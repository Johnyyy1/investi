# Phase 6A.3A — learner profile and recommendation domain

Baseline: `8f4041f`, local `main` matched `origin/main`, clean before implementation. No commit or push. Scope follows the continuation request: domain, persistence and minimal compatibility wiring; polished onboarding and personalized lesson presentation are deferred to 6A.3B.

## Existing profile audit

`learning_profile` already had one row per user, cascading on account deletion:

- `userId`
- `experienceLevel` (BEGINNER / BASIC / INVESTOR / legacy ADVANCED)
- `goals[]`, `interests[]`
- `dailyGoalMinutes`, `timeZone`
- `recommendedStart` (legacy cached module hint)
- `onboardingStep`, `onboardingCompletedAt`, `updatedAt`

The current quick-start UI collects experience and supplies a 10-minute preference. The old Settings editor allows several goals. The original application gate required a completed profile even for users with existing progress or a portfolio. The existing Learn continuation algorithm prioritizes active lessons and recent module continuity.

## Fields reused and added

No second profile table or duplicate preference columns.

| New domain concept | Existing storage | New-write contract |
| --- | --- | --- |
| primaryGoal | `goals[]` | zero (neutral) or one identifier |
| interests | `interests[]` | up to seven distinct supported identifiers |
| selfAssessedExperience | `experienceLevel` | BEGINNER, BASIC, INVESTOR |
| preferredSessionMinutes | `dailyGoalMinutes` | 5, 10, 20, 30 |
| diagnostic | new nullable `diagnosticResult` JSONB | version, answers, correctness per concept, count, level |
| completed personalization | new nullable `personalizedOnboardingCompletedAt` | distinct from the original onboarding gate |
| updated time | `updatedAt` | server authored |

Stable primary goals: CONFIDENCE (basics), LONG_TERM_ETF, COMPANIES (stock analysis), PORTFOLIO, QUANT (quant/data).

Stable interests: STOCKS, ETFS, PORTFOLIO, FUNDAMENTALS (company analysis), DATA (statistics), QUANT, BACKTESTING.

Migration `0009_brainy_madame_masque.sql` adds exactly the two nullable columns and three enum values: LONG_TERM_ETF, DATA, BACKTESTING. No data updates, backfill, deletion, reward changes or new tables. Original timestamps and legacy enum values remain valid. Version lives inside the diagnostic JSON rather than in a duplicate column.

Legacy reads select the first supported goal without rewriting the stored array, omit the old MARKETS interest from the new learning model, map ADVANCED to INVESTOR and 15 minutes to the 20-minute bucket. Original legacy storage is preserved until the learner explicitly edits preferences.

## Diagnostic V1

`FOUNDATIONS_DIAGNOSTIC_V1` has stable question and option identifiers, with Czech prompts and plausible distractors:

| Concept | Question | Correct answer |
| --- | --- | --- |
| Simple return | 100 Kč → 110 Kč | +10 % |
| Compounding | 100 Kč, then +20 %, then −20 % | 96 Kč |
| Portfolio weight | ETF 2 000 Kč in a 5 000 Kč portfolio | 40 % |
| Bid/ask | Buy immediately with bid 99,80 / ask 100,20 Kč | Ask / 100,20 Kč |
| Diversification | Which statement is correct? | Holdings count alone does not prove diversification |

Clients submit only `{ version, answers }`. Strict Zod schemas reject extra score, correctness, level, evidence and owner fields, invalid options, missing answers and unknown submission versions. The server repository evaluates answers itself. The result stores both the submitted answers and per-concept evidence so it remains interpretable. Stored derived count/level are recomputed on read from the versioned answers. Unknown stored versions are preserved and supply no current diagnostic evidence.

Levels: 0–1 correct → `foundations_needed`; 2–3 → `partial_foundations`; 4–5 → `strong_foundations`. Self-assessment cannot override evidence. No user-facing badge or rank exists in this phase.

## Recommendation rules

`recommendLearning` is pure and deterministic. It receives a normalized profile, actual lesson progress, ordered curriculum and prerequisite map. It returns:

- `nextLessonId` or null;
- `reasonCode`;
- `scaffoldLevel`;
- `exampleContext` (neutral / etf / stock / portfolio / data);
- bounded `sessionLessonIds` and `splitLessonAcrossSessions` for approximate planning.

Only published, incomplete lessons satisfying their lesson/module prerequisites qualify. Unfinished Foundations take precedence, in normal sequence, regardless of self-assessment or diagnostic strength. Returns requires all seven published Foundations completions. After Foundations, the next incomplete published Returns lesson is recommended. Primary goal determines the context first; otherwise relevant interests determine it. Completed recommendations are skipped. No planned lesson or future module is returned as an actionable step. All content complete returns null with CURRICULUM_COMPLETE; unavailable prerequisites return null with NO_AVAILABLE_LESSON.

Reason codes include FOUNDATIONS_START, FOUNDATIONS_CONTINUE, DIAGNOSTIC_REMEDIATION, FOUNDATIONS_COMPACT_REVIEW, RETURNS_AFTER_FOUNDATIONS and ETF/stock/portfolio/quant Returns path variants. No recommendation or explanatory prose is persisted.

Weak evidence → guided; partial → standard; strong → compact; no evidence → standard. All self-assessments use the same evidence rule. These are domain outputs only: no lesson content, mastery check, hint or financial exercise changes in 6A.3A.

Session planning starts with one lesson even if it exceeds the chosen session duration, marking that it can span sessions; additional currently eligible lessons fit within the minute budget, capped at three. No streak feature or new daily pressure is introduced. The reused minutes column remains readable by the existing daily-goal presentation; replacing that presentation belongs to 6A.3B.

`loadLearner` now exposes `recommendation` for later UI use. The old onboarding recommendation presenter delegates selection to the new engine, so experience alone no longer recommends skipping Foundations. The existing Learn continuation card and completion navigation still use their existing continuity summary. Wiring the personalized recommendation visibly into those surfaces is explicitly deferred to 6A.3B.

## Writes, compatibility and defaults

Authenticated actions derive ownership from the session. Repositories validate unknown input again and only write `learning_profile`. Errors are normalized to Czech recovery messages. Revalidation follows successful writes. No profile payload accepts XP, entitlement, capital or lesson completion.

- Initial personalized completion writes preferences and server-evaluated diagnostic atomically. A conditional upsert protects an already completed personalized profile from duplicate/stale initial submissions. Original onboarding completion time and timezone are preserved.
- Preference edits update only the reused preference columns and server timestamp; existing diagnostic and personalized completion time remain.
- Explicit retake replaces the latest diagnostic and updated timestamp only. There is no assessment event log. It requires completed personalization and preserves the original completion markers.
- Skip creates neutral defaults (no goal/interests, BEGINNER, ten minutes, no diagnostic, standard scaffold), completes the original gate, and leaves the personalized completion marker null. Skipping an unfinished legacy draft applies those defaults. A stale skip cannot erase a completed profile.
- Existing completed onboarding remains sufficient for access. An account with lesson progress, award receipts, an entitlement or a portfolio also bypasses the initial gate even if its profile is missing/incomplete. Read-time access checks do not manufacture profiles, XP or diagnostic evidence.
- The existing Settings page safely displays neutral defaults for a missing profile; saving can create that profile for an account with history. The full redesigned Settings editor and optional personalization invitation remain deferred.

## Verification

- `npm test`: **60 files, 544 tests passed** (108 onboarding/personalization tests across six files; existing financial/progression suites retained).
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; Next.js 16.3.4 production build.
- `git diff --check`: passed.
- `npm run test:personalization-persistence`: passed on a dedicated disposable PostgreSQL 16 database bound to 127.0.0.1:55439.
- `npm run test:progression-persistence`: passed, including concurrent unlock, one-time capital and grandfathering.
- `npm run test:curriculum-seed`: passed, ten published lessons across two modules.
- `npm run test:personalization-compatibility`: passed in Chrome against a fresh production runtime on 127.0.0.1:3143; new-user onboarding gate, existing no-profile/incomplete-profile Learn access, Settings save and portfolio-only account access, no browser exceptions.
- Explicit remote-host negative test: rejected before application imports or any database connection.

Persistence QA starts on an empty named disposable database, applies historical migrations, creates legacy profiles and progress, applies the additive migration, reruns the migration runner, and reruns the canonical seed. It checks exact legacy row preservation, concurrent initial saves, stale save/skip handling, invalid inputs, retake behavior, normalized defaults, recommendation recomputation and cascading account deletion. It completes the real seven Foundations lessons and executes a deterministic sample trade, then compares every progress, award, entitlement, portfolio and trade row before/after profile mutations. The 420 XP, 500 000 minor-unit unlock grant and review = 0 XP invariants pass.

QA explicitly pins deterministic market time to the existing fixture (`2026-01-16T20:50:00.000Z`). Earlier test attempts exposed an unencoded SQL Date parameter (fixed to database `now()`), an incompatible test market clock (fixed in QA only), and a raw-SQL timestamp/string comparison (fixed in the test). Final passing checks use the corrected implementation and fixture setup. No remote database or live market provider was used.

No new UI screens were introduced, so the full responsive/accessibility matrix and review screenshots requested for 6A.3 are deferred with the UI to 6A.3B.

### Reproducing database QA

Provision a fresh disposable PostgreSQL database named `investi_6a3a_qa` on loopback. Export its DATABASE_URL explicitly; do not load a remote .env. Also export `PERSONALIZATION_QA_DISPOSABLE=1`, `MARKET_DATA_PROVIDER=deterministic`, `FX_DATA_PROVIDER=deterministic`, a local BETTER_AUTH_URL and a test BETTER_AUTH_SECRET. Then run `npm run test:personalization-persistence`. This script rejects non-loopback hosts, a different database name, missing opt-in, non-deterministic providers and non-empty databases before migration.

For browser compatibility, start a clean local production runtime using the same DB/provider settings and export `PERSONALIZATION_TEST_URL` with its loopback URL. Run `npm run test:personalization-compatibility`.

## Changed files

- `src/db/schema.ts`
- `drizzle/0009_brainy_madame_masque.sql`, `drizzle/meta/0009_snapshot.json`, `drizzle/meta/_journal.json`
- `src/features/personalization/{profile,diagnostic,recommendation,repository,actions}.ts`
- `src/features/personalization/{profile,diagnostic,recommendation,actions}.test.ts`, `test-fixtures.ts`
- `src/features/onboarding/domain.ts`, `domain.test.ts`, `repository.ts`
- `src/features/learning/load-learner.ts`
- `src/app/(app)/layout.tsx`, `src/app/(app)/settings/page.tsx`, `src/app/onboarding/page.tsx`
- `scripts/validate-personalization-persistence.mts`, `scripts/validate-personalization-compatibility.mjs`
- `package.json`
- `docs/onboarding.md`, `docs/personalization-phase-6a3a.md`

## Next: Phase 6A.3B

Build the short Czech preference and diagnostic flow, optional existing-user entry point, explicit skip, concise plan, recommendation reason presenter and profile editing/retake UI. Use the new domain output for the visible Learn recommendation while keeping ordinary curriculum access. Replace the legacy multi-goal editor with one primary goal and session pace, and remove obsolete cached recommendation reads as those callers migrate. Add narrowly scoped example/scaffold presentation hooks while preserving every concept and mastery requirement. Validate the full browser scenarios, keyboard/focus semantics, reduced motion, 1440/768/390/375/320 widths and 320 at 200% text, then capture the requested review screenshots.

Remaining domain limitations are intentional: five-question coarse evidence, latest diagnostic only, first supported legacy goal normalization, no inferred diagnostic from experience, current Foundations → Returns actionable curriculum, approximate session durations, and no visible adaptive lessons yet.
