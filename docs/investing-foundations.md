# Investing Foundations — implementation and validation

Continues from `9143933` using the existing investi design, typed lesson blocks, ModulePath, guided runner, Better Auth, and Drizzle/PostgreSQL persistence.

## 1. Curriculum changes

Investing Foundations is the first available module at `/learn/investing-foundations`, followed by Returns & Compounding at the unchanged `/learn/returns` route. Returns lesson IDs and progress remain stable. The catalog combines the two existing-style lesson manifests for routing, paths, seed data, published-lesson validation, and progress selection. There is no second curriculum engine or lesson runner.

Foundations has eight planned lessons. Why invest?, Stocks: owning part of a business, ETFs & indexes, Bonds & cash, How markets work, Risk vs reward, and Your first portfolio are available. Foundations checkpoint remains upcoming, with no actionable navigation. Its direct unavailable lesson URL returns the existing not-found page and server actions reject its ID.

## 2. Lessons implemented

- **Why invest?** — nine guided steps plus explicit completion. Purchasing-power prediction, saving/liquidity versus uncertain investing outcomes, the €100/€110 basket, business growth, €100 → €105 → €110.25 compounding, risk, editable growth comparison, concept check, and takeaway.
- **Stocks: owning part of a business** — ten guided steps plus completion. Share ownership, editable ownership fraction, share price versus company size, editable market cap, price expectations, dividends, numeric and conceptual practice, daily-control misconception, and takeaway.
- **ETFs & indexes** — ten guided steps plus completion. The hundreds-of-companies question, diversification, indexes as measurements, a simple index → tracking ETF → investor visual, buyable ETF versus index, active strategies, remaining risk, asset exposure, fees, and takeaway. Checks cover all four required misconceptions.
- **Bonds & cash** — ten guided steps plus completion. It contrasts cash, ownership, and lending; introduces issuer, principal, coupon, and maturity; includes a validated fixed-cash-flow illustration; explains the interest-rate/price direction without formal pricing; and covers credit, inflation, and liquidity risks. The cash-flow display explicitly is not a yield or total-return calculation.
- **How markets work** — ten guided steps plus completion. It begins with a buyer and seller whose prices do not meet; explains bid, ask, spread, market versus limit instructions, primary and secondary markets, price discovery, liquidity, and the forces that can move a price. The interactive quote emphasizes that displayed quotes and limit orders do not guarantee execution.
- **Risk vs reward** — ten guided steps plus completion. It distinguishes expected from realized returns, contrasts equal-average outcome ranges, introduces drawdown and recovery, identifies several forms of risk, previews diversification, and separates time horizon, risk tolerance, and risk capacity without making allocation recommendations.
- **Your first portfolio** — twelve guided steps plus completion. It defines portfolios and asset allocation; compares concentrated and spread outcomes; provides a responsive stocks/bonds/cash builder with explicit 100% validation; calculates hypothetical weighted one-period returns; explores asset roles, time horizon, and risk tolerance versus capacity; and closes on trade-offs without recommending an allocation.

Authored content maps to the same production Check → Feedback → Continue interaction. Integrity tests enforce one occurrence of every block, at most one question per step, question-last ordering, and a non-question final step. Every available manifest lesson has exactly one matching authored lesson; upcoming lessons have none.

## 3. Financial utilities and content review

`ownershipPercentage` returns percentage units, validates finite positive total shares, finite nonnegative owned shares, and owned ≤ total. `marketCapitalization` validates positive shares outstanding, nonnegative finite price, and a finite product. Examples verified: 100 / 1,000,000 = 0.01%; €50 × 1,000,000 = €50,000,000.

The growth interaction reuses `compoundValue` from the existing Returns finance utilities. At €10,000, 5% each year for ten years yields €16,288.95; zero growth stays €10,000. Negative rates are supported. The interface labels this a mathematical illustration, distinguishes its flat cash assumption from interest-bearing savings, and states that inflation, fees, taxes, and new contributions are omitted. It exposes annual values as an accessible expandable list. No new compounding implementation was added.

`bidAskSpread` validates finite nonnegative bids, positive asks, and ask ≥ bid. `drawdownFromPeak` validates a positive peak and nonnegative current value; it returns the fractional fall from the stated peak and returns zero when the current value is at or above that peak. Both are pure, unit-tested functions. The market and risk interactions reuse these utilities rather than embedding calculations in React.

`validatePortfolioWeights` accepts finite decimal weights from 0 to 1 and requires their unrounded sum to equal 1 within a small floating-point tolerance. `portfolioWeightedReturn` validates matching finite return inputs and calculates the unrounded one-period weighted result. Tests cover 60/30/10 = 6.6% for +10%/+2%/0%, invalid sums, negative and above-one weights, floating-point sums, negative asset returns, mismatched lengths, and decimal precision. The UI rounds only for display.

The content distinguishes amounts from purchasing power, expected from realized returns, equity market value from revenue/profit/cash/enterprise value, dividends from guaranteed extra wealth, and indexes from investable funds. It presents a market order as an execution priority rather than a guaranteed price, and a limit order as a price constraint rather than a guarantee of execution. Diversification is described as reducing some risks, not eliminating losses. No investment products are recommended.

Editorial reference checks used these primary sources:

- [ECB: price stability and purchasing power](https://www.ecb.europa.eu/home/pdf/students/leaflet_en.pdf)
- [Investor.gov: stock ownership and dividends](https://www.investor.gov/money-smarts-quiz-answer-1b)
- [Investor.gov: market capitalization](https://www.investor.gov/introduction-investing/investing-basics/glossary/market-capitalization)
- [Investor.gov: index funds and tracking differences](https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-4)
- [Investor.gov: ETF structure and strategies](https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2)
- [Investor.gov: diversification limits](https://www.investor.gov/introduction-investing/getting-started/asset-allocation)
- [Investor.gov: market and limit orders](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14)
- [Investor.gov: time horizon, risk, and diversification](https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset)
- [FINRA: willingness versus ability to take risk](https://www.finra.org/investors/insights/know-your-risk-tolerance)

## 4. Onboarding recommendations

- BEGINNER → Investing Foundations regardless of interests.
- BASIC → Foundations for the confidence goal, or ETF interests without QUANT/KNOWLEDGE goals; otherwise Returns & Compounding.
- INVESTOR → Returns & Compounding.
- ADVANCED → Returns & Compounding; quantitative goals/interests include Quantitative Investing as a future target.

Future targets remain plain text without links. Preferences are read and recommendations recomputed safely, including profiles saved when `returns` was the only recommendation. Loading the app does not rewrite answers, saved recommendations, or onboarding completion. New completions and preference edits persist the current recommendation. Completed users are not sent through onboarding again.

## 5. Home, Learn, and Progress

Home uses this deterministic priority among implemented lessons:

1. Most recently updated IN_PROGRESS lesson across both modules.
2. First incomplete lesson in the module of the most recently completed lesson.
3. First incomplete lesson in the recommended starting module.
4. First incomplete lesson in curriculum order; if everything available is completed, offer review.

Equal timestamps use curriculum order. Unknown or upcoming lesson progress is ignored. Rule 2 keeps an existing Returns learner moving through Returns after explicit completion, even if recomputation now recommends Foundations. When the seven available Foundations lessons are finished, Returns becomes the next available learning.

Home's path preview follows the selected module, and recent completion links use each lesson's actual module. Learn presents a sequential journey with START HERE, Foundations, THEN Returns & Compounding, and upcoming topic areas. Progress shows both modules separately and ten available lessons overall. The module and completion screens count seven available Foundations lessons and three available Returns lessons, with upcoming counts explicitly separated. No planned curriculum percentage, XP, streak, or other fabricated completion data is displayed.

## 6. Persistence, migration, and rollout

Existing `lesson_progress` rows store status, `lastPosition`, and completion timestamps. Foundation actions use the same session-owned repository functions. Cursor bounds and implemented IDs are checked on the server. Completion counts resolve the correct module and exclude unpublished database lessons. Review does not alter the saved completion or cursor; failed saves retain the current step and offer retry.

One schema change is necessary: `recommended_start` was a PostgreSQL enum containing only `returns`. Migration `0002_awesome_wolfsbane.sql` adds `investing-foundations`; there are no table/column changes and no profile or progress data migration.

Before starting this app version in another environment, run:

```sh
npm run db:migrate
npm run db:seed
```

The local migration was applied and the seed executed again. The seed transaction upserts stable module/lesson IDs, reorders Foundations before Returns, and leaves user progress untouched. Validation confirmed exactly eight Foundations rows with seven published lessons. No remote deployment or push was performed.

## 7. Responsive and accessibility validation

Chrome browser validation covers 320, 375, 390, 768, 1024, and 1440px. Assertions cover module paths, the lesson runner, growth/ownership/market-cap, bond, market, liquidity, risk-range, drawdown, diversification, portfolio weights and return inputs, asset roles, horizon, and risk-capacity interactions; completion; Home/Learn/Progress; no horizontal overflow; one page heading; and actions reachable at the bottom of the page. Existing Returns suites also cover interactive charts and their data fallbacks.

Keyboard tests use Space, arrow keys, Tab, and Enter; verify focus moving from Check to feedback Continue and then to the next step heading; and verify focus returns to retry actions after failed persistence. Inputs have labels and associated validation errors. Reduced-motion preference is exercised. Mobile and desktop screenshots were visually inspected, including 320px calculator values and the ETF visual.

No unexpected console or hydration errors remained. The known Motion development notice when reduced motion is enabled is explicitly excluded from the console assertion, as in the existing design-system suite. Expected simulated network failures and the intentional unavailable-route 404 are separately scoped.

## 8. Test and build results

Passed on 2026-09-09:

- `npm run lint`
- `npm run typecheck`
- `npm test` — 195 tests in 19 files.
- `npm run build` — optimized Next.js build succeeded.
- `BROWSER_CHANNEL=chrome node scripts/validate-foundations.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-onboarding.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-returns-flow.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-product-migration.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-design-system.mjs`

Browser flows use real local signup, sessions, server actions, and PostgreSQL. Foundations validation completes all seven lessons, edits and invalidates calculator and portfolio inputs, retries failed cursor/completion writes, refreshes saved steps (including the Portfolio Builder step), follows next-lesson links, signs out/in, checks review invariance for the new lessons, simulates a legacy completed profile, and verifies active Returns continuity. Disposable accounts and their cascading data are removed in `finally` blocks. Screenshots remain under `/tmp/investi-foundations-qa` and the existing suites' temporary directories; they are not committed.

## 9. Known limitations

Only Foundations Lessons 1–7 are implemented. Answers, allocations, and explorer inputs remain transient and reset on refresh, matching the existing runner; the saved cursor and completion persist. Market quotes, risk scenarios, and portfolio returns are deterministic illustrations, not live data, forecasts, expected returns, or recommendations. The Portfolio Builder uses three conceptual asset categories and one-period weighted returns; it deliberately omits volatility, correlation, covariance, optimization, taxes, fees, and product selection.

Browser automation ran against local Next.js development using installed Chrome; the production build was validated separately. Safari, Firefox, physical mobile devices, and screen-reader hardware were not tested. No out-of-scope investing modules, gamification backend, market data, or AI tutor were introduced.

## 10. Recommended Foundations checkpoint design

Keep the checkpoint in the shared runner and make it retrieval-focused rather than adding new teaching. A strong design would use six to eight mixed tasks across the existing mental models: classify ownership versus lending, distinguish an index from an ETF, read bid/ask intent, identify concentration risk, calculate one simple weighted return, and explain why horizon and capacity matter. Include one short “spot the misconception” sequence using only statements already covered. Show question-level feedback and a final concept summary, but do not create a score-backed credential, unlock hidden recommendations, introduce portfolio optimization, or persist a second assessment state. Explicit completion should continue to use the existing idempotent progress action.
