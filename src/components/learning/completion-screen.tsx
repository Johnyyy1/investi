"use client";
import { motion } from "motion/react";
import { CircleCheck } from "lucide-react";
import { LearningButton } from "./learning-button";
import { useLearningDuration } from "./motion";

export function CompletionScreen({ title, description, xp, onContinue }: { title: string; description: string; xp?: number; onContinue: () => void }) {
  const duration = useLearningDuration("reward");
  return <section className="mx-auto max-w-xl py-8 text-center">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration }}>
      <CircleCheck aria-hidden="true" className="mx-auto size-12 text-ql-success-ink" />
      <h2 className="mt-6 text-ql-page-title font-semibold">{title}</h2>
      <p className="mt-3 text-ql-body text-ql-secondary">{description}</p>
      {xp !== undefined ? <p className="mt-4 text-ql-emphasis font-semibold text-ql-link">+{xp} XP earned</p> : null}
    </motion.div>
    <LearningButton className="mt-6" onClick={onContinue}>Continue learning</LearningButton>
  </section>;
}
