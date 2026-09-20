import "dotenv/config";

import assert from "node:assert/strict";
import { createMarketDataService } from "../src/features/market-data/composition";
import { isMarketDataError } from "../src/features/market-data/errors";
import { fxUnitsFromNumber, grossBaseMinor, parseQuantity, priceUnitsFromNumber } from "../src/features/portfolio/decimal";

const apiKey = process.env.FMP_API_KEY?.trim();
assert.ok(apiKey, "FMP_API_KEY is required for the manual FMP smoke test.");
assert.equal(process.env.MARKET_DATA_PROVIDER, "fmp", "Set MARKET_DATA_PROVIDER=fmp for the multi-provider smoke test.");
assert.equal(process.env.FX_DATA_PROVIDER, "frankfurter", "Set FX_DATA_PROVIDER=frankfurter for the multi-provider smoke test.");

try {
  const service = createMarketDataService({ provider: "fmp", fxProvider: "frankfurter", fmpApiKey: apiKey });
  const results = await service.searchInstruments("AAPL");
  const selected = results.find(({ symbol, quoteCurrency }) => symbol === "AAPL" && quoteCurrency === "USD");
  assert.ok(selected, "FMP search did not return a USD AAPL instrument.");

  const instrument = await service.getInstrumentMetadata(selected.instrumentId);
  const quote = await service.getQuote(selected.instrumentId);
  // Smoke-test current valuation semantics even when the last security trade occurred on a prior market day.
  const fx = await service.getFxRate(quote.currency, "CZK", quote.retrievedAt);
  const exampleValueMinor = grossBaseMinor(parseQuantity("1"), priceUnitsFromNumber(quote.price), fxUnitsFromNumber(fx.rate));

  console.log(JSON.stringify({
    ok: true,
    searchMatches: results.length,
    instrumentId: instrument.instrumentId,
    symbol: instrument.symbol,
    quoteCurrency: quote.currency,
    securityProvider: quote.provenance.provider,
    quoteObservedAt: quote.observedAt,
    quoteFreshness: quote.freshness.status,
    fxPair: `${fx.baseCurrency}/${fx.quoteCurrency}`,
    fxProvider: fx.provenance.provider,
    fxReferenceDate: fx.referenceDate,
    exampleOneShareValueCzkMinor: exampleValueMinor.toString(),
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
