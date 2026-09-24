"use client";

import { useState, type Ref } from "react";
import { AnswerOption } from "@/components/learning/answer-option";
import { FinanceInput } from "@/components/learning/finance-input";
import { LearningButton } from "@/components/learning/learning-button";
import { LessonFeedback } from "@/components/learning/lesson-feedback";
import { evaluateQuestion, type QuestionBlock } from "@/features/lessons/question-evaluation";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function GuidedQuestion({ block, onContinue, onPrevious, pending, continueButtonRef }: { block: QuestionBlock; onContinue: (answers: Record<string, string>) => void; onPrevious?: () => void; pending: boolean; continueButtonRef?: Ref<HTMLButtonElement> }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<boolean>();
  const evaluation = evaluateQuestion(block, answers);
  function answer(id: string, value: string) { setAnswers((current) => ({ ...current, [id]: value })); }
  const fields = block.type === "multiNumericQuestion" ? block.answers : block.type === "numericQuestion" ? [{ id: "answer", label: "Tvoje odpověď", unit: block.unit }] : [];
  return <section aria-labelledby={`${block.id}-question`} className="mt-7 overflow-hidden rounded-panel border border-border bg-surface shadow-elevation-1">
    <div className="px-5 pt-6 pb-7 sm:px-7 sm:pt-7">
      <p className="text-microcopy font-extrabold tracking-[0.08em] text-primary-hover uppercase">Ověř si porozumění</p>
      <h3 id={`${block.id}-question`} className="mt-2 text-card-title font-bold sm:text-[1.35rem]">{block.prompt}</h3>
      {block.type === "multipleChoiceQuestion" ? <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">Vyber odpověď</legend>
        {block.options.map((option) => <AnswerOption key={option.id} name={block.id} value={option.id} checked={answers.answer === option.id} disabled={feedback !== undefined} onChange={(value) => answer("answer", value)} state={answers.answer === option.id ? feedback === undefined ? "selected" : feedback ? "correct" : "incorrect" : "idle"}>{option.label}</AnswerOption>)}
      </fieldset> : <div className="mt-6 grid gap-5 sm:grid-cols-2">{fields.map((field) => <FinanceInput key={field.id} label={field.label} suffix={field.unit} value={answers[field.id] ?? ""} onValueChange={(value) => answer(field.id, value)} disabled={feedback !== undefined} hint={field.unit === "%" ? "Zadej procento jako číslo." : field.unit ? `Zadej číselnou hodnotu v ${field.unit}.` : "Zadej číselnou hodnotu."} error={answers[field.id] && !Number.isFinite(Number(answers[field.id])) ? "Zadej konečné číslo." : undefined} />)}</div>}
    </div>
    {feedback === undefined ? <div className="flex flex-col gap-2 border-t border-border bg-surface-muted/55 px-5 py-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:px-7"><LearningButton className="order-2 w-full min-[420px]:w-auto" disabled={evaluation === undefined || pending} onClick={() => setFeedback(evaluation)}>Zkontrolovat odpověď<ArrowRight aria-hidden="true" className="size-4" /></LearningButton>{onPrevious ? <LearningButton className="order-1" variant="ghost" disabled={pending} onClick={onPrevious}><ArrowLeft aria-hidden="true" className="size-4" />Předchozí</LearningButton> : null}</div> : <div className="p-3"><LessonFeedback sticky autoFocusAction actionButtonRef={continueButtonRef} state={feedback ? "correct" : "incorrect"} title={feedback ? "Správně" : "Zkus to ještě jednou"} onPrevious={onPrevious} actionLabel={feedback ? "Pokračovat" : "Zkusit znovu"} onContinue={feedback ? () => onContinue(answers) : () => { setAnswers({}); setFeedback(undefined); }} actionPending={pending}>{feedback ? block.correctExplanation : block.incorrectExplanation}</LessonFeedback></div>}
  </section>;
}
