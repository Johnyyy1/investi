import "server-only";
import { getCurrentUser } from "@/lib/session";
import { getLessonProgress } from "@/features/progress/repository";
import { returnsLessons } from "@/features/lessons/returns/manifest";
import { getLearnerSummary } from "./learner-summary";

export async function loadLearner() {
  const user = await getCurrentUser();
  const rows = user ? await Promise.all(returnsLessons.filter((lesson) => lesson.status === "available").map((lesson) => getLessonProgress(user.id, lesson.id))) : [];
  const states = rows.filter((row) => row !== undefined);
  return { user, states, ...getLearnerSummary(states) };
}
