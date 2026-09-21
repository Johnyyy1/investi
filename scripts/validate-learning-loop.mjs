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
const practiceCapitalTotal = async (id) => BigInt((await sql`select coalesce(sum(practice_capital_minor), 0)::text as total from lesson_award where user_id = ${id}`)[0].total);
async function finishReview(page) {
  for (let step = 0; step < 20; step += 1) {
    const finish = button(page, "Finish review");
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      await heading(page, "Review complete");
      return;
    }
    const checkAnswer = button(page, "Check answer");
    if (await checkAnswer.isVisible().catch(() => false)) {
      const radios = page.getByRole("radio");
      if (await radios.count()) await radios.first().check();
      else await page.getByRole("textbox", { name: "Your answer", exact: true }).fill("0");
      await checkAnswer.click();
    }
    await button(page, "Continue").click();
  }
  throw new Error("Review did not reach its completion screen.");
}
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
      const links = nav.getByRole("link");
      assert.deepEqual(await links.allTextContents(), ["Learn", "Lab", "Progress"]);
      const box = await nav.boundingBox();
      assert.ok(box && box.height >= 48, "navigation has large targets");
      for (const link of await links.all()) {
        const linkBox = await link.boundingBox();
        assert.ok(linkBox && linkBox.height >= 48, `${label}: every navigation target is at least 48px at ${width}`);
      }
      const accountBox = await page.getByLabel("Account menu").boundingBox();
      assert.ok(accountBox && accountBox.height >= 48, `${label}: account target is at least 48px at ${width}`);
    }
  }
}
async function accountMenuLayouts(page) {
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const trigger = page.getByLabel("Account menu");
    await trigger.click();
    const settings = page.getByRole("link", { name: "Settings", exact: true });
    const signOut = button(page, "Sign out");
    await settings.waitFor();
    const [triggerBox, settingsBox, signOutBox] = await Promise.all([
      trigger.boundingBox(), settings.boundingBox(), signOut.boundingBox(),
    ]);
    for (const box of [triggerBox, settingsBox, signOutBox]) {
      assert.ok(box && box.x >= 0 && box.x + box.width <= width, `account menu stays within ${width}px viewport`);
      assert.ok(box.height >= 44, `account menu targets stay at least 44px at ${width}`);
    }
    await page.screenshot({ path: `${screenshotDir}/account-menu-${width}.png`, fullPage: true });
    await trigger.press("Escape");
    assert.ok(await trigger.evaluate((element) => element === document.activeElement), "Escape closes account menu and returns focus");
    assert.equal(await settings.isVisible(), false, "Escape hides account actions");
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; window.scrollTo(0, 0); });
  const trigger = page.getByLabel("Account menu");
  await trigger.click();
  const settings = page.getByRole("link", { name: "Settings", exact: true });
  await settings.waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Learn and account shell respect 200% text at 320px");
  for (const item of [trigger, settings, button(page, "Sign out")]) {
    const box = await item.boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 320, "enlarged account controls stay inside the viewport");
  }
  await page.screenshot({ path: `${screenshotDir}/account-menu-320-text-200.png`, fullPage: true });
  await trigger.press("Escape");
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.setViewportSize({ width: 1440, height: 900 });
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
  assert.equal(await practiceCapitalTotal(owner.id), 1_200_000n);
  assert.ok((await awards(owner.id)).every((award) => BigInt(award.practice_capital_minor) === 200_000n && award.reward_policy_version === 1));
  assert.equal((await rows(owner.id)).length, 7);
  await page.getByTestId("total-practice-capital").filter({ hasText: "12,000 Kč" }).waitFor();
  assert.equal(await page.getByLabel("Practice Capital: 12,000 Kč").count(), 1, "Learn exposes an unambiguous capital label");
  assert.equal(await page.getByText(/\bXP\b/).count(), 0, "Learn does not expose XP");
  return { page, owner };
}
try {
  const demoA = await newContext();
  const { page, owner: ownerA } = await startDemo(demoA);
  await layouts(page, "learn");
  await accountMenuLayouts(page);
  await page.getByLabel("Account menu").click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await heading(page, "Learning preferences");
  await layouts(page, "settings");
  assert.equal(await page.getByRole("navigation", { name: "Main navigation" }).locator('[aria-current="page"]').count(), 0, "Settings does not imply a primary navigation destination");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Lab", exact: true }).click();
  await heading(page, "What happens if…");
  assert.equal(await page.getByRole("link", { name: "Lab", exact: true }).getAttribute("aria-current"), "page");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
  await heading(page, "Look how far you’ve come.");
  assert.equal(await page.getByRole("link", { name: "Progress", exact: true }).getAttribute("aria-current"), "page");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Learn", exact: true }).click();
  await page.waitForURL("**/learn");
  await page.locator("h1").waitFor();
  assert.equal(await page.getByRole("link", { name: "Learn", exact: true }).getAttribute("aria-current"), "page");
  assert.equal(await page.getByRole("link", { name: "Continue learning", exact: true }).getAttribute("href"), "/learn/investing-foundations/risk-vs-reward");
  await page.getByRole("link", { name: "Continue learning", exact: true }).click();
  await heading(page, "The timing of a need matters");
  assert.equal(await page.getByRole("navigation", { name: /^(Main|Mobile) navigation$/ }).count(), 0, "Focused lesson has no app navigation");
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
  assert.deepEqual(await rows(ownerA.id), before, "reward receipt failure rolls back lesson completion");
  assert.equal(await total(ownerA.id), 360);
  assert.equal(await practiceCapitalTotal(ownerA.id), 1_200_000n);
  assert.equal(await page.getByRole("heading", { name: "Lesson complete", exact: true }).count(), 0);
  await sql.unsafe(`ALTER TABLE lesson_award DROP CONSTRAINT "${constraint}"`); constraint = undefined;
  const concurrent = await demoA.newPage();
  await concurrent.goto(page.url());
  await heading(concurrent, "Risk is a question of outcomes and circumstances");
  await Promise.all([button(page, "Mark lesson complete").click(), button(concurrent, "Mark lesson complete").click()]);
  await heading(page, "Lesson complete"); await heading(concurrent, "Lesson complete");
  assert.equal(await total(ownerA.id), 420, "concurrent completions award XP once");
  assert.equal(await practiceCapitalTotal(ownerA.id), 1_400_000n, "concurrent completions award Practice Capital once");
  assert.equal(
    await page.getByLabel("2,000 Kč Practice Capital earned").count() + await concurrent.getByLabel("2,000 Kč Practice Capital earned").count(),
    1,
    "the authoritative first-completion result presents one Practice Capital reward",
  );
  assert.equal(await page.getByText(/\bXP\b/).count() + await concurrent.getByText(/\bXP\b/).count(), 0, "completion does not expose XP");
  const completed = await rows(ownerA.id), savedAwards = await awards(ownerA.id);
  assert.equal(savedAwards.length, 7);
  await page.getByText("2 / 2 lessons", { exact: true }).waitFor();
  await page.getByText("4 days", { exact: true }).waitFor();
  assert.ok(await button(page, "Next lesson").evaluate((el) => el === document.activeElement));
  await layouts(page, "completion");
  await button(page, "Next lesson").click();
  await heading(page, "A collection shaped by its parts");
  await page.goto(`${baseURL}/learn/investing-foundations/risk-vs-reward`);
  await heading(page, "Different outcomes can be equally possible");
  await page.getByRole("radio").nth(1).check(); await button(page, "Check answer").click(); await button(page, "Continue").click();
  await heading(page, "Expected is not realized");
  await finishReview(page);
  await page.screenshot({ path: `${screenshotDir}/review-completion.png`, fullPage: true });
  assert.equal(await page.getByLabel("2,000 Kč Practice Capital earned").count(), 0, "review completion presents no reward");
  assert.equal(await page.getByText("Review strengthens an idea. No duplicate reward.", { exact: true }).count(), 1, "review completion is neutral about rewards");
  assert.deepEqual(await awards(ownerA.id), savedAwards, "review awards nothing");
  assert.equal(await practiceCapitalTotal(ownerA.id), 1_400_000n, "review awards no Practice Capital");
  assert.deepEqual((await rows(ownerA.id)).find((row) => row.lesson_id === "foundations-risk-reward"), completed.find((row) => row.lesson_id === "foundations-risk-reward"), "review preserves completion");
  checks.push("A/F: one-click resume; refresh; atomic XP/Practice Capital rollback; concurrent idempotence; daily goal; next lesson; review");

  const demoB = await newContext();
  const { page: pageB, owner: ownerB } = await startDemo(demoB);
  assert.notEqual(ownerA.id, ownerB.id);
  assert.equal(await total(ownerB.id), 360);
  assert.equal(await practiceCapitalTotal(ownerB.id), 1_200_000n);
  assert.equal((await rows(ownerB.id)).find((row) => row.lesson_id === "foundations-risk-reward").status, "in_progress");
  await pageB.reload();
  assert.equal(await total(ownerB.id), 360, "demo refresh does not reseed or duplicate");
  assert.equal(await practiceCapitalTotal(ownerB.id), 1_200_000n, "demo refresh preserves receipt-derived Practice Capital");
  checks.push("D/E: one-click isolated demo; separate identities and state; refresh persistence");

  await page.goto(`${baseURL}/lab`); await heading(page, "What happens if…"); await layouts(page, "lab");
  await page.getByRole("link", { name: "Open Portfolio Lab", exact: true }).click();
  await heading(page, "Portfolio Lab");
  await page.getByTestId("holding-AAPL").waitFor();
  await button(page, "Invest").click();
  const investmentDialog = page.getByRole("dialog", { name: "Invest Practice Capital" });
  const search = investmentDialog.getByRole("combobox", { name: "Search investments" });
  await search.fill("bond");
  await investmentDialog.getByRole("option", { name: /CZGB35/ }).waitFor();
  await search.press("ArrowDown");
  await search.press("Enter");
  await investmentDialog.getByRole("textbox", { name: "Quantity", exact: true }).fill("1.3333");
  await investmentDialog.getByRole("button", { name: "Review order", exact: true }).click();
  await investmentDialog.getByRole("button", { name: "Confirm buy CZGB35", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Investment added" }).waitFor();
  const bondRow = page.getByTestId("holding-CZGB35");
  await bondRow.waitFor();
  await bondRow.getByRole("button", { name: "Actions for CZGB35", exact: true }).click();
  await page.getByRole("menu", { name: "Actions for CZGB35" }).getByRole("menuitem", { name: "Sell", exact: true }).click();
  const saleDialog = page.getByRole("dialog", { name: "Sell CZGB35" });
  await saleDialog.getByLabel("Quantity to sell").fill("0.3333");
  await saleDialog.getByRole("button", { name: "Sell CZGB35", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Investment sold" }).waitFor();
  await page.reload(); await heading(page, "Portfolio Lab");
  await page.getByTestId("holding-CZGB35").getByText("1 shares", { exact: true }).waitFor();
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
  checks.push("Labs: persistent portfolio search/buy/sell/reload; responsive holdings; backtest; benchmark; full table; question; invalid amount/period; reduced motion; 200% text");
  await page.goto(`${baseURL}/progress`); await heading(page, "Look how far you’ve come."); await layouts(page, "progress");
  await page.getByTestId("total-practice-capital").filter({ hasText: "14,000 Kč" }).waitFor();
  assert.equal(await page.getByLabel("Practice Capital earned: 14,000 Kč").count(), 1, "Progress exposes an unambiguous earned-capital label");
  assert.equal(await page.getByText(/\bXP\b/).count(), 0, "Progress does not expose XP");
  assert.equal(await total(ownerA.id), 420, "Lab does not manufacture lesson XP");
  assert.equal(await practiceCapitalTotal(ownerA.id), 1_400_000n, "Lab does not manufacture Practice Capital");

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
  assert.equal(await practiceCapitalTotal(normal.id), 0n, "new users receive no starting Practice Capital");
  await signup.goto(`${baseURL}/onboarding`); await signup.waitForURL("**/learn");
  // Legacy preferences and active Returns cursor survive sign-out/in and dashboard compatibility redirect.
  await sql`update learning_profile set experience_level = 'INVESTOR', goals = ARRAY['QUANT']::learning_goal[], interests = ARRAY['QUANT']::learning_interest[], daily_goal_minutes = 15, recommended_start = 'returns' where user_id = ${normal.id}`;
  await sql`insert into lesson_progress (user_id, lesson_id, status, last_position, updated_at) values (${normal.id}, 'returns-simple-returns', 'in_progress', 3, now())`;
  const [legacy] = await sql`select * from learning_profile where user_id = ${normal.id}`;
  await menuSignOut(signup);
  await signup.getByLabel("Email", { exact: true }).fill(email);
  await signup.getByLabel("Password", { exact: true }).fill(password);
  await button(signup, "Sign in").click(); await signup.waitForURL("**/learn");
  const dashboardNavigation = await signup.goto(`${baseURL}/dashboard`, { waitUntil: "commit" }).catch((error) => error);
  if (dashboardNavigation instanceof Error) assert.match(dashboardNavigation.message, /Navigation to .*\/dashboard.*interrupted by another navigation to .*\/learn/);
  await signup.waitForURL("**/learn");
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
