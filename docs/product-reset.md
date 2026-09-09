# Product reset: learning loop, rewards, demo, and Lab

## Product and navigation

The production information architecture is intentionally limited to **Learn**, **Lab**, and **Progress**. Settings is behind the account control. `/dashboard` is retained only as a compatibility redirect to `/learn`; `/` sends authenticated learners to `/learn` and other visitors to sign-in. Available lesson routes use focus mode and omit the application navigation.

Learn is the authenticated entry experience. Its one dominant action is selected centrally by `getLearnerSummary`:

1. Most recently updated `IN_PROGRESS` lesson.
2. First incomplete lesson in the module of the most recently completed lesson.
3. First incomplete lesson in the learner's recommended module.
4. First incomplete implemented lesson in curriculum order.

Unknown and unpublished lessons are ignored. Equal timestamps use curriculum order. If all available lessons are complete, Learn offers review while the completion loop points to the Lab.

## Onboarding and compatibility

New accounts see one experience-level choice with Beginner selected by default, then **Start learning** opens the first lesson directly on an interaction. The quick-start profile stores an empty goal/interest list, a ten-minute daily preference, the browser's validated IANA timezone, and the normal onboarding completion marker. Deeper preferences remain editable in Settings.

Completed profiles never replay onboarding. Existing answers, completion timestamps, lesson rows, and active Returns cursors remain intact. The loader recomputes a suitable recommendation without rewriting stored preferences. A stale onboarding tab cannot overwrite a completed profile.

## Completion transaction and XP

The client sends only the lesson identifier, cursor, and—when crossing a question step—the attempted answer. User identity always comes from the server session. XP is the server constant `LESSON_XP = 60`; no client payload can choose an amount.

The repository validates that movement advances by no more than one authored step and that a question was attempted before leaving its step. Completion requires the final saved authored step. The completion transaction locks the account row, preserves an existing `completedAt`, changes an unfinished progress row to completed, and inserts one `lesson_award` receipt. The receipt primary key `(user_id, lesson_id)` and fixed-XP check enforce one lifetime reward per lesson. The transaction then derives the updated read model and next lesson. If the award write fails, the lesson update rolls back. Repeated, refreshed, reviewed, or concurrent completion requests cannot add a second receipt.

Migration `0003_chunky_sphinx.sql` intentionally backfills one 60-XP receipt for each pre-existing published completed lesson. It uses the real stored completion/update timestamp and UTC because the historical timezone was not recorded. This preserves credit without duplicating completion or inventing a separate time-spent measure; the composite primary key makes deployment/retry idempotent. No time minutes are inferred.

## Streak and daily goal semantics

An award's `learning_date` is the local calendar date at the first legitimate completion. Multiple first completions on the same date count as one streak day, while each still counts toward that day's lesson target. A run of consecutive learning dates ending today is the active streak. A run ending yesterday remains active through today; a gap before yesterday resets the active streak to zero. Reviews do not create a learning day. There are no streak freezes.

The learner timezone is a validated IANA identifier and is pinned on the profile so travel or later device changes cannot manufacture days. New onboarding stores the browser timezone; demo state uses UTC. Historical backfill uses UTC explicitly because no prior timezone exists.

Daily minutes map deterministically to lesson targets: 5 → 1, 10 → 1, 15 → 2, 20 → 2, and no stored preference → 1. Progress uses real first-completion receipts. The UI never claims measured time-on-task.

## Demo architecture and cleanup

**Explore demo** asks Better Auth to create a fresh anonymous user/session. There is no shared email or password. Before the session is usable, a transaction verifies the anonymous owner and seeds a deterministic profile, six completed lessons with matching award receipts, and one in-progress lesson. Concurrent or repeated initialization is safe, and a failed seed rolls back profile/progress/rewards together. Separate visitors receive separate owners and mutable state.

The resulting read model is 360 XP, a four-day streak, one of two daily lessons, completed Foundations/Returns history, and an in-progress Risk vs reward lesson ready at its final interaction. These values are derived from the stored seed rows rather than hardcoded UI metrics.

Anonymous sessions expire after 24 hours. `npm run demo:cleanup` is a dry run; `npm run demo:cleanup -- --apply` removes only anonymous identities older than seven days, with related data deleted by cascade. Scheduling that command daily is sufficient for the current scale.

## Portfolio Lab

Portfolio Lab keeps Stocks/Bonds/Cash at exactly 100% by redistributing the remaining allocation deterministically. It reuses the lesson's weighted-return utility, accepts negative hypothetical returns down to −100%, rejects non-finite/invalid amounts and returns, and refuses non-finite final values. Portfolio return is displayed as `%`; each asset's allocation-times-return contribution is displayed in percentage points (`pp`), with negative zero normalized. Examples are explicitly hypothetical and are not forecasts, recommendations, or an optimal/safe/best allocation.

## Backtesting Lab and synthetic fixture

Backtesting Lab compounds monthly simple returns for a chosen deterministic mix, inclusive calendar-year period, and positive starting value. It reports final value, CAGR, maximum drawdown, and annualized volatility. CAGR uses the number of monthly return intervals divided by 12. Volatility is sample standard deviation (`n − 1`) multiplied by `√12`. Drawdown includes the initial value and month-end peaks. A −100% return is supported; returns below −100%, missing/duplicate/unordered observations, non-finite inputs, incomplete months, and overflow are rejected.

The bundled Jan 2015–Dec 2025 sequence is wholly invented educational data. Calendar labels are illustrative; it is not live or historical market data and is never named as a real index. The UI labels it **Demo data** and **synthetic**, and exposes the full monthly value table as the chart's textual alternative. Assumptions omit costs, tax, inflation, cash flows, and currency conversion and assume monthly rebalancing.

## Known limitations

Only seven Foundations and three Returns lessons are implemented; planned lessons remain unavailable. Lesson explorer inputs and answers are transient even though the saved cursor/completion persists. Lab data is simplified and synthetic. Chromium automation covers the declared responsive/accessibility flows, but Safari, Firefox, physical devices, and screen-reader hardware are not automated. Demo cleanup is an operational command rather than a lifecycle service.
