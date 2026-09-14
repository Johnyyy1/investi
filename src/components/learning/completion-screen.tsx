"use client";
import { motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import Image from "next/image";
import { LearningButton } from "./learning-button";
import { useLearningDuration } from "./motion";

export function CompletionScreen({ title, description, xp, children, onContinue, autoFocusAction = false, actionLabel = "Continue learning" }: { title: string; description: string; xp?: number; children?: ReactNode; onContinue: () => void; autoFocusAction?: boolean; actionLabel?: string }) {
  const duration = useLearningDuration("reward");
  const descriptionId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // Replacing a tall exercise can leave the completion title above the viewport.
    if (autoFocusAction) sectionRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [autoFocusAction]);
  return <section ref={sectionRef} className="mx-auto max-w-xl px-5 py-8 text-center sm:px-8 sm:py-10">
    <motion.div id={descriptionId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration }}>
      <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-success bg-success-soft">{xp !== undefined ? <Image src="/brand/xp-star.webp" alt="" width={96} height={96} className="size-12 object-contain" /> : <CircleCheck aria-hidden="true" className="size-9 text-success-ink" />}</div>
      <p className="mt-5 text-microcopy font-extrabold tracking-[0.08em] text-success-ink uppercase">Progress saved</p>
      <h2 className="mt-1 text-page-title font-bold tracking-[-0.025em]">{title}</h2>
      <p className="mt-3 text-body text-secondary">{description}</p>
      {xp !== undefined ? <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-pill border border-warning bg-warning-soft px-5 py-2 text-emphasis font-extrabold text-warning-ink"><span aria-hidden="true">+</span>{xp} XP earned</div> : null}
    </motion.div>
    {children}
    <LearningButton autoFocus={autoFocusAction} aria-describedby={descriptionId} className="mt-7 w-full" onClick={onContinue}>{actionLabel}</LearningButton>
  </section>;
}
