import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { learningProfile } from "@/db/schema";
import { draftPayloadSchema, preferencesSchema, recommendLearningPath } from "./domain";

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
