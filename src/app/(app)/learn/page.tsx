import { LearningStats } from "@/components/gamification/learning-stats";
import { DailyGoal } from "@/components/gamification/daily-goal";
import Link from "next/link";
import { ArrowUpRight, Check, Lock } from "lucide-react";
import { moduleCatalog, getModuleLessons } from "@/features/learning/catalog";
import { loadLearner } from "@/features/learning/load-learner";
import { ContinueLearning } from "@/components/learning/continue-learning";
import { LearnerGreeting } from "@/components/learning/learner-greeting";

export const metadata = { title: "Learn" };
export default async function LearnPage() {
  const summary = await loadLearner();
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-10 lg:py-14">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-5"><LearnerGreeting name={summary.user?.name ?? "learner"} />{summary.gamification && <LearningStats stats={summary.gamification} />}</header>
    <ContinueLearning summary={summary} />
    {summary.gamification && <div className="mt-6 max-w-sm"><DailyGoal completed={summary.gamification.todayCompleted} target={summary.gamification.dailyTarget} /></div>}
    <section className="mt-14" aria-labelledby="journey-title">
      <h2 id="journey-title" className="mb-3 text-ql-title font-semibold">Your journey</h2>
      <ol>{moduleCatalog.filter((module) => module.status === "available").map((module, index) => {
        const completed = summary.completed.filter((lesson) => lesson.moduleSlug === module.slug).length;
        return <li key={module.slug} className="border-b border-ql-border py-6">
          <Link href={`/learn/${module.slug}`} className="group flex min-h-12 items-center justify-between gap-4"><div><p className="text-ql-small text-ql-secondary">Chapter 0{index + 1} · {completed} / {module.lessonCount} complete</p><h3 className="mt-1 text-ql-title font-semibold group-hover:text-ql-link">{module.title}</h3></div><ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-ql-secondary" /></Link>
          <div className="mt-4 flex flex-wrap gap-3" aria-label={`${module.title} lesson progress`}>{getModuleLessons(module.slug).map((lesson) => {
            const state = summary.states.find((state) => state.lessonId === lesson.id);
            const label = `${lesson.title}: ${lesson.status !== "available" ? "upcoming" : state?.status === "completed" ? "complete" : state?.status === "in_progress" ? "in progress" : "ready"}`;
            return <span key={lesson.id} title={label} className={`flex size-6 items-center justify-center rounded-full border ${state?.status === "completed" ? "border-ql-link bg-ql-link text-white" : state?.status === "in_progress" ? "border-2 border-ql-link bg-ql-blue-100" : "border-ql-border-strong"}`}><span className="sr-only">{label}</span>{state?.status === "completed" ? <Check aria-hidden="true" className="size-4" /> : lesson.status !== "available" ? <Lock aria-hidden="true" className="size-3 text-ql-secondary" /> : null}</span>;
          })}</div>
        </li>;
      })}</ol>
      <p className="mt-5 text-ql-small text-ql-secondary">Up next in the curriculum: volatility &amp; correlation.</p>
    </section>
    <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-ql-small"><span className="text-ql-secondary">Try an idea</span><Link className="inline-flex min-h-12 items-center text-ql-link underline underline-offset-4" href="/lab/portfolio">Portfolio Lab</Link><Link className="inline-flex min-h-12 items-center text-ql-link underline underline-offset-4" href="/lab/backtesting">Backtesting Lab</Link></div>
  </main>;
}
