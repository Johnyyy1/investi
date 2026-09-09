# investi

Learn investing, step by step. The current product teaches Investing Foundations and Returns & Compounding through seven guided, interactive lessons with persisted progress and personalized onboarding.

## Foundation

- **App Router** separates public authentication routes from authenticated product routes.
- **Better Auth** owns identity, sessions, and credentials; the application layout is the single access boundary.
- **Drizzle + PostgreSQL** own publishable module and lesson records plus per-user lesson progress.
- **`features/lessons`** is a typed repository-authored lesson engine. It supports ordered editorial blocks, interactive figures, and exercises without introducing a generic page builder.
- **`features/progress`** owns validated persistence contracts. Future modules add a catalog entry and authored lesson records without changing the shell or auth layer.

## Local setup

1. Copy `.env.example` to `.env.local` and set a real `BETTER_AUTH_SECRET`.
2. Start PostgreSQL and update `DATABASE_URL`.
3. Generate and apply the migration:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`db:seed` is idempotent and publishes the first four Foundations lessons and first three Returns lessons, retaining the remaining lesson entries as upcoming. Apply the included migrations before seeding.


All production routes share the validated `ql-*` learning theme and Nunito Sans. Home remains at `/dashboard`; `/learn` presents the curriculum and `/progress` shows completed and active learning. Investing Foundations comes first with four available and four upcoming lessons. Returns & Compounding has three available and three upcoming lessons. Home preserves active learning continuity; Progress counts only the seven available lessons.

Local browser validation (requires the running app and local PostgreSQL):

```bash
BROWSER_CHANNEL=chrome node scripts/validate-foundations.mjs
BROWSER_CHANNEL=chrome node scripts/validate-onboarding.mjs
BROWSER_CHANNEL=chrome node scripts/validate-product-migration.mjs
BROWSER_CHANNEL=chrome node scripts/validate-returns-flow.mjs
BROWSER_CHANNEL=chrome node scripts/validate-design-system.mjs
```

Omit `BROWSER_CHANNEL` if Playwright Chromium is installed. Product tests create and remove only their own disposable accounts. Screenshots default to `/tmp/investi-product-qa`. See [the Foundations implementation report](docs/investing-foundations.md) for scope and validation.
