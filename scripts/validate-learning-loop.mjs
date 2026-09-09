// Product-reset acceptance suite. Real auth/actions/PostgreSQL, disposable local identities only.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import postgres from "postgres";
import { chromium } from "playwright";

const baseURL = process.env.PRODUCT_TEST_URL ?? "http://localhost:3000";
const local = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
assert.ok(local(new URL(baseURL).hostname) && local(new URL(process.env.DATABASE_URL).hostname), "Requires a local app and DB.");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "chrome" });
const screenshotDir = process.env.PRODUCT_SCREENSHOT_DIR ?? "/tmp/investi-reset-qa";
await mkdir(screenshotDir, { recursive: true });
const ids = new Set(), errors = [], checks = [];
let constraint;
let contextIndex = 10;
// Give each isolated browser an explicit local client address so Better Auth's
// production rate limiting does not make repeated local acceptance runs share a bucket.
const newContext = () => browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: "Europe/Prague", extraHTTPHeaders: { "x-forwarded-for": `127.0.0.${contextIndex++}` } });
const heading = (page, name) => page.getByRole("heading", { name, exact: true }).waitFor();
const button = (page, name) => page.getByRole("button", { name, exact: true });
const rows = (id) => sql`select * from lesson_progress where user_id = ${id} order by lesson_id`;
const awards = (id) => sql`select * from lesson_award where user_id = ${id} order by lesson_id`;
const total = async (id) => Number((await sql`select coalesce(sum(xp), 0)::int as xp from lesson_award where user_id = ${id}`)[0].xp);
async function sessionOwner(context) {
  const result = await context.request.get(`${baseURL}/api/auth/get-session`);
  const session = await result.json();
  assert.ok(session?.user?.id);
  ids.add(session.user.id);
  return session.user;
}
async function layouts(page, label) {
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${screenshotDir}/${label}-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label}: no overflow at ${width}`);
    assert.equal(await page.locator("h1").count(), 1, `${label}: one page heading`);
    const nav = page.getByRole("navigation", { name: width < 1024 ? "Mobile navigation" : "Main navigation" });
    if (await nav.count()) {
      assert.deepEqual(await nav.getByRole("link").allTextContents(), ["Learn", "Lab", "Progress"]);
      const box = await nav.boundingBox();
      assert.ok(box && box.height >= 48, "navigation has large targets");
    }
  }
}
async function menuSignOut(page) {
  await page.getByLabel("Account menu").click();
  await button(page, "Sign out").click();
  await page.waitForURL("**/sign-in");
}
async function startDemo(context) {
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/sign-in`);
  await button(page, "Explore demo").click();
  await page.waitForURL("**/learn");
  const owner = await sessionOwner(context);
  assert.equal(owner.isAnonymous, true);
  assert.equal(await total(owner.id), 360);
  assert.equal((await rows(owner.id)).length, 7);
  await page.getByTestId("total-xp").filter({ hasText: "360 XP" }).waitFor();
  return { page, owner };
}
try {
  const demoA = await newContext();
  const { page, owner: ownerA } = await startDemo(demoA);
  await layouts(page, "learn");
  assert.equal(await page.getByRole("link", { name: "Continue learning", exact: true }).getAttribute("href"), "/learn/investing-foundations/risk-vs-reward");
  await page.getByRole("link", { name: "Continue learning", exact: true }).click();
  await heading(page, "The timing of a need matters");
  assert.equal(await page.getByRole("navigation").count(), 0, "Focused lesson has no app navigation");
  await layouts(page, "lesson");
  await page.getByRole("radio").first().check();
  await button(page, "Check answer").click();
  await heading(page, "That’s right");
  assert.ok(await button(page, "Continue").evaluate((el) => el === document.activeElement), "feedback hands off focus");
  await button(page, "Continue").click();
  await heading(page, "Risk is a question of outcomes and circumstances");
  await page.reload();
  await heading(page, "Risk is a question of outcomes and circumstances");
  const before = await rows(ownerA.id);
  // Force the reward insert to fail only for this run's disposable owner. The progress update must roll back.
  constraint = `qa_award_${randomUUID().replaceAll("-", "")}`;
  await sql.unsafe(`ALTER TABLE lesson_award ADD CONSTRAINT "${constraint}" CHECK (user_id <> '${ownerA.id.replaceAll("'", "''")}') NOT VALID`);
  await button(page, "Mark lesson complete").click();
  await page.locator("main").getByRole("alert").filter({ hasText: "Completion could not be saved" }).waitFor();
  assert.deepEqual(await rows(ownerA.id), before, "XP failure rolls back lesson completion");
  assert.equal(await total(ownerA.id), 360);
  assert.equal(await page.getByRole("heading", { name: "Lesson complete", exact: true }).count(), 0);
  await sql.unsafe(`ALTER TABLE lesson_award DROP CONSTRAINT "${constraint}"`); constraint = undefined;
  const concurrent = await demoA.newPage();
  await concurrent.goto(page.url());
  await heading(concurrent, "Risk is a question of outcomes and circumstances");
  await Promise.all([button(page, "Mark lesson complete").click(), button(concurrent, "Mark lesson complete").click()]);
  await heading(page, "Lesson complete"); await heading(concurrent, "Lesson complete");
  assert.equal(await total(ownerA.id), 420, "concurrent completions award XP once");
  const completed = await rows(ownerA.id), savedAwards = await awards(ownerA.id);
  assert.equal(savedAwards.length, 7);
  await page.getByText("2 / 2 lessons", { exact: true }).waitFor();
  await page.getByText("4 day streak", { exact: true }).waitFor();
  assert.ok(await button(page, "Next lesson").evaluate((el) => el === document.activeElement));
  await layouts(page, "completion");
  await button(page, "Next lesson").click();
  await heading(page, "A collection shaped by its parts");
  await page.goto(`${baseURL}/learn/investing-foundations/risk-vs-reward`);
  await heading(page, "Different outcomes can be equally possible");
  await page.getByRole("radio").nth(1).check(); await button(page, "Check answer").click(); await button(page, "Continue").click();
  await heading(page, "Expected is not realized");
  assert.deepEqual(await awards(ownerA.id), savedAwards, "review awards nothing");
  assert.deepEqual((await rows(ownerA.id)).find((row) => row.lesson_id === "foundations-risk-reward"), completed.find((row) => row.lesson_id === "foundations-risk-reward"), "review preserves completion");
  checks.push("A/F: one-click resume; refresh; completion/XP rollback; concurrent idempotence; daily goal; next lesson; review");

  const demoB = await newContext();
  const { page: pageB, owner: ownerB } = await startDemo(demoB);
  assert.notEqual(ownerA.id, ownerB.id);
  assert.equal(await total(ownerB.id), 360);
  assert.equal((await rows(ownerB.id)).find((row) => row.lesson_id === "foundations-risk-reward").status, "in_progress");
  await pageB.reload();
  assert.equal(await total(ownerB.id), 360, "demo refresh does not reseed or duplicate");
  checks.push("D/E: one-click isolated demo; separate identities and state; refresh persistence");

  await page.goto(`${baseURL}/lab`); await heading(page, "What happens if…"); await layouts(page, "lab");
  await page.getByRole("link", { name: "Open Portfolio Lab", exact: true }).click();
  await button(page, "Run scenario").click();
  await heading(page, "See what changed");
  assert.equal(await page.getByTestId("portfolio-return").textContent(), "-11.4%");
  const slider = page.getByRole("slider", { name: "Stocks allocation slider" });
  await slider.focus();
  assert.notEqual(await slider.evaluate((element) => getComputedStyle(element).outlineStyle), "none", "Portfolio slider keeps a visible keyboard focus indicator");
  assert.ok((await slider.boundingBox()).height >= 48, "Portfolio slider keeps a 48px touch target");
  await slider.press("Home");
  await button(page, "Run scenario").click();
  await page.getByTestId("portfolio-comparison").waitFor();
  assert.equal(await page.getByTestId("portfolio-return").textContent(), "+1.5%");
  await page.getByText("Edit scenario & starting amount", { exact: true }).click();
  await page.getByRole("textbox", { name: "Stocks hypothetical return" }).fill("-101");
  await button(page, "Run scenario").click(); await page.locator("main").getByRole("alert").waitFor();
  await page.getByRole("textbox", { name: "Stocks hypothetical return" }).fill("-20");
  await button(page, "Run scenario").click(); await page.locator("main").getByRole("alert").waitFor({ state: "hidden" });
  await page.getByText("Edit scenario & starting amount", { exact: true }).click();
  await layouts(page, "portfolio");
  await page.goto(`${baseURL}/lab/backtesting`);
  await button(page, "Run backtest").click();
  await page.getByTestId("metric-final-value").waitFor();
  await page.locator(".recharts-surface").waitFor();
  assert.equal(await page.getByTestId("metric-final-value").textContent(), "159,732 Kč");
  await page.getByRole("radio", { name: "Max drawdown", exact: true }).check();
  await button(page, "Check answer").click(); await page.getByRole("status").filter({ hasText: "That’s right" }).waitFor();
  await page.getByText("View data table", { exact: true }).click();
  assert.equal(await page.getByRole("row").count(), 134, "full accessible chart table");
  await page.getByText("View data table", { exact: true }).click();
  await layouts(page, "backtesting");
  await page.getByRole("textbox", { name: "Initial amount" }).fill("0");
  await button(page, "Run backtest").click(); await page.locator("main").getByRole("alert").waitFor();
  await page.getByRole("textbox", { name: "Initial amount" }).fill("100000");
  await page.getByLabel("From January").selectOption("2025"); await page.getByLabel("To December").selectOption("2020");
  await button(page, "Run backtest").click(); await page.locator("main").getByRole("alert").filter({ hasText: "start year" }).waitFor();
  await page.getByLabel("From January").selectOption("2020");
  await button(page, "Run backtest").click(); await page.locator("main").getByRole("alert").waitFor({ state: "hidden" });
  await page.getByText("Jan 2020 – Dec 2020", { exact: false }).waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await button(page, "Run backtest").evaluate((el) => getComputedStyle(el).transitionDuration), "0s");
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Backtest respects 200% text at 320px");
  await page.evaluate(() => document.documentElement.style.fontSize = "");
  checks.push("Labs: slider keyboard input; weighted scenario and comparison; invalid returns; backtest; benchmark; full table; question; invalid amount/period; reduced motion; 200% text");
  await page.goto(`${baseURL}/progress`); await heading(page, "Look how far you’ve come."); await layouts(page, "progress");
  assert.equal(await total(ownerA.id), 420, "Lab does not manufacture lesson XP");

  const fresh = await newContext(), signup = await fresh.newPage();
  const email = `reset-${randomUUID()}@example.com`, password = randomUUID();
  await signup.goto(`${baseURL}/sign-up`); await layouts(signup, "auth");
  await signup.getByLabel("Name", { exact: true }).fill("Loop QA");
  await signup.getByLabel("Email", { exact: true }).fill(email);
  await signup.getByLabel("Password", { exact: true }).fill(password);
  await button(signup, "Create account").click(); await signup.waitForURL("**/onboarding");
  const normal = await sessionOwner(fresh); assert.equal(normal.isAnonymous, false);
  await layouts(signup, "onboarding");
  // Default beginner selection means only Start learning is needed after account creation.
  await button(signup, "Start learning").click();
  await heading(signup, "Same money, different purchasing power");
  assert.equal(await signup.getByRole("radio").count(), 3, "first lesson opens directly on an interaction");
  const [profile] = await sql`select * from learning_profile where user_id = ${normal.id}`;
  assert.deepEqual(profile.goals, []); assert.deepEqual(profile.interests, []);
  assert.equal(profile.time_zone, "Europe/Prague");
  assert.equal(await total(normal.id), 0);
  await signup.goto(`${baseURL}/onboarding`); await signup.waitForURL("**/learn");
  // Legacy preferences and active Returns cursor survive sign-out/in and dashboard compatibility redirect.
  await sql`update learning_profile set experience_level = 'INVESTOR', goals = ARRAY['QUANT']::learning_goal[], interests = ARRAY['QUANT']::learning_interest[], daily_goal_minutes = 15, recommended_start = 'returns' where user_id = ${normal.id}`;
  await sql`insert into lesson_progress (user_id, lesson_id, status, last_position, updated_at) values (${normal.id}, 'returns-simple-returns', 'in_progress', 3, now())`;
  const [legacy] = await sql`select * from learning_profile where user_id = ${normal.id}`;
  await menuSignOut(signup);
  await signup.getByLabel("Email", { exact: true }).fill(email);
  await signup.getByLabel("Password", { exact: true }).fill(password);
  await button(signup, "Sign in").click(); await signup.waitForURL("**/learn");
  await signup.goto(`${baseURL}/dashboard`); await signup.waitForURL("**/learn");
  assert.equal(await signup.getByRole("link", { name: "Continue learning", exact: true }).getAttribute("href"), "/learn/returns/simple-returns");
  assert.deepEqual((await sql`select * from learning_profile where user_id = ${normal.id}`)[0], legacy);
  await signup.getByRole("link", { name: "Continue learning", exact: true }).click(); await heading(signup, "Explore a price series");
  checks.push("B/C: minimal onboarding opens first interaction; no invented preferences; normal auth; old profile retained; no replay; Returns continuity; dashboard redirect");
  const failureContext = await newContext(), failurePage = await failureContext.newPage();
  await failurePage.goto(`${baseURL}/sign-in`);
  await failurePage.route("**/api/auth/sign-in/anonymous", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Unavailable" }) }));
  await button(failurePage, "Explore demo").click();
  await failurePage.locator("main").getByRole("alert").filter({ hasText: "We couldn’t open the demo" }).waitFor();
  assert.equal(new URL(failurePage.url()).pathname, "/sign-in");
  assert.equal(await button(failurePage, "Explore demo").isEnabled(), true);
  checks.push("Demo initialization failure stays on auth with retry; no false populated state");
  assert.deepEqual(errors, [], "No browser runtime errors");
  await writeFile(`${screenshotDir}/results.json`, JSON.stringify({ checks, widths: [320, 375, 390, 768, 1024, 1440], friction: { returning: 1, demo: 1, newAfterSignup: 1 } }, null, 2));
  console.log("PASS", checks.join("\n"), "\nScreenshots:", screenshotDir);
} finally {
  if (constraint) await sql.unsafe(`ALTER TABLE lesson_award DROP CONSTRAINT IF EXISTS "${constraint}"`);
  await browser.close();
  for (const id of ids) await sql`delete from "user" where id = ${id}`;
  await sql.end();
}
