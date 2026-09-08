import "server-only";

import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { type SaveLessonProgress, saveLessonProgressSchema } from "./schemas";

export async function saveLessonProgress(userId: string, input: SaveLessonProgress) {
  const progress = saveLessonProgressSchema.parse(input);
  const now = new Date();

  await db.insert(lessonProgress).values({
    userId,
    lessonId: progress.lessonId,
    status: progress.status,
    lastPosition: progress.lastPosition,
    completedAt: progress.status === "completed" ? now : null,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: [lessonProgress.userId, lessonProgress.lessonId],
    set: {
      status: progress.status,
      lastPosition: progress.lastPosition,
      completedAt: progress.status === "completed" ? now : null,
      updatedAt: now,
    },
  });
}

export async function getLessonProgress(userId: string, lessonId: string) {
  return db.query.lessonProgress.findFirst({
    where: (progress, { and, eq }) => and(eq(progress.userId, userId), eq(progress.lessonId, lessonId)),
  });
}
