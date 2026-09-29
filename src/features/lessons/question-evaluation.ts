import type { LessonBlock } from "./types";

export type QuestionBlock = Extract<LessonBlock, { type: "multipleChoiceQuestion" | "numericQuestion" | "multiNumericQuestion" }>;
export function isQuestion(block: LessonBlock): block is QuestionBlock {
  return block.type === "multipleChoiceQuestion" || block.type === "numericQuestion" || block.type === "multiNumericQuestion";
}

/** Normalize the Czech decimal separator at the answer-input boundary. */
export function parseNumericAnswer(value: string) {
  return value.trim() === "" ? Number.NaN : Number(value.replace(",", "."));
}

/** Same authored answers and tolerances as the article renderer; blanks never become zero. */
export function evaluateQuestion(block: QuestionBlock, answers: Record<string, string>) {
  if (block.type === "multipleChoiceQuestion") {
    if (!block.options.some((option) => option.id === answers.answer)) return undefined;
    return answers.answer === block.correctOptionId;
  }
  const fields = block.type === "multiNumericQuestion" ? block.answers : [{ id: "answer", answer: block.answer, tolerance: block.tolerance }];
  if (fields.some((field) => !answers[field.id]?.trim() || !Number.isFinite(parseNumericAnswer(answers[field.id])))) return undefined;
  return fields.every((field) => Math.abs(parseNumericAnswer(answers[field.id]) - field.answer) <= field.tolerance);
}
