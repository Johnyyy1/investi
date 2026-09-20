# Persistent Portfolio Lab accounting

Portfolio Lab is an educational paper portfolio. Its base currency is CZK. It consumes the configured normalized market-data service: deterministic mode supplies reproducible sample security/FX data, while live mode composes FMP security observations with Frankfurter dated reference FX rates. No value represents withdrawable money or guaranteed broker execution.

## Generations and contributions

Each learner has at most one active portfolio generation. Reset closes that row, links a new generation through `reset_from_portfolio_id`, and retains every prior trade. `opening_capital_minor` is the exact receipt entitlement observed when the generation opened; it is an audit baseline, not a mutable balance.

Current contributed Practice Capital is always the lifetime sum of legitimate `lesson_award.practice_capital_minor` receipts. Cash for the active generation is:

```text
receipt entitlement + sum(active-generation trade cash deltas)
```

This makes a later lesson reward available as cash without counting it as investment performance. Reset starts with no active-generation trade cash flows, so it restores the same lifetime entitlement without copying or double-counting rewards.

Portfolio total is cash plus current holdings market value. Investment gain/loss is portfolio total minus current contributed Practice Capital. A missing quote or FX rate makes valuation incomplete; it is never substituted with zero.

## Exact arithmetic

- Money is stored as `bigint` minor units.
- Quantities use `numeric(24,8)` and accept at most 8 decimal places.
- Execution prices use `numeric(24,8)`.
- FX rates use `numeric(24,12)`.
- New trades retain separate immutable security and FX provenance; Frankfurter observations preserve a calendar reference date rather than a fabricated intraday timestamp.
- The server converts normalized market observations once at the ledger boundary, then uses scaled `bigint` arithmetic.
- Money products and proportional cost-basis allocations round to the nearest minor unit, with half values rounded away from zero.

Holdings are folded from the immutable trade ledger using weighted-average cost. No mutable position table exists. Allocation is each holding’s current market value divided by total invested holdings value; available cash is deliberately excluded.

## Transaction boundary

Buy, sell, reset, and lesson completion lock the learner’s `user` row. Under that lock a trade re-reads receipt entitlement, active-generation trades, cash, and quantities. This serializes competing buys, competing sells, and reward/trade races. Client input is limited to instrument identity, quantity, and an idempotency key; execution price, FX, cash effects, and performance are server-derived.
