import "server-only";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loadGamification } from "@/features/gamification/repository";
import { loadPracticeCapitalSummary } from "@/features/rewards/repository";
import { getLearningProfile } from "@/features/onboarding/repository";
import { availableLessons } from "./catalog";

import { readLearnerProfile } from "@/features/personalization/profile";
import { recommendLearning } from "@/features/personalization/recommendation";
import { getLearnerSummary } from "./learner-summary";

export async function loadLearner() {
  const user = await getCurrentUser();
  const [rows, profile, gamification, practiceCapital] = user ? await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id)),
    getLearningProfile(user.id),
    loadGamification(user.id),
    loadPracticeCapitalSummary(user.id),
  ]) : [[], undefined, undefined, { earnedPracticeCapitalMinor: BigInt(0) }];
  const states = rows.filter((row) => row !== undefined);
  const recommendation = recommendLearning({ profile: readLearnerProfile(profile), progress: states });
  return { user, profile, recommendation, gamification, practiceCapital, states, ...getLearnerSummary(states, availableLessons.find((lesson) => lesson.id === recommendation.nextLessonId)?.moduleSlug) };
}
