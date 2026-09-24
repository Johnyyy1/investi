import { availableLessons } from "@/features/learning/catalog";
import { getAuthoredLesson } from "@/features/lessons/registry";
import { getGuidedSteps } from "@/features/lessons/returns/guided-flow";
import { evaluateQuestion, isQuestion } from "@/features/lessons/question-evaluation";

export function lessonSteps(lessonId: string) {
  const definition = availableLessons.find((lesson) => lesson.id === lessonId);
  if (!definition) throw new Error("Lesson is unavailable.");
  return getGuidedSteps(getAuthoredLesson(definition.moduleSlug, definition.slug)!);
}
/** A checked, correct answer earns the right to continue. Mistakes remain ephemeral and retryable. */
export function validateMove(lessonId: string, current: number, next: number, answers: Record<string, string> = {}) {
  const steps = lessonSteps(lessonId);
  if (!Number.isInteger(next) || next < 0 || next >= steps.length || next > current + 1) throw new Error("Continue one step at a time.");
  if (next > current) {
    const question = steps[current].blocks.find(isQuestion);
    if (question && evaluateQuestion(question, answers) !== true) throw new Error("Answer the question correctly before continuing.");
  }
}
export function validateCompletion(lessonId: string, progress?: { status: string; lastPosition: number }) {
  if (!progress || (progress.status !== "completed" && progress.lastPosition !== lessonSteps(lessonId).length - 1)) throw new Error("Finish the lesson before completing it.");
}
