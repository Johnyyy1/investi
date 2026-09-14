import { LearningStats } from "@/components/gamification/learning-stats";
import { DailyGoal } from "@/components/gamification/daily-goal";
import Link from "next/link";
import { loadLearner } from "@/features/learning/load-learner";
import { ContinueLearning } from "@/components/learning/continue-learning";
import { JourneyOverview } from "@/components/learning/journey-overview";
import { LearnerGreeting } from "@/components/learning/learner-greeting";
import { PageFrame } from "@/components/shell/page-frame";

export const metadata = { title: "Learn" };
export default async function LearnPage() {
  const summary = await loadLearner();
  return <PageFrame width="standard">
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8"><LearnerGreeting name={summary.user?.name ?? "learner"} />{summary.gamification && <div className="min-w-0 max-w-full rounded-surface border border-border bg-surface px-4 py-2 shadow-elevation-1"><LearningStats stats={summary.gamification} earnedPracticeCapitalMinor={summary.practiceCapital.earnedPracticeCapitalMinor} /></div>}</header>
    <ContinueLearning summary={summary} />
    {summary.gamification && <div className="mt-4"><DailyGoal completed={summary.gamification.todayCompleted} target={summary.gamification.dailyTarget} /></div>}
    <JourneyOverview summary={summary} />
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-small"><span className="text-secondary">Try an idea</span><Link className="inline-flex min-h-12 items-center font-semibold text-primary-hover underline underline-offset-4" href="/lab/portfolio">Portfolio Lab</Link><Link className="inline-flex min-h-12 items-center font-semibold text-primary-hover underline underline-offset-4" href="/lab/backtesting">Backtesting Lab</Link></div>
  </PageFrame>;
}
