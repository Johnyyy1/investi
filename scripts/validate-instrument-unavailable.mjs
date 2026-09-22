import { finishOnboarding } from "./onboarding-helper.mjs";
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import postgres from "postgres";
import { chromium } from "playwright";

const baseURL = process.env.INSTRUMENT_UNAVAILABLE_TEST_URL ?? "http://localhost:3104";
const screenshotDir = process.env.INSTRUMENT_UNAVAILABLE_SCREENSHOT_DIR ?? "/tmp/investi-instrument-unavailable-qa";
const local = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
assert.ok(local(new URL(baseURL).hostname) && local(new URL(process.env.DATABASE_URL).hostname), "Requires local app and database.");
await mkdir(screenshotDir, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "chrome" });
const email = `instrument-unavailable-${randomUUID()}@example.com`;
const password = randomUUID();
let userId;

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, timezoneId: "Europe/Prague" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/sign-up`);
  await page.getByLabel("Name", { exact: true }).fill("Instrument Unavailable QA");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await finishOnboarding(page);
  [{ id: userId }] = await sql`select id from "user" where email = ${email}`;

  await page.goto(`${baseURL}/lab/instruments/US-XNAS%3AAAPL`);
  await page.getByRole("heading", { name: "Apple Inc." }).waitFor();
  assert.match(await page.locator("main").innerText(), /Stale observation/, "old quote is labeled stale rather than live");
  assert.equal(await page.getByRole("img", { name: /daily split-adjusted closing price chart/ }).count(), 1, "historical chart remains visible when the quote is stale");
  await page.screenshot({ path: `${screenshotDir}/stale-quote-history-available-1440.png`, fullPage: true });

  await page.goto(`${baseURL}/lab/instruments/US-XNAS%3AAAPL?range=1M`);
  await page.getByRole("status").filter({ hasText: "Price history is not available for this range" }).waitFor();
  assert.equal(await page.getByRole("img", { name: /daily closing price chart/ }).count(), 0, "an empty range never fabricates chart points");
  assert.equal(await page.getByText("Zoom chart", { exact: true }).count(), 0, "unavailable history has no zoom controls");
  await page.screenshot({ path: `${screenshotDir}/history-unavailable-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "unavailable detail supports 320px and 200% text");
  await page.screenshot({ path: `${screenshotDir}/history-unavailable-320-200-percent.png`, fullPage: true });

  await page.goto(`${baseURL}/lab/instruments/FMP%3ANASDAQ%3AA%25ZZ`);
  await page.getByRole("heading", { name: "This page isn’t available" }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Apple Inc." }).count(), 0, "malformed encoded provider identity never renders instrument data");
  assert.deepEqual(errors, [], "partial and invalid detail states have no browser errors");
  console.log("PASS: stale quote retains history, unavailable range has no fabricated chart, invalid route renders not-found, and 320px/200% text has no overflow. Screenshots:", screenshotDir);
} finally {
  await browser.close();
  if (userId) await sql`delete from "user" where id = ${userId}`;
  await sql.end();
}
