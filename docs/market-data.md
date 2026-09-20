# Market data

Investi accesses market data through the server-only `MarketDataProvider` contract and the normalized `MarketDataService` boundary. Provider response objects and credentials must not enter client components.

## Configuration

Set `MARKET_DATA_PROVIDER` to one of:

- `deterministic` — the default synthetic dataset for local development, demos, and reproducible tests.
- `fmp` — Financial Modeling Prep Stable API data. This requires the server-only `FMP_API_KEY` variable.

An invalid provider or a selected FMP provider without a key fails during composition. Investi never silently falls back from FMP to deterministic data. Never prefix the FMP key with `NEXT_PUBLIC_`.

The selected FMP plan must permit every dataset used by Portfolio Lab, including forex quotes. An HTTP 402 plan-entitlement response is normalized as a provider-configuration failure; Investi does not replace the missing rate with sample data.

Portfolio Lab uses the configured provider through one server-only composition point. `deterministic` keeps its reproducible educational flow; `fmp` enables normalized FMP discovery, execution observations, and current valuation. There is no provider fallback.

Persisted deterministic IDs remain unchanged. In FMP mode they are shown as unavailable rather than silently reinterpreted as FMP instruments; similarly, deterministic mode does not remap `FMP:` identities. New FMP trades retain the provider-qualified ID returned by search.

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

## Portfolio Lab semantics

Portfolio Lab simulates immediate execution using a fresh server-observed current/last quote and, when required, a direct conversion into CZK. The observation is a reference price—not a bid, ask, or promise of real-world execution—and Investi does not invent slippage. The browser submits only the instrument ID, quantity, and idempotency key; authoritative price and FX observations are fetched server-side.

Each trade permanently stores its execution price, quote currency, exact FX rate to CZK, CZK gross amount, observation time, and provider provenance. Later market changes never rewrite those values or the resulting cost basis.

Current valuation is separate. It obtains a current/cached quote and a current FX observation, then computes `quantity × current price × current FX`. Freshness and observation times are displayed. Stale-but-available quotes can be shown with an explicit stale label, but only fresh observations may simulate a new trade.

If one holding cannot be valued, that holding is marked unavailable and is never treated as zero. Other holdings retain their individual values, while aggregate portfolio value, allocation, and gain/loss remain incomplete until every open holding has a valid valuation. Authentication, rate-limit, provider, instrument, quote, and FX failures remain distinct on the server and are reduced to concise UI messages.

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

Cross-provider identity migration, corporate-action processing, total-return series, wider FX pairs, distributed caching, and background refresh are deferred. Fundamentals, statements, ratios, estimates, ratings, DCF, news, intraday data, crypto, and streaming are outside the current market-data scope.

## Manual FMP smoke test

With `FMP_API_KEY` set locally, run `npm run smoke:fmp`. This manual-only command searches for one instrument, resolves its profile, fetches its quote, and obtains the required CZK conversion without printing the credential. Automated tests never make FMP network calls.
