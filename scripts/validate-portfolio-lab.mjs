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
  await page.getByText("Complete lessons to earn Practice Capital.", { exact: true }).waitFor();
  assert.equal(await page.getByTestId("portfolio-cash").textContent(), "0 Kč");
  assert.equal(await page.getByRole("link", { name: "Continue learning", exact: true }).getAttribute("href"), "/learn");

  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `zero-capital portfolio has no overflow at ${width}`);
    if ([320, 390, 1440].includes(width)) await page.screenshot({ path: `${screenshotDir}/zero-${width}.png`, fullPage: true });
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
  assert.match(await page.getByText(/vs contributed capital/).textContent(), /^\+?0\.00%/, "reward does not create investment gain");

  const search = page.getByRole("combobox", { name: "Instrument" });
  await search.fill("apple");
  await page.getByRole("option", { name: /AAPL/ }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/search-open-1440.png`, fullPage: true });
  await search.press("Enter");
  await page.getByLabel("Quantity").waitFor();
  await page.screenshot({ path: `${screenshotDir}/buy-1440.png`, fullPage: true });
  await page.getByLabel("Quantity").fill("1");
  await page.getByRole("button", { name: "Buy", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "not have enough" }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/insufficient-cash-1440.png`, fullPage: true });
  await page.getByLabel("Quantity").fill("0.25");
  await page.getByRole("button", { name: "Buy", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Purchase complete" }).waitFor();
  assert.equal(await page.getByTestId("portfolio-cash").textContent(), "1,351.62 Kč");
  const aapl = page.getByRole("row").filter({ hasText: "AAPL" });
  await aapl.getByRole("button", { name: "Sell", exact: true }).click();
  await page.screenshot({ path: `${screenshotDir}/sell-1440.png`, fullPage: true });
  await page.getByLabel("Quantity to sell").fill("0.3");
  await page.locator('section[aria-labelledby="sell-heading"]').getByRole("button", { name: "Sell", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "cannot sell more" }).waitFor();
  await page.getByLabel("Quantity to sell").fill("0.1");
  await page.locator('section[aria-labelledby="sell-heading"]').getByRole("button", { name: "Sell", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Sale complete" }).waitFor();
  await page.reload();
  await page.getByRole("row").filter({ hasText: "AAPL" }).getByText("0.15", { exact: true }).waitFor();

  await page.getByRole("button", { name: "Reset portfolio", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Learning progress and old trades remain recorded.", { exact: false }).waitFor();
  await page.screenshot({ path: `${screenshotDir}/reset-confirmation-1440.png`, fullPage: true });
  await dialog.getByRole("button", { name: "Reset portfolio", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Portfolio reset" }).waitFor();
  assert.equal(await page.getByTestId("portfolio-cash").textContent(), "2,000 Kč");
  assert.equal(await page.getByRole("row").filter({ hasText: "AAPL" }).count(), 0);
  await page.screenshot({ path: `${screenshotDir}/post-reset-1440.png`, fullPage: true });
  assert.deepEqual(errors, [], "Portfolio Lab has no browser errors");
  console.log("PASS: zero-capital, later reward, keyboard search, fractional buy, insufficient cash, oversell, partial sell, persistence, reset, responsive layouts, and 200% text. Screenshots:", screenshotDir);
} finally {
  await browser.close();
  if (userId) await sql`delete from "user" where id = ${userId}`;
  await sql.end();
}
