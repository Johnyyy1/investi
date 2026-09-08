"use client";
import { motion } from "motion/react";
import { useLearningDuration } from "@/components/learning/motion";
export function XpCounter({ value }: { value: number }) {
  const duration = useLearningDuration("reward");
  return <span aria-live="polite" aria-atomic="true" className="inline-flex gap-1 text-ql-small font-semibold text-ql-link"><motion.span key={value} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration }} className="tabular-nums">{value}</motion.span> XP</span>;
}

