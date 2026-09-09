"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { completeLesson, getModuleProgress, markLessonInProgress, saveLessonProgress } from "./repository";
import { RETURNS_MODULE_ID, returnsLessons } from "@/features/lessons/returns/manifest";
import { compoundingSteps } from "@/features/lessons/returns/compounding-flow";

const lessonIdSchema = z.string().min(1);

export async function markLessonStartedAction(lessonId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Your session has ended. Sign in again to save progress." };
    await markLessonInProgress(user.id, lessonIdSchema.parse(lessonId));
    revalidatePath("/learn/returns");
    return { ok: true };
  } catch {
    return { ok: false, message: "Progress could not be saved. Your work is still available on this page." };
  }
}

export async function completeLessonAction(lessonId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Your session has ended. Sign in again to complete this lesson." };
    await completeLesson(user.id, lessonIdSchema.parse(lessonId));
    const completedLessons = await getModuleProgress(user.id, RETURNS_MODULE_ID);
    revalidatePath("/dashboard");
    revalidatePath("/learn");
    revalidatePath("/learn/returns");
    revalidatePath("/learn/returns/what-is-a-return");
    revalidatePath("/learn/returns/simple-returns");
    revalidatePath("/learn/returns/compounding-and-cumulative-returns");
    return { ok: true, completedLessons };
  } catch {
    return { ok: false, message: "Completion could not be saved. Please try again." };
  }
}

/** Uses the existing progress row; this is a cursor, not a second progress store. */
export async function saveCompoundingPositionAction(position: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Your session has ended. Sign in again to save progress." };
    const lastPosition = z.number().int().min(0).max(compoundingSteps.length - 1).parse(position);
    await saveLessonProgress(user.id, { lessonId: returnsLessons[2].id, status: "in_progress", lastPosition });
    revalidatePath("/learn/returns");
    return { ok: true };
  } catch {
    return { ok: false, message: "Your place could not be saved. Please try again." };
  }
}
