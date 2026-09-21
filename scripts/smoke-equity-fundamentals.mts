/** Manual development smoke only. Never run in automated tests. */
import "dotenv/config";
import assert from "node:assert/strict";
import { createMarketDataService } from "../src/features/market-data/composition";

const apiKey = process.env.FMP_API_KEY?.trim();
assert.ok(apiKey, "FMP_API_KEY is required for this manual smoke test.");
const paths: string[] = [];
const service = createMarketDataService({
  provider: "fmp", fxProvider: "frankfurter", fmpApiKey: apiKey,
  fetch: async (input, init) => {
    paths.push(new URL(input instanceof Request ? input.url : input.toString()).pathname);
    return fetch(input, init);
  },
});
const instrumentId = "FMP:NASDAQ:AAPL";
const instrument = await service.getInstrumentMetadata(instrumentId);
const first = await service.getEquityFundamentals(instrumentId);
const callsAfterFirst = paths.length;
const second = await service.getEquityFundamentals(instrumentId);
assert.deepEqual(second, first);
assert.equal(paths.length, callsAfterFirst, "a second fundamentals read should use the process-local cache");
assert.equal(instrument.assetType, "equity");
assert.equal(first.provenance.isDeterministic, false);
assert.ok(first.valuation.marketCap && first.valuation.marketCap > 0);
assert.ok(first.valuation.peTtm && first.valuation.peTtm > 0);
assert.ok(first.businessPerformance.revenueFy && first.businessPerformance.revenueFy > 0);
assert.ok(first.businessPerformance.fiscalYearEnd);
assert.equal(first.businessPerformance.reportingCurrency, "USD");
console.log(JSON.stringify({
  ok: true,
  endpoints: paths,
  unavailableDatasets: first.provenance.unavailableDatasets,
  marketCap: first.valuation.marketCap,
  peTtm: first.valuation.peTtm,
  grossMarginTtm: first.profitability.grossMarginTtm,
  fiscalYearEnd: first.businessPerformance.fiscalYearEnd,
  reportingCurrency: first.businessPerformance.reportingCurrency,
  revenueFy: first.businessPerformance.revenueFy,
  freeCashFlowFy: first.businessPerformance.freeCashFlowFy,
  cachedSecondRead: paths.length === callsAfterFirst,
}, null, 2));
