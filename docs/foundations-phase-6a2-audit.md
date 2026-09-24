# Phase 6A.2 Foundations audit

This records the pre-change curriculum at baseline `ac9ff9b` and the Phase 6A.2 response. Stable lesson IDs and route slugs were retained so existing completion receipts remain valid.

| Order | Stable lesson ID | Original title | Original focus and interactions | Original weakness / Portfolio Lab gap | Phase 6A.2 outcome |
| --- | --- | --- | --- | --- | --- |
| 1 | `foundations-why-invest` | Why invest? | Inflation, saving, growth, risk; choice, worked examples, growth calculator | Ten steps and early compounding duplicated later material; only one closing check; no explicit Lab connection | Saving vs investing; horizon prediction, inflation example, two mastery checks, cash-versus-invested Lab bridge |
| 2 | `foundations-stocks` | Stocks: owning part of a business | Ownership fraction, market cap, dividends; choices, numeric ownership exercise, two calculators | Market cap and dividends arrived before the essential position-value relationship; no `quantity × price` practice | Stocks and ownership; position-value formula, numeric calculation, price-change explorer, intrinsic-value distinction, Lab position bridge |
| 3 | `foundations-etfs-indexes` | ETFs & indexes | Fund/index distinction, fees, general diversification; choices and an index-to-ETF diagram | No weighted holdings example; “many holdings” concentration idea was stated but not made visible | ETFs and indexes; 45/30/15/10 holdings visualization, concentration prediction, two mastery checks, ETF analytics bridge |
| 4 | `foundations-bonds-cash` | Bonds & cash | Cash, lending, coupons, rates, default; choices, coupon math, cash-flow explorer, asset comparison | Thorough but long; ten steps and some yield-adjacent detail exceeded the beginner prerequisite | Cash and bonds; compact asset comparison, principal/coupon/maturity example, light rate intuition, issuer-risk mastery |
| 5 | `foundations-markets` | How markets work | Buyers/sellers, bid/ask, orders, primary/secondary markets, liquidity; quote and liquidity explorers | Ten steps; spread example used 99/100 rather than the approved 99.80/100.20 case; no direct Lab execution bridge | Markets, bid and ask; exact quote/spread exercise, buy/sell mastery, market-versus-limit intuition, execution bridge |
| 6 | `foundations-risk-reward` | Risk vs reward | Expected/realized return, drawdown, recovery, risk types, diversification, horizon; several explorers | Did not teach the required simple-return formula, growth factor, or +20%/−20% asymmetry; overlapped Lessons 1 and 7 | Returns and compounding; stable ID/slug retained, simple-return and growth-factor formulas, prediction-first asymmetry, numeric mastery |
| 7 | `foundations-portfolio` | Your first portfolio | Allocation, weighted returns, asset roles, diversification, horizon, risk capacity; builder and scenarios | Fifteen-minute/twelve-step scope was too broad; did not begin from cash + holdings or the approved 5,000 Kč weight example | Portfolio weights, diversification and risk; cash-inclusive total value, exact 40/20/40 weights, contribution intuition, concentration exercise, explicit Lab handoff |

## Original completion and state model

- A lesson loaded as `in_progress` without completing.
- The server required the final saved cursor before completion and kept completion/idempotency authoritative.
- First completion generated one reward receipt; review generated no duplicate receipt.
- Existing completed rows were keyed by stable lesson ID and therefore survive content/title changes.
- Weakness: any attempted answer, including an incorrect one, authorized the next cursor. The UI also offered Continue after incorrect feedback.

## Final curriculum contract

Each lesson now follows prediction/question → explanation → interaction/application → two mastery checks → Portfolio Lab bridge → summary. Incorrect answers explain the misconception and return the learner to an enabled retry state. The server accepts forward progress through a question only after a correct evaluated answer. Ephemeral attempts remain client-side; completion, XP, unlock, and Practice Capital remain server-authoritative and idempotent.

## Migration verification

On 2026-09-24, the configured Neon database reported all nine repository migrations, through `0008_overconfident_shape`. Migration `0008` only replaces the `lesson_award.practice_capital_minor` positive-value check with a nonnegative check; it contains no data statements, so it cannot change data rows. The live constraint reports `practice_capital_minor >= 0`, and the local fresh migration chain used for Phase 6A.2 validation is consistent through the same migration.
