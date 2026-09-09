import "server-only";
import { getCurrentUser } from "@/lib/session";
import { getLessonProgress } from "@/features/progress/repository";
import { getLearningProfile } from "@/features/onboarding/repository";
import { preferencesSchema, recommendLearningPath } from "@/features/onboarding/domain";
import { availableLessons } from "./catalog";
import { getLearnerSummary } from "./learner-summary";

export async function loadLearner() {
  const user = await getCurrentUser();
  const [rows, profile] = user ? await Promise.all([
    Promise.all(availableLessons.map((lesson) => getLessonProgress(user.id, lesson.id))),
    getLearningProfile(user.id),
  ]) : [[], undefined];
  const states = rows.filter((row) => row !== undefined);
  // Recompute from stored answers: old recommendedStart values never force repeat onboarding.
  const preferences = preferencesSchema.safeParse(profile ? { experienceLevel: profile.experienceLevel, goals: profile.goals, interests: profile.interests, dailyGoalMinutes: profile.dailyGoalMinutes } : undefined);
  const recommendedStart = preferences.success ? recommendLearningPath(preferences.data).recommendedModule.slug : "investing-foundations";
  return { user, profile, states, ...getLearnerSummary(states, recommendedStart) };
}
