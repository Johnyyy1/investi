import { returnsLessons } from "../lessons/returns/manifest";
import { getStepDefinitions } from "../lessons/returns/guided-flow";

export type LearnerState = { lessonId: string; status: "not_started" | "in_progress" | "completed"; lastPosition: number; updatedAt: Date; completedAt: Date | null };
export function getLearnerSummary(states: LearnerState[]) {
  const lessons = returnsLessons.filter((lesson) => lesson.status === "available");
  const completed = lessons.filter((lesson) => states.some((state) => state.lessonId === lesson.id && state.status === "completed"));
  const current = states.filter((state) => state.status === "in_progress" && lessons.some((lesson) => lesson.id === state.lessonId)).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  const next = lessons.find((lesson) => lesson.id === current?.lessonId) ?? lessons.find((lesson) => !completed.includes(lesson)) ?? lessons[lessons.length - 1];
  const state = states.find((state) => state.lessonId === next.id);
  const stepCount = getStepDefinitions(next.id).length;
  return { lessons, completed, next, state, stepCount, position: Math.min(Math.max(state?.lastPosition ?? 0, 0), stepCount - 1), allComplete: completed.length === lessons.length, percentage: Math.round(completed.length / lessons.length * 100), recent: states.filter((state) => state.status === "completed" && lessons.some((lesson) => lesson.id === state.lessonId)).sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)) };
}
