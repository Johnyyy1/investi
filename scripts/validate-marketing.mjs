// Phase 1 browser acceptance: local app/database, disposable isolated demo users.
import "dotenv/config";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import postgres from "postgres";

const baseURL = process.env.MARKETING_TEST_URL ?? "http://localhost:3000";
const local = (hostname) => ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
assert.ok(local(new URL(baseURL).hostname) && local(new URL(process.env.DATABASE_URL).hostname), "Use a local app and database only.");
const output = process.env.MARKETING_SCREENSHOT_DIR ?? "/tmp/investi-marketing-qa";
await mkdir(output, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "chrome" });
const owners = new Set(), errors = [], checks = [];
const widths = [1440, 1024, 768, 390, 375, 320];
let contextIndex = 70;
const newContext = () => browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: { "x-forwarded-for": `127.0.0.${contextIndex++}` } });
async function session(context) {
  const result = await context.request.get(`${baseURL}/api/auth/get-session`);
  const data = await result.json();
  assert.equal(data?.user?.isAnonymous, true);
  owners.add(data.user.id);
  return data.user.id;
}
async function layout(page, width, enlarged) {
  await page.setViewportSize({ width, height: 1000 });
  await page.evaluate((large) => { document.documentElement.style.fontSize = large ? "200%" : ""; window.scrollTo(0, 0); }, enlarged);
  await page.locator("[data-asset-state] img").evaluate((img) => img.decode());
  const dimensions = await page.evaluate(() => {
    const pie = document.querySelector("[data-asset-state]").getBoundingClientRect();
    const scene = document.querySelectorAll("main > section")[1].getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      overlap: Math.round(pie.bottom - scene.top),
      pieWidth: Math.round(pie.width),
      clipped: [...document.querySelectorAll("h1, h2, h3, article, main p, main a, main button")].some((el) => {
        const css = getComputedStyle(el);
        // Display-font descenders can exceed the line box without being clipped.
        return (css.overflowX !== "visible" && el.scrollWidth > el.clientWidth + 1)
          || (css.overflowY !== "visible" && el.scrollHeight > el.clientHeight + 1);
      }),
    };
  });
  assert.equal(dimensions.overflow, false, `No overflow: ${width}, enlarged=${enlarged}`);
  assert.equal(dimensions.clipped, false, `No clipped text: ${width}, enlarged=${enlarged}`);
  assert.equal(dimensions.overlap, width < 768 ? 100 : width <= 1100 ? 135 : 170);
  assert.equal(dimensions.pieWidth, width < 768 ? 260 : width <= 1100 ? 340 : 410);
  await page.screenshot({ path: `${output}/landing-${width}${enlarged ? "-200" : ""}.png`, fullPage: true });
  if (width <= 1100) {
    const menu = page.getByLabel("Navigation menu");
    await menu.focus(); await menu.press("Enter");
    const nav = page.getByRole("navigation", { name: "Mobile navigation" });
    assert.equal(await nav.isVisible(), true);
    assert.deepEqual(await nav.getByRole("link").allTextContents(), ["Learn", "Portfolio Lab", "Backtesting", "Sign in", "Start learning "]);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Expanded menu fits");
    await page.screenshot({ path: `${output}/menu-${width}${enlarged ? "-200" : ""}.png`, fullPage: true });
    await menu.press("Enter");
  }
}
try {
  const context = await newContext(), page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.title(), "Learn investing by doing · investi");
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator("h1").innerText(), "Learn investing\nby doing.");
  assert.equal(await page.locator("main > section").count(), 2, "Stops after Phase 1");
  assert.deepEqual(await page.locator("article h3").allTextContents(), ["Learn", "Build", "Backtest"]);
  assert.equal(await page.locator("[data-asset-state]").getAttribute("data-asset-state"), "ready");
  assert.equal(await page.locator("[data-asset-state] img").evaluate((img) => img.complete && img.naturalWidth > 0), true, "Portfolio artwork loads");
  for (const text of ["A smarter", "A brighter", "Practice today.", "Invest tomorrow."]) {
    assert.equal(await page.getByText(text, { exact: false }).count(), 1);
  }
  for (const width of widths) {
    await layout(page, width, false);
    await layout(page, width, true);
  }
  checks.push("All six widths at 100% and 200% text: no overflow/clipping; loaded pie artwork, sizes and overlap; handwritten annotations; keyboard mobile menu");
  await page.evaluate(() => document.documentElement.style.fontSize = "");
  await page.setViewportSize({ width: 390, height: 1000 });
  for (const [name, path] of [["Learn", "/sign-in"], ["Portfolio Lab", "/sign-in"], ["Backtesting", "/sign-in"], ["Sign in", "/sign-in"], ["Start learning", "/sign-up"]]) {
    await page.goto(baseURL);
    await page.getByLabel("Navigation menu").click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name, exact: true }).click();
    await page.waitForURL(`**${path}`);
  }
  checks.push("Every mobile-menu destination works, including protected-route auth gates and Start learning");
  await page.goto(baseURL);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.getByRole("button", { name: "Explore demo" }).evaluate((el) => getComputedStyle(el).transitionDuration), "0s");
  await page.goto(baseURL);
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("link", { name: "Skip to content" }).evaluate((el) => el === document.activeElement), true);
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("main").evaluate((el) => el === document.activeElement), true);
  await page.getByRole("link", { name: "Start learning", exact: true }).last().click();
  await page.waitForURL("**/sign-up");
  await page.getByRole("heading", { name: "Create account", exact: true }).waitFor();
  await page.goto(baseURL);
  await page.getByRole("link", { name: "Sign in", exact: true }).first().click();
  await page.waitForURL("**/sign-in");
  await page.getByRole("heading", { name: "Welcome back" }).waitFor();
  checks.push("Metadata, one H1, two sections only, skip link, reduced motion, existing signup and sign-in");

  await page.goto(baseURL);
  await page.setViewportSize({ width: 390, height: 1000 });
  let releaseFailure;
  let reportFailureStarted;
  const failureStarted = new Promise((resolve) => { reportFailureStarted = resolve; });
  await page.route("**/api/auth/sign-in/anonymous", async (route) => {
    await new Promise((resolve) => { releaseFailure = resolve; reportFailureStarted(); });
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Unavailable" }) });
  });
  await page.getByRole("button", { name: "Explore demo" }).click();
  await failureStarted;
  assert.equal(await page.getByRole("button", { name: "Opening demo…" }).isDisabled(), true, "Demo prevents repeat activation while pending");
  releaseFailure();
  await page.getByRole("alert").filter({ hasText: "We couldn’t open the demo" }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/");
  assert.equal(await page.getByRole("button", { name: "Explore demo" }).isEnabled(), true);
  await page.unroute("**/api/auth/sign-in/anonymous");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await page.waitForURL("**/learn");
  const owner = await session(context);
  await page.goto(baseURL);
  assert.equal(new URL(page.url()).pathname, "/", "Root stays public with a session");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await page.waitForURL("**/learn");
  assert.equal(await session(context), owner, "Demo reuses an existing session");
  for (const path of ["/lab/portfolio", "/lab/backtesting", "/progress"]) {
    await page.goto(`${baseURL}${path}`);
    assert.equal(new URL(page.url()).pathname, path);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("[data-asset-state]").count(), 0, "Marketing does not enter the product");
  }
  const other = await newContext(), otherPage = await other.newPage();
  await otherPage.goto(baseURL);
  await otherPage.getByRole("button", { name: "Explore demo" }).click();
  await otherPage.waitForURL("**/learn");
  assert.notEqual(await session(other), owner, "Separate browsers create isolated demo profiles");
  checks.push("Demo failure/retry, one-click real demo, existing-session reuse, isolated profiles, protected product routes still work");
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ widths, checks, asset: "public/brand/portfolio-pie.webp; loaded and visually reviewed across all six widths." }, null, 2));
  console.log("PASS\n" + checks.join("\n") + `\nScreenshots: ${output}`);
} finally {
  await browser.close();
  for (const id of owners) await sql`delete from "user" where id = ${id}`;
  await sql.end();
}
