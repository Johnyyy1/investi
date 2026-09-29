import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import postgres from "postgres";

// No dotenv import: fail closed BEFORE importing any application/database modules.
const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "Supply an explicit disposable local DATABASE_URL.");
const url = new URL(databaseUrl);
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Loopback PostgreSQL only.");
assert.equal(url.pathname, "/investi_6a3a_qa", "Use the dedicated disposable database.");
assert.equal(process.env.PERSONALIZATION_QA_DISPOSABLE, "1", "Explicit disposable QA opt-in required.");
assert.equal(process.env.MARKET_DATA_PROVIDER, "deterministic");
assert.equal(process.env.FX_DATA_PROVIDER, "deterministic");
// Pin to the open-session fixture, never to wall-clock market time.
process.env.DETERMINISTIC_MARKET_NOW = "2026-01-16T20:50:00.000Z";
const sql = postgres(databaseUrl, { prepare: false, onnotice: () => {} });
const temp = await mkdtemp(join(tmpdir(), "investi-profile-migrations-"));
try {
  const [{ count }] = await sql`select count(*)::int as count from information_schema.tables where table_schema = 'public'`;
  assert.equal(count, 0, "Migration compatibility test requires a fresh empty disposable database.");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
  const beforeEntries = journal.entries.filter((entry: { idx: number }) => entry.idx < 9);
  await mkdir(join(temp, "meta"));
  await writeFile(join(temp, "meta/_journal.json"), JSON.stringify({ ...journal, entries: beforeEntries }));
  for (const entry of beforeEntries) await copyFile(`drizzle/${entry.tag}.sql`, join(temp, `${entry.tag}.sql`));
  await migrate(drizzle(sql), { migrationsFolder: temp });
  execFileSync("npm", ["run", "db:seed"], { stdio: "pipe", env: process.env });
  for (const id of ["profile-legacy", "profile-history", "profile-fresh", "profile-skipped", "profile-draft", "profile-portfolio-only"]) {
    await sql`insert into "user" (id, name, email, created_at, updated_at) values (${id}, 'QA', ${`${id}@example.com`}, now(), now())`;
  }
  await sql`insert into learning_profile (user_id, experience_level, goals, interests, daily_goal_minutes, time_zone, recommended_start, onboarding_completed_at) values ('profile-legacy', 'ADVANCED', '{MARKETS,QUANT,COMPANIES}', '{MARKETS,STOCKS}', 15, 'Europe/Prague', 'returns', now())`;
  await sql`insert into learning_profile (user_id, experience_level, goals, interests, daily_goal_minutes) values ('profile-draft', 'INVESTOR', '{COMPANIES}', '{STOCKS}', 20)`;
  await sql`insert into lesson_progress (user_id, lesson_id, status, last_position, updated_at) values ('profile-history', 'foundations-why-invest', 'in_progress', 1, now())`;
  const [legacyBefore] = await sql`select * from learning_profile where user_id = 'profile-legacy'`;
  const progressBefore = await sql`select * from lesson_progress order by user_id, lesson_id`;
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  execFileSync("npm", ["run", "db:seed"], { stdio: "pipe", env: process.env });
  const [legacyAfter] = await sql`select * from learning_profile where user_id = 'profile-legacy'`;
  assert.deepEqual(legacyAfter, { ...legacyBefore, diagnostic_result: null, personalized_onboarding_completed_at: null });
  assert.deepEqual(await sql`select * from lesson_progress order by user_id, lesson_id`, progressBefore);
  const { completePersonalization, updatePersonalizedPreferences, skipPersonalization, retakeDiagnostic } = await import("../src/features/personalization/repository");
  const { getLearningProfile, hasLearningHistory, updatePreferences, quickStart } = await import("../src/features/onboarding/repository");
  const { readLearnerProfile, defaultPreferences, requiresInitialOnboarding } = await import("../src/features/personalization/profile");
  const { diagnosticWithCorrectCount } = await import("../src/features/personalization/test-fixtures");
  const { recommendLearning } = await import("../src/features/personalization/recommendation");
  assert.equal(requiresInitialOnboarding(await getLearningProfile("profile-history"), await hasLearningHistory("profile-history")), false);
  assert.equal(requiresInitialOnboarding(await getLearningProfile("profile-fresh"), await hasLearningHistory("profile-fresh")), true);
  assert.equal(readLearnerProfile(await getLearningProfile("profile-legacy")).preferredSessionMinutes, 20);
  const submission = { preferences: { ...defaultPreferences, primaryGoal: "LONG_TERM_ETF", interests: ["ETFS", "DATA"] }, diagnostic: diagnosticWithCorrectCount(5) };
  await Promise.all([completePersonalization("profile-fresh", submission), completePersonalization("profile-fresh", submission)]);
  const fresh = await getLearningProfile("profile-fresh");
  assert.equal(fresh?.diagnosticResult?.correctCount, 5);
  assert.ok(fresh?.personalizedOnboardingCompletedAt);
  assert.equal(recommendLearning({ profile: readLearnerProfile(fresh) }).nextLessonId, "foundations-why-invest");
  assert.equal(recommendLearning({ profile: readLearnerProfile(fresh) }).scaffoldLevel, "compact");
  for (const table of ["lesson_award", "lesson_progress", "progression_unlock", "portfolio"]) {
    assert.equal((await sql.unsafe(`select * from ${table} where user_id = $1`, ["profile-fresh"])).length, 0, "diagnostic confers no progress, XP, capital, or access");
  }
  await assert.rejects(() => completePersonalization("profile-fresh", { ...submission, diagnostic: { ...submission.diagnostic, correct: true } }));
  await assert.rejects(() => updatePersonalizedPreferences("profile-fresh", { ...submission.preferences, primaryGoal: "RICH" }));
  await assert.rejects(() => updatePersonalizedPreferences("profile-fresh", { ...submission.preferences, userId: "profile-legacy" }));
  await completePersonalization("profile-fresh", { ...submission, diagnostic: diagnosticWithCorrectCount(0) });
  assert.deepEqual(await getLearningProfile("profile-fresh"), fresh, "stale completion is a no-op");
  await skipPersonalization("profile-fresh", {});
  assert.deepEqual(await getLearningProfile("profile-fresh"), fresh, "stale skip is a no-op");
  await retakeDiagnostic("profile-fresh", diagnosticWithCorrectCount(1));
  const retaken = await getLearningProfile("profile-fresh");
  assert.equal(retaken?.diagnosticResult?.correctCount, 1);
  assert.deepEqual(retaken?.personalizedOnboardingCompletedAt, fresh?.personalizedOnboardingCompletedAt);
  assert.equal(recommendLearning({ profile: readLearnerProfile(retaken) }).scaffoldLevel, "guided");
  await skipPersonalization("profile-skipped", {});
  await skipPersonalization("profile-draft", {});
  for (const id of ["profile-skipped", "profile-draft"]) {
    assert.deepEqual(readLearnerProfile(await getLearningProfile(id)), { ...defaultPreferences, personalized: false, diagnostic: null });
    assert.equal(requiresInitialOnboarding(await getLearningProfile(id), false), false);
  }
  await assert.rejects(() => retakeDiagnostic("profile-skipped", diagnosticWithCorrectCount(5)), "a retake requires completed personalization");
  await updatePreferences("profile-history", { experienceLevel: "BASIC", goals: [], interests: ["STOCKS"], dailyGoalMinutes: 10 });
  assert.ok((await getLearningProfile("profile-history"))?.onboardingCompletedAt, "old settings can create a missing profile without blocking existing progress");

  // Real existing completion receipts, entitlement, capital and a trade survive every profile mutation.
  const { completeLesson } = await import("../src/features/progress/repository");
  const { lessonSteps } = await import("../src/features/progress/transition");
  const { foundationsLessons } = await import("../src/features/lessons/foundations/manifest");
  const { executeTrade } = await import("../src/features/portfolio/repository");
  for (const lesson of foundationsLessons.filter((lesson) => lesson.status === "available")) {
    await sql`insert into lesson_progress (user_id, lesson_id, status, last_position, updated_at) values ('profile-legacy', ${lesson.id}, 'in_progress', ${lessonSteps(lesson.id).length - 1}, now())`;
    assert.equal((await completeLesson("profile-legacy", lesson.id)).xpAwarded, 60);
  }
  await executeTrade("profile-legacy", { instrumentId: "US-XNAS:AAPL", quantity: "0.1", side: "BUY", clientIdempotencyKey: "00000000-0000-4000-8000-000000000001" });
  async function state() {
    return {
      progress: await sql`select * from lesson_progress where user_id = 'profile-legacy' order by lesson_id`,
      awards: await sql`select * from lesson_award where user_id = 'profile-legacy' order by lesson_id`,
      unlock: await sql`select * from progression_unlock where user_id = 'profile-legacy' order by unlock_id`,
      portfolio: await sql`select * from portfolio where user_id = 'profile-legacy' order by id`,
      trades: await sql`select t.* from portfolio_trade t join portfolio p on p.id = t.portfolio_id where p.user_id = 'profile-legacy' order by t.id`,
    };
  }
  const before = await state();
  assert.equal(before.awards.reduce((sum, award) => sum + award.xp, 0), 420);
  assert.equal(String(before.unlock[0].practice_capital_minor), "500000");
  assert.equal(before.trades.length, 1);
  await completePersonalization("profile-legacy", submission);
  const personalized = await getLearningProfile("profile-legacy");
  assert.equal(personalized?.onboardingCompletedAt?.getTime(), new Date(legacyBefore.onboarding_completed_at).getTime());
  assert.equal((await sql`select onboarding_completed_at from learning_profile where user_id = 'profile-legacy'`)[0].onboarding_completed_at, legacyBefore.onboarding_completed_at);
  const firstRecommendation = recommendLearning({ profile: readLearnerProfile(personalized), progress: before.progress.map((row) => ({ lessonId: row.lesson_id, status: row.status })) });
  assert.equal(firstRecommendation.reasonCode, "RETURNS_FOR_ETF_PATH");
  await updatePersonalizedPreferences("profile-legacy", { ...defaultPreferences, primaryGoal: "QUANT", interests: ["DATA", "BACKTESTING"], preferredSessionMinutes: 30 });
  const edited = await getLearningProfile("profile-legacy");
  assert.deepEqual(edited?.diagnosticResult, personalized?.diagnosticResult);
  assert.equal(recommendLearning({ profile: readLearnerProfile(edited), progress: before.progress.map((row) => ({ lessonId: row.lesson_id, status: row.status })) }).reasonCode, "RETURNS_FOR_QUANT_PATH");
  await retakeDiagnostic("profile-legacy", diagnosticWithCorrectCount(0));
  await quickStart("profile-legacy", { experienceLevel: "BEGINNER", timeZone: "UTC" });
  await skipPersonalization("profile-legacy", {});
  assert.deepEqual(await state(), before, "preferences/diagnostic must not alter completion, XP, entitlement, capital, portfolio or trades");
  assert.equal((await completeLesson("profile-legacy", "foundations-why-invest")).xpAwarded, 0);
  await sql`insert into portfolio (id, user_id, opened_at, opening_capital_minor) values ('portfolio-only', 'profile-portfolio-only', now(), 0)`;
  assert.equal(requiresInitialOnboarding(await getLearningProfile("profile-portfolio-only"), await hasLearningHistory("profile-portfolio-only")), false);
  await sql`delete from "user" where id = 'profile-fresh'`;
  assert.equal(await getLearningProfile("profile-fresh"), undefined, "profile cascades with account deletion");
  console.log("PASS: fresh + upgrade migrations, migration rerun, canonical seed, legacy/null/draft profiles, strict validation, idempotent completion, retake, skip, recommendation recomputation, cascade, and unchanged 420 XP / 5,000 Kč / trades.");
} finally {
  await sql.end();
  const client = (globalThis as unknown as { client?: { end: () => Promise<void> } }).client;
  if (client) await client.end();
  await rm(temp, { recursive: true, force: true });
}
