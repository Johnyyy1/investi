"use client";

import { useState, type Ref } from "react";
import { AnswerOption } from "@/components/learning/answer-option";
import { FinanceInput } from "@/components/learning/finance-input";
import { LearningButton } from "@/components/learning/learning-button";
import { LessonFeedback } from "@/components/learning/lesson-feedback";
import { evaluateQuestion, type QuestionBlock } from "@/features/lessons/question-evaluation";

export function GuidedQuestion({ block, onContinue, pending, continueButtonRef }: { block: QuestionBlock; onContinue: (answers: Record<string, string>) => void; pending: boolean; continueButtonRef?: Ref<HTMLButtonElement> }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<boolean>();
  const evaluation = evaluateQuestion(block, answers);
  function answer(id: string, value: string) { setAnswers((current) => ({ ...current, [id]: value })); }
  const fields = block.type === "multiNumericQuestion" ? block.answers : block.type === "numericQuestion" ? [{ id: "answer", label: "Your answer", unit: block.unit }] : [];
  return <section aria-labelledby={`${block.id}-question`} className="mt-8">
    <div className="px-6 pb-8 sm:px-10">
      <h3 id={`${block.id}-question`} className="text-ql-title font-semibold">{block.prompt}</h3>
      {block.type === "multipleChoiceQuestion" ? <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">Choose an answer</legend>
        {block.options.map((option) => <AnswerOption key={option.id} name={block.id} value={option.id} checked={answers.answer === option.id} disabled={feedback !== undefined} onChange={(value) => answer("answer", value)} state={answers.answer === option.id ? feedback === undefined ? "selected" : feedback ? "correct" : "incorrect" : "idle"}>{option.label}</AnswerOption>)}
      </fieldset> : <div className="mt-6 grid gap-5 sm:grid-cols-2">{fields.map((field) => <FinanceInput key={field.id} label={field.label} suffix={field.unit} value={answers[field.id] ?? ""} onValueChange={(value) => answer(field.id, value)} disabled={feedback !== undefined} hint="Enter a numeric percentage." error={answers[field.id] && !Number.isFinite(Number(answers[field.id])) ? "Enter a finite number." : undefined} />)}</div>}
    </div>
    {feedback === undefined ? <div className="sticky bottom-0 z-20 border-t border-ql-border bg-ql-surface px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-10"><LearningButton className="w-full sm:w-auto" disabled={evaluation === undefined || pending} onClick={() => setFeedback(evaluation)}>Check answer</LearningButton></div> : <LessonFeedback sticky autoFocusAction actionButtonRef={continueButtonRef} state={feedback ? "correct" : "incorrect"} title={feedback ? "That’s right" : "Let’s work through it"} onContinue={() => onContinue(answers)} actionPending={pending}>{feedback ? block.correctExplanation : block.incorrectExplanation}</LessonFeedback>}
  </section>;
}
