import "server-only";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loadGamification } from "@/features/gamification/repository";
import { getLearningProfile } from "@/features/onboarding/repository";
import { preferencesSchema, recommendLearningPath } from "@/features/onboarding/domain";

import { getLearnerSummary } from "./learner-summary";

export async function loadLearner() {
  const user = await getCurrentUser();
  const [rows, profile, gamification] = user ? await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id)),
    getLearningProfile(user.id),
    loadGamification(user.id),
  ]) : [[], undefined, undefined];
  const states = rows.filter((row) => row !== undefined);
  // Recompute from stored answers: old recommendedStart values never force repeat onboarding.
  const preferences = preferencesSchema.safeParse(profile ? { experienceLevel: profile.experienceLevel, goals: profile.goals, interests: profile.interests, dailyGoalMinutes: profile.dailyGoalMinutes } : undefined);
  const recommendedStart = preferences.success ? recommendLearningPath(preferences.data).recommendedModule.slug : profile?.recommendedStart ?? "investing-foundations";
  return { user, profile, gamification, states, ...getLearnerSummary(states, recommendedStart) };
}
