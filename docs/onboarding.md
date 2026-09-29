# Onboarding and learning preferences

New learners see a short Czech flow: primary goal, optional interests, experience, approximate session length, five diagnostic questions, and a saved recommended plan. Skipping uses the authoritative safe-default action. Neither completing nor skipping personalization awards XP, completes lessons, or unlocks Portfolio Lab.

Existing learners retain app access when their profile is missing or incomplete but they have learning history, awards, an entitlement, or a portfolio. Learn offers optional, dismissible personalization. Settings edits the same profile and offers a separate diagnostic retake after personalization has been completed.

The `dailyGoalMinutes` column remains in storage; these screens describe it as preferred session length. The deterministic recommendation engine supplies Learn and the result page. These surfaces do not read legacy `recommendedStart`. The ordinary curriculum remains visible.

Initial personalization and skip retain their conditional upserts. Edits preserve diagnostic evidence; retakes preserve the original personalization completion marker. Actions authenticate ownership, validate inputs server-side, and evaluate answer IDs on the server.

See [Phase 6A.3A](personalization-phase-6a3a.md) for the additive migration and domain invariants, and [Phase 6A.3B](personalization-phase-6a3b.md) for UI integration, validation, screenshots, and deferred lesson adaptation.
