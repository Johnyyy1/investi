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
- Recommended start enum (`returns`), draft step, completion timestamp, updated timestamp.
- `20` is the stored representation of the 20+ minute choice.

Existing users have no profile and therefore receive onboarding once. Existing lesson progress is retained. The migration is additive and does not rewrite user or lesson records. It was applied to the local PostgreSQL database during validation; no remote deployment was performed.

Continue saves the answers and next cursor before advancing. Refresh or another authenticated browser resumes the last saved screen. Back and Edit preferences retain the current in-memory answers. Failed saves keep the current screen and answers available for retry. Changes on the current question are durable after a successful Continue; unsubmitted selections may be lost if the page is closed or refreshed. The interface states when answers are saved.

Ready is still a draft until Start learning succeeds. Completion is idempotent. Conditional upserts prevent a stale onboarding tab from overwriting a completed profile, and preference updates retain the original completion date. Simultaneous preference editors use the last successful save.

## Recommendations

`recommendLearningPath` is pure typed domain logic with no model/API call. Experience controls the explanation; selected goals and interests determine up to two future targets in stable curriculum order. Only the implemented Returns module is a navigable start, presented as Returns & Compounding. Beginners receive a clear explanation that Investing Foundations is planned. Future portfolio, quantitative, company-analysis and markets topics have no links or invented lessons.

The available start remains the same for all experience levels until more content ships. Recommendations never change or erase lesson progress. No XP, streak, notification, payment or market-data system was added.

## Validation

Executed successfully:

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

Publish Investing Foundations, then connect the recommendation registry to that available module. The persisted daily-goal value is ready for a separately scoped real daily learning-goal system.
