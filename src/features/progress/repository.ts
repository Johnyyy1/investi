import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { learningProfile, lesson, lessonAward, lessonProgress, user } from "@/db/schema";
import { type SaveLessonProgress, saveLessonProgressSchema } from "./schemas";
import { validateCompletion, validateMove } from "./transition";
import { getGamification, learningDate, LESSON_XP } from "@/features/gamification/domain";
import { getLearnerSummary } from "@/features/learning/learner-summary";

export async function saveLessonProgress(userId: string, input: SaveLessonProgress, answers?: Record<string, string>) {
  const progress = saveLessonProgressSchema.parse(input);
  if (progress.status !== "in_progress") throw new Error("Use the completion transaction to complete a lesson.");
  await db.transaction(async (tx) => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const where = and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, progress.lessonId));
    const [current] = await tx.select().from(lessonProgress).where(where);
    if (current?.status === "completed") return;
    validateMove(progress.lessonId, current?.lastPosition ?? 0, progress.lastPosition, answers);
    await tx.insert(lessonProgress).values({ userId, ...progress, updatedAt: new Date() }).onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: { lastPosition: progress.lastPosition, updatedAt: new Date() },
    });
  });
}

export async function markLessonInProgress(userId: string, lessonId: string) {
  // Loading or reviewing a lesson must never move an existing cursor or change continuity recency.
  await db.insert(lessonProgress).values({ userId, lessonId, status: "in_progress", lastPosition: 0, updatedAt: new Date() }).onConflictDoNothing();
}

export async function completeLesson(userId: string, lessonId: string) {
  return db.transaction(async (tx) => {
    // Serialize completions for this account, including different lessons completing simultaneously.
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const where = and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId));
    const [current] = await tx.select().from(lessonProgress).where(where);
    validateCompletion(lessonId, current);
    const [profile] = await tx.select().from(learningProfile).where(eq(learningProfile.userId, userId));
    const timeZone = profile?.timeZone ?? "UTC";
    const now = new Date();
    let xpAwarded = 0;
    if (current.status !== "completed") {
      await tx.update(lessonProgress).set({ status: "completed", completedAt: now, updatedAt: now }).where(where);
      const awarded = await tx.insert(lessonAward).values({ userId, lessonId, xp: LESSON_XP, learningDate: learningDate(now, timeZone), timeZone, awardedAt: now }).onConflictDoNothing().returning();
      xpAwarded = awarded[0]?.xp ?? 0;
    }
    const awards = await tx.select().from(lessonAward).where(eq(lessonAward.userId, userId));
    const states = await tx.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
    const summary = getLearnerSummary(states, profile?.recommendedStart ?? "investing-foundations");
    return {
      xpAwarded,
      lessonXp: awards.find((award) => award.lessonId === lessonId)?.xp ?? 0,
      gamification: getGamification(awards, now, timeZone, profile?.dailyGoalMinutes),
      nextHref: summary.allComplete ? "/lab" : `/learn/${summary.next.moduleSlug}/${summary.next.slug}`,
      nextTitle: summary.allComplete ? "Try the Lab" : summary.next.title,
      allComplete: summary.allComplete,
    };
  });
}
export async function getLessonProgress(userId: string, lessonId: string) {
  return db.query.lessonProgress.findFirst({ where: and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)) });
}
export async function getModuleProgress(userId: string, moduleId: string) {
  const [result] = await db.select({ completed: count() }).from(lessonProgress).innerJoin(lesson, eq(lessonProgress.lessonId, lesson.id)).where(and(eq(lessonProgress.userId, userId), eq(lesson.moduleId, moduleId), eq(lesson.isPublished, true), eq(lessonProgress.status, "completed")));
  return Number(result?.completed ?? 0);
}
