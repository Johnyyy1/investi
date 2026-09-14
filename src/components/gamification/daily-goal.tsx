import { LearningProgressBar } from "@/components/learning/lesson-progress";
import { CheckCircle2 } from "lucide-react";
export function DailyGoal({ completed, target }: { completed: number; target: number }) {
  const complete = target > 0 && completed >= target;
  return <section aria-label="Today’s learning goal" className="rounded-surface border border-border bg-surface/70 px-5 py-4 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-2 text-small">
      <span className="inline-flex items-center gap-2 font-bold">{complete ? <CheckCircle2 aria-hidden="true" className="size-5 text-success-ink" /> : null}Today’s goal</span>
      <span className={complete ? "min-w-0 text-right tabular-nums font-bold text-success-ink" : "min-w-0 text-right tabular-nums text-secondary"}>{completed} / {target} {target === 1 ? "lesson" : "lessons"}</span>
    </div>
    <div className="mt-3"><LearningProgressBar value={completed} total={target} label="Daily learning goal" tone={complete ? "success" : "primary"} /></div>
    <p className="mt-2 text-microcopy text-secondary">{complete ? "Goal complete — nice momentum." : "Complete a lesson to move today forward."}</p>
  </section>;
}
