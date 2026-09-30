# Phase 6B.5 — Log Returns closeout

Validated on 2026-09-30 from baseline `b8d1f8b9a02d644fad4863e91776f48145c5922d` on `main`, initially identical to `origin/main`, with a clean working tree.

## Implementation

`returns-log-returns` is available at `/learn/returns/log-returns`, in position 5 immediately after `returns-comparing`. Its existing ID, slug, title, and 10-minute estimate are retained. The checkpoint stays planned and has no authored lesson. There are now five published Returns lessons and twelve published lessons overall. L4's only content-file change is its next-navigation link; its blocks and persisted step positions are unchanged.

The eight steps use the existing authored block system and renderer:

1. Assessed prediction: 100 → 110 → 99, with cumulative simple return −1%.
2. Multiplicative growth factors and why adding simple returns fails.
3. Definition of log return, explained symbols, positive-price constraint, worked example and numeric check distinguishing 9.531% from 10%.
4. Simple/log conversion and its inverse, using decimal inputs.
5. Consecutive log-return addition, the logarithm identity, and conversion of the sum back to −1% simple return.
6. Small-return approximation with retryable conceptual assessment.
7. Reasoning exercise for 100 → 105 → 110: compounded/simple and summed/log representations.
8. Simple, cumulative simple, and log-return summary, followed by a bridge to return observations.

Added educational floating-point helpers `logReturn(previousPrice, currentPrice)` and `simpleReturnFromLog(value)` to the existing Returns utility. Both follow `FinancialInputError`. Log returns reject non-finite/non-positive prices and handle extreme positive ratios without division overflow/underflow. The inverse uses `Math.expm1` for small-return accuracy and rejects non-finite or unrepresentable results. These helpers are not money-accounting functions.

## Preserved boundaries

No new generic lesson UI, schema changes, migrations, auth changes, reward-policy changes, server-authority changes, provider changes, portfolio-accounting changes, or unrelated feature redesigns. Reward policy v2 remains 60 XP and zero Practice Capital per first lesson completion; legacy v1 receipts remain authoritative. Review grants nothing. Learning continuation, completion transactions, locks, and receipt uniqueness are unchanged.

The configured database was not seeded or migrated. Database checks used a new disposable local PostgreSQL 17 container; browser checks used a fresh production server on port 3105 with deterministic market/FX providers and local QA credentials. Both were cleaned up after verification. No deployment, commit, or push was performed.

## Validation results

| Check | Result |
| --- | --- |
| Targeted helper/lesson tests | Passed: 51 tests after final lesson change |
| Full `npm test` | Passed: 66 files, 636 tests |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `git diff --check` | Passed |
| Existing migrations into disposable DB | Passed; no migration added |
| Curriculum seed + validation, repeated | Passed twice: all twelve published lessons, all planned entries and positions match; no duplicates |
| `test:log-returns-persistence` | Passed: persisted answer gates, premature-completion rejection, concurrent one-time reward, planned-lesson rejection, legacy receipt preservation, L4 preservation and replay |
| `test:persistence` | Passed |
| `test:progression-persistence` | Passed |
| `test:portfolio-persistence` | Passed, including buy/sell/reward concurrency |
| `test:log-returns-browser` with installed Chrome | Passed: complete L4 and L5, all eight L5 steps at 320/375/390/768/1024/1440, KaTeX, incorrect/retry feedback, numeric decimal-comma answer, keyboard radio navigation, visible focus, focus on Continue, touch-target height, reload/resume, Previous, completion and full review |
| Existing `validate-returns-flow.mjs` with installed Chrome | Passed: all L3 steps, explorers, responsive charts, persistence, sign-out/sign-in, review and reduced-motion behavior |
| Accessibility/layout checks | No horizontal page overflow at the six widths; all L5 steps reflow at 200% root text size at 768px; reduced-motion mode exercised; desktop/mobile screenshots visually inspected |

First L5 completion produced exactly one 60-XP, policy-v2, zero-capital receipt. Two concurrent repository completions awarded 60 XP in total. Browser replay through every question and completion preserved all receipts, progress rows, timestamps, cursors, and unlock grants. L4 stayed completed. After completing all available lessons, the primary completion action went to Lab. The future checkpoint displayed the application's unavailable page with `noindex` and created no progress row. Bundled Next.js guidance confirms streamed `notFound` responses can use HTTP 200; validation checks the unavailable UI and access state rather than assuming HTTP 404.

Browser scripts were corrected for the current Learn heading and planned checkpoint route. The separate legacy product-migration suite's planned-route assertion was updated, but that entire suite was not run. Other unrelated browser suites were not run. Playwright's bundled Chromium was unavailable; installed Chrome was used successfully. Initial QA harness failures (database startup timing, SQL result-array comparison, and streamed not-found expectations) were corrected and the affected checks rerun successfully.

Screenshots are local QA artifacts under `/tmp/investi-log-returns-qa`.

## Files changed

- `package.json`
- `scripts/validate-curriculum-seed.mts`
- `scripts/validate-log-returns-persistence.mts` (new)
- `scripts/validate-log-returns.mjs` (new)
- `scripts/validate-product-migration.mjs`
- `scripts/validate-returns-flow.mjs`
- `src/features/finance/returns.ts`
- `src/features/finance/returns.test.ts`
- `src/features/learning/learner-summary.test.ts`
- `src/features/learning/returns-path.test.ts`
- `src/features/lessons/registry.ts`
- `src/features/lessons/registry.test.ts`
- `src/features/lessons/returns/comparing-investments.ts`
- `src/features/lessons/returns/comparing-investments.test.ts`
- `src/features/lessons/returns/guided-flow.ts`
- `src/features/lessons/returns/guided-flow.test.ts`
- `src/features/lessons/returns/log-returns.ts` (new)
- `src/features/lessons/returns/log-returns.test.ts` (new)
- `src/features/lessons/returns/manifest.ts`
- `src/features/progress/actions.test.ts`
- `docs/returns-log-returns-validation.md` (new)

Final working-tree state: 16 modified tracked files and 5 new files, all scoped to this phase. Changes remain uncommitted on `main`; no unrelated pre-existing changes were present.
