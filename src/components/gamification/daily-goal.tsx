import { LearningProgressBar } from "@/components/learning/lesson-progress";
import { CheckCircle2 } from "lucide-react";

export function DailyGoal({ completed, target }: { completed: number; target: number }) {
  const complete = target > 0 && completed >= target;
  const lessonLabel = (count: number) => count === 1 ? "lekce" : count >= 2 && count <= 4 ? "lekce" : "lekcí";
  return <section aria-label="Dnešní studijní cíl" className="rounded-surface border border-border bg-surface/70 px-5 py-4 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-2 text-small">
      <span className="inline-flex items-center gap-2 font-bold">{complete ? <CheckCircle2 aria-hidden="true" className="size-5 text-success-ink" /> : null}Dnešní cíl</span>
      <span className={complete ? "min-w-0 text-right font-bold text-success-ink" : "min-w-0 text-right tabular-nums text-secondary"}>{complete ? "Splněn" : `${completed} / ${target} ${lessonLabel(target)}`}</span>
    </div>
    <div className="mt-3"><LearningProgressBar value={completed} total={target} label="Dnešní studijní cíl" tone={complete ? "success" : "primary"} /></div>
    <p className="mt-2 text-microcopy text-secondary">{complete ? `${completed} ${lessonLabel(completed)} dnes · denní cíl splněn` : "Dokonči lekci a posuň dnešní cíl."}</p>
  </section>;
}
