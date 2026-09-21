import { finishOnboarding } from "./onboarding-helper.mjs";
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { chromium } from "playwright";

const baseURL = process.env.PORTFOLIO_CLOSED_TEST_URL ?? "http://localhost:3001";
const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "DATABASE_URL is required.");
const local = (host) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
assert.ok(local(new URL(baseURL).hostname) && local(new URL(databaseUrl).hostname), "Requires a local app and database.");

const sql = postgres(databaseUrl, { prepare: false });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "chrome" });
const email = `portfolio-closed-${randomUUID()}@example.com`;
const password = randomUUID();
let userId;

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, timezoneId: "Europe/Prague" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/sign-up`);
  await page.getByLabel("Name", { exact: true }).fill("Closed Market QA");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await finishOnboarding(page);
  [{ id: userId }] = await sql`select id from "user" where email = ${email}`;
  const [{ id: lessonId }] = await sql`select id from lesson where is_published = true order by id limit 1`;
  const now = new Date("2026-01-17T12:00:00.000Z");
  await sql`insert into lesson_progress (user_id, lesson_id, status, last_position, completed_at, updated_at) values (${userId}, ${lessonId}, 'completed', 0, ${now}, ${now}) on conflict do nothing`;
  await sql`insert into lesson_award (user_id, lesson_id, xp, practice_capital_minor, reward_policy_version, learning_date, time_zone, awarded_at) values (${userId}, ${lessonId}, 60, 200000, 1, '2026-01-17', 'Europe/Prague', ${now})`;

  await page.goto(`${baseURL}/lab/portfolio`);
  const [{ id: portfolioId }] = await sql`select id from portfolio where user_id = ${userId} and closed_at is null`;
  await sql`insert into portfolio_trade (
    id, portfolio_id, instrument_id, instrument_symbol, instrument_name, instrument_asset_type,
    side, quantity, unit_price, quote_currency, fx_rate_to_base, gross_amount_base_minor,
    fee_base_minor, cash_delta_base_minor, quote_observed_at, executed_at,
    market_data_provider, market_data_dataset, market_data_kind, market_data_is_deterministic,
    fx_rate_provider, fx_rate_dataset, fx_rate_kind, fx_rate_is_deterministic,
    fx_reference_date, fx_rate_retrieved_at, client_idempotency_key
  ) values (
    ${randomUUID()}, ${portfolioId}, 'US-XNAS:AAPL', 'AAPL', 'Apple Inc.', 'equity',
    'BUY', '0.25', '114', 'USD', '22.75', 64838,
    0, -64838, '2026-01-16T20:45:00.000Z', '2026-01-16T20:50:00.000Z',
    'investi-deterministic', 'investi-education-market-v1', 'synthetic', true,
    'investi-deterministic', 'investi-education-market-v1', 'synthetic', true,
    '2026-01-16', '2026-01-16T20:50:00.000Z', ${randomUUID()}
  )`;
  await page.reload();
  const holding = page.getByTestId("holding-mobile-AAPL");
  await holding.waitFor();
  assert.match(await holding.textContent(), /648\.38 Kč/, "the last-session quote produces a non-zero closed-market valuation");
  assert.match(await holding.textContent(), /Market closed/, "the compact holding preserves market-session context");
  assert.match(await holding.textContent(), /114 USD/, "the compact holding preserves the native reference price");
  const cashBeforePreview = await page.getByTestId("portfolio-cash").textContent();

  await page.getByRole("button", { name: "Invest", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Invest Practice Capital" });
  await dialog.getByRole("combobox", { name: "Search investments" }).fill("AAPL");
  await dialog.getByRole("option", { name: /AAPL/ }).waitFor();
  await dialog.getByRole("combobox", { name: "Search investments" }).press("Enter");

  const warning = dialog.getByTestId("market-execution-unavailable");
  await warning.waitFor();
  assert.match(await warning.textContent(), /Market is currently closed/);
  assert.match(await dialog.textContent(), /Last market price/);
  assert.match(await dialog.textContent(), /market closed/);
  assert.equal(await dialog.getByRole("button", { name: "Review order", exact: true }).isDisabled(), true, "closed-market execution is disabled");
  assert.equal(await page.getByTestId("portfolio-cash").textContent(), cashBeforePreview, "closed-market preview does not deduct Practice Capital");
  const [{ count }] = await sql`select count(*)::int as count from portfolio_trade pt join portfolio p on p.id = pt.portfolio_id where p.user_id = ${userId}`;
  assert.equal(count, 1, "closed-market preview creates no additional trade");

  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "closed-market state supports 200% text");
  assert.deepEqual(errors, [], "closed-market Portfolio Lab has no browser errors");
  console.log("PASS: deterministic closed-market reference preserves non-zero valuation, labels its as-of state, disables immediate execution, adds no trade, and leaves Practice Capital unchanged.");
} finally {
  await browser.close();
  if (userId) await sql`delete from "user" where id = ${userId}`;
  await sql.end();
}
