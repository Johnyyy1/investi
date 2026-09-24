import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { lessonAward, lessonProgress, portfolio, progressionUnlock, user } from "../src/db/schema";
import { lessonSteps } from "../src/features/progress/transition";
import { completeLesson } from "../src/features/progress/repository";
import { loadPortfolioLabUnlock, requirePortfolioLabUnlock } from "../src/features/progression/repository";
import { progressionUnlocks } from "../src/features/progression/unlocks";
import { loadPracticeCapitalSummary } from "../src/features/rewards/repository";
import { loadPortfolioView } from "../src/features/portfolio/service";
import { executeTrade } from "../src/features/portfolio/repository";

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname), "Requires a local test database.");
const sql = postgres(databaseUrl, { prepare: false });
const ids: string[] = [];
async function owner() {
  const id = `progression_qa_${randomUUID()}`;
  ids.push(id);
  await db.insert(user).values({ id, email: `${id}@example.com`, name: "Progression QA", createdAt: new Date(), updatedAt: new Date() });
  return id;
}
async function finalCursor(userId: string, lessonId: string) {
  await db.insert(lessonProgress).values({ userId, lessonId, status: "in_progress", lastPosition: lessonSteps(lessonId).length - 1, updatedAt: new Date() });
}

try {
  const learner = await owner();
  assert.equal((await loadPortfolioLabUnlock(learner)).unlocked, false);
  await assert.rejects(() => requirePortfolioLabUnlock(learner));
  const required = progressionUnlocks.PORTFOLIO_LAB.prerequisiteLessonIds;
  for (const lessonId of required.slice(0, -1)) {
    await finalCursor(learner, lessonId);
    assert.equal((await completeLesson(learner, lessonId)).xpAwarded, 60);
  }
  assert.equal((await loadPortfolioLabUnlock(learner)).unlocked, false);
  await finalCursor(learner, required.at(-1)!);
  await finalCursor(learner, "returns-what-is-a-return");
  const results = await Promise.all([
    completeLesson(learner, required.at(-1)!),
    completeLesson(learner, "returns-what-is-a-return"),
  ]);
  assert.equal(results.filter((result) => result.portfolioLabUnlocked).length, 1, "concurrent threshold crossings grant once");
  assert.equal(results.reduce((sum, result) => sum + result.unlockCapitalAwardedMinor, 0n), 500_000n);
  assert.equal((await completeLesson(learner, required.at(-1)!)).xpAwarded, 0, "retry awards no XP");
  assert.equal((await loadPortfolioLabUnlock(learner)).newlyUnlocked, false, "reload does not grant again");
  const [awardRows, unlockRows] = await Promise.all([
    db.select().from(lessonAward).where(eq(lessonAward.userId, learner)),
    db.select().from(progressionUnlock).where(eq(progressionUnlock.userId, learner)),
  ]);
  assert.equal(awardRows.reduce((sum, row) => sum + row.xp, 0), 480);
  assert.equal(unlockRows.length, 1);
  assert.equal(unlockRows[0].practiceCapitalMinor, 500_000n);
  assert.ok(awardRows.every((row) => row.practiceCapitalMinor === 0n && row.rewardPolicyVersion === 2), "new completions use XP-only policy v2");
  assert.equal((await loadPracticeCapitalSummary(learner)).earnedPracticeCapitalMinor, 500_000n);
  const view = await loadPortfolioView(learner);
  assert.equal(view.earnedPracticeCapitalMinor, "500000");
  assert.equal(view.availableCashMinor, "500000");
  assert.equal(view.investmentGainLossMinor, "0", "learning grants are contributions, not return");

  const legacy = await owner();
  await db.insert(lessonAward).values({ userId: legacy, lessonId: required[0], xp: 60, practiceCapitalMinor: 200_000n, rewardPolicyVersion: 1, learningDate: "2026-09-22", timeZone: "UTC", awardedAt: new Date() });
  await db.insert(portfolio).values({ id: randomUUID(), userId: legacy, openedAt: new Date(), openingCapitalMinor: 200_000n });
  await executeTrade(legacy, { instrumentId: "US-XNAS:AAPL", quantity: "0.1", side: "BUY", clientIdempotencyKey: randomUUID() });
  const original = await db.select().from(portfolio).where(eq(portfolio.userId, legacy));
  const originalView = await loadPortfolioView(legacy);
  assert.equal((await loadPortfolioLabUnlock(legacy)).unlocked, true, "existing portfolio retains access");
  assert.equal((await loadPortfolioLabUnlock(legacy)).capitalAwardedMinor, 0n);
  assert.deepEqual(await db.select().from(portfolio).where(eq(portfolio.userId, legacy)), original, "legacy portfolio remains untouched");
  assert.equal((await loadPracticeCapitalSummary(legacy)).earnedPracticeCapitalMinor, 200_000n, "grandfathering adds no capital");
  assert.equal((await loadPortfolioView(legacy)).holdings[0].quantity, originalView.holdings[0].quantity, "grandfathering preserves holdings and trades");
  assert.equal((await db.select().from(lessonAward).where(eq(lessonAward.userId, legacy))).length, 1, "grandfathering does not fabricate XP");
  await finalCursor(legacy, required[1]);
  const mixed = await completeLesson(legacy, required[1]);
  assert.equal(mixed.xpAwarded, 60);
  assert.equal(mixed.practiceCapitalAwardedMinor, 0n, "subsequent completion follows v2");
  const mixedRows = await db.select().from(lessonAward).where(eq(lessonAward.userId, legacy));
  assert.equal(mixedRows.find((row) => row.lessonId === required[0])?.practiceCapitalMinor, 200_000n, "v1 receipt remains unchanged");
  assert.equal(mixedRows.find((row) => row.lessonId === required[1])?.rewardPolicyVersion, 2, "new receipt records v2");
  assert.equal((await loadPracticeCapitalSummary(legacy)).earnedPracticeCapitalMinor, 200_000n, "mixed v1/v2 capital preserves only historical amount");

  const backfill = await owner();
  await db.insert(lessonAward).values({ userId: backfill, lessonId: required[1], xp: 60, practiceCapitalMinor: 200_000n, rewardPolicyVersion: 1, learningDate: "2026-09-22", timeZone: "UTC", awardedAt: new Date() });
  await db.insert(portfolio).values({ id: randomUUID(), userId: backfill, openedAt: new Date(), openingCapitalMinor: 200_000n });
  await executeTrade(backfill, { instrumentId: "US-XNAS:AAPL", quantity: "0.1", side: "BUY", clientIdempotencyKey: randomUUID() });
  const beforeBackfill = await loadPortfolioView(backfill);
  const migration = await readFile(new URL("../drizzle/0007_complex_deadpool.sql", import.meta.url), "utf8");
  const insert = migration.slice(migration.indexOf('INSERT INTO "progression_unlock"'));
  await sql.unsafe(insert);
  await sql.unsafe(insert);
  const migrated = await db.select().from(progressionUnlock).where(and(eq(progressionUnlock.userId, backfill), eq(progressionUnlock.unlockId, "PORTFOLIO_LAB")));
  assert.equal(migrated.length, 1, "backfill rerun is idempotent");
  assert.equal(migrated[0].reason, "existing_portfolio");
  assert.equal(migrated[0].practiceCapitalMinor, 0n);
  const afterBackfill = await loadPortfolioView(backfill);
  assert.equal(afterBackfill.holdings[0].quantity, beforeBackfill.holdings[0].quantity, "migration backfill preserves holdings and trades");
  assert.equal(afterBackfill.earnedPracticeCapitalMinor, beforeBackfill.earnedPracticeCapitalMinor, "grandfathering contributes no capital");
  console.log("PASS: XP, concurrent unlock, one-time capital, grandfathering, accounting, and migration rerun.");
} finally {
  await db.delete(user).where(eq(user.id, ids[0] ?? ""));
  for (const id of ids.slice(1)) await db.delete(user).where(eq(user.id, id));
  await sql.end();
  const client = (globalThis as unknown as { client?: { end: () => Promise<void> } }).client;
  if (client) await client.end();
}
