# Production onboarding and learning preferences

Implemented from `7266e36` using the existing investi theme, tokens, Nunito Sans, LearningButton, AnswerOption (now also supports native checkboxes), progress bar and reduced-motion-aware transitions.

## Routes and auth

- Sign-up sends new accounts to `/onboarding`.
- `/onboarding` is a focused seven-screen funnel outside the application shell: welcome, experience, goals, interests, daily goal, recommendation, ready.
- The application layout sends unauthenticated visitors to sign-in and authenticated learners without a completion timestamp to onboarding.
- Start learning saves completion before navigating to `/dashboard`. Completed users visiting onboarding return to the dashboard. Sign-in keeps the existing dashboard destination; the layout resolves incomplete accounts.
- `/settings` exposes Learning preferences through desktop/mobile Settings navigation and a dashboard link. It edits all four preferences together without replaying welcome. The dashboard displays the saved daily goal.
- Server actions resolve account ownership from the current session; they never accept a client-selected user ID. Each write is validated again in the repository with strict Zod schemas.

## Persistence and rollout

Apply `npm run db:migrate` before deploying the application. Migration `0001_violet_shape.sql` adds one `learning_profile` row per user, with a cascading user foreign key:

- Nullable experience enum, goal and interest enum arrays, nullable daily goal minutes.
- Recommended start enum (`returns`, `investing-foundations`; the latter added by migration 0002), draft step, completion timestamp, updated timestamp.
- `20` is the stored representation of the 20+ minute choice.

Existing users have no profile and therefore receive onboarding once. Existing lesson progress is retained. The migration is additive and does not rewrite user or lesson records. It was applied to the local PostgreSQL database during validation; no remote deployment was performed.

Continue saves the answers and next cursor before advancing. Refresh or another authenticated browser resumes the last saved screen. Back and Edit preferences retain the current in-memory answers. Failed saves keep the current screen and answers available for retry. Changes on the current question are durable after a successful Continue; unsubmitted selections may be lost if the page is closed or refreshed. The interface states when answers are saved.

Ready is still a draft until Start learning succeeds. Completion is idempotent. Conditional upserts prevent a stale onboarding tab from overwriting a completed profile, and preference updates retain the original completion date. Simultaneous preference editors use the last successful save.

## Recommendations

`recommendLearningPath` is pure typed domain logic with no model/API call. Beginners start with Investing Foundations. BASIC learners start there when they select the confidence goal, or ETF interests without quantitative/existing-knowledge goals; other BASIC learners, investors, and advanced learners start with Returns & Compounding. Goals and interests also select up to two future targets in stable order, including Quantitative Investing for quantitative interests. Future targets have no links.

Recommendations are recomputed from stored preferences when loading Home. An older completed profile with `recommendedStart = returns` is not rewritten, and its onboarding completion timestamp is retained. Updated preferences and new onboarding completions persist the current recommendation. Recommendations never change or erase lesson progress.

Home preserves continuity before applying recommendations. See [Investing Foundations](investing-foundations.md) for the priority rule, current validation, and rollout instructions.

## Validation

Original onboarding-slice validation (current curriculum validation is recorded in `investing-foundations.md`):

- `npm run lint`
- `npm run typecheck`
- `npm test` — 115 tests in 16 files, including recommendation, validation, cursor/answer behavior, authenticated ownership, retry and simulated database/session failure coverage.
- `npm run build`
- `BROWSER_CHANNEL=chrome node scripts/validate-onboarding.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-returns-flow.mjs`
- `BROWSER_CHANNEL=chrome node scripts/validate-product-migration.mjs`

Browser scripts use real local Better Auth sessions, server actions and PostgreSQL, create disposable accounts, and remove only their own test accounts. Chrome is used because this machine does not have the Playwright-managed Chromium executable installed. The old lesson/product suites now complete the actual onboarding funnel after signup.

Onboarding coverage includes auth gates, new signup, all selections, forged enum rejection by the server, network failures on drafts/completion/preferences, retry, refresh, back, cross-context resume, recommendations, completion, sign-out/sign-in without replay, preferences after reload, and stale completion after edits. Database failures are injected in unit tests, rather than interrupting the shared local database.

Layout assertions and screenshots cover 320, 375, 390, 768, 1024 and 1440px. They check no horizontal overflow and that content can scroll clear of the sticky CTA. Keyboard checks exercise radio arrow keys and checkbox Space, focus-visible styling and heading focus after transitions. Native labels/fieldsets, semantic buttons, shared accessible color tokens and reduced-motion primitives are retained. Mobile and desktop screenshots were visually inspected. Screen-reader hardware and non-Chromium browsers were not tested.

Screenshots are disposable local QA artifacts under `/tmp/investi-onboarding-qa`; no generated raster assets were added to the repository. Existing vector icons occupy a reusable `data-illustration-slot` for a future onboarding illustration.

## Next slice

Continue Investing Foundations with the separately scoped Bonds & cash lesson. The persisted daily-goal value is ready for a separately scoped real daily learning-goal system.
