import { z } from "zod";

export const progressStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

export const saveLessonProgressSchema = z.object({
  lessonId: z.string().min(1),
  status: progressStatusSchema,
  lastPosition: z.number().int().nonnegative(),
});

export type SaveLessonProgress = z.infer<typeof saveLessonProgressSchema>;
