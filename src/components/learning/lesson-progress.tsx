"use client";
import { ArrowLeft } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function LearningProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return <Progress value={value} total={total} label={label} />;
}
export function LessonProgress({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  return <div className="flex items-center gap-4">
    <IconButton onClick={onBack} aria-label="Back to lesson overview" variant="ghost"><ArrowLeft className="size-5" /></IconButton>
    <LearningProgressBar value={step} total={total} label="Lesson steps" />
    <span className="shrink-0 text-ql-small tabular-nums text-ql-secondary">{step} / {total}</span>
  </div>;
}
