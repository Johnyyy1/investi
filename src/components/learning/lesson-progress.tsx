"use client";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useLearningDuration } from "./motion";

export function LearningProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 1;
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(safeTotal, value)) : 0;
  const duration = useLearningDuration();
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeTotal} aria-valuenow={safeValue} className="h-3 flex-1 overflow-hidden rounded-ql-full bg-ql-blue-100">
    <motion.div initial={false} animate={{ width: `${safeValue / safeTotal * 100}%` }} transition={{ duration }} className="h-full rounded-ql-full bg-ql-blue-700" />
  </div>;
}
export function LessonProgress({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  return <div className="flex items-center gap-4">
    <button onClick={onBack} type="button" aria-label="Back to lesson overview" className="flex size-12 shrink-0 items-center justify-center rounded-ql-md text-ql-secondary hover:bg-ql-subtle"><ArrowLeft className="size-5" /></button>
    <LearningProgressBar value={step} total={total} label="Lesson steps" />
    <span className="shrink-0 text-ql-small tabular-nums text-ql-secondary">{step} / {total}</span>
  </div>;
}
