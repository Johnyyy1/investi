import { finishOnboarding } from "./onboarding-helper.mjs";
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import postgres from "postgres";
import { chromium } from "playwright";

const baseURL = process.env.PORTFOLIO_TEST_URL ?? "http://localhost:3000";
const local = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
assert.ok(local(new URL(baseURL).hostname) && local(new URL(process.env.DATABASE_URL).hostname), "Requires local app and database.");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "chrome" });
const screenshotDir = process.env.PORTFOLIO_SCREENSHOT_DIR ?? "/tmp/investi-portfolio-qa";
await mkdir(screenshotDir, { recursive: true });
const email = `portfolio-browser-${randomUUID()}@example.com`;
const password = randomUUID();
let userId;
const minorFromCzk = (value) => BigInt(Math.round(Number(value.replace(/[^\d.-]/g, "")) * 100));
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, timezoneId: "Europe/Prague" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/sign-up`);
  await page.getByLabel("Name", { exact: true }).fill("Portfolio Browser QA");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await finishOnboarding(page);
  [{ id: userId }] = await sql`select id from "user" where email = ${email}`;
  await page.goto(`${baseURL}/lab/portfolio`);
  await page.getByRole("heading", { name: "Portfolio Lab", exact: true }).waitFor();
  assert.equal(await page.getByText("Sample data", { exact: true }).count(), 1, "deterministic mode is labeled as sample data");
  await page.getByRole("heading", { name: "Build capital by learning", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: /Invest/ }).count(), 0, "zero capital does not suggest investing is possible");
  assert.equal(await page.getByRole("heading", { name: "Holdings", exact: true }).count(), 0);
  assert.equal(await page.getByRole("heading", { name: "Recent activity", exact: true }).count(), 0);
  assert.equal(await page.getByRole("link", { name: "Continue learning", exact: true }).getAttribute("href"), "/learn");

  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `zero-capital portfolio has no overflow at ${width}`);
    if ([320, 375, 390, 1024, 1440].includes(width)) await page.screenshot({ path: `${screenshotDir}/zero-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "zero-capital portfolio supports 200% text");
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.setViewportSize({ width: 1440, height: 950 });

  const [{ id: lessonId }] = await sql`select id from lesson where is_published = true order by id limit 1`;
  await sql.begin(async (tx) => {
    const now = new Date();
    await tx`insert into lesson_progress (user_id, lesson_id, status, last_position, completed_at, updated_at) values (${userId}, ${lessonId}, 'completed', 0, ${now}, ${now}) on conflict do nothing`;
    await tx`insert into lesson_award (user_id, lesson_id, xp, practice_capital_minor, reward_policy_version, learning_date, time_zone, awarded_at) values (${userId}, ${lessonId}, 60, 200000, 1, '2026-09-14', 'Europe/Prague', ${now})`;
  });
  await page.reload();
  assert.equal(await page.getByTestId("portfolio-cash").textContent(), "2,000 Kč", "later reward becomes available cash");
  assert.equal(await page.getByTestId("portfolio-invested").textContent(), "0 Kč", "an empty portfolio has no invested value");
  assert.equal(await page.getByText("Practice Capital earned", { exact: true }).count(), 0, "earned-capital copy is absent from the portfolio overview");
  assert.match(await page.locator('section[aria-labelledby="portfolio-value-label"]').textContent(), /0 Kč\s*·\s*0\.00%/, "reward does not create investment gain");
  await page.getByRole("heading", { name: "Your portfolio is ready", exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Holdings", exact: true }).count(), 0, "empty state avoids an empty holdings section");
  assert.equal(await page.getByRole("heading", { name: "Recent activity", exact: true }).count(), 0, "empty state avoids an empty activity section");
  assert.equal(await page.getByRole("button", { name: "Portfolio options", exact: true }).count(), 0, "reset is absent from the empty state");
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 320) {
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      const overflowing = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 80), className: element.className?.toString().slice(0, 100), box: element.getBoundingClientRect().toJSON() })));
      assert.deepEqual(overflowing, [], "capital/no-holdings state supports 200% text");
      await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `capital/no-holdings state has no overflow at ${width}`);
    await page.screenshot({ path: `${screenshotDir}/ready-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 950 });

  const investTrigger = page.getByRole("button", { name: "Invest", exact: true });
  await investTrigger.click();
  const investDialog = page.getByRole("dialog", { name: "Invest Practice Capital" });
  await investDialog.waitFor();
  const emptySearch = investDialog.getByRole("combobox", { name: "Search investments" });
  await page.waitForFunction((element) => document.activeElement === element, await emptySearch.elementHandle());
  assert.equal(await emptySearch.evaluate((element) => element === document.activeElement), true, "investment sheet focuses search");
  await page.keyboard.press("Escape");
  assert.equal(await investDialog.isVisible(), false, "Escape closes investment sheet");
  assert.equal(await investTrigger.evaluate((element) => element === document.activeElement), true, "investment sheet returns focus");
  await page.getByRole("button", { name: "Make your first investment", exact: true }).click();
  const search = investDialog.getByRole("combobox", { name: "Search investments" });
  await search.fill("apple");
  await investDialog.getByRole("option", { name: /AAPL/ }).waitFor();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `search sheet has no overflow at ${width}`);
    await page.screenshot({ path: `${screenshotDir}/search-open-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  await search.press("Enter");
  await page.waitForURL(/\/lab\/instruments\/US-XNAS%3AAAPL/);
  await page.getByRole("heading", { name: "Apple Inc.", exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Your position" }).count(), 0, "unowned instrument has no invented position");
  assert.equal(await page.getByText("Sample data", { exact: true }).count(), 1, "deterministic detail is labeled as sample data");
  assert.match(await page.getByRole("img", { name: /daily split-adjusted closing price chart/ }).getAttribute("aria-label"), /\d+ observations/, "daily chart uses available sample observations");
  assert.match(await page.locator("main").innerText(), /Selected 1Y price return/);
  await page.getByRole("heading", { name: "Key metrics" }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Fund overview" }).count(), 0, "equities do not render ETF analytics");
  assert.match(await page.locator("main").innerText(), /Valuation[\s\S]*Market cap[\s\S]*P\/E TTM[\s\S]*Profitability[\s\S]*Financial health[\s\S]*Latest fiscal year/i);
  assert.match(await page.locator("main").innerText(), /382\.4B USD/);
  const metricSignal = async (id) => page.locator(`[data-metric="${id}"]`).getAttribute("data-signal");
  assert.equal(await metricSignal("pe"), "neutral", "P/E remains neutral");
  assert.equal(await metricSignal("market-cap"), "neutral", "size remains neutral");
  assert.equal(await metricSignal("operating-margin"), "positive", "operating profitability uses the broad reference");
  assert.equal(await metricSignal("debt-equity"), "neutral", "middle debt-to-equity values remain neutral");
  assert.equal(await metricSignal("net-debt-ebitda"), "positive", "low net debt uses the broad reference");
  await page.getByRole("button", { name: "P/E TTM" }).click();
  await page.getByText(/Share price relative to trailing twelve-month earnings/).waitFor();
  await page.getByRole("button", { name: "P/E TTM" }).click();
  await page.screenshot({ path: `${screenshotDir}/instrument-aapl-1y-1440.png`, fullPage: true });
  await page.getByRole("navigation", { name: "Price history timeframe" }).getByRole("link", { name: "1M" }).click();
  await page.waitForURL(/range=1M/);
  assert.match(await page.locator("main").innerText(), /Selected 1M price return/);
  assert.match(await page.locator("main").innerText(), /Started · .*Ended · .*Period low.*Period high/s);
  await page.screenshot({ path: `${screenshotDir}/instrument-aapl-1m-1440.png`, fullPage: true });
  for (const width of [320, 375, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(() => {
      const plot = document.querySelector('[aria-label*="daily split-adjusted closing price chart"]');
      const svg = plot?.querySelector("svg");
      return !svg || svg.getBoundingClientRect().width <= plot.getBoundingClientRect().width + 1;
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `instrument detail has no overflow at ${width}`);
    if (width === 320) {
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "instrument detail supports 200% text");
      await page.screenshot({ path: `${screenshotDir}/instrument-aapl-320-200-percent.png`, fullPage: true });
      await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
    }
    await page.screenshot({ path: `${screenshotDir}/instrument-aapl-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto(`${baseURL}/lab/instruments/US-XNAS%3ANVDA`);
  await page.getByRole("heading", { name: "NVIDIA Corporation" }).waitFor();
  assert.equal(await metricSignal("p-fcf"), "unavailable", "missing valuation stays muted");
  assert.equal(await metricSignal("fcf"), "unavailable", "missing fiscal cash flow stays muted");
  assert.match(await page.locator("main").innerText(), /Price \/ FCF TTM\s*—/);
  assert.match(await page.locator("main").innerText(), /Free cash flow FY\s*—/);
  await page.screenshot({ path: `${screenshotDir}/instrument-equity-partial-1440.png`, fullPage: true });
  await page.goto(`${baseURL}/lab/instruments/IE-XETR%3AVWCE`);
  await page.getByRole("heading", { name: "Vanguard FTSE All-World UCITS ETF" }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Key metrics" }).count(), 0, "ETF detail excludes company fundamentals");
  assert.match(await page.locator("main").innerText(), /VWCE · ETF · XETR/, "ETF detail uses ETF identity and exchange");
  assert.equal(await page.getByText("Last observation · Last observation", { exact: false }).count(), 0, "unknown session state does not duplicate the observation label");
  assert.equal(await page.getByRole("heading", { name: "Your position" }).count(), 0, "unowned ETF has no fake position");
  await page.getByRole("heading", { name: "Fund overview" }).waitFor();
  assert.match(await page.locator('[data-testid="etf-analytics"]').innerText(), /Expense ratio[\s\S]*0\.22%[\s\S]*AUM[\s\S]*14\.8B EUR[\s\S]*NAV[\s\S]*123\.68 EUR/);
  assert.match(await page.locator('[data-testid="etf-analytics"]').innerText(), /Top holdings[\s\S]*Top 10 concentration[\s\S]*23\.1%[\s\S]*Sample Atlas Devices/);
  assert.equal(await page.getByRole("heading", { name: "Sector exposure" }).count(), 1);
  assert.equal(await page.getByRole("heading", { name: "Country exposure" }).count(), 1);
  assert.equal(await page.getByText("P/E TTM", { exact: true }).count(), 0, "ETF does not show company ratios");
  await page.getByLabel("About Expense ratio").focus();
  await page.keyboard.press("Enter");
  await page.getByText("Annual fund operating costs as a percentage of assets.").waitFor();
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "Fund overview" }).click();
  const etfScreenshotStyle = await page.addStyleTag({ content: 'header.sticky { position: static !important; } nav[aria-label="Mobile navigation"] { position: static !important; }' });
  await page.screenshot({ path: `${screenshotDir}/instrument-etf-1440.png`, fullPage: true });
  await page.locator('[data-testid="etf-analytics"] > div').screenshot({ path: `${screenshotDir}/instrument-etf-holdings-sectors.png` });
  await page.locator('section[aria-labelledby="etf-countries-heading"]').screenshot({ path: `${screenshotDir}/instrument-etf-countries.png` });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `ETF detail has no overflow at ${width}`);
    if (width === 320) await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const etfOverflow = await page.evaluate(() => ({ exceeds: document.documentElement.scrollWidth > innerWidth, elements: [...document.querySelectorAll("main *")].filter((element) => element.scrollWidth > element.clientWidth + 1).slice(0, 18).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 45), className: element.className?.toString().slice(0, 80), scroll: element.scrollWidth, client: element.clientWidth })) }));
    assert.equal(etfOverflow.exceeds, false, `ETF detail supports ${width}px${width === 320 ? " and 200% text" : ""}: ${JSON.stringify(etfOverflow.elements)}`);
    await page.screenshot({ path: `${screenshotDir}/instrument-etf-${width}${width === 320 ? "-200-percent" : ""}.png`, fullPage: true });
    if (width === 320) await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  }
  await etfScreenshotStyle.evaluate((style) => style.remove());
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto(`${baseURL}/lab/instruments/US-XNAS%3AAAPL`);
  const detailInvest = page.getByRole("button", { name: /Invest/, exact: false }).first();
  await detailInvest.click();
  const orderDialog = page.getByRole("dialog", { name: "Invest in AAPL" });
  await orderDialog.getByRole("textbox", { name: /Quantity/ }).fill("1");
  await page.screenshot({ path: `${screenshotDir}/buy-1440.png`, fullPage: true });
  await orderDialog.getByRole("button", { name: "Review order", exact: true }).click();
  await orderDialog.getByRole("heading", { name: "Review your investment", exact: true }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/buy-review-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const reviewOverflow = await orderDialog.evaluate((dialog) => [...dialog.querySelectorAll("*")].filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 80), className: element.className?.toString().slice(0, 100), box: element.getBoundingClientRect().toJSON() })));
  assert.deepEqual(reviewOverflow, [], "buy review supports 200% text");
  await page.screenshot({ path: `${screenshotDir}/buy-review-320-200-percent.png`, fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.setViewportSize({ width: 1440, height: 950 });
  await orderDialog.getByRole("button", { name: "Confirm buy AAPL", exact: true }).click();
  await orderDialog.getByRole("alert").filter({ hasText: "not have enough" }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/insufficient-cash-1440.png`, fullPage: true });
  await orderDialog.getByRole("button", { name: "Edit order", exact: true }).click();
  await orderDialog.getByRole("textbox", { name: /Quantity/ }).fill("0.25");
  await orderDialog.getByRole("button", { name: "Review order", exact: true }).click();
  await page.screenshot({ path: `${screenshotDir}/buy-review-confirm-1440.png`, fullPage: true });
  await orderDialog.getByRole("button", { name: "Confirm buy AAPL", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Investment added" }).waitFor();
  await page.getByRole("heading", { name: "Your position" }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/instrument-aapl-owned-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: `${screenshotDir}/instrument-aapl-owned-390.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto(`${baseURL}/lab/portfolio`);
  const primaryInvest = page.getByRole("button", { name: "Invest", exact: true });
  assert.equal(await page.getByTestId("portfolio-cash").textContent(), "1,351.62 Kč");
  const aapl = page.getByTestId("holding-AAPL");
  await aapl.waitFor();
  assert.equal(await page.getByRole("heading", { name: "Your portfolio is ready", exact: true }).count(), 0, "onboarding disappears after the first investment");
  assert.equal(await page.getByText("Performance history not available yet", { exact: true }).count(), 1, "the hero is honest about missing performance history");
  assert.equal(await page.getByRole("heading", { name: "Allocation", exact: true }).count(), 0, "allocation is part of holdings, not a separate panel");
  assert.match(await aapl.textContent(), /100\.00%/, "a single holding owns the full invested weight");
  const firstCash = minorFromCzk(await page.getByTestId("portfolio-cash").textContent());
  const firstInvested = minorFromCzk(await page.getByTestId("portfolio-invested").textContent());
  const firstTotal = minorFromCzk(await page.getByTestId("portfolio-value").textContent());
  assert.equal(firstCash + firstInvested, firstTotal, "portfolio value equals available cash plus invested value");
  assert.match(await page.getByTestId("portfolio-gain-loss").textContent(), /0 Kč\s*·\s*0\.00%/, "the initial holding does not fabricate investment performance");

  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `populated portfolio has no overflow at ${width}`);
    if ([320, 390, 768, 1024, 1440].includes(width)) await page.screenshot({ path: `${screenshotDir}/populated-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByTestId("holding-mobile-AAPL").waitFor();
  assert.equal(await page.getByTestId("holding-AAPL").isVisible(), false, "the desktop holdings table gives way to a dedicated mobile row");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const zoomOverflow = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 60), className: element.className?.toString().slice(0, 100), box: element.getBoundingClientRect().toJSON() })));
  assert.deepEqual(zoomOverflow, [], "populated portfolio supports 200% text");
  const zoomInvestTrigger = page.getByRole("button", { name: "Invest", exact: true });
  await zoomInvestTrigger.click();
  await investDialog.getByRole("combobox", { name: "Search investments" }).fill("MSFT");
  await investDialog.getByRole("option", { name: /MSFT/ }).waitFor();
  const resultLayout = await investDialog.getByRole("option", { name: /MSFT/ }).locator("button").evaluate((button) => ({ direction: getComputedStyle(button).flexDirection, primaryWidth: button.firstElementChild.getBoundingClientRect().width, metadataWidth: button.lastElementChild.getBoundingClientRect().width }));
  assert.equal(resultLayout.direction, "column", "search result metadata stacks at 200% text on narrow screens");
  assert.ok(resultLayout.primaryWidth > 192 && resultLayout.metadataWidth > 192, "search result labels have readable line width at 200% text");
  const sheetOverflow = await investDialog.evaluate((dialog) => [...dialog.querySelectorAll("*")].filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 60), className: element.className?.toString().slice(0, 100), box: element.getBoundingClientRect().toJSON() })));
  assert.deepEqual(sheetOverflow, [], "investment sheet supports 200% text without horizontal overflow");
  await page.screenshot({ path: `${screenshotDir}/search-open-320-200-percent.png`, fullPage: true });
  await page.keyboard.press("Escape");
  assert.equal(await zoomInvestTrigger.evaluate((element) => element === document.activeElement), true, "zoomed investment sheet returns focus");
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.setViewportSize({ width: 1440, height: 950 });

  await primaryInvest.click();
  await investDialog.getByRole("combobox", { name: "Search investments" }).fill("MSFT");
  await investDialog.getByRole("option", { name: /MSFT/ }).waitFor();
  await investDialog.getByRole("combobox", { name: "Search investments" }).press("Enter");
  await page.waitForURL(/\/lab\/instruments\/US-XNAS%3AMSFT/);
  assert.equal(await metricSignal("net-debt-ebitda"), "positive", "confirmed sample net cash receives the positive reference");
  await page.getByRole("button", { name: /Invest/ }).first().click();
  const msftDialog = page.getByRole("dialog", { name: "Invest in MSFT" });
  await msftDialog.getByRole("textbox", { name: /Quantity/ }).fill("0.05");
  await msftDialog.getByRole("button", { name: "Review order", exact: true }).click();
  await msftDialog.getByRole("button", { name: "Confirm buy MSFT", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Investment added" }).waitFor();
  await page.goto(`${baseURL}/lab/portfolio`);
  await page.getByTestId("holding-MSFT").waitFor();
  assert.equal(await page.getByRole("table", { name: "Current portfolio holdings" }).getByRole("row").count(), 3, "the desktop table contains a header plus two holdings");
  assert.equal(await page.getByRole("table", { name: "Current portfolio holdings" }).getByRole("columnheader", { name: "Gain/loss" }).count(), 1, "absolute holding P&L is labeled as gain/loss");
  assert.equal(await page.locator("main header").getByRole("button", { name: "Portfolio options", exact: true }).count(), 1, "portfolio options live beside the primary header action");
  assert.match(await page.getByTestId("holding-AAPL").textContent(), /\d+\.\d{2}%/);
  assert.match(await page.getByTestId("holding-MSFT").textContent(), /\d+\.\d{2}%/, "multiple holdings show weight in the table");
  assert.equal(await page.locator('section[aria-labelledby="activity-heading"] li').count(), 2, "recent activity remains secondary and records both buys");
  const multiCash = minorFromCzk(await page.getByTestId("portfolio-cash").textContent());
  const multiInvested = minorFromCzk(await page.getByTestId("portfolio-invested").textContent());
  const multiTotal = minorFromCzk(await page.getByTestId("portfolio-value").textContent());
  assert.equal(multiCash + multiInvested, multiTotal, "summary metrics remain coherent with multiple holdings");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${screenshotDir}/multiple-holdings-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByTestId("holding-mobile-AAPL").waitFor();
  await page.getByTestId("holding-mobile-MSFT").waitFor();
  assert.equal(await page.getByTestId("holding-mobile-AAPL").getByText("Gain/loss", { exact: true }).count(), 1, "mobile holding labels the same absolute P&L correctly");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "multiple mobile holding rows do not overflow");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${screenshotDir}/multiple-holdings-390.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 950 });

  await aapl.getByRole("button", { name: "Actions for AAPL", exact: true }).click();
  await page.getByRole("menu", { name: "Actions for AAPL" }).getByRole("menuitem", { name: "Sell", exact: true }).click();
  const sellDialog = page.getByRole("dialog", { name: "Sell AAPL" });
  await sellDialog.waitFor();
  await page.screenshot({ path: `${screenshotDir}/sell-1440.png`, fullPage: true });
  for (const width of [320, 375, 390, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `sell sheet has no overflow at ${width}`);
    if (width === 320) {
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      const overflowing = await sellDialog.evaluate((dialog) => [...dialog.querySelectorAll("*")].filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 80), className: element.className?.toString().slice(0, 100), box: element.getBoundingClientRect().toJSON() })));
      assert.deepEqual(overflowing, [], "sell sheet supports 200% text");
      await page.screenshot({ path: `${screenshotDir}/sell-320-200-percent.png`, fullPage: true });
      await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
    }
    await page.screenshot({ path: `${screenshotDir}/sell-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  await sellDialog.getByLabel("Quantity to sell").fill("0.3");
  await sellDialog.getByRole("button", { name: "Sell AAPL", exact: true }).click();
  await sellDialog.getByRole("alert").filter({ hasText: "cannot sell more" }).waitFor();
  await sellDialog.getByLabel("Quantity to sell").fill("0.1");
  await sellDialog.getByRole("button", { name: "Sell AAPL", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Investment sold" }).waitFor();
  const holdingAction = page.getByTestId("holding-AAPL").getByRole("button", { name: "Actions for AAPL", exact: true });
  await page.waitForFunction((element) => document.activeElement === element, await holdingAction.elementHandle());
  assert.equal(await holdingAction.evaluate((element) => element === document.activeElement), true, "sale returns focus to the holding action");
  await page.reload();
  await page.getByTestId("holding-AAPL").getByText("0.15 shares", { exact: true }).waitFor();

  const [{ id: activePortfolioId }] = await sql`select id from portfolio where user_id = ${userId} and closed_at is null`;
  const unavailableTradeTime = new Date();
  await sql`insert into portfolio_trade (
    id, portfolio_id, instrument_id, instrument_symbol, instrument_name, instrument_asset_type,
    side, quantity, unit_price, quote_currency, fx_rate_to_base, gross_amount_base_minor,
    fee_base_minor, cash_delta_base_minor, quote_observed_at, executed_at,
    market_data_provider, market_data_dataset, market_data_kind, market_data_is_deterministic,
    fx_rate_provider, fx_rate_dataset, fx_rate_kind, fx_rate_is_deterministic,
    fx_reference_date, fx_rate_retrieved_at, client_idempotency_key
  ) values (
    ${randomUUID()}, ${activePortfolioId}, 'FMP:NASDAQ:NVDA', 'NVDA', 'NVIDIA Corporation', 'equity',
    'BUY', '0.01', '100', 'USD', '22', 2200,
    0, -2200, ${unavailableTradeTime}, ${unavailableTradeTime},
    'fmp', 'quote', 'live', false,
    'frankfurter', 'ecb-reference', 'reference', false,
    '2026-09-20', ${unavailableTradeTime}, ${randomUUID()}
  )`;
  await page.reload();
  await page.getByRole("status").filter({ hasText: "2 of 3 positions currently valued" }).waitFor();
  assert.equal(await page.getByTestId("portfolio-value").textContent(), "—", "partial valuation does not invent a portfolio total");
  assert.equal(await page.getByText("Incomplete valuation", { exact: true }).count(), 1, "the missing total is labeled explicitly");
  assert.equal(await page.getByTestId("portfolio-invested").textContent(), "Incomplete", "partial valuation does not treat an unavailable holding as zero");
  assert.match(await page.getByTestId("holding-NVDA").textContent(), /Unavailable from this data source/, "the unavailable holding explains its state");
  assert.match(await page.getByTestId("holding-AAPL").textContent(), /Unavailable/, "partial valuation suppresses misleading weight even for a valued holding");
  await page.screenshot({ path: `${screenshotDir}/partial-valuation-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await page.screenshot({ path: `${screenshotDir}/partial-valuation-320-200-percent.png`, fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "partial valuation supports 320px and 200% text");
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.setViewportSize({ width: 1440, height: 950 });

  await page.getByRole("button", { name: "Portfolio options", exact: true }).click();
  await page.screenshot({ path: `${screenshotDir}/portfolio-options-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const optionsOverflow = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 80), className: element.className?.toString().slice(0, 100), box: element.getBoundingClientRect().toJSON() })));
  assert.deepEqual(optionsOverflow, [], "portfolio options support 200% text");
  await page.screenshot({ path: `${screenshotDir}/portfolio-options-320-200-percent.png`, fullPage: true });
  await page.getByRole("menu", { name: "Portfolio options" }).getByRole("menuitem", { name: "Reset portfolio", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Reset this portfolio?" });
  await dialog.getByText("Learning progress and old trades remain recorded.", { exact: false }).waitFor();
  const resetOverflow = await dialog.evaluate((element) => [...element.querySelectorAll("*")].filter((child) => { const box = child.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((child) => ({ tag: child.tagName, text: child.textContent?.trim().slice(0, 80), className: child.className?.toString().slice(0, 100), box: child.getBoundingClientRect().toJSON() })));
  assert.deepEqual(resetOverflow, [], "reset confirmation supports 200% text");
  await page.screenshot({ path: `${screenshotDir}/reset-confirmation-320-200-percent.png`, fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.screenshot({ path: `${screenshotDir}/reset-confirmation-1440.png`, fullPage: true });
  await dialog.getByRole("button", { name: "Reset portfolio", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Portfolio reset" }).waitFor();
  await page.getByTestId("holding-AAPL").waitFor({ state: "detached" });
  await page.getByTestId("portfolio-cash").filter({ hasText: "2,000 Kč" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Portfolio options", exact: true }).count(), 0, "reset returns to the guided empty state");
  const investAfterReset = page.getByRole("button", { name: "Invest", exact: true });
  await page.waitForFunction((element) => document.activeElement === element, await investAfterReset.elementHandle());
  assert.equal(await investAfterReset.evaluate((element) => element === document.activeElement), true, "reset returns focus to Invest when its options trigger is removed");
  await page.screenshot({ path: `${screenshotDir}/post-reset-1440.png`, fullPage: true });
  assert.deepEqual(errors, [], "Portfolio Lab has no browser errors");
  console.log("PASS: zero-capital, later reward, keyboard search, fractional buy, insufficient cash, oversell, partial sell, persistence, reset, responsive layouts, and 200% text. Screenshots:", screenshotDir);
} finally {
  await browser.close();
  if (userId) await sql`delete from "user" where id = ${userId}`;
  await sql.end();
}
