# Next session handoff

## Current product state

Investi is a Next.js App Router learning product with authenticated Learn, Lab, and Progress areas. It has onboarding, Better Auth credentials plus isolated anonymous demos, ten authored guided lessons (seven Foundations and three Returns), persisted cursor/completion state, receipt-derived Practice Capital and streaks, and two educational labs:

- Backtesting Lab uses an explicitly synthetic monthly-return fixture.
- Portfolio Lab is a persistent CZK paper portfolio with append-only trades, exact minor-unit arithmetic, deterministic quotes/FX, idempotent trade/reset actions, and retained reset generations.

The portfolio's market data is synthetic and educational; it is not live or historical market data.

## Recently completed work

- Portfolio Lab's investing flow was redesigned in `3921db5`.
- Persistent portfolio storage, auditable trade ledger, reset generations, and browser coverage landed in `cc30c82`.
- Provider-agnostic market-data contracts plus a deterministic provider landed in `e40d7b3`.
- Practice Capital replaced visible XP while keeping legacy XP internally for compatibility.

## Unfinished work and known technical debt

- Only ten lessons are authored; planned curriculum remains unavailable.
- Lesson explorer inputs/answers are transient; only lesson position and completion persist.
- Backtesting data and Portfolio Lab quotes/FX are deliberately synthetic.
- `NoopMarketDataCache` is the current cache implementation; there is no external provider adapter, cache backend, retry/rate-limit policy, or provider observability.
- Browser automation is Chromium-only; Safari, Firefox, physical-device, and assistive-technology coverage are absent.
- Demo cleanup is an operator-run command, not a scheduled lifecycle service.

## Architecture decisions to preserve

- Use App Router server components/pages and server actions; keep client components away from provider/service/cache modules.
- Keep authored lesson content in `src/features/lessons`; transition validation and completion transactions belong in `src/features/progress`.
- `lesson_award` is the immutable source of truth for Practice Capital; do not introduce a mutable balance.
- Portfolio value comes from the immutable `portfolio_trade` ledger. Money uses `bigint` minor units and quantities/prices use fixed precision; do not replace this with floating-point arithmetic.
- Persist market-data provenance with every trade. Symbols are display/search data; `instrumentId` is the stable identity.
- Treat missing quote/FX valuations as incomplete, never as zero.

## Relevant files for the next phase

- `src/features/market-data/contracts.ts` — normalized types, provenance, adjustment policy.
- `src/features/market-data/provider.ts` — provider port; external adapters implement this.
- `src/features/market-data/service.ts` and `cache.ts` — validation, freshness, error normalization, cache seam.
- `src/features/market-data/deterministic/` — current fixture implementation; preserve for tests/demo.
- `src/features/portfolio/repository.ts`, `service.ts`, and `actions.ts` — server-side execution, valuation, and UI boundary.
- `src/components/lab/portfolio-lab.tsx` and `src/app/(app)/lab/portfolio/page.tsx` — Portfolio Lab UX.
- `src/db/schema.ts` and `drizzle/0005_sweet_anthem.sql` — portfolio persistence contract.
- `docs/portfolio-lab.md` and `docs/product-reset.md` — accounting and product semantics.

## Market-data architecture (outline only; do not implement yet)

Use `MarketDataProvider` as the sole vendor boundary. Add one server-only adapter that translates a vendor's search, metadata, quote, FX, history, and corporate-action responses into the existing normalized contracts. Configure provider selection/composition outside portfolio logic, retain the deterministic provider for demo/test environments, and route all callers through `MarketDataService` so validation, freshness classification, normalized errors, and a cache policy remain consistent. Cache keys must include provider/dataset, instrument ID, currency pair, timestamp/date range, interval, and adjustment mode. Persist the returned provenance snapshot at execution; never re-price an executed trade from current vendor data. Before enabling a real provider, define licensing/entitlements, delayed-vs-live labeling, quotas/retries/timeouts, cache TTLs, monitoring, and fixture-based contract tests.

## Recommended next five implementation steps

1. Decide the real market-data provider and its licensing, supported exchanges/currencies, delayed/live policy, and operational limits.
2. Add provider configuration and a server-only adapter implementing `MarketDataProvider`; keep deterministic data as the default for demo/test.
3. Add a bounded cache implementation plus TTL, timeout, retry, rate-limit, and provider-health policy behind `MarketDataService`.
4. Create adapter contract fixtures/tests for normalization, provenance, gaps, adjustments, FX, and vendor failures; then test Portfolio Lab against them.
5. Add UI disclosure for provider/data freshness and run cross-browser/accessibility validation before broadening the instrument universe.

## Commands to resume

```bash
npm install
cp .env.example .env.local # if needed; set BETTER_AUTH_SECRET and DATABASE_URL
npm run db:migrate
npm run db:seed
npm run dev

npm test
npm run typecheck
npm run lint
npm run build
npm run test:persistence
npm run test:portfolio-persistence
npm run test:portfolio-migration
npm run test:portfolio-browser
```

The browser command needs a running local app and Chrome:

```bash
BROWSER_CHANNEL=chrome node scripts/validate-portfolio-lab.mjs
```
