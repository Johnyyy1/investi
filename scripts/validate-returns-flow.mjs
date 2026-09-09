import { finishOnboarding } from "./onboarding-helper.mjs";
// Local integration test: creates and removes only its own disposable learner.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { chromium } from "playwright";

const baseURL = process.env.RETURNS_TEST_URL ?? "http://localhost:3000";
const loopback = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
assert.ok(loopback(new URL(baseURL).hostname) && loopback(new URL(process.env.DATABASE_URL).hostname), "This disposable-account test is restricted to local app/database hosts.");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const email = `returns-migration-${randomUUID()}@example.com`;
const password = randomUUID();
const lessonId = "returns-compounding";
const route = "/learn/returns/compounding-and-cumulative-returns";
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
let userId;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (["warning", "error"].includes(message.type())) errors.push(message.text()); });
  const heading = async (name) => page.getByRole("heading", { name, exact: true }).waitFor();
  const next = async (name) => { await page.getByRole("button", { name: "Continue", exact: true }).click(); await heading(name); };
  const row = async () => (await sql`select status, last_position, completed_at from lesson_progress where user_id = ${userId} and lesson_id = ${lessonId}`)[0];
  const overflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  async function signIn() {
    await page.goto(`${baseURL}/sign-in`);
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("heading", { name: /^(Good morning|Good afternoon|Good evening|Welcome),/ }).waitFor();
  }
  async function signOut() {
    const response = await page.request.post(`${baseURL}/api/auth/sign-out`, { data: {}, headers: { Origin: baseURL } });
    assert.equal(response.ok(), true);
    await page.goto(`${baseURL}${route}`);
    await page.waitForURL("**/sign-in");
  }

  await page.goto(`${baseURL}/sign-up`);
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Returns integration QA");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await finishOnboarding(page);
  await page.getByRole("heading", { name: /^(Good morning|Good afternoon|Good evening|Welcome),/ }).waitFor();
  [{ id: userId }] = await sql`select id from "user" where email = ${email}`;
  assert.equal(await page.locator(".learning-theme").count(), 1, "Dashboard uses the shared theme");
  await page.getByRole("link", { name: "Browse curriculum", exact: true }).click();
  await heading("Learn investing, step by step");
  assert.equal(await page.locator(".learning-theme").count(), 1, "Learn uses the shared theme");
  await page.locator('a[href="/learn/returns"]').click();
  await heading("Returns & Compounding");
  assert.equal(await page.getByTestId("module-progress").textContent(), "0 of 3 available lessons complete");
  const compounding = page.getByRole("listitem").filter({ hasText: "Compounding & cumulative returns" });
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await overflow();
    const mobileNav = page.getByRole("navigation", { name: "Mobile navigation" });
    assert.equal(await mobileNav.isVisible(), width < 1024);
  }
  assert.equal(await page.getByRole("listitem").filter({ hasText: "Log returns" }).getByRole("button").count(), 0);
  await compounding.getByRole("button", { name: "Start lesson" }).click();
  await heading("From one period to a sequence");
  assert.equal(await page.getByRole("navigation").count(), 0, "Lesson mode has no app navigation");
  await next("Make a prediction");
  assert.equal((await row()).status, "in_progress");
  assert.equal((await row()).last_position, 1);
  await page.goto(`${baseURL}/learn/returns`);
  await heading("Returns & Compounding");
  assert.equal(await compounding.getByRole("button", { name: "Continue lesson", exact: true }).isVisible(), true);
  await compounding.getByRole("button", { name: "Continue lesson", exact: true }).click();
  await heading("Make a prediction");
  await page.reload();
  await heading("Make a prediction");
  await page.getByRole("radio").first().press("Space");
  await page.getByRole("radio").first().press("ArrowDown");
  await page.getByRole("radio").nth(1).press("Tab");
  const check = page.getByRole("button", { name: "Check answer", exact: true });
  assert.equal(await check.evaluate((element) => element === document.activeElement && element.matches(":focus-visible")), true);
  await check.press("Enter");
  await heading("That’s right");
  assert.equal(await page.getByRole("button", { name: "Continue", exact: true }).evaluate((element) => element === document.activeElement), true);
  await next("The starting value changes");
  await next("Think in growth factors");
  await next("Multiply the growth factors");
  assert.equal(await page.locator("math").count(), 2);
  await page.setViewportSize({ width: 320, height: 800 });
  await overflow();
  await next("Explore compounding");
  await page.getByText("9,600.00", { exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Starting value", exact: true }).fill("");
  await page.getByRole("alert").filter({ hasText: "Starting value is required." }).waitFor();
  assert.equal(await page.locator(".recharts-wrapper").count(), 0);
  await page.getByRole("textbox", { name: "Starting value", exact: true }).fill("10000");
  await page.getByRole("textbox", { name: "Period 2 return", exact: true }).fill("-101");
  await page.getByRole("alert").filter({ hasText: "cannot be below -100%" }).waitFor();
  await page.getByRole("textbox", { name: "Period 2 return", exact: true }).fill("-20");
  await page.getByRole("button", { name: "Add period", exact: true }).click();
  await page.getByRole("button", { name: "Remove period 3", exact: true }).click();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(() => {
      const chart = document.querySelector(".recharts-wrapper");
      return chart && Math.abs(chart.getBoundingClientRect().width - chart.closest(".recharts-responsive-container").getBoundingClientRect().width) < 2;
    });
    await overflow();
    console.log(`Production layout and chart: ${width}px passed`);
  }
  await page.getByText("View data table", { exact: true }).press("Enter");
  assert.equal(await page.getByRole("cell", { name: "9,600", exact: true }).isVisible(), true);
  await signOut();
  await signIn();
  await page.goto(`${baseURL}${route}`);
  await heading("Explore compounding");
  assert.equal((await row()).last_position, 5);
  await page.getByRole("textbox", { name: "Your answer", exact: true }).fill("21");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await heading("That’s right");
  await next("Connect returns to prices");
  await page.getByRole("textbox", { name: "100 → 110", exact: true }).fill("10");
  await page.getByRole("textbox", { name: "110 → 99", exact: true }).fill("-10");
  assert.equal(await page.getByRole("button", { name: "Check answer", exact: true }).isDisabled(), true);
  await page.getByRole("textbox", { name: "Cumulative return", exact: true }).fill("-1");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await heading("That’s right");
  await next("Recovering from a loss");
  for (const [loss, recovery] of [[10, "+11.11%"], [20, "+25.00%"], [50, "+100.00%"]]) {
    await page.getByRole("button", { name: `Try −${loss}%`, exact: true }).click();
    await page.getByText(recovery, { exact: true }).waitFor();
  }
  await page.getByRole("textbox", { name: "Loss magnitude", exact: true }).fill("");
  assert.equal(await page.getByRole("textbox", { name: "Loss magnitude", exact: true }).getAttribute("aria-invalid"), "true");
  await page.getByRole("button", { name: "Try −50%", exact: true }).click();
  await page.getByRole("textbox", { name: "Your answer", exact: true }).fill("100");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await heading("That’s right");
  await next("Check your understanding");
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await heading("Let’s work through it");
  await next("Bring it together");
  assert.equal((await row()).status, "in_progress", "Reaching the end does not auto-complete");
  await page.getByRole("button", { name: "Mark lesson complete", exact: true }).click();
  await heading("Lesson complete");
  assert.match(await page.getByTestId("completion-progress").textContent(), /1 of 3/);
  const completed = await row();
  assert.equal(completed.status, "completed");
  await page.getByRole("button", { name: "Back to Returns & Compounding", exact: true }).click();
  await heading("Returns & Compounding");
  assert.equal(await page.getByTestId("module-progress").textContent(), "1 of 3 available lessons complete");
  await page.reload();
  await heading("Returns & Compounding");
  assert.equal(await page.getByTestId("module-progress").textContent(), "1 of 3 available lessons complete");
  await signOut();
  await signIn();
  await page.goto(`${baseURL}/learn/returns`);
  await heading("Returns & Compounding");
  assert.equal(await page.getByTestId("module-progress").textContent(), "1 of 3 available lessons complete");
  await compounding.getByRole("button", { name: "Review lesson" }).click();
  await heading("From one period to a sequence");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await next("Make a prediction");
  assert.equal(await page.getByRole("button", { name: "Previous step" }).evaluate((element) => getComputedStyle(element).transitionDuration), "0s");
  assert.deepEqual(await row(), completed, "Review never modifies persisted completion or cursor");
  await page.goto(`${baseURL}/learn/returns/simple-returns`);
  assert.equal(await page.locator(".learning-theme").count(), 1, "Lesson 2 uses the shared theme");
  const actionableErrors = errors.filter((message) => !message.startsWith("You have Reduced Motion enabled on your device."));
  assert.deepEqual(actionableErrors, [], "No unexpected console or hydration errors");
  console.log("All lesson steps, feedback, explorers, explicit completion, refresh, sign-out/sign-in, review, and reduced motion passed.");
} finally {
  await browser.close();
  // Constrained to the exact generated account; FK cascades remove only its test sessions/progress.
  if (userId) await sql`delete from "user" where id = ${userId} and email = ${email}`;
  await sql.end();
}
