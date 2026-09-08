"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { completeLesson, markLessonInProgress } from "./repository";

const lessonIdSchema = z.string().min(1);

export async function markLessonStartedAction(lessonId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Your session has ended. Sign in again to save progress." };
    await markLessonInProgress(user.id, lessonIdSchema.parse(lessonId));
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
    revalidatePath("/dashboard");
    revalidatePath("/learn");
    revalidatePath("/learn/returns");
    revalidatePath("/learn/returns/what-is-a-return");
    revalidatePath("/learn/returns/simple-returns");
    revalidatePath("/learn/returns/compounding-and-cumulative-returns");
    return { ok: true };
  } catch {
    return { ok: false, message: "Completion could not be saved. Please try again." };
  }
}
