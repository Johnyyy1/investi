import { returnsLessons } from "../lessons/returns/manifest";

type PersistedLessonState = { lessonId: string; status: "not_started" | "in_progress" | "completed" };

export function getReturnsPath(states: PersistedLessonState[]) {
  return returnsLessons.map((lesson) => {
    const status = states.find((state) => state.lessonId === lesson.id)?.status;
    const state = lesson.status !== "available" ? "locked" : status === "completed" ? "completed" : status === "in_progress" ? "active" : "available";
    return { id: lesson.id, title: lesson.title, minutes: lesson.estimatedMinutes, state } as const;
  });
}
