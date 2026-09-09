import "server-only";
import { validTimeZone } from "@/features/gamification/domain";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { learningProfile } from "@/db/schema";
import { draftPayloadSchema, quickStartSchema, preferencesSchema, recommendLearningPath } from "./domain";

export async function getLearningProfile(userId: string) {
  return db.query.learningProfile.findFirst({ where: eq(learningProfile.userId, userId) });
}
export async function saveOnboardingDraft(userId: string, input: unknown) {
  const { answers, step } = draftPayloadSchema.parse(input);
  const values = { ...answers, onboardingStep: step, updatedAt: new Date() };
  // A stale onboarding tab must never overwrite completed preferences.
  await db.insert(learningProfile).values({ userId, ...values }).onConflictDoUpdate({
    target: learningProfile.userId, set: values, setWhere: isNull(learningProfile.onboardingCompletedAt),
  });
}
export async function completeOnboarding(userId: string, input: unknown) {
  const answers = preferencesSchema.parse(input);
  const values = { ...answers, recommendedStart: recommendLearningPath(answers).recommendedModule.slug, onboardingStep: 6, updatedAt: new Date() };
  await db.insert(learningProfile).values({ userId, ...values, onboardingCompletedAt: new Date() }).onConflictDoUpdate({
    target: learningProfile.userId, set: { ...values, onboardingCompletedAt: sql`coalesce(${learningProfile.onboardingCompletedAt}, now())` },
    setWhere: isNull(learningProfile.onboardingCompletedAt),
  });
}
export async function updatePreferences(userId: string, input: unknown) {
  const answers = preferencesSchema.parse(input);
  const rows = await db.update(learningProfile).set({ ...answers, recommendedStart: recommendLearningPath(answers).recommendedModule.slug, updatedAt: new Date() })
    .where(and(eq(learningProfile.userId, userId), sql`${learningProfile.onboardingCompletedAt} is not null`)).returning({ userId: learningProfile.userId });
  if (!rows.length) throw new Error("Complete onboarding first");
}

/** One useful answer; keep legacy answers and the original completion marker intact. */
export async function quickStart(userId: string, input: unknown) {
  const { experienceLevel, timeZone: zone } = quickStartSchema.parse(input);
  const timeZone = validTimeZone(zone);
  const recommendedStart = recommendLearningPath({ experienceLevel, goals: [], interests: [] }).recommendedModule.slug;
  await db.insert(learningProfile).values({ userId, experienceLevel, recommendedStart, timeZone, dailyGoalMinutes: 10, onboardingStep: 6, onboardingCompletedAt: new Date(), updatedAt: new Date() }).onConflictDoUpdate({
    target: learningProfile.userId,
    set: { experienceLevel, recommendedStart, timeZone: sql`coalesce(${learningProfile.timeZone}, ${timeZone})`, dailyGoalMinutes: sql`coalesce(${learningProfile.dailyGoalMinutes}, 10)`, onboardingStep: 6, onboardingCompletedAt: new Date(), updatedAt: new Date() },
    setWhere: isNull(learningProfile.onboardingCompletedAt),
  });
}
