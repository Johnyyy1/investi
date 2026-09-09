import { Streak } from "./streak";
import { DailyGoal } from "./daily-goal";
import type { Gamification } from "@/features/gamification/domain";

export function LearningStats({ stats, goal = false }: { stats: Gamification; goal?: boolean }) {
  return <div data-testid="learning-stats">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3"><Streak days={stats.streak} /><span className="text-ql-small font-bold text-ql-link" data-testid="total-xp">{stats.totalXp} XP</span></div>
    {goal && <div className="mt-6 max-w-sm"><DailyGoal completed={stats.todayCompleted} target={stats.dailyTarget} /></div>}
  </div>;
}
