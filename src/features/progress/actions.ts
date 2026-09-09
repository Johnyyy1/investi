"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { completeLesson, getModuleProgress, markLessonInProgress, saveLessonProgress } from "./repository";
import { availableLessons } from "@/features/learning/catalog";
import { getStepDefinitions } from "@/features/lessons/returns/guided-flow";

const lessonIdSchema = z.string().refine((id) => availableLessons.some((lesson) => lesson.id === id && lesson.status === "available"));

export async function markLessonStartedAction(lessonId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Your session has ended. Sign in again to save progress." };
    await markLessonInProgress(user.id, lessonIdSchema.parse(lessonId));
    revalidatePath("/learn", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/progress");
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
    const completedLessons = await getModuleProgress(user.id, availableLessons.find((lesson) => lesson.id === lessonId)!.moduleId);
    revalidatePath("/learn", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/progress");
    return { ok: true, completedLessons };
  } catch {
    return { ok: false, message: "Completion could not be saved. Please try again." };
  }
}

/** Uses the existing progress row; this is a cursor, not a second progress store. */
export async function saveLessonPositionAction(lessonId: string, position: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Your session has ended. Sign in again to save progress." };
    const id = lessonIdSchema.parse(lessonId);
    const lastPosition = z.number().int().min(0).max(getStepDefinitions(id).length - 1).parse(position);
    await saveLessonProgress(user.id, { lessonId: id, status: "in_progress", lastPosition });
    revalidatePath("/learn", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/progress");
    return { ok: true };
  } catch {
    return { ok: false, message: "Your place could not be saved. Please try again." };
  }
}
