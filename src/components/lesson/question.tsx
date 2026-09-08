"use client";

import { useState } from "react";
import type { LessonBlock } from "@/features/lessons/types";
import { Button } from "@/components/ui/button";

type QuestionBlock = Extract<LessonBlock, { type: "multipleChoiceQuestion" | "numericQuestion" }>;

export function Question({ block }: { block: QuestionBlock }) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; content: string }>();
  function submit() {
    if (block.type === "multipleChoiceQuestion") {
      if (!answer) { setFeedback({ correct: false, content: "Choose an answer before checking your reasoning." }); return; }
      const correct = answer === block.correctOptionId;
      setFeedback({ correct, content: correct ? block.correctExplanation : block.incorrectExplanation });
      return;
    }
    const numericAnswer = Number(answer);
    if (answer.trim() === "" || !Number.isFinite(numericAnswer)) { setFeedback({ correct: false, content: "Enter a numeric answer before checking your reasoning." }); return; }
    const correct = Math.abs(numericAnswer - block.answer) <= block.tolerance;
    setFeedback({ correct, content: correct ? block.correctExplanation : block.incorrectExplanation });
  }
  return <section className="my-10 border-t-2 border-neutral-950 pt-5" aria-labelledby={`${block.id}-prompt`}><p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">{block.type === "numericQuestion" ? "Practice" : "Prediction"}</p><h3 id={`${block.id}-prompt`} className="mt-3 text-lg font-semibold tracking-[-0.03em]">{block.prompt}</h3>{block.type === "multipleChoiceQuestion" ? <fieldset className="mt-5 space-y-2"><legend className="sr-only">Answer choices</legend>{block.options.map((option) => <label key={option.id} className="flex cursor-pointer gap-3 border border-line px-4 py-3 text-sm transition-colors hover:bg-white has-[:checked]:border-neutral-950"><input type="radio" name={block.id} value={option.id} checked={answer === option.id} onChange={(event) => setAnswer(event.target.value)} className="mt-0.5" />{option.label}</label>)}</fieldset> : <div className="mt-5 flex max-w-xs items-center gap-2"><input value={answer} onChange={(event) => setAnswer(event.target.value)} inputMode="decimal" aria-label="Numeric answer" className="h-11 min-w-0 flex-1 border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950" /><span className="text-sm text-muted">{block.unit}</span></div>}<Button type="button" variant="secondary" className="mt-5" onClick={submit}>Check answer</Button>{feedback ? <div className={`mt-5 border-l-2 px-4 py-1 text-sm leading-6 ${feedback.correct ? "border-positive bg-[#f0f6f2]" : "border-neutral-400 bg-neutral-100"}`} aria-live="polite"><p className="font-medium">{feedback.correct ? "That’s right." : "Revisit the comparison."}</p><p className="mt-1 text-neutral-700">{feedback.content}</p></div> : null}</section>;
}
