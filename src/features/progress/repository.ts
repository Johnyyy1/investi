import "server-only";

import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { lesson, lessonProgress } from "@/db/schema";
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
      status: progress.status === "completed" ? "completed" : sql`case when ${lessonProgress.status} = 'completed' then ${lessonProgress.status} else ${progress.status} end`,
      lastPosition: progress.lastPosition,
      completedAt: progress.status === "completed" ? now : sql`case when ${lessonProgress.status} = 'completed' then ${lessonProgress.completedAt} else null end`,
      updatedAt: now,
    },
  });
}

export async function markLessonInProgress(userId: string, lessonId: string) {
  const now = new Date();
  await db.insert(lessonProgress).values({ userId, lessonId, status: "in_progress", lastPosition: 0, completedAt: null, updatedAt: now }).onConflictDoUpdate({
    target: [lessonProgress.userId, lessonProgress.lessonId],
    set: {
      status: sql`case when ${lessonProgress.status} = 'completed' then ${lessonProgress.status} else 'in_progress' end`,
      completedAt: sql`case when ${lessonProgress.status} = 'completed' then ${lessonProgress.completedAt} else null end`,
      updatedAt: now,
    },
  });
}

export async function completeLesson(userId: string, lessonId: string) {
  const now = new Date();
  await db.insert(lessonProgress).values({ userId, lessonId, status: "completed", lastPosition: 0, completedAt: now, updatedAt: now }).onConflictDoUpdate({
    target: [lessonProgress.userId, lessonProgress.lessonId],
    set: { status: "completed", completedAt: sql`coalesce(${lessonProgress.completedAt}, ${now.toISOString()}::timestamptz)`, updatedAt: sql`case when ${lessonProgress.status} = 'completed' then ${lessonProgress.updatedAt} else ${now.toISOString()}::timestamptz end` },
  });
}

export async function getLessonProgress(userId: string, lessonId: string) {
  return db.query.lessonProgress.findFirst({
    where: (progress, { and, eq }) => and(eq(progress.userId, userId), eq(progress.lessonId, lessonId)),
  });
}

export async function getModuleProgress(userId: string, moduleId: string) {
  const [result] = await db.select({ completed: count() }).from(lessonProgress).innerJoin(lesson, eq(lessonProgress.lessonId, lesson.id)).where(and(eq(lessonProgress.userId, userId), eq(lesson.moduleId, moduleId), eq(lesson.isPublished, true), eq(lessonProgress.status, "completed")));
  return Number(result?.completed ?? 0);
}
