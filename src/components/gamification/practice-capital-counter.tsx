"use client";
import { motion } from "motion/react";
import { useLearningDuration } from "@/components/learning/motion";
import { formatPracticeCapitalMinor } from "@/features/rewards/presentation";

export function PracticeCapitalCounter({ value }: { value: bigint }) {
  const duration = useLearningDuration("reward");
  const formatted = formatPracticeCapitalMinor(value);
  return <span aria-live="polite" aria-atomic="true" aria-label={`Practice Capital: ${formatted}`} className="inline-flex min-w-0 flex-col text-ql-small">
    <span className="text-microcopy font-semibold text-secondary">Practice Capital</span>
    <motion.span aria-hidden="true" key={value.toString()} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration }} className="break-words font-bold text-ql-link tabular-nums">{formatted}</motion.span>
  </span>;
}
