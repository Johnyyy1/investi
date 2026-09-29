import { diagnosticQuestions, FOUNDATIONS_DIAGNOSTIC_V1, type DiagnosticSubmission } from "./diagnostic";

export function diagnosticWithCorrectCount(count: number): DiagnosticSubmission {
  return { version: FOUNDATIONS_DIAGNOSTIC_V1, answers: Object.fromEntries(diagnosticQuestions.map((question, index) => [question.id, index < count ? question.correctAnswer : question.options.find((option) => option.id !== question.correctAnswer)!.id])) as DiagnosticSubmission["answers"] };
}
