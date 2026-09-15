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
  assert.match(await page.locator('section[aria-labelledby="portfolio-value-label"]').textContent(), /0 Kč\s*·\s*0\.00%/, "reward does not create investment gain");
  await page.getByRole("heading", { name: "Build your first educational portfolio", exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Holdings", exact: true }).count(), 0, "empty state avoids an empty holdings section");
  assert.equal(await page.getByRole("heading", { name: "Recent activity", exact: true }).count(), 0, "empty state avoids an empty activity section");
  assert.equal(await page.getByRole("button", { name: "Portfolio options", exact: true }).count(), 0, "reset is absent from the empty state");
  for (const width of [320, 375, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 320) {
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "capital/no-holdings state supports 200% text");
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
  for (const width of [320, 375, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `search sheet has no overflow at ${width}`);
    await page.screenshot({ path: `${screenshotDir}/search-open-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  await search.press("Enter");
  await investDialog.getByRole("textbox", { name: "Quantity", exact: true }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/buy-1440.png`, fullPage: true });
  for (const width of [320, 375, 390, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `selected instrument sheet has no overflow at ${width}`);
    if (width === 320) {
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      const overflowing = await investDialog.evaluate((dialog) => [...dialog.querySelectorAll("*")].filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 80), className: element.className?.toString().slice(0, 100), box: element.getBoundingClientRect().toJSON() })));
      assert.deepEqual(overflowing, [], "buy quantity step supports 200% text");
      await page.screenshot({ path: `${screenshotDir}/buy-320-200-percent.png`, fullPage: true });
      await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
    }
    await page.screenshot({ path: `${screenshotDir}/buy-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  await investDialog.getByRole("textbox", { name: "Quantity", exact: true }).fill("1");
  await investDialog.getByRole("button", { name: "Review order", exact: true }).click();
  await investDialog.getByRole("heading", { name: "Review your investment", exact: true }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/buy-review-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const reviewOverflow = await investDialog.evaluate((dialog) => [...dialog.querySelectorAll("*")].filter((element) => { const box = element.getBoundingClientRect(); return box.right > innerWidth + 1 || box.left < -1; }).slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 80), className: element.className?.toString().slice(0, 100), box: element.getBoundingClientRect().toJSON() })));
  assert.deepEqual(reviewOverflow, [], "buy review supports 200% text");
  await page.screenshot({ path: `${screenshotDir}/buy-review-320-200-percent.png`, fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.setViewportSize({ width: 1440, height: 950 });
  await investDialog.getByRole("button", { name: "Confirm buy AAPL", exact: true }).click();
  await investDialog.getByRole("alert").filter({ hasText: "not have enough" }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/insufficient-cash-1440.png`, fullPage: true });
  await investDialog.getByRole("button", { name: "Edit order", exact: true }).click();
  await investDialog.getByRole("textbox", { name: "Quantity", exact: true }).fill("0.25");
  await investDialog.getByRole("button", { name: "Review order", exact: true }).click();
  await page.screenshot({ path: `${screenshotDir}/buy-review-confirm-1440.png`, fullPage: true });
  await investDialog.getByRole("button", { name: "Confirm buy AAPL", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Investment added" }).waitFor();
  const primaryInvest = page.getByRole("button", { name: "Invest", exact: true });
  await page.waitForFunction((element) => document.activeElement === element, await primaryInvest.elementHandle());
  assert.equal(await primaryInvest.evaluate((element) => element === document.activeElement), true, "successful buy returns focus to the persistent Invest action");
  assert.equal(await page.getByTestId("portfolio-cash").textContent(), "1,351.62 Kč");
  const aapl = page.getByTestId("holding-AAPL");
  await aapl.waitFor();

  for (const width of [320, 375, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `populated portfolio has no overflow at ${width}`);
    if ([320, 375, 390, 1024, 1440].includes(width)) await page.screenshot({ path: `${screenshotDir}/populated-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 900 });
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

  await page.getByRole("button", { name: "Portfolio options", exact: true }).click();
  await page.screenshot({ path: `${screenshotDir}/portfolio-options-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "portfolio options support 200% text");
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
