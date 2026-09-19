# Market data

Investi accesses market data through the server-only `MarketDataProvider` contract and the normalized `MarketDataService` boundary. Provider response objects and credentials must not enter client components.

## Configuration

Set `MARKET_DATA_PROVIDER` to one of:

- `deterministic` — the default synthetic dataset for local development, demos, and reproducible tests.
- `fmp` — Financial Modeling Prep Stable API data. This requires the server-only `FMP_API_KEY` variable.

An invalid provider or a selected FMP provider without a key fails during composition. Investi never silently falls back from FMP to deterministic data. Never prefix the FMP key with `NEXT_PUBLIC_`.

Portfolio Lab still uses its explicitly wired deterministic provider in Phase 4E.2. The selector is ready for a later controlled cutover; changing the environment variable alone does not change Portfolio Lab yet.

## Current FMP support

The adapter currently normalizes:

- ticker/company-name discovery through Stable `search-symbol`;
- instrument profiles through Stable `profile`;
- current/last quotes through Stable `quote`;
- daily raw and split-adjusted OHLC history through the corresponding Stable historical EOD routes;
- direct USD/CZK and EUR/CZK rates through Stable `quote`, plus local CZK/CZK identity.

An FMP instrument ID includes both the provider exchange code and provider symbol, for example `FMP:NASDAQ:AAPL`. Search results retain provider identity and the original provider symbol. A known exchange code is also mapped to a MIC where Investi has a reliable mapping. Profile lookup determines equity versus ETF because the search response does not reliably supply that distinction.

An FX rate is always expressed as quote-currency units per one base-currency unit. Thus `USD/CZK = 20.90` means `1 USD = 20.90 CZK`. The adapter requests FMP's direct `USDCZK` or `EURCZK` pair and does not silently invert rates.

Historical `close` is the end-of-day session close under the series' declared adjustment policy. It is not a current quote, bid, ask, or execution price. Points are validated at the provider boundary and sorted in ascending calendar order.

## Cache policy

FMP services use a small process-local cache of normalized successful results with lazy expiry:

| Data | TTL |
| --- | ---: |
| Instrument search | 5 minutes |
| Instrument profile | 24 hours |
| Quote | 30 seconds |
| Completed daily history | 24 hours |
| FX | 5 minutes |
| Corporate actions hook | 1 hour |

Identical simultaneous loads are coalesced. Provider errors and malformed responses are not cached. The cache is deliberately neither persistent nor distributed, so separate application processes may each call FMP.

## Deferred limitations

Portfolio Lab cutover, persisted provider-qualified instrument migration, corporate-action processing, total-return series, wider FX pairs, distributed caching, and background refresh are deferred. Fundamentals, statements, ratios, estimates, ratings, DCF, news, intraday data, crypto, and streaming are outside the current market-data scope.
