// Real auth, server actions and PostgreSQL. Deletes only its disposable account.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import postgres from "postgres";
import { chromium } from "playwright";

const baseURL = process.env.ONBOARDING_TEST_URL ?? "http://localhost:3000";
const local = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
assert.ok(local(new URL(baseURL).hostname) && local(new URL(process.env.DATABASE_URL).hostname), "Requires local app and database");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const email = `onboarding-${randomUUID()}@example.com`;
const password = randomUUID();
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
const screenshotDir = "/tmp/investi-onboarding-qa";
await mkdir(screenshotDir, { recursive: true });
let userId;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const heading = (name) => page.getByRole("heading", { name, exact: true }).waitFor();
  const button = (name) => page.getByRole("button", { name, exact: true });
  const row = async () => (await sql`select * from learning_profile where user_id = ${userId}`)[0];
  const next = async (name) => { await button("Continue").click(); await heading(name); };
  const check = (name) => page.getByLabel(name, { exact: true }).check();
  async function layouts(label) {
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 740 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} overflow at ${width}`);
      assert.equal(await page.locator("h1").count(), 1);
      if (await page.locator("footer").count()) {
        const target = page.locator("section").last();
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const section = await target.boundingBox();
        const footer = await page.locator("footer").boundingBox();
        assert.ok(section.y + section.height <= footer.y + 1, `${label} content can scroll clear of CTA at ${width}`);
      }
      if ([320, 390, 1440].includes(width)) await page.screenshot({ path: `${screenshotDir}/${label}-${width}.png`, fullPage: true });
    }
  }
  for (const route of ["/onboarding", "/dashboard", "/settings", "/learn/returns"]) {
    await page.goto(`${baseURL}${route}`); await page.waitForURL("**/sign-in");
  }
  await page.goto(`${baseURL}/sign-up`);
  await page.getByLabel("Name", { exact: true }).fill("Onboarding QA");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await button("Create account").click();
  await page.waitForURL("**/onboarding");
  [{ id: userId }] = await sql`select id from "user" where email = ${email}`;
  await heading("Build real investing knowledge, step by step.");
  assert.equal(await page.getByRole("navigation").count(), 0);
  await layouts("welcome");
  await button("Get started").click(); await heading("How familiar are you with investing?");
  assert.equal(await button("Continue").isDisabled(), true);
  await page.getByRole("radio").first().press("Space");
  await page.getByRole("radio").first().press("ArrowDown");
  assert.equal(await page.getByLabel("I know the basics", { exact: true }).isChecked(), true);
  assert.equal(await page.getByRole("radio").nth(1).evaluate((el) => el.matches(":focus-visible")), true);
  await layouts("experience");
  // Invalid payload reaches the real server; client validation cannot be the boundary.
  await page.route("**/onboarding", (route) => route.request().method() === "POST" ? route.continue({ postData: route.request().postData().replace('"BASIC"', '"INVALID"') }) : route.continue());
  await button("Continue").click(); await page.getByRole("alert").waitFor();
  assert.equal((await row()).experience_level, null);
  await page.unroute("**/onboarding");
  await next("What would you like to get better at?");
  await page.getByLabel("Build a better portfolio", { exact: true }).press("Space");
  await check("Learn quantitative investing");
  await layouts("goals");
  // Network failure preserves both answers and current step for retry.
  await page.route("**/onboarding", (route) => route.request().method() === "POST" ? route.abort() : route.continue());
  await button("Continue").click(); await page.getByRole("alert").waitFor();
  assert.equal(await page.getByLabel("Build a better portfolio", { exact: true }).isChecked(), true);
  assert.equal((await row()).onboarding_step, 2);
  await page.unroute("**/onboarding");
  await next("What are you most interested in?");
  await page.reload(); await heading("What are you most interested in?");
  await button("Back").click(); await heading("What would you like to get better at?");
  assert.equal(await page.getByLabel("Build a better portfolio", { exact: true }).isChecked(), true);
  await next("What are you most interested in?");
  await check("Portfolio building"); await check("Quantitative strategies");
  await layouts("interests");
  await next("How much time would you like to learn each day?");
  // Incomplete users cannot enter the app, including in a fresh browser session.
  const resumeContext = await browser.newContext({ storageState: await page.context().storageState() });
  const resumePage = await resumeContext.newPage();
  await resumePage.goto(`${baseURL}/dashboard`); await resumePage.waitForURL("**/onboarding");
  await resumePage.getByRole("heading", { name: "How much time would you like to learn each day?", exact: true }).waitFor();
  await resumeContext.close();
  await check("15 minutes"); await layouts("daily-goal");
  await next("Your recommended path");
  await page.getByText("Portfolio Construction", { exact: true }).waitFor();
  await page.getByText("Quantitative Investing", { exact: true }).waitFor();
  assert.equal(await page.locator('section a').count(), 0, "Future modules have no links");
  await layouts("recommendation");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await next("Your learning path is ready.");
  assert.equal(await page.locator("h1").evaluate((el) => el === document.activeElement), true);
  await layouts("ready");
  assert.equal((await row()).onboarding_completed_at, null, "Ready is not yet completed");
  await page.reload(); await heading("Your learning path is ready.");
  await button("Edit preferences").click(); await heading("How familiar are you with investing?");
  await check("I already invest"); await next("What would you like to get better at?");
  await next("What are you most interested in?"); await next("How much time would you like to learn each day?");
  await next("Your recommended path"); await next("Your learning path is ready.");
  const staleContext = await browser.newContext({ storageState: await page.context().storageState() });
  const stalePage = await staleContext.newPage();
  await stalePage.goto(`${baseURL}/onboarding`); await stalePage.getByRole("button", { name: "Start learning", exact: true }).waitFor();
  await page.route("**/onboarding", (route) => route.request().method() === "POST" ? route.abort() : route.continue());
  await button("Start learning").click(); await page.getByRole("alert").waitFor();
  assert.equal((await row()).onboarding_completed_at, null);
  await page.unroute("**/onboarding");
  await button("Start learning").click(); await page.waitForURL("**/dashboard");
  const completedAt = (await row()).onboarding_completed_at.toISOString();
  assert.equal((await row()).recommended_start, "returns");
  assert.equal((await row()).daily_goal_minutes, 15);
  await button("Sign out").click(); await page.waitForURL("**/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await button("Sign in").click(); await page.waitForURL("**/dashboard");
  await page.goto(`${baseURL}/onboarding`); await page.waitForURL("**/dashboard");
  await page.getByRole("link", { name: "Settings", exact: true }).filter({ visible: true }).click();
  await heading("Learning preferences");
  await check("I’m comfortable with advanced concepts"); await check("20+ minutes");
  await page.getByLabel("Portfolio building", { exact: true }).uncheck();
  await layouts("preferences");
  await page.route("**/settings", (route) => route.request().method() === "POST" ? route.abort() : route.continue());
  await button("Save preferences").click(); await page.getByRole("alert").waitFor();
  assert.equal((await row()).daily_goal_minutes, 15);
  await page.unroute("**/settings");
  await button("Save preferences").click(); await page.getByRole("status").waitFor();
  await page.reload(); await heading("Learning preferences");
  assert.equal(await page.getByLabel("20+ minutes", { exact: true }).isChecked(), true);
  assert.equal(await page.getByLabel("I’m comfortable with advanced concepts", { exact: true }).isChecked(), true);
  assert.equal(await page.getByLabel("Portfolio building", { exact: true }).isChecked(), false);
  assert.equal((await row()).onboarding_completed_at.toISOString(), completedAt);
  // Refresh the session after sign-out while retaining the stale tab’s original answers.
  await staleContext.addCookies(await page.context().cookies());
  // Stale completion is idempotent and cannot undo edited preferences.
  await stalePage.getByRole("button", { name: "Start learning", exact: true }).click(); await stalePage.waitForURL("**/dashboard");
  assert.equal((await row()).daily_goal_minutes, 20);
  assert.equal((await row()).experience_level, "ADVANCED");
  await staleContext.close();
  assert.deepEqual(errors, []);
  console.log("PASS: auth gates, signup, seven steps, typed server validation, retries, refresh/back/resume, completion, re-login, preference persistence, stale completion, keyboard, reduced motion, six widths.");
} finally {
  await sql`delete from "user" where email = ${email}`;
  await sql.end(); await browser.close();
}
