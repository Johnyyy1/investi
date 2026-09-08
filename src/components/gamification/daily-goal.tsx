import { LearningProgressBar } from "@/components/learning/lesson-progress";
export function DailyGoal({ completed, target }: { completed: number; target: number }) {
  return <div className="space-y-3"><div className="flex justify-between gap-4 text-ql-small"><span className="font-semibold">Today’s goal</span><span className="tabular-nums text-ql-secondary">{completed} / {target}</span></div><LearningProgressBar value={completed} total={target} label="Daily learning goal" /></div>;
}

