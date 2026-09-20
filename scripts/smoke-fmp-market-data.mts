import "dotenv/config";

import assert from "node:assert/strict";
import { isMarketDataError } from "../src/features/market-data/errors";
import { createFmpMarketDataService } from "../src/features/market-data/fmp/service";

const apiKey = process.env.FMP_API_KEY?.trim();
assert.ok(apiKey, "FMP_API_KEY is required for the manual FMP smoke test.");

try {
  const service = createFmpMarketDataService({ apiKey });
  const results = await service.searchInstruments("AAPL");
  const selected = results.find(({ symbol, quoteCurrency }) => symbol === "AAPL" && quoteCurrency === "USD");
  assert.ok(selected, "FMP search did not return a USD AAPL instrument.");

  const instrument = await service.getInstrumentMetadata(selected.instrumentId);
  const quote = await service.getQuote(selected.instrumentId);
  const fx = await service.getFxRate(quote.currency, "CZK", quote.observedAt);

  console.log(JSON.stringify({
    ok: true,
    searchMatches: results.length,
    instrumentId: instrument.instrumentId,
    symbol: instrument.symbol,
    quoteCurrency: quote.currency,
    quoteObservedAt: quote.observedAt,
    quoteFreshness: quote.freshness.status,
    fxPair: `${fx.baseCurrency}/${fx.quoteCurrency}`,
    fxObservedAt: fx.observedAt,
  }, null, 2));
} catch (error) {
  if (isMarketDataError(error)) {
    console.error(JSON.stringify({
      ok: false,
      code: error.code,
      endpoint: error.context.endpoint,
      status: error.context.status,
      reason: error.context.reason,
    }, null, 2));
    process.exitCode = 1;
  } else {
    throw error;
  }
}
