# Quantlearn

Quantlearn is an editorial, data-led learning product for quantitative finance.

## Foundation

- **App Router** separates public authentication routes from authenticated product routes.
- **Better Auth** owns identity, sessions, and credentials; the application layout is the single access boundary.
- **Drizzle + PostgreSQL** own publishable module and lesson records plus per-user lesson progress.
- **`features/learning`** defines a temporary product-facing module registry. **`features/progress`** owns validated persistence contracts. Future modules add a catalog entry and lesson records without changing the shell or auth layer.

## Local setup

1. Copy `.env.example` to `.env.local` and set a real `BETTER_AUTH_SECRET`.
2. Start PostgreSQL and update `DATABASE_URL`.
3. Generate and apply the migration:

   ```bash
   npm run db:generate
   npm run db:migrate
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
