# investi

Learn investing by doing. The authenticated product is organized around three destinations: **Learn**, **Lab**, and **Progress**. Ten guided lessons are currently available across Investing Foundations and Returns & Compounding, with persisted lesson position, transactional first-completion rewards, and focused interactive exercises.

## Architecture

- **Next.js App Router** separates public authentication/onboarding from authenticated product routes.
- **Better Auth** owns credentials, normal sessions, and isolated anonymous demo sessions.
- **Drizzle + PostgreSQL** own curriculum records, per-user progress, learning profiles, and immutable lesson-award receipts.
- **`features/lessons`** is the typed authored lesson engine shared by Foundations and Returns.
- **`features/progress`** validates step transitions and completes lessons with rewards in one transaction.
- **`features/gamification`** derives XP, local learning days, streak, and daily lesson progress from persisted award receipts.
- **`features/rewards`** owns the server-side Practice Capital policy and exact receipt-derived entitlement read model.
- **`features/lab`** contains pure portfolio/backtest math and an explicitly synthetic educational fixture.

## Local setup and deployment order

1. Copy `.env.example` to `.env.local` and set a real `BETTER_AUTH_SECRET`.
2. Start PostgreSQL and update `DATABASE_URL`.
3. Apply committed migrations before starting the new application code, then seed the curriculum:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

`db:seed` is idempotent. Apply all committed migrations through `0005_sweet_anthem.sql`: completion writes require the Practice Capital fields on `lesson_award`, and Portfolio Lab requires the `portfolio` and `portfolio_trade` tables.

## Docker

Prerequisites: Docker Desktop (or Docker Engine with the Compose plugin). On first use, create an ignored Compose environment file and replace both placeholder secrets with locally generated values:

```bash
cp .env.example .env
```

`BETTER_AUTH_SECRET` must be at least 32 characters. `POSTGRES_PASSWORD` is used only by the Docker PostgreSQL instance. `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` should remain `http://localhost:3000` unless the app is exposed on another host or port. `DATABASE_URL` remains the non-Docker development connection string; Compose supplies its own internal value using the `db` service hostname.

Start the complete development stack:

```bash
docker compose up --build
```

The app is available at <http://localhost:3000>. Compose waits for PostgreSQL to pass its healthcheck, then the app automatically runs the committed Drizzle migrations and idempotent curriculum seed before launching Next.js development mode. To run them manually instead, use:

```bash
docker compose run --rm app npm run db:migrate
docker compose run --rm app npm run db:seed
```

Stop the stack with `docker compose down`. PostgreSQL data remains in the named `postgres_data` volume across stops and rebuilds. To remove containers and the persisted development database deliberately, run `docker compose down --volumes`.

## Verification

With the local app and PostgreSQL running:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:persistence
npm run test:migration
npm run test:product
BROWSER_CHANNEL=chrome node scripts/validate-foundations.mjs
BROWSER_CHANNEL=chrome node scripts/validate-returns-flow.mjs
BROWSER_CHANNEL=chrome node scripts/validate-product-migration.mjs
BROWSER_CHANNEL=chrome node scripts/validate-onboarding.mjs
BROWSER_CHANNEL=chrome node scripts/validate-design-system.mjs
```

Browser suites create and remove only their own local disposable identities. Screenshots are written under `/tmp`, never the repository.

## Demo retention

Anonymous demo sessions expire after 24 hours. Their database identities may remain until cleanup. Preview or apply the bounded cleanup with:

```bash
npm run demo:cleanup
npm run demo:cleanup -- --apply
```

Only users explicitly marked `is_anonymous = true` and older than seven days are eligible; cascading foreign keys remove their sessions, profile, progress, and award receipts.

See [the product reset notes](docs/product-reset.md) for reward, streak, daily-goal, synthetic-data, migration, compatibility, and validation semantics.
