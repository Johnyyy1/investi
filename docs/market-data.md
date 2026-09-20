# Market data

Investi accesses market data through the server-only normalized `MarketDataService` boundary. Security and FX capabilities may be supplied by different providers; provider response objects and credentials must not enter client components.

## Configuration

Set `MARKET_DATA_PROVIDER` to one of:

- `deterministic` — the default synthetic dataset for local development, demos, and reproducible tests.
- `fmp` — Financial Modeling Prep Stable API data. This requires the server-only `FMP_API_KEY` variable.

Set `FX_DATA_PROVIDER` to one of:

- `deterministic` — reproducible educational FX fixtures;
- `frankfurter` — Frankfurter API v2 blended reference rates. No API key is required.

The normal local/test configuration explicitly selects `deterministic` for both. Live Portfolio Lab configuration uses `MARKET_DATA_PROVIDER=fmp` and `FX_DATA_PROVIDER=frankfurter`. Selecting FMP without an explicit FX provider or without `FMP_API_KEY` fails during composition. Invalid values fail environment validation. Investi never silently falls back between providers, and deterministic FX is never mixed into FMP mode unless it was explicitly selected. Never prefix the FMP key with `NEXT_PUBLIC_`.

The current free FMP plan permits the security datasets used by Investi but returns HTTP 402 for FMP forex. Portfolio Lab therefore obtains security data from FMP and reference FX data from Frankfurter instead of upgrading FMP or substituting sample rates.

Portfolio Lab uses the composed service through one server-only composition point and does not select either provider itself. Fully deterministic mode keeps its reproducible educational flow. There is no provider fallback.

Persisted deterministic IDs remain unchanged. In FMP mode they are shown as unavailable rather than silently reinterpreted as FMP instruments; similarly, deterministic mode does not remap `FMP:` identities. New FMP trades retain the provider-qualified ID returned by search.

## Current FMP support

The adapter currently normalizes:

- ticker/company-name discovery through Stable `search-symbol`;
- instrument profiles through Stable `profile`;
- current/last quotes through Stable `quote`;
- daily raw and split-adjusted OHLC history through the corresponding Stable historical EOD routes;
- normalized provider errors without using FMP forex for Portfolio Lab.

An FMP instrument ID includes both the provider exchange code and provider symbol, for example `FMP:NASDAQ:AAPL`. Search results retain provider identity and the original provider symbol. A known exchange code is also mapped to a MIC where Investi has a reliable mapping. Profile lookup determines equity versus ETF because the search response does not reliably supply that distinction.

## Frankfurter FX support

The server-only [Frankfurter API v2](https://frankfurter.dev/) adapter calls the single-pair endpoint, `/v2/rate/{base}/{quote}`. It requests the direct pair and never silently inverts or triangulates it. Frankfurter requires no credential.

An Investi FX rate is always expressed as quote-currency units per one base-currency unit. Thus `USD/CZK = 20.90` means `1 USD = 20.90 CZK`. Frankfurter rates are blended, dated reference/mid-market rates—not live broker execution quotes. Investi does not invent an FX spread, bid, ask, or intraday timestamp.

Frankfurter supplies a calendar `date`. The normalized `FxRate` preserves this as `referenceDate`; it remains distinct from the UTC retrieval timestamp. A local same-currency identity conversion is exactly `1`, uses the request's calendar date, and makes no provider request.

Historical `close` is the end-of-day session close under the series' declared adjustment policy. It is not a current quote, bid, ask, or execution price. Points are validated at the provider boundary and sorted in ascending calendar order.

## Portfolio Lab semantics

Portfolio Lab simulates immediate execution using a fresh server-observed current/last security quote and a dated reference conversion into CZK. Neither is a promise of broker execution, and Investi does not invent bid/ask, FX spreads, or slippage. The browser submits only the instrument ID, quantity, and idempotency key; authoritative price and FX observations are fetched server-side.

Each new trade permanently stores its execution price, quote currency, exact FX rate to CZK, CZK gross amount, security observation/provenance, and separate FX provider, dataset, kind, reference date, deterministic flag, and retrieval time. The additive fields remain nullable only for pre-4E.4 executions. Later market changes never rewrite those values or the resulting cost basis.

Current valuation is separate. It obtains a current/cached FMP quote and a current/cached Frankfurter reference rate, then computes `quantity × current price × current reference FX`. Security freshness, security observation time, and FX reference date are displayed separately. Stale-but-available security quotes can be shown with an explicit stale label, but only fresh security observations may simulate a new trade.

If one holding cannot be valued, that holding is marked unavailable and is never treated as zero. Other holdings retain their individual values, while aggregate portfolio value, allocation, and gain/loss remain incomplete until every open holding has a valid valuation. Authentication, rate-limit, provider, instrument, quote, and FX failures remain distinct on the server and are reduced to concise UI messages.

## Cache policy

FMP services use a small process-local cache of normalized successful results with lazy expiry:

| Data | TTL |
| --- | ---: |
| Instrument search | 5 minutes |
| Instrument profile | 24 hours |
| Quote | 30 seconds |
| Completed daily history | 24 hours |
| Frankfurter reference FX | 1 hour |
| Corporate actions hook | 1 hour |

FX cache keys include provider identity, base currency, quote currency, and request calendar date, so deterministic and Frankfurter entries cannot collide. Identical simultaneous loads are coalesced. Provider errors and malformed responses are not cached. The cache is deliberately neither persistent nor distributed, so separate application processes may each call the external providers.

## Deferred limitations

Cross-provider security-identity migration, provider health telemetry, historical portfolio FX/performance, corporate-action processing, total-return series, wider Investi currency support, distributed caching, and background refresh are deferred. Fundamentals, statements, ratios, estimates, ratings, DCF, news, intraday data, crypto, and streaming are outside the current market-data scope.

## Manual FMP smoke test

Set `MARKET_DATA_PROVIDER=fmp`, `FX_DATA_PROVIDER=frankfurter`, and `FMP_API_KEY` locally, then run `npm run smoke:fmp`. This manual-only command searches for one instrument, resolves its profile, fetches its security quote from FMP, fetches USD/CZK from Frankfurter, and calculates one example CZK value with Investi's fixed-point arithmetic. It prints separate security/FX provenance and the FX reference date without printing the credential. Automated tests never make external network calls.
