# Returns module — Phase 6B.1 audit and implementation plan

Review proposal, 2026-09-29. Baseline: `4a80f8a` on `main`, matching `origin/main` after `git pull --ff-only`; initially clean. Auth phase is treated as complete at that baseline, not re-audited. No publication, migration, database access, provider calls, commit, or push in this phase.

## 1. Current state and evidence

Paths below are repository-relative. Primary evidence:

- `src/features/lessons/returns/{manifest,what-is-a-return,simple-returns,compounding-and-cumulative-returns,guided-flow,compounding-flow}.ts` and `src/features/lessons/registry.ts`.
- `src/components/lesson/{guided-lesson,guided-block,guided-question,return-calculator,price-series-explorer,compounding-explorer,recovery-explorer}.tsx`; `src/components/learning/learning-chart.tsx`.
- `src/features/finance/returns.ts`, its tests, and only the related `growthFactor`/`compoundReturn` exports in `finance/foundations.ts`.
- Learning catalog, Returns path, learner summary/loader, lesson route, question evaluation, progress transition validation, recommendation/presentation integration and their existing tests.
- `src/features/instruments/{history,period-statistics,price-chart-presentation}.ts`, Instrument Detail/chart presentation and related tests; normalized market-history contracts. No accounting, ETF fundamentals, auth, or backtesting-internals audit.

| Published lesson | Current duration / guided steps | Distinct job | Assessment actually present |
| --- | --- | --- | --- |
| `returns-what-is-a-return` | 12 min / 9 | Scale absolute change by starting price | Comparison prediction, 80→92 numeric answer, reason for percentage comparison |
| `returns-simple-returns` | 14 min / 10 | Move the denominator through adjacent observations | Positive/negative pair, decimal→percent, repeated comparison, two adjacent returns |
| `returns-compounding` | 15 min / 10 | Reconstruct an outcome from period returns | +20%/−20% prediction, two gains, adjacent plus cumulative returns, recovery, why addition fails |

The manifest additionally lists `returns-log-returns` (10 min), `returns-comparing` (10 min), and `returns-checkpoint` (8 min), all planned and absent from the authored registry. Current available duration is 41 minutes. Keep all IDs and published slugs stable.

**Strongest content:** the changing-denominator explanation; paired numeric questions for 100→110→99; comparison of arithmetic addition with compounding; editable 2–5-period explorer; recovery explorer; shared pure calculations; retryable feedback with server-validated continuation. The renderer supports one question per step, after its explanatory blocks. Returns questions are assessed but do not currently use the renderer's optional `kind: "mastery"` label. Final `checkpoint` blocks are summaries, not scored questions.

**Navigation/progression:** only available lessons enter the active path; planned lessons remain locked even with stray progress rows and have no authored route. Published lessons are accessible without introducing new sequential access locks. Completion navigation uses the learner summary/reward response, not just authored `navigation`; absence of an authored next link in lesson 3 is appropriate today. Latest active learning takes precedence in continuation. Step positions are persisted numerically: a future step reorder needs explicit resume-compatibility review, not an incidental content edit.

**Personalization:** Phase 6A.3 remains intact. Recommendations require completed Foundations, use normal curriculum order, and vary reason/context/session framing; continuation still prioritizes active learning. No lesson-level alternate curricula are currently wired into `GuidedLesson`. Keep one set of formulas, answers, mastery requirements, progression and rewards for all interests. No XP, Practice Capital, entitlement, portfolio, or auth changes.

## 2. Concept coverage and repetition

L1–L3 refer to the published lessons above; names in backticks are authored block IDs. “None” means no explicit assessed item, not no possible exploration.

| Concept | First introduction | Worked example | Interaction | Current mastery check | Later repetition and judgment |
| --- | --- | --- | --- | --- | --- |
| Absolute price change | L1 `price-change` | `example-100`, `compare-assets` | Return calculator | `prediction`, `why-percent` distinguish scale; no standalone subtraction check | L2 `raw-differences`: useful reminder; identical comparison numbers below are redundant |
| Percentage return | L1 `formula-one` | `example-100` | Calculator | `numeric`, `why-percent` | L2 percentage answers, L3 outcomes: useful application |
| Simple return, equivalent forms | L1 `formula-one/two` | 100→110 | Calculator | 80→92 = 15% | L2 adds time subscripts and adjacency: useful, condense re-explanation |
| Positive/negative/zero signs | L1 `positive-negative` | L1 positive example; L2 loss exercise | Calculator can produce all three | L2 `negative-return`; no explicit zero-return question | L3 signed factors: useful; explorer fixture contains no flat interval |
| Period return | L2 `periods` | `period-example` | Price-series explorer | `two-periods` | L3 `multi-period`: useful before compounding |
| Price series | L2 `series` | Fixed 100→105→102→108 | Chart, table, selectable rows | `two-periods` uses 100→110→99 | L3 telescoping example: useful distinct outcome |
| Adjacent observations | L2 `periods`, `series` | Explorer's selected pair | Period selection | `two-periods` | L3 `multi-period`: useful retrieval |
| Previous-price denominator | L1 starting-price formula; L2 moving denominator | L2 100→105, next base 105 | Selected pair explanation | L2 positive/negative and two-period questions | L3 changed base and recovery: necessary dependency |
| Decimal representation | L1 `numeric` feedback; explicitly L2 `representation` | 0.05 = 5%; −0.12 = −12% | Percentage inputs convert at boundaries | L2 `decimal-practice` only tests decimal→percent | L3 `growth-callout`: useful; percent→decimal mastery missing |
| Percentage representation | L1 examples; explicit conversion L2 | Same conversion examples | Calculator/explorer output | L2 `decimal-practice` | L3 displayed return vs factor: useful |
| N prices → N−1 returns | Implicit L2 first row has dashes | Four prices / three returns in explorer | Select three periods | None | Make explicit in L2; no separate lesson needed |
| Growth factor | L3 `growth-factors` | `growth-callout`: 0.05→1.05, −0.12→0.88 | Compounding explorer applies factors | `two-gains` indirectly | Later log conversion: useful; add direct factor explanation/check |
| Compounding vs addition | L3 opening and `prediction` | `twenty-example` | Editable sequence and sum comparison | `two-gains`, `concept` | Final checkpoint should transfer to unfamiliar values |
| Cumulative return | L3 `twenty-example`, `cumulative-formula` | −4%; direct 99/100−1 = −1% | Compounding explorer | `two-gains`, `multi-period` | Later comparison and log reconstruction: useful |
| Ending value | L3 `prediction`, `value-formula` | 10,000→12,000→9,600 | Explorer initial value and sequence | Prediction selects 9,600; no independent numeric ending-value check | Add numerical transfer later, not another full exposition |
| Loss/recovery asymmetry | L3 `twenty-example`; explicit `asymmetry` | Recovery explorer 20%→25%; feedback 50%→100% | Recovery input/presets | `loss-practice` | Checkpoint retrieval useful |
| Compare investments | L1 `comparing` | 100→110 vs 500→510 | `prediction` | `why-percent`, L2 `comparison` | L2 repeats exactly 50→55 vs 200→210: replace with adjacency/data reasoning |
| Price vs total return | Only price calculations; no current dividend lesson | None | None | None | Brief price-only scope now; proposed L4 owns distributions |
| Log returns | Planned metadata only | None | None | None | Proposed L5 |
| Return series as observations/center/extremes | L2 table implicitly | None explicitly about a dataset | No return-data view | None | Introduce in L2, assess interpretation in L6 |

L1's prediction follows formulas and a near-identical worked comparison; it is retrieval rather than prediction-before-explanation. L2 has no initial prediction. L3 predicts before the worked numeric solution, although its opening already says to multiply. Fix ordering only with persisted-position compatibility accounted for. Keep the repeated 100→110→99 across L2/L3: L2 extracts intervals; L3 adds the new cumulative result.

## 3. Reuse the price-series explorer

Reuse `PriceSeriesExplorer`; do not replace it. It already uses the canonical helper, shows the initial undefined return as “—”, selects adjacent pairs, and explains the denominator. It does **not** highlight the selected chart segment; only the table row and explanatory panel change. The phase's wording correction removes that promise.

Required extensions in 6B.2/6B.3:

1. Explicitly show **4 prices → 3 return observations**, with no return at the first price; assess the general N−1 rule.
2. Add a paired price-data / decimal-return-data view, preserving dates and the two endpoints of each observation. Teach `100, 103, 101, 106 → 0.03, −0.0194174757…, 0.0495049505…`, displayed as `+3.00%, −1.94%, +4.95%` (localized commas in Czech UI).
3. Clearly label the fixed dataset educational/sample data. Add a flat interval example; do not mistake the first unavailable return for zero.
4. Add percent→decimal practice and a count/adjacency question in place of the duplicate stock comparison. Keep one assessed question per guided step.
5. Introduce the series as observations in time, with differing moves, a rough center and extremes. No variance, standard deviation, annualization, volatility score or correlation calculation.
6. Explain weekends/session gaps. Localize `Day 0` labels and dot-formatted numbers. The current 30rem minimum-width table forces local horizontal scrolling; design an intentional mobile pair list when extending this interaction. No layout changes or screenshots in 6B.1.

## 4. Finance contract and numerical findings

Use decimal returns internally; percentage input/output conversion is a presentation concern. “Simple” describes the return definition, not an instruction to add returns through time.

| Quantity | Definition / scope |
| --- | --- |
| Absolute price change | `P_end − P_start`, in price/currency units |
| Simple price return | `R_t = P_t / P_(t−1) − 1 = (P_t − P_(t−1)) / P_(t−1)` |
| Growth factor | `G_t = 1 + R_t` |
| Cumulative return | `R_cum = product(1 + R_t) − 1` |
| Ending value | `V_n = V_0 × product(1 + R_t)`; no added/withdrawn capital; returns must consistently include or exclude distributions/fees |
| Recovery | Positive loss magnitude `L`, `0 ≤ L < 1`: `1 / (1 − L) − 1`; no finite recovery at complete loss |
| Log price return | `r_log,t = ln(P_t / P_(t−1)) = ln(1 + R_t)`, strictly positive prices |
| Log time aggregation | `sum(r_log,t) = ln(P_n/P_0)`; convert back with `exp(sum) − 1` for simple cumulative return |

Endpoint equivalence applies to prices on one consistent currency/adjustment basis. A price-only series does not reconstruct dividend-inclusive wealth. Return inputs must never include learning rewards or deposits as investment gains.

All authored numeric examples/answers checked against the definitions:

- L1: 100→110: +10 units/+10%; 500→510: +10/+2%; 50→55: +10%; 200→210: +5%; 80→92: +15%.
- L2: 100→105: +5%; 80→84: +5%; 120→108: −10%; −0.12→−12%; 100→110→99: +10%, −10%. Explorer 100→105→102→108: +5%, −2.857142857…%, +5.882352941…%.
- L3: 10,000×1.2×0.8 = 9,600 (−4%); 1.1²−1 = 21%; 1.1×0.9−1 = −1%, matching 99/100−1. Factors 1.05 and 0.88 are correct. Losses 10%, 20%, 50% require about 11.1111%, 25%, 100% gains.
- Equal start/end gives zero; negative outcomes keep their sign. No premature rounding in ordinary helper paths; figures format results only. JS `number` is approximate arithmetic, not exact money accounting.

No incorrect worked answer or formula found. Corrected wording: percentage conversion needs multiplication by 100; previous observation need not mean yesterday; price-only scope must not imply dividend-inclusive performance.

**Price/total-return teaching (L4):** with start 100, end 105 and distribution 2, price return is 5%. `(105−100+2)/100 = 7%` is exact in the explicitly simplified cash-held, no-fee/no-tax example; call it approximately 7% as an intuition for total return, not a universal reinvested result. Real total-return series need distribution timing, reinvestment prices and a consistent methodology. Split adjustment alone does not include dividends. The distinction between raw closes, adjusted data and return conventions is also documented by [PerformanceAnalytics, Return.calculate](https://search.r-project.org/CRAN/refmans/PerformanceAnalytics/html/Return.calculate.html); investi's actual chart semantics are established by local contracts above.

**Log scope (L5):** measure the logarithm of the growth ratio; add across adjacent time intervals; explain use in statistics/time-series analysis; compare a +1% simple move with `ln(1.01) ≈ 0.00995033` and a +20% move with `ln(1.2) ≈ 0.182322`. Approximate similarity is for small moves. Communicate investment performance primarily using simple returns. Log returns are not portfolio-weighted simple returns and are undefined at a zero endpoint. No stochastic calculus, Itô, GBM, pricing theory or advanced probability.

## 5. Final compact sequence — six lessons

This is a proposal, not a manifest change. Reuse all six IDs; move planned `returns-comparing` before `returns-log-returns` when implementing. Comparison owns the return-basis decision; the checkpoint applies it to data. No extra price-series lesson.

| # / lesson / stable ID / duration | Objective and prerequisite | Misconception; prediction before explanation | Minimum math; main interaction | Mastery and next bridge |
| --- | --- | --- | --- | --- |
| 1. **Co je výnos?** `returns-what-is-a-return`, 10–12 min | Distinguish amount from proportional price change; basic percentages / Foundations | Larger cash gain must mean larger return; predict 50→55 vs 200→210 before the example | Subtraction, division, ×100; existing return calculator | Calculate a new pair, explain denominator, identify positive/negative/zero; bridge from one pair to many |
| 2. **Jednoduché výnosy** `returns-simple-returns`, 12–15 min | Convert prices into adjacent decimal return observations; L1 | Every return uses initial price; first row is zero; predict number of returns and second denominator | Same ratio, decimal↔percent, N−1; extend existing price-series explorer | Extract returns including loss/flat move, count observations, convert both ways, explain an observation gap; bridge to reconstructing whole-period result |
| 3. **Složené a kumulativní výnosy** `returns-compounding`, 12–15 min | Turn a return sequence into cumulative return and ending value; L2 | Gains/losses cancel or can be added; retain +20%/−20% prediction | `1+R`, multiplication, product notation, recovery ratio; existing compounding/recovery explorers | Calculate factor, cumulative result and ending value on new inputs; explain recovery and endpoint equivalence; bridge to what the input return includes |
| 4. **Cenový a celkový výnos: férové porovnání** `returns-comparing`, 12–15 min | Choose a common basis before comparing outcomes; L1–L3 | Chart gain includes distributions; any two percentage figures are comparable; predict 100→105 plus dividend 2 | Price return and simplified `(end−start+cash)/start`; small deterministic comparison using existing question/worked-example blocks | Distinguish 5% price from simplified 7% cash-inclusive outcome; reject differing dates/currency/adjustment/fee assumptions; bridge from return basis to alternative mathematical representation |
| 5. **Logaritmické výnosy** `returns-log-returns`, 10–12 min | Interpret log return and time additivity; L2–L4 | Log percentage equals simple percentage, or simple returns add; predict whether both definitions agree exactly for small/large moves | `ln(ratio)`, sum, `exp(sum)−1` with supplied calculator values; compact simple/log comparison | Identify valid positive-price input; aggregate logs then recover a simple return; explain why analysts use logs but communicate simple outcomes; bridge to interpreting the dataset |
| 6. **Výnosová řada: porovnání a kontrola** `returns-checkpoint`, 12–15 min | Integrate calculation, basis selection and data interpretation; L1–L5 | Same endpoint means same path; highest return alone proves best investment; predict whether two paths with equal endpoints look alike | Previously learned formulas only; one short, fixed dataset and existing question types | Transfer checks below; identify center/extremes/time order without risk calculations; bridge to November Risk/Volatility |

Logical prerequisites guide explanations and recommendation order, not new access controls. Target total: 68–84 minutes. L4 is feasible in this budget because it owns comparison conventions; L6 assesses them without re-teaching. Use short, concrete examples, not a new calculator platform.

### Dependency and exit-assessment map

`absolute change → starting-price scale → simple decimal return ↔ percentage → adjacent pairs/N−1 → return dataset`

`decimal return → growth factor → cumulative return → ending value/recovery`

`consistent price data + distributions → price/total-return basis → fair comparison`

`adjacent ratios + compounding → log time additivity → simple-performance interpretation`

All feed L6. Its exit exercise should use a fresh series, including a flat and losing interval, rather than copy L2/L3 answers:

- Identify absolute change versus return; calculate signed simple/adjacent returns; explain the moving denominator and N−1 count; convert decimal↔percent (L1/L2 transfer).
- Derive a growth factor, cumulative return and ending value; explain why addition fails and a loss needs a larger percentage recovery (L3 transfer).
- Select price versus total-return semantics and a common comparison period, currency and adjustment basis; state distribution/reinvestment assumptions (L4 transfer).
- Interpret supplied log values, their sum and conversion back to simple return; use simple return in a performance sentence (L5 transfer).
- Read `+1.0%, −0.4%, +0.3%, −1.2%, +0.8%` as five observations: mixed signs, values around a center, −1.2% as the most negative and largest absolute move, time order retained. No numerical variance/volatility/correlation mastery.

Order affects the path and later time-series analysis; reordering an identical set of returns does **not** change their final product without cash flows. Do not teach the opposite when explaining why timestamps matter.

## 6. Pure helper audit and intended ownership

| Existing helper | Current contract / duplication | Recommendation |
| --- | --- | --- |
| `returns.absoluteChange` | Finite start >0, end ≥0; price-unit difference | Keep |
| `returns.simpleReturn` | Same inputs; unrounded decimal ratio minus 1 | Canonical; do not introduce another version |
| `returns.consecutiveSimpleReturns` | Ordered numeric array, ≥2 entries; adjacent returns; zero terminal price allowed, zero next denominator rejected | Already fulfills numeric `priceSeriesToReturns`; keep name, no alias/duplicate; not a timestamp validator |
| `returns.cumulativeReturn` | Finite returns ≥−1, product−1; empty array = 0 | Canonical |
| `returns.compoundValue` | Positive start × (1+cumulative return) | Keep public contract; assess numerical-range hardening before market-data reuse |
| `returns.compoundPeriods` | Same factor multiplication plus explanatory period rows; zero remains zero after −100% | Necessary trace, not a competing return definition |
| `returns.recoveryReturn` | Positive loss magnitude [0,1); decimal required gain | Keep; full loss explicitly outside domain |
| `foundations.growthFactor` | Existing validated `1+R` | Already exists; do not add a competing export. Any future relocation should preserve its old import API and avoid a returns↔foundations cycle; no Foundations change now |
| `foundations.compoundReturn` | Delegates to `cumulativeReturn` | Compatibility wrapper, not duplicate implementation; no removal needed |
| `returns.parsePrice`, local `parsePercent`, local formatters, `lib/formatters` | Input parsing/display; repeated formatting, not duplicate finance | Keep outside future data transformation; prefer shared Czech formatting when figures are edited |
| `instruments.periodStatistics` | Validated dated series; endpoint return in **percentage units** (`returnPercent`), close min/max, null for insufficient returns | Formula overlap is an intentional existing UI boundary. Do not change chart calculations in 6B.1 or feed this percentage field into decimal-return helpers |

No duplicate numeric series helper or existing log-return helper found. Proposed additions only when needed: pure `logReturn(start,end)` with both prices finite and >0; a dated `historicalPriceReturns` transformation wrapping normalized history and `simpleReturn`. No provider-specific fields, IO or formatting in either. A generic total-return helper is premature without distribution/reinvestment contracts.

Hardening backlog, not evidence that current lesson answers are wrong: finite inputs can still overflow a ratio/product; extremely small compounded factors can lose precision when `compoundValue` reconstructs `1 + (product − 1)`. Numeric arrays also do not encode timestamp gaps or provenance. Before accepting market-history inputs, define structured non-finite/out-of-range errors and test the actual edge cases; do not repurpose these educational floats for portfolio accounting. No helper changes made in this audit.

## 7. Future price-series data contract

**Boundary:** normalized ordered history → validation → adjacent observed pairs → decimal return observations. Keep this a consumer of the existing market-data contract, not a provider architecture change.

Input: existing `HistoricalSeries` with stable instrument ID, currency, UTC session dates, interval, explicit adjustment and provenance; select `close`, never silently substitute `adjustedClose`. Initial supported basis is split-adjusted price return. Other bases must be explicitly supported or rejected, never relabeled as total return. Preserve requested/actual range and source completeness. No fetching inside the transformation.

Proposed discriminated output: `ok` with observations and diagnostics; `insufficient-data` with no computed return; `invalid-data` with reason and offending indices/dates, no partially accepted series. Each successful observation carries `startDate`, `endDate`, `startClose`, `endClose`, decimal `returnValue`, elapsed calendar days, and gap classification (`scheduled`, `missing-session`, `unknown`, or none). Series metadata preserves instrument/currency/interval/adjustment/provenance, observation count, return count and completeness. Gap classification needs explicit calendar/completeness evidence; dates alone cannot prove a missing session.

| Input condition | Required behavior |
| --- | --- |
| <2 valid observations | `insufficient-data`, zero return observations, never a synthetic 0% return. The existing numeric helper may retain its throwing contract; adapter translates deliberately |
| Previous price zero | `invalid-data`: undefined denominator |
| Negative, null, undefined, non-numeric, NaN, infinite price | `invalid-data`, identify row; do not coerce null/blank to zero or silently drop row |
| Zero terminal price | Dated market-history consumer rejects non-positive closes, matching current history validation. Educational `simpleReturn(100,0) = −1` remains valid; log return never accepts zero |
| Duplicate timestamps (even equal values) | Reject as ambiguous; no silent last-write-wins or deduplication |
| Unsorted/invalid timestamps | Reject; no silent sort, mutate or timezone coercion. Daily dates must be real canonical UTC session dates |
| Entire missing expected observation | Never invent a row. Adjacent **available** valid endpoints may form one multi-session return, tagged as a gap and partial/unknown coverage. Never present it as a one-session observation |
| Weekend/holiday gap | Keep the actual adjacent available endpoints and elapsed span. With session-calendar evidence, mark scheduled gap; create no weekend/holiday prices or zero returns |
| Unknown calendar/coverage | Preserve `unknown`; absence of evidence is not completeness. Consumers needing regular comparable observations must block or explicitly handle this |
| Mixed instrument, currency, adjustment or interval | Reject unsupported/mixed basis; no implicit FX, split adjustment or dividend reinvestment |
| Non-finite derived result | Explicit range error; never return infinity, zero fallback or partially formatted numeric strings |

For a valid N-observation input, return exactly N−1 observations without rounding. If the source omitted a price, N means received valid observations, not requested calendar days. Later volatility/correlation consumers must align intervals using explicit policies; this phase adds no filling, resampling or annualization. Minimum future tests: adjacency/N−1 and endpoint equivalence, missing vs flat, date ordering/duplicates, malformed/zero prices, decimal precision and gap metadata. Test behavior, not copy or every viewport.

## 8. Instrument Detail mapping and future modules

Selected-period performance is **PRICE return from available split-adjusted closes**, in the instrument's quote currency. `historicalRequest` requests that policy; `chartPoints` rejects incompatible history; `periodStatistics` uses the first/last available closes. Current chart calculations remain untouched.

| Instrument UI | Curriculum interpretation |
| --- | --- |
| Start/end close | L1 denominator/numerator; observed dates may differ from requested calendar boundaries |
| Selected-period price return | L3 endpoint result; L4 explicitly excludes dividends; not investor-specific cash-flow return or CZK portfolio performance |
| Price change | L1 amount vs percentage; same endpoints |
| Price history | L2 observations and adjacent pairs; no fabricated missing days |
| Min/max | Extremes of observed closes in line mode; OHLC lows/highs in candle mode. Neither is the selected-period return or maximum drawdown |
| Line/candles | Two views of history; candle open→close direction does not equal previous-close period return. Switching view does not redefine the endpoint return |
| Zoom / range | Zoom changes visible data, while selected-range metrics stay fixed; choosing a different range changes the metric inputs |
| Unavailable/one close/partial history | No invented performance. One close supports a price, not a return; partial history keeps actual endpoints and warning |

Future deterministic exercises can mirror these labels; no authenticated chart-driven lesson or live-provider flow now. Later read-only integration must freeze source context and calculation basis for an exercise, preserving provenance and stable correct answers.

| Next module | What Returns supplies | What is deferred |
| --- | --- | --- |
| Risk/Volatility (November) | Signed, timestamped return dataset; intuitive center/extremes | Dispersion, variance, standard deviation, frequency and annualization |
| Correlation | Comparable aligned return observations | Joint movement, covariance/correlation and alignment choices |
| Portfolio | Consistent decimal asset returns and period basis | Weighted asset returns plus covariance; no personal-ledger mutation |
| Backtesting | Explicit strategy-return series conventions | Simulation, costs, cash-flow treatment and risk metrics; no backtesting of live transactions |

## 9. Exact recommended build order

| Phase | Concrete scope / acceptance |
| --- | --- |
| **6B.2 — strengthen published content** | Only three existing lessons and their current interactions. Make L2 N−1 explicit; add reverse conversion and flat-price distinction; replace identical L2 comparison with adjacency/count reasoning; label/localize the fixed explorer data; add L3 numerical ending-value transfer and direct factor explanation using existing blocks. Preserve 9/10/10 step positions and one-question-per-step where possible. For prediction-first, revise the existing opening as an ungraded prediction prompt before explanation; do not move persisted question gates without a reviewed resume solution. Reuse calculator/explorers. No new published lessons, helpers, provider work, chart changes or reward/progression changes. Reuse existing tests; targeted clean-runtime browser check only for changed interaction/reflow, not a viewport matrix |
| **6B.3 — return dataset contract** | Implement the pure dated adapter and focused edge-case tests from §7; extend L2's existing explorer with paired data views and deterministic date/gap examples. Address numerical-range findings before new consumer use, maintaining existing APIs. Still no new price-series lesson or live calls. Use existing normalized contracts |
| **6B.4 — comparison basis** | Author L4 under `returns-comparing`, retain slug `comparing-investments`, position it before log returns in planned sequence. Price vs total return, timing/reinvestment caveat, common dates/currency/adjustment basis, Instrument Detail interpretation. Small existing block-based exercise. Prepare content/registry/steps together; publish only as an explicitly approved implementation phase, not from this plan |
| **6B.5 — log returns** | Add tested pure `logReturn` once, author L5 with the narrow scope above, compare simple/log values and convert cumulative logs back. Reuse deterministic examples and existing renderer; no stochastic calculus or provider integration |
| **6B.6 — integrated checkpoint and polish** | Author L6 to cover exit competencies and series interpretation; connect to the future Risk module without falsely making it available. Verify planned/available routing, recommendation order, current/review/resume and module completion behavior. Update durations and metadata coherently. Defer actual live market-data lesson integration to a separately scoped phase |

No schema migration is expected. Manifest metadata eventually flows through the existing idempotent curriculum seed; do not delete/recreate stable lesson IDs, reset progress, or execute production seeding during these audits. If implementation requires a schema migration, stop for review. Build/publish the remaining lessons incrementally; do not release all planned lessons at once.

## 10. Phase 6B.1 changes and verification

Changes: this plan plus five wording corrections across the three published lesson files (price-only scope, previous observation vs yesterday, actual row highlighting, ×100 conversion, cumulative price-return assumptions). No answer, tolerance, block ID, step order, manifest, helper, formula implementation or layout changed. No tests added for static copy. No screenshots.

Verification completed:

- `npm test`: **63 files / 565 tests passed**, including Returns calculations/flow/registry, progression transitions, recommendation behavior and Instrument Detail statistics. No tests added or removed.
- `npm run typecheck`, `npm run lint`, `npm run build`: **passed**. Build used deterministic market/FX providers, dummy local build credentials and a loopback database URL on port 1; no production database or live provider was used.
- `git diff --check`: **passed**; all four changed files reviewed. `main` remains at `4a80f8a`, zero commits ahead/behind `origin/main`; three modified lesson files and this new document remain uncommitted for review.

Database/integration/browser suites were not run for these wording/documentation changes; no runtime accessibility claim is made. Zero screenshots. Existing code inspection identifies the mobile explorer follow-up above. No schema, database, auth, personalization-domain, financial-accounting, chart-calculation or progression change; no commit or push.
