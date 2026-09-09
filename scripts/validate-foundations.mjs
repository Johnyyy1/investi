// Real local auth, server actions, and PostgreSQL; cleans up only this run's disposable account.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import postgres from "postgres";
import { chromium } from "playwright";

const baseURL = process.env.FOUNDATIONS_TEST_URL ?? "http://localhost:3000";
const local = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
assert.ok(local(new URL(baseURL).hostname) && local(new URL(process.env.DATABASE_URL).hostname), "Requires local app and database");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const email = `foundations-${randomUUID()}@example.com`;
const password = randomUUID();
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
const screenshotDir = "/tmp/investi-foundations-qa";
await mkdir(screenshotDir, { recursive: true });
let userId;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  let expectedNetworkFailure = false;
  page.on("pageerror", (error) => { if (!expectedNetworkFailure) errors.push(error.message); });
  page.on("console", (message) => { if (["warning", "error"].includes(message.type()) && !expectedNetworkFailure && !message.text().startsWith("You have Reduced Motion enabled on your device.")) errors.push(message.text()); });
  const heading = (name) => page.getByRole("heading", { name, exact: true }).waitFor();
  const button = (name) => page.getByRole("button", { name, exact: true });
  const row = async (lesson) => (await sql`select * from lesson_progress where user_id = ${userId} and lesson_id = ${lesson}`)[0];
  const profile = async () => (await sql`select * from learning_profile where user_id = ${userId}`)[0];
  async function layouts(label, screenshots = false) {
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 820 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label}: overflow at ${width}`);
      assert.equal(await page.locator("h1").count(), 1, `${label}: one h1`);
      const cta = page.locator("section .sticky").last();
      if (await cta.count()) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const box = await cta.boundingBox();
        assert.ok(box.y >= 0 && box.y + box.height <= 821, `${label}: reachable actions at ${width}`);
      }
      if (screenshots && [320, 390, 1440].includes(width)) await page.screenshot({ path: `${screenshotDir}/${label}-${width}.png`, fullPage: true });
    }
  }
  async function check(index, correct = true) {
    const radios = page.getByRole("radio");
    await radios.first().press("Space");
    for (let i = 0; i < index; i++) await radios.nth(i).press("ArrowDown");
    await radios.nth(index).press("Tab");
    assert.equal(await button("Check answer").evaluate((el) => el === document.activeElement), true);
    await button("Check answer").press("Enter");
    await heading(correct ? "That’s right" : "Let’s work through it");
    assert.equal(await button("Continue").evaluate((el) => el === document.activeElement), true, "Feedback hands focus to Continue");
  }
  async function next(title) {
    await button("Continue").click(); await heading(title);
    assert.equal(await page.locator("#step-title").evaluate((el) => el === document.activeElement), true, "Continue focuses next step heading");
  }
  async function failThenRetry(action, id) {
    const url = page.url();
    const before = await row(id);
    expectedNetworkFailure = true;
    await page.route(url, (route) => route.request().method() === "POST" ? route.abort() : route.continue());
    await button(action).click(); await page.locator("main").getByRole("alert").filter({ hasText: /.+/ }).waitFor();
    await page.waitForFunction((name) => document.activeElement?.textContent === name, action);
    assert.deepEqual(await row(id), before, "Failed writes preserve saved progress");
    await page.unroute(url);
    expectedNetworkFailure = false;
  }
  const modules = await sql`select slug, position from learning_module where slug in ('returns', 'investing-foundations') order by position`;
  assert.deepEqual(modules.map((module) => module.slug), ["investing-foundations", "returns"]);
  assert.equal(Number((await sql`select count(*) from lesson where module_id = 'module-investing-foundations'`)[0].count), 8);
  assert.equal(Number((await sql`select count(*) from lesson where module_id = 'module-investing-foundations' and is_published`)[0].count), 7);

  await page.goto(`${baseURL}/sign-up`);
  await page.getByLabel("Name", { exact: true }).fill("Foundations QA");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await button("Create account").click(); await page.waitForURL("**/onboarding");
  [{ id: userId }] = await sql`select id from "user" where email = ${email}`;
  await button("Get started").click();
  for (const label of ["I’m completely new", "Start investing confidently", "ETFs", "10 minutes"]) {
    await page.getByLabel(label, { exact: true }).check(); await button("Continue").click();
  }
  await heading("Your recommended path"); await heading("Investing Foundations");
  await button("Continue").click(); await button("Start learning").click(); await page.waitForURL("**/dashboard");
  assert.equal((await profile()).recommended_start, "investing-foundations");
  const onboardingCompleted = (await profile()).onboarding_completed_at.toISOString();
  // Simulate a completed profile from before Foundations existed; read-time recomputation is non-destructive.
  await sql`update learning_profile set recommended_start = 'returns' where user_id = ${userId}`;
  await page.reload(); await heading("Continue learning");
  assert.equal(await page.getByRole("link", { name: "Start lesson", exact: true }).getAttribute("href"), "/learn/investing-foundations/why-invest");
  assert.equal((await profile()).recommended_start, "returns");
  assert.equal((await profile()).onboarding_completed_at.toISOString(), onboardingCompleted);
  await layouts("home", true);
  await page.getByRole("link", { name: "Browse curriculum" }).click(); await heading("Learn investing, step by step");
  assert.deepEqual(await page.locator('ol[aria-label="Available learning journey"] h2').allTextContents(), ["Investing Foundations", "Returns & Compounding"]);
  await layouts("learn", true);
  await page.getByRole("link", { name: "Explore Foundations" }).click(); await heading("Investing Foundations");
  assert.equal(await page.getByTestId("module-progress").textContent(), "0 of 7 available lessons complete");
  const pathItems = page.getByRole("list", { name: "Module learning path" }).getByRole("listitem");
  assert.equal(await pathItems.count(), 8);
  for (let i = 7; i < 8; i++) assert.equal(await pathItems.nth(i).getByRole("button").count(), 0);
  await layouts("module", true);
  await pathItems.first().getByRole("button", { name: "Start lesson" }).click();
  await heading("Same money, different purchasing power");
  assert.equal(await page.getByRole("navigation").count(), 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await layouts("opening", true); await check(1); await layouts("feedback", true);
  await failThenRetry("Continue", "foundations-why-invest");
  await next("Two tools for different needs");
  await page.reload(); await heading("Two tools for different needs");
  assert.equal((await row("foundations-why-invest")).last_position, 1);
  for (const title of ["Think in baskets, not just euros", "Where could growth come from?", "Time gives growth room to build", "Risk enters the picture", "Change the assumptions"]) { await next(title); await layouts(title.replaceAll(/[^a-zA-Z]/g, "-")); }
  await page.getByText("€16,288.95", { exact: true }).waitFor();
  for (const [label, invalid, valid] of [["Starting value", "0", "10000"], ["Hypothetical annual rate", "-101", "5"], ["Time in years", "1.5", "10"]]) {
    await page.getByLabel(label, { exact: true }).fill(invalid); await page.locator("main").getByRole("alert").filter({ hasText: /.+/ }).waitFor();
    assert.equal(await page.getByLabel(label, { exact: true }).getAttribute("aria-invalid"), "true");
    await page.getByLabel(label, { exact: true }).fill(valid);
  }
  await page.getByLabel("Time in years").fill("20"); await page.getByText("€26,532.98", { exact: true }).waitFor();
  await page.getByLabel("Hypothetical annual rate").fill("-10"); await page.getByLabel("Time in years").fill("2"); await page.getByText("€8,100.00", { exact: true }).waitFor();
  await page.getByText("See values year by year", { exact: true }).press("Enter"); await layouts("growth-expanded", true);
  await next("Match the tool to the idea"); await check(0, false); await next("A reason to understand both");
  assert.equal((await row("foundations-why-invest")).status, "in_progress");
  await failThenRetry("Mark lesson complete", "foundations-why-invest");
  await button("Mark lesson complete").click(); await heading("Lesson complete");
  assert.equal((await row("foundations-why-invest")).status, "completed");
  await layouts("completion", true);
  await page.getByRole("link", { name: "Next lesson: Stocks: owning part of a business" }).click(); await heading("Imagine a business split into pieces");
  await check(1); await next("How much of the business?"); await page.getByText("0.01%", { exact: true }).waitFor();
  for (const [label, invalid, valid] of [["Total shares", "0", "1000000"], ["Owned shares", "-1", "100"], ["Owned shares", "1000001", "100"]]) {
    await page.getByLabel(label, { exact: true }).fill(invalid); await page.locator("main").getByRole("alert").filter({ hasText: /.+/ }).waitFor();
    await page.getByLabel(label, { exact: true }).fill(valid);
  }
  await page.getByLabel("Owned shares", { exact: true }).fill("100000"); await page.getByText("10%", { exact: true }).waitFor(); await layouts("ownership", true);
  await next("A price is attached to each piece"); await next("Put a value on all the shares"); await page.getByText("€50,000,000.00", { exact: true }).waitFor();
  await page.getByLabel("Share price", { exact: true }).fill("-1"); await page.locator("main").getByRole("alert").filter({ hasText: /.+/ }).waitFor();
  await page.getByLabel("Share price", { exact: true }).fill("25"); await page.getByText("€25,000,000.00", { exact: true }).waitFor(); await layouts("market-cap", true);
  await next("Why can the price move?"); await next("Owners may receive dividends"); await next("Practice the ownership fraction");
  await page.getByLabel("Your answer", { exact: true }).fill("0.01"); await button("Check answer").click(); await heading("That’s right");
  await next("Separate company size from share price"); await check(2); await next("Ownership is not daily control"); await next("Connect the three numbers");
  await button("Mark lesson complete").click(); await heading("Lesson complete");
  await page.getByRole("link", { name: "Next lesson: ETFs & indexes" }).click(); await heading("Hundreds of companies, one purchase?");
  await check(1); await next("Why spread exposure?"); await next("An index is a measuring tool"); await layouts("index-etf-visual", true);
  await next("Which can you buy?"); await check(1); await next("A fund can follow different strategies"); await check(1); await next("A basket still carries risk"); await check(1); await next("Keep the distinction clear"); await check(0);
  await next("Look inside the fund"); await layouts("fund-fees", true); await next("Try explaining it to someone else"); await next("One distinction opens the next door");
  await button("Mark lesson complete").click(); await heading("Lesson complete");
  await page.getByRole("link", { name: "Next lesson: Bonds & cash" }).click(); await heading("Owning and lending are different roles");
  await check(0); await next("Cash keeps money ready"); await check(0); await next("Every loan has two sides"); await next("A bond packages a loan"); await check(1); await next("Three terms describe the promise");
  await page.getByLabel("Your answer", { exact: true }).fill("50"); await button("Check answer").click(); await heading("That’s right"); await next("Follow the promised cash flows");
  await page.getByText("€1,250.00", { exact: true }).waitFor();
  for (const [label, invalid, valid] of [["Principal", "0", "1000"], ["Annual coupon rate", "-1", "5"], ["Years to maturity", "1.5", "5"]]) {
    await page.getByLabel(label, { exact: true }).fill(invalid); await page.locator("main").getByRole("alert").filter({ hasText: /.+/ }).waitFor();
    await page.getByLabel(label, { exact: true }).fill(valid);
  }
  await page.getByLabel("Annual coupon rate", { exact: true }).fill("3"); await page.getByText("€1,150.00", { exact: true }).waitFor(); await layouts("bond-cashflows", true);
  await next("A bond can trade at a new price"); await check(0); await next("A promise is not the same as certainty"); await check(1); await next("Choose the relationship, then the purpose");
  await button("Bond").click(); await page.getByText("A loan to an issuer", { exact: true }).waitFor(); await layouts("asset-comparison", true); await next("Three mental models to keep");
  await button("Mark lesson complete").click(); await heading("Lesson complete");
  await page.getByRole("link", { name: "Next lesson: How markets work" }).click(); await heading("A market needs a meeting point");
  await check(1); await next("Bid and ask name each side"); await check(1); await next("Choose what you want the order to express");
  await button("Sell now").click(); await page.getByText("You meet the bid", { exact: true }).waitFor(); await layouts("market-quote", true); await next("The gap is the spread");
  await page.reload(); await heading("The gap is the spread"); assert.equal((await row("foundations-markets")).last_position, 3);
  await check(1); await next("Execution and price constraints differ"); await check(1); await next("Most everyday trades are between investors"); await check(1); await next("Prices are discovered through trades"); await check(0);
  await next("Liquidity is ease, not safety"); await button("Thinly traded obscure security").click(); await page.getByText("Fewer active participants", { exact: false }).waitFor(); await layouts("liquidity", true); await next("Many forces can move a price"); await check(1); await next("Markets match views, not certainties");
  await button("Mark lesson complete").click(); await heading("Lesson complete");
  await page.getByRole("link", { name: "Next lesson: Risk vs reward" }).click(); await heading("Different outcomes can be equally possible");
  await check(1); await next("Expected is not realized"); await check(0); await next("More potential reward can mean more uncertainty"); await check(1); await next("Averages can hide the range");
  await button("Investment B").click(); await page.getByText("-20%", { exact: true }).waitFor(); await layouts("risk-scenarios", true); await next("Drawdown describes a fall from a peak");
  await page.getByLabel("Current value", { exact: true }).fill("8000"); await page.getByText("20%", { exact: true }).first().waitFor(); await layouts("drawdown", true); await page.getByLabel("Your answer", { exact: true }).fill("20"); await button("Check answer").click(); await heading("That’s right"); await next("A loss needs a larger recovery");
  await next("Risk takes more than one form"); await check(0); await next("Spreading exposure can reduce one dependency"); await button("Portfolio B · many investments").click(); await page.getByText("broad market risk remains", { exact: false }).waitFor(); await layouts("diversification", true); await check(1); await next("The timing of a need matters");
  await button("Intended for decades later").click(); await page.getByText("longer horizon", { exact: false }).waitFor(); await layouts("time-horizon", true); await check(0); await next("Risk is a question of outcomes and circumstances");
  await button("Mark lesson complete").click(); await heading("Lesson complete");
  await page.getByRole("link", { name: "Next lesson: Your first portfolio" }).click(); await heading("A collection shaped by its parts");
  await check(1); await next("One outcome can dominate"); await check(0); await next("See what spreading exposure can change");
  await page.getByText("-10%", { exact: true }).waitFor(); await button("All four fall together").click();
  await page.getByText("-20%", { exact: true }).first().waitFor(); assert.equal(await page.getByText("-20%", { exact: true }).count(), 2); await layouts("diversification-impact", true);
  await next("Allocation gives each part a share"); await next("Build, predict, and observe");
  await page.getByText("+5.4%", { exact: true }).waitFor();
  await page.getByLabel("Stocks allocation", { exact: true }).fill("70"); await page.getByText("Reduce the allocation by 10%.", { exact: true }).waitFor();
  assert.equal(await page.getByText("Hypothetical one-period portfolio return", { exact: true }).count(), 0);
  await page.getByLabel("Stocks allocation", { exact: true }).fill("-1"); await page.getByText("Stocks allocation must be from 0% to 100%.", { exact: true }).waitFor();
  await button("60 / 30 / 10 example").click(); await page.getByText("Ready · allocation equals 100%.", { exact: true }).waitFor();
  await page.getByLabel("Stocks allocation slider", { exact: true }).focus(); await page.getByLabel("Stocks allocation slider", { exact: true }).press("ArrowRight");
  assert.notEqual(await page.getByLabel("Stocks allocation slider", { exact: true }).evaluate((el) => getComputedStyle(el).outlineStyle), "none", "Portfolio slider has a visible keyboard focus indicator");
  await page.getByText("Reduce the allocation by 1%.", { exact: true }).waitFor();
  await button("100% stocks").click(); await page.getByText("+8%", { exact: true }).waitFor();
  await button("60 / 30 / 10 example").click(); await button("Stocks fall −10%").click(); await page.getByText("−5.4%", { exact: true }).waitFor();
  await page.getByLabel("Stocks hypothetical return", { exact: true }).fill("-101"); await page.getByText("Stocks return cannot be below −100%.", { exact: true }).waitFor();
  await page.getByLabel("Stocks hypothetical return", { exact: true }).fill("-10"); await layouts("portfolio-builder", true);
  await page.reload(); await heading("Build, predict, and observe"); assert.equal((await row("foundations-portfolio")).last_position, 4);
  await page.getByText("+5.4%", { exact: true }).waitFor(); await next("Each asset can play more than one role");
  await button("Bond").click(); await page.getByText("Credit, interest-rate, inflation, and liquidity risks may matter", { exact: true }).waitFor(); await layouts("portfolio-asset-roles", true);
  await next("Weights shape the one-period result"); await layouts("portfolio-weighted-return", true); await page.getByLabel("Your answer", { exact: true }).fill("5"); await button("Check answer").click(); await heading("That’s right");
  await next("Diversification reduces some dependencies"); await check(1); await next("Match uncertainty to the time available");
  await button("Money not expected for 20 years").click(); await page.getByText("Longer horizon", { exact: true }).waitFor(); await layouts("portfolio-horizon", true); await check(0);
  await next("Emotional comfort is not financial capacity"); await button("Financial need").click(); await button("Consider both").click(); await page.getByText("Tolerance is not enough", { exact: true }).waitFor(); await layouts("portfolio-risk-capacity", true); await check(1);
  await next("Every portfolio is a set of trade-offs"); await check(1); await next("The mix is the decision");
  await failThenRetry("Mark lesson complete", "foundations-portfolio"); await button("Mark lesson complete").click(); await heading("Lesson complete");
  await button("Back to Investing Foundations").click(); await heading("Investing Foundations");
  assert.equal(await page.getByTestId("module-progress").textContent(), "7 of 7 available lessons complete");
  assert.equal(await page.getByRole("button", { name: "Review lesson", exact: true }).count(), 7);
  await page.goto(`${baseURL}/progress`); await heading("Your progress");
  assert.match(await page.getByTestId("available-progress").textContent(), /7 of 10/); await layouts("progress", true);
  await button("Sign out").click(); await page.waitForURL("**/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(email); await page.getByLabel("Password", { exact: true }).fill(password);
  await button("Sign in").click(); await page.waitForURL("**/dashboard");
  assert.equal(await page.getByRole("link", { name: "Start lesson", exact: true }).getAttribute("href"), "/learn/returns/what-is-a-return");
  const completed = await row("foundations-why-invest");
  await page.goto(`${baseURL}/learn/investing-foundations/why-invest`); await heading("Same money, different purchasing power");
  await page.getByText("Already completed. Reviewing will not change your saved completion.").waitFor();
  await check(1); await next("Two tools for different needs");
  assert.deepEqual(await row("foundations-why-invest"), completed, "Review preserves completion, timestamp and cursor");
  const marketCompleted = await row("foundations-markets");
  await page.goto(`${baseURL}/learn/investing-foundations/how-markets-work`); await heading("A market needs a meeting point"); await check(1); await next("Bid and ask name each side");
  assert.deepEqual(await row("foundations-markets"), marketCompleted, "Market review preserves completion, timestamp and cursor");
  const riskCompleted = await row("foundations-risk-reward");
  await page.goto(`${baseURL}/learn/investing-foundations/risk-vs-reward`); await heading("Different outcomes can be equally possible"); await check(1); await next("Expected is not realized");
  assert.deepEqual(await row("foundations-risk-reward"), riskCompleted, "Risk review preserves completion, timestamp and cursor");
  const portfolioCompleted = await row("foundations-portfolio");
  await page.goto(`${baseURL}/learn/investing-foundations/your-first-portfolio`); await heading("A collection shaped by its parts"); await check(1); await next("One outcome can dominate");
  assert.deepEqual(await row("foundations-portfolio"), portfolioCompleted, "Portfolio review preserves completion, timestamp and cursor");
  // Same disposable learner simulates a pre-Foundations account with active Returns progress.
  await sql`delete from lesson_progress where user_id = ${userId}`;
  await page.goto(`${baseURL}/learn/returns/simple-returns`); await heading("One period at a time"); await next("Use the previous price");
  await page.goto(`${baseURL}/dashboard`); await heading("Continue learning");
  assert.equal(await page.getByRole("link", { name: "Continue lesson", exact: true }).getAttribute("href"), "/learn/returns/simple-returns");
  assert.equal((await profile()).onboarding_completed_at.toISOString(), onboardingCompleted);
  assert.equal((await profile()).experience_level, "BEGINNER");
  expectedNetworkFailure = true; // The intentionally unavailable route may log its expected 404.
  await page.goto(`${baseURL}/learn/investing-foundations/foundations-checkpoint`);
  await heading("This page isn’t available");
  assert.deepEqual(errors, []);
  console.log("PASS: beginner onboarding, legacy profile recomputation, all seven guided lessons, portfolio allocation/return/diversification/horizon/capacity interactions, save/completion retry, refresh, next lesson, sign-out/in, review, Returns continuity, real counts, six widths, keyboard, focus, reduced motion, no hydration/console errors. Screenshots:", screenshotDir);
} finally {
  await sql`delete from "user" where email = ${email}`;
  await sql.end(); await browser.close();
}
