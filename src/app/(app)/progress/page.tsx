import Link from "next/link";
import { loadLearner } from "@/features/learning/load-learner";
import { DailyGoal } from "@/components/gamification/daily-goal";
import { Streak } from "@/components/gamification/streak";
import { LearningProgressBar } from "@/components/learning/lesson-progress";
import { LearningLink } from "@/components/learning/learning-button";
import { moduleCatalog } from "@/features/learning/catalog";
import { AppHeader } from "@/components/shell/app-header";
import { PageFrame } from "@/components/shell/page-frame";
import { formatPracticeCapitalMinor } from "@/features/rewards/presentation";

export const metadata = { title: "Progress" };
export default async function ProgressPage() {
  const summary = await loadLearner();
  const formattedCapital = formatPracticeCapitalMinor(summary.practiceCapital.earnedPracticeCapitalMinor);
  return <PageFrame width="focused">
    <AppHeader title="Look how far you’ve come." />
    <section className="mt-8 min-w-0 rounded-surface border border-border bg-surface p-5 shadow-elevation-1 sm:p-6" aria-labelledby="practice-capital-title">
      <h2 id="practice-capital-title" className="text-ql-small font-semibold text-ql-secondary">Practice Capital earned</h2>
      <p className="mt-1 break-words text-ql-celebration font-bold text-ql-link tabular-nums" data-testid="total-practice-capital" aria-label={`Practice Capital earned: ${formattedCapital}`}>{formattedCapital}</p>
      <p className="mt-3 max-w-xl text-ql-small text-ql-secondary">Virtual capital earned through learning for educational use inside Investi. It is not real money, cannot be withdrawn, and is not investment advice.</p>
    </section>
    <p className="mt-10 text-ql-celebration font-bold">{summary.completed.length}<span className="ml-3 text-ql-title font-normal text-ql-secondary">lessons completed</span></p>
    <p data-testid="available-progress" className="mt-2 text-ql-small text-ql-secondary">{summary.completed.length} of {summary.lessons.length} available lessons complete</p>
    {summary.gamification && <div className="mt-7"><Streak days={summary.gamification.streak} /><div className="mt-6 max-w-sm"><DailyGoal completed={summary.gamification.todayCompleted} target={summary.gamification.dailyTarget} /></div></div>}
    <div className="mt-10 space-y-8">{moduleCatalog.filter((module) => module.status === "available").map((module) => {
      const completed = summary.completed.filter((lesson) => lesson.moduleSlug === module.slug).length;
      return <section key={module.slug}><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-ql-title font-semibold"><Link href={`/learn/${module.slug}`} className="hover:text-ql-link">{module.title}</Link></h2><span className="text-ql-small text-ql-secondary">{completed} / {module.lessonCount}</span></div><LearningProgressBar value={completed} total={module.lessonCount} label={`${module.title} completed lessons`} /></section>;
    })}</div>
    <section className="mt-12 border-t border-ql-border pt-7" aria-labelledby="recent-title"><h2 id="recent-title" className="text-ql-title font-semibold">Recently learned</h2>
      {summary.recent.length ? <ol className="mt-4">{summary.recent.slice(0, 3).map((state) => {
        const lesson = summary.lessons.find((lesson) => lesson.id === state.lessonId)!;
        return <li key={state.lessonId} className="flex flex-wrap items-center justify-between gap-3 py-3"><Link className="flex min-h-12 items-center text-ql-body underline decoration-ql-border-strong underline-offset-4 hover:text-ql-link" href={`/learn/${lesson.moduleSlug}/${lesson.slug}`}>{lesson.title}</Link><span className="text-ql-small text-ql-secondary">{state.completedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: summary.gamification?.timeZone ?? "UTC" })}</span></li>;
      })}</ol> : <p className="mt-3 text-ql-body text-ql-secondary">Your first lesson is a good place to start.</p>}
    </section>
    <LearningLink className="mt-8 w-full sm:w-auto" href={summary.allComplete ? "/lab" : `/learn/${summary.next.moduleSlug}/${summary.next.slug}`}>{summary.allComplete ? "Explore the Lab" : "Continue learning"}</LearningLink>
    <details className="mt-8 text-ql-small text-ql-secondary"><summary className="flex min-h-12 cursor-pointer items-center text-ql-link">How progress works</summary><p>First completion earns 2,000 Kč Practice Capital. At least one new lesson on a calendar day counts toward your streak. Reviews do not earn extra capital. Your goal is {summary.gamification?.dailyTarget ?? 1} lessons a day, based on your saved daily minutes. Days follow {summary.gamification?.timeZone ?? "UTC"}.</p></details>
  </PageFrame>;
}
