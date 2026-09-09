"use client";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LearningButton } from "./learning-button";

const feedbackStyles = {
  correct: "border-ql-success bg-ql-success-bg",
  incorrect: "border-ql-danger bg-ql-danger-bg",
  informational: "border-ql-blue-200 bg-ql-subtle",
};
export function LessonFeedback({ state, title, children, onContinue, actionLabel = "Continue", sticky = false, autoFocusAction = false, actionPending = false }: {
  state: keyof typeof feedbackStyles; title: string; children: ReactNode; onContinue?: () => void; actionLabel?: string; sticky?: boolean; autoFocusAction?: boolean; actionPending?: boolean;
}) {
  const descriptionId = useId();
  return <section aria-label="Answer feedback" className={cn("border-t-2 px-6 py-5", feedbackStyles[state], sticky && "sticky bottom-0 z-20 pb-[max(1.25rem,env(safe-area-inset-bottom))]")}>
    <div className="mx-auto flex max-w-3xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div id={descriptionId} role="status" aria-live="polite"><h3 className="text-ql-title font-semibold">{title}</h3><div className="mt-1 max-w-xl text-ql-small">{children}</div></div>
      {onContinue ? <LearningButton loading={actionPending} autoFocus={autoFocusAction} aria-describedby={descriptionId} variant={state === "correct" ? "success" : "primary"} onClick={onContinue}>{actionLabel}</LearningButton> : null}
    </div>
  </section>;
}
