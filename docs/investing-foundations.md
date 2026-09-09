# Investing Foundations — implementation and validation

Continues from `9143933` using the existing investi design, typed lesson blocks, ModulePath, guided runner, Better Auth, and Drizzle/PostgreSQL persistence.

## 1. Curriculum changes

Investing Foundations is the first available module at `/learn/investing-foundations`, followed by Returns & Compounding at the unchanged `/learn/returns` route. Returns lesson IDs and progress remain stable. The catalog combines the two existing-style lesson manifests for routing, paths, seed data, published-lesson validation, and progress selection. There is no second curriculum engine or lesson runner.

Foundations has eight planned lessons. Why invest?, Stocks: owning part of a business, and ETFs & indexes are available. Bonds & cash, How markets work, Risk vs reward, Your first portfolio, and Foundations checkpoint are upcoming, with no actionable navigation. Direct unavailable lesson URLs return the existing not-found page; server actions reject their IDs.

## 2. Lessons implemented

- **Why invest?** — nine guided steps plus explicit completion. Purchasing-power prediction, saving/liquidity versus uncertain investing outcomes, the €100/€110 basket, business growth, €100 → €105 → €110.25 compounding, risk, editable growth comparison, concept check, and takeaway.
- **Stocks: owning part of a business** — ten guided steps plus completion. Share ownership, editable ownership fraction, share price versus company size, editable market cap, price expectations, dividends, numeric and conceptual practice, daily-control misconception, and takeaway.
- **ETFs & indexes** — ten guided steps plus completion. The hundreds-of-companies question, diversification, indexes as measurements, a simple index → tracking ETF → investor visual, buyable ETF versus index, active strategies, remaining risk, asset exposure, fees, and takeaway. Checks cover all four required misconceptions.

Authored content maps to the same production Check → Feedback → Continue interaction. Integrity tests enforce one occurrence of every block, at most one question per step, question-last ordering, and a non-question final step. Every available manifest lesson has exactly one matching authored lesson; upcoming lessons have none.

## 3. Financial utilities and content review

`ownershipPercentage` returns percentage units, validates finite positive total shares, finite nonnegative owned shares, and owned ≤ total. `marketCapitalization` validates positive shares outstanding, nonnegative finite price, and a finite product. Examples verified: 100 / 1,000,000 = 0.01%; €50 × 1,000,000 = €50,000,000.

The growth interaction reuses `compoundValue` from the existing Returns finance utilities. At €10,000, 5% each year for ten years yields €16,288.95; zero growth stays €10,000. Negative rates are supported. The interface labels this a mathematical illustration, distinguishes its flat cash assumption from interest-bearing savings, and states that inflation, fees, taxes, and new contributions are omitted. It exposes annual values as an accessible expandable list. No new compounding implementation was added.

The content distinguishes amounts from purchasing power, expected from realized returns, equity market value from revenue/profit/cash/enterprise value, dividends from guaranteed extra wealth, and indexes from investable funds. Diversification is described as reducing some risks, not eliminating losses. No investment products are recommended.

Editorial reference checks used these primary sources:

- [ECB: price stability and purchasing power](https://www.ecb.europa.eu/home/pdf/students/leaflet_en.pdf)
- [Investor.gov: stock ownership and dividends](https://www.investor.gov/money-smarts-quiz-answer-1b)
- [Investor.gov: market capitalization](https://www.investor.gov/introduction-investing/investing-basics/glossary/market-capitalization)
- [Investor.gov: index funds and tracking differences](https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-4)
- [Investor.gov: ETF structure and strategies](https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2)
- [Investor.gov: diversification limits](https://www.investor.gov/introduction-investing/getting-started/asset-allocation)

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

Equal timestamps use curriculum order. Unknown or upcoming lesson progress is ignored. Rule 2 keeps an existing Returns learner moving through Returns after explicit completion, even if recomputation now recommends Foundations. When the three available Foundations lessons are finished, Returns becomes the next available learning.

Home's path preview follows the selected module, and recent completion links use each lesson's actual module. Learn presents a sequential journey with START HERE, Foundations, THEN Returns & Compounding, and upcoming topic areas. Progress shows both modules separately and six available lessons overall. The module and completion screens count three available lessons per module, with upcoming counts explicitly separated. No planned curriculum percentage, XP, streak, or other fabricated completion data is displayed.

## 6. Persistence, migration, and rollout

Existing `lesson_progress` rows store status, `lastPosition`, and completion timestamps. Foundation actions use the same session-owned repository functions. Cursor bounds and implemented IDs are checked on the server. Completion counts resolve the correct module and exclude unpublished database lessons. Review does not alter the saved completion or cursor; failed saves retain the current step and offer retry.

One schema change is necessary: `recommended_start` was a PostgreSQL enum containing only `returns`. Migration `0002_awesome_wolfsbane.sql` adds `investing-foundations`; there are no table/column changes and no profile or progress data migration.

Before starting this app version in another environment, run:

```sh
npm run db:migrate
npm run db:seed
```

The local migration was applied and the seed executed twice. The seed transaction upserts stable module/lesson IDs, reorders Foundations before Returns, and leaves user progress untouched. Validation confirmed exactly eight Foundations rows with three published lessons. No remote deployment or push was performed.

## 7. Responsive and accessibility validation

Chrome browser validation covers 320, 375, 390, 768, 1024, and 1440px. Assertions cover module paths, the lesson runner, growth/ownership/market-cap interactions, formulas, ETF visual, completion, Home/Learn/Progress, no horizontal overflow, one page heading, and actions reachable at the bottom of the page. Existing Returns suites also cover interactive charts and their data fallbacks.

Keyboard tests use Space, arrow keys, Tab, and Enter; verify focus moving from Check to feedback Continue and then to the next step heading; and verify focus returns to retry actions after failed persistence. Inputs have labels and associated validation errors. Reduced-motion preference is exercised. Mobile and desktop screenshots were visually inspected, including 320px calculator values and the ETF visual.

No unexpected console or hydration errors remained. The known Motion development notice when reduced motion is enabled is explicitly excluded from the console assertion, as in the existing design-system suite. Expected simulated network failures and the intentional unavailable-route 404 are separately scoped.

## 8. Test and build results

Passed on 2026-09-09:

- `npm run lint`
- `npm run typecheck`
- `npm test` — 152 tests in 18 files.
- `npm run build` — optimized Next.js build succeeded.
- `BROWSER_CHANNEL=chrome node scripts/validate-foundations.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-onboarding.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-returns-flow.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-product-migration.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-design-system.mjs`

Browser flows use real local signup, sessions, server actions, and PostgreSQL. Foundations validation completes all three lessons, edits and invalidates calculator inputs, retries failed cursor/completion writes, refreshes saved steps, follows next-lesson links, signs out/in, checks review invariance, simulates a legacy completed profile, and verifies active Returns continuity. Disposable accounts and their cascading data are removed in `finally` blocks. Screenshots remain under `/tmp/investi-foundations-qa` and the existing suites' temporary directories; they are not committed.

## 9. Known limitations

Only Foundations Lessons 1–3 are implemented. Answers and explorer inputs remain transient and reset on refresh, matching the existing runner; the saved cursor and completion persist. Growth values are deterministic nominal illustrations, not simulated or forecast market paths. The ownership/market-cap examples assume a single class with equal ownership per share. Fees are explained but not calculated.

Browser automation ran against local Next.js development using installed Chrome; the production build was validated separately. Safari, Firefox, physical mobile devices, and screen-reader hardware were not tested. No out-of-scope investing modules, gamification backend, market data, or AI tutor were introduced.

## 10. Recommended next slice

Implement Foundations Lesson 4, Bonds & cash, with the same runner and a narrowly scoped interaction explaining lender versus owner, liquidity, interest, and the possibility of bond price changes. Keep the other upcoming lessons planned until their own slices are reviewed.
