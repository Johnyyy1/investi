import "dotenv/config";

import assert from "node:assert/strict";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "DATABASE_URL is required.");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname), "Requires local DB.");
const sql = postgres(databaseUrl, { prepare: false, max: 1 });
try {
  const columns = await sql`
    select table_name, column_name, data_type, numeric_precision, numeric_scale, is_nullable
    from information_schema.columns
    where table_schema = 'public' and table_name in ('portfolio', 'portfolio_trade')
    order by table_name, ordinal_position
  `;
  assert.equal(columns.filter(({ table_name }) => table_name === "portfolio").length, 8);
  assert.equal(columns.filter(({ table_name }) => table_name === "portfolio_trade").length, 27);
  for (const legacySafeColumn of ["fx_rate_provider", "fx_rate_dataset", "fx_rate_kind", "fx_rate_is_deterministic", "fx_reference_date", "fx_rate_retrieved_at"]) {
    assert.equal(columns.find(({ column_name }) => column_name === legacySafeColumn)?.is_nullable, "YES", `${legacySafeColumn} is nullable for legacy trades`);
  }
  const numeric = Object.fromEntries(columns.filter(({ numeric_precision }) => numeric_precision !== null).map((row) => [row.column_name, row]));
  assert.deepEqual([numeric.quantity.numeric_precision, numeric.quantity.numeric_scale], [24, 8]);
  assert.deepEqual([numeric.unit_price.numeric_precision, numeric.unit_price.numeric_scale], [24, 8]);
  assert.deepEqual([numeric.fx_rate_to_base.numeric_precision, numeric.fx_rate_to_base.numeric_scale], [24, 12]);
  for (const money of ["opening_capital_minor", "gross_amount_base_minor", "fee_base_minor", "cash_delta_base_minor"]) {
    assert.equal(columns.find(({ column_name }) => column_name === money)?.data_type, "bigint", `${money} uses exact minor units`);
  }

  const indexes = await sql`select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename in ('portfolio', 'portfolio_trade')`;
  assert.match(indexes.find(({ indexname }) => indexname === "portfolio_one_active_per_user_idx")?.indexdef ?? "", /UNIQUE.+WHERE \(closed_at IS NULL\)/i);
  assert.ok(indexes.some(({ indexname }) => indexname === "portfolio_trade_idempotency_idx"));
  assert.ok(indexes.some(({ indexname }) => indexname === "portfolio_reset_idempotency_idx"));

  const checks = await sql`
    select conname from pg_constraint
    where conrelid in ('portfolio'::regclass, 'portfolio_trade'::regclass) and contype = 'c'
  `;
  const checkNames = checks.map(({ conname }) => conname);
  for (const expected of [
    "portfolio_base_currency_check", "portfolio_opening_capital_nonnegative_check", "portfolio_reset_not_self_check",
    "portfolio_trade_quantity_positive_check", "portfolio_trade_unit_price_positive_check", "portfolio_trade_fx_positive_check",
    "portfolio_trade_gross_positive_check", "portfolio_trade_fee_nonnegative_check", "portfolio_trade_cash_delta_check",
    "portfolio_trade_fx_provenance_complete_check", "portfolio_trade_fx_kind_check",
  ]) assert.ok(checkNames.includes(expected), `${expected} exists`);

  const cascades = await sql`
    select conname, confdeltype from pg_constraint
    where conname in ('portfolio_user_id_user_id_fk', 'portfolio_trade_portfolio_id_portfolio_id_fk')
  `;
  assert.ok(cascades.every(({ confdeltype }) => confdeltype === "c"), "ownership deletes cascade to generations and trades");
  console.log("PASS: portfolio migration exact types, precision, generation/idempotency indexes, checks, and ownership cascades.");
} finally {
  await sql.end();
}
