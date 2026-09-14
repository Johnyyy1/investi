"use client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function LearningProgressBar({ value, total, label, tone = "primary" }: { value: number; total: number; label: string; tone?: "primary" | "success" }) {
  return <Progress value={value} total={total} label={label} tone={tone} />;
}
export function LessonProgress({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  return <div className="flex items-center gap-3 sm:gap-4">
    <Button onClick={onBack} aria-label="Back to Learn" variant="ghost" size="compact" className="shrink-0 px-2 sm:px-3"><ArrowLeft className="size-4" /><span className="hidden min-[375px]:inline">Back</span></Button>
    <LearningProgressBar value={step} total={total} label="Lesson steps" />
    <span className="shrink-0 text-small font-semibold tabular-nums text-secondary">{step} / {total}</span>
  </div>;
}
