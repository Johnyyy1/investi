"use client";
import { motion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { CircleCheck } from "lucide-react";
import { LearningButton } from "./learning-button";
import { useLearningDuration } from "./motion";

export function CompletionScreen({ title, description, xp, onContinue, autoFocusAction = false, actionLabel = "Continue learning" }: { title: string; description: string; xp?: number; onContinue: () => void; autoFocusAction?: boolean; actionLabel?: string }) {
  const duration = useLearningDuration("reward");
  const descriptionId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // Replacing a tall exercise can leave the completion title above the viewport.
    if (autoFocusAction) sectionRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [autoFocusAction]);
  return <section ref={sectionRef} className="mx-auto max-w-xl px-6 py-8 text-center">
    <motion.div id={descriptionId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration }}>
      <CircleCheck aria-hidden="true" className="mx-auto size-12 text-ql-success-ink" />
      <h2 className="mt-6 text-ql-page-title font-semibold">{title}</h2>
      <p className="mt-3 text-ql-body text-ql-secondary">{description}</p>
      {xp !== undefined ? <p className="mt-4 text-ql-emphasis font-semibold text-ql-link">+{xp} XP earned</p> : null}
    </motion.div>
    <LearningButton autoFocus={autoFocusAction} aria-describedby={descriptionId} className="mt-6" onClick={onContinue}>{actionLabel}</LearningButton>
  </section>;
}
