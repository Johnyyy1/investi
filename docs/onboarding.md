# Onboarding and learning preferences

New learners see a Czech flow: primary goal, optional interests, experience, preferred session length, five diagnostic questions, and a saved recommended plan. Skipping uses the authoritative safe-default action. Completing or skipping personalization creates no lesson progress, XP, Practice Capital, entitlement, portfolio, or trade.

## Storage and compatibility

There is one `learning_profile` row per user, cascading on account deletion. Personalization reuses `goals[]` for zero or one primary goal, `interests[]`, `experienceLevel`, and `dailyGoalMinutes` for session length. Migration `0009` adds nullable `diagnosticResult` and `personalizedOnboardingCompletedAt`, plus the `LONG_TERM_ETF`, `DATA`, and `BACKTESTING` enum values. It does not rewrite existing rows.

Legacy reads select the first supported goal, omit the old MARKETS interest, map ADVANCED to INVESTOR, and map 15 minutes to the 20-minute session bucket. Reads preserve the original stored values. Legacy `recommendedStart` is not the source of current recommendation decisions.

Existing users retain app access with an original onboarding completion marker or any learning history, award, entitlement, or portfolio. Missing/incomplete profiles do not block those users. Learn offers dismissible optional personalization; Settings edits the same profile and permits a diagnostic retake after personalization is complete.

The old onboarding repository remains exercised by persistence and compatibility tests. The unused old UI server actions and their superseded action tests have been retired. Their conditional writes protect completed profiles against stale tabs. Removing that compatibility surface requires a separate persistence-contract review.

## Diagnostic and recommendations

`FOUNDATIONS_DIAGNOSTIC_V1` covers simple return, compounding, portfolio weight, bid/ask, and diversification. Clients send only versioned answer IDs. Strict schemas reject extra owner, score, correctness, or reward fields. The server evaluates answers and stores concept evidence. Reads recompute derived count/level; unknown stored versions supply no current evidence.

Evidence is coarse: 0–1 correct gives `foundations_needed`, 2–3 gives `partial_foundations`, and 4–5 gives `strong_foundations`. Self-assessment cannot override it. There is no public rank, diagnostic history, or credential.

`recommendLearning` uses normalized preferences, actual lesson progress, the published curriculum, and prerequisites. Unfinished Foundations take precedence. Returns recommendations require all seven Foundations completions. It selects the next incomplete published Returns lesson after Foundations; completed/unpublished lessons are never recommended as new learning. Goal and interests vary the explanation/context. All complete returns a null next lesson and `CURRICULUM_COMPLETE`.

The domain returns scaffold level (guided/standard/compact), example context, and approximate session planning, capped at three eligible lessons. A lesson longer than the session remains eligible and may span sessions. These outputs do not create alternate lesson content, mastery requirements, or rewards. Active-learning continuity is handled separately by the learner summary.

## Writes and recovery

Actions derive ownership from the session and repositories validate again. Initial completion saves preferences and server-evaluated diagnostic in one conditional upsert. Duplicate/stale completion cannot overwrite a personalized profile. Preference edits preserve diagnostic evidence and completion timestamps. Retakes replace the latest diagnostic and updated timestamp, preserving the original completion markers.

Skip applies neutral defaults: no goals/interests, BEGINNER, ten minutes, no diagnostic. It completes the original gate while leaving personalized completion null. A stale skip cannot erase a completed profile. No profile mutation alters lesson receipts, progress, unlocks, capital, portfolios, or immutable trades.

The browser-tab draft is scoped to the user and initial/retake mode. Disabled storage leaves a working form that restarts after refresh. Failed saves preserve attempted values and expose retry. Dismissal is a local UI preference.

## Validation workflow

Use `npm run test:personalization-persistence` with an explicitly supplied, empty disposable loopback PostgreSQL database named `investi_6a3a_qa`, `PERSONALIZATION_QA_DISPOSABLE=1`, deterministic market/FX providers, a local `BETTER_AUTH_URL`, and a test secret. The harness refuses other hosts/names, absent opt-in, non-deterministic providers, or a non-empty database before migration. It tests historical upgrade, migration rerun, seed, legacy reads, stale/concurrent writes, retakes, cascade, and unchanged financial/learning records.

Against a fresh local app using that database, set `PERSONALIZATION_TEST_URL` and run `test:personalization-compatibility` and `test:personalization-browser`. The latter covers recovery, failures, double submits, recommendations, Settings, keyboard operation, and responsive reflow. Screenshots remain under `/tmp`.

Deferred work includes lesson-level scaffold adaptation, diagnostic history, physical-device/screen-reader verification, and eventual retirement of legacy preference contracts.
