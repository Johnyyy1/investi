"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LessonBlock } from "@/features/lessons/types";

type QuestionBlock = Extract<LessonBlock, { type: "multipleChoiceQuestion" | "numericQuestion" | "multiNumericQuestion" }>;

function Feedback({ feedback }: { feedback?: { correct: boolean; content: string } }) {
  if (!feedback) return null;
  return <div className={`mt-5 border-l-2 px-4 py-1 text-sm leading-6 ${feedback.correct ? "border-positive bg-[#f0f6f2]" : "border-neutral-400 bg-neutral-100"}`} aria-live="polite"><p className="font-medium">{feedback.correct ? "That’s right." : "Revisit the comparison."}</p><p className="mt-1 text-neutral-700">{feedback.content}</p></div>;
}

export function Question({ block }: { block: QuestionBlock }) {
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ correct: boolean; content: string }>();
  function submit() {
    if (block.type === "multipleChoiceQuestion") {
      if (!answer) { setFeedback({ correct: false, content: "Choose an answer before checking your reasoning." }); return; }
      const correct = answer === block.correctOptionId;
      setFeedback({ correct, content: correct ? block.correctExplanation : block.incorrectExplanation });
      return;
    }
    if (block.type === "multiNumericQuestion") {
      const numericAnswers = block.answers.map((item) => ({ item, value: Number(answers[item.id]) }));
      if (numericAnswers.some(({ item }) => answers[item.id]?.trim() === "") || numericAnswers.some(({ value }) => !Number.isFinite(value))) { setFeedback({ correct: false, content: "Enter a numeric answer for both periods before checking your reasoning." }); return; }
      const correct = numericAnswers.every(({ item, value }) => Math.abs(value - item.answer) <= item.tolerance);
      setFeedback({ correct, content: correct ? block.correctExplanation : block.incorrectExplanation });
      return;
    }
    const numericAnswer = Number(answer);
    if (answer.trim() === "" || !Number.isFinite(numericAnswer)) { setFeedback({ correct: false, content: "Enter a numeric answer before checking your reasoning." }); return; }
    const correct = Math.abs(numericAnswer - block.answer) <= block.tolerance;
    setFeedback({ correct, content: correct ? block.correctExplanation : block.incorrectExplanation });
  }
  const label = block.type === "multipleChoiceQuestion" ? "Prediction" : "Practice";
  return <section className="my-10 border-t-2 border-neutral-950 pt-5" aria-labelledby={`${block.id}-prompt`}><p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">{label}</p><h3 id={`${block.id}-prompt`} className="mt-3 text-lg font-semibold tracking-[-0.03em]">{block.prompt}</h3>{block.type === "multipleChoiceQuestion" ? <fieldset className="mt-5 space-y-2"><legend className="sr-only">Answer choices</legend>{block.options.map((option) => <label key={option.id} className="flex cursor-pointer gap-3 border border-line px-4 py-3 text-sm transition-colors hover:bg-white has-[:checked]:border-neutral-950"><input type="radio" name={block.id} value={option.id} checked={answer === option.id} onChange={(event) => setAnswer(event.target.value)} className="mt-0.5" />{option.label}</label>)}</fieldset> : block.type === "multiNumericQuestion" ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{block.answers.map((item) => <label key={item.id} className="space-y-2"><span className="text-sm font-medium">{item.label}</span><div className="flex items-center gap-2"><input value={answers[item.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} inputMode="decimal" aria-label={`${item.label} numeric answer`} className="h-11 min-w-0 flex-1 border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950" /><span className="text-sm text-muted">{item.unit}</span></div></label>)}</div> : <div className="mt-5 flex max-w-xs items-center gap-2"><input value={answer} onChange={(event) => setAnswer(event.target.value)} inputMode="decimal" aria-label="Numeric answer" className="h-11 min-w-0 flex-1 border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950" /><span className="text-sm text-muted">{block.unit}</span></div>}<Button type="button" variant="secondary" className="mt-5" onClick={submit}>Check answer</Button><Feedback feedback={feedback} /></section>;
}
