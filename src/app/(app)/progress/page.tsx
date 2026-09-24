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
import { loadPortfolioLabUnlock } from "@/features/progression/repository";
import { formatDate } from "@/lib/formatters";

export const metadata = { title: "Pokrok" };
export default async function ProgressPage() {
  const summary = await loadLearner();
  const unlock = summary.user ? await loadPortfolioLabUnlock(summary.user.id) : null;
  const formattedCapital = formatPracticeCapitalMinor(summary.practiceCapital.earnedPracticeCapitalMinor);
  return <PageFrame width="focused">
    <AppHeader title="Podívej se, jak daleko jsi došel." />
    {unlock && <section className="mt-8 border-y border-ql-border py-6" aria-labelledby="xp-title"><h2 id="xp-title" className="text-ql-small font-semibold text-ql-secondary">XP za učení</h2><p className="mt-1 text-ql-celebration font-bold text-ql-link tabular-nums" data-testid="total-xp">{unlock.totalXp} XP</p><div className="mt-5 flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-ql-title font-semibold">Portfolio Lab {unlock.unlocked ? "odemčen" : "čeká na odemčení"}</h3><Link className="text-ql-small font-semibold text-ql-link underline" href="/lab/portfolio">{unlock.unlocked ? "Otevřít Lab" : "Zobrazit podmínky"}</Link></div><p className="mt-2 text-ql-small text-ql-secondary">{unlock.totalXp} / {unlock.xpRequired} XP · Základy investování {unlock.completedPrerequisiteLessons} / {unlock.requiredPrerequisiteLessons} lekcí</p><LearningProgressBar value={Math.min(unlock.totalXp, unlock.xpRequired)} total={unlock.xpRequired} label="XP potřebné k odemčení Portfolio Labu" /></section>}
    <section className="mt-8 min-w-0 rounded-surface border border-border bg-surface p-5 shadow-elevation-1 sm:p-6" aria-labelledby="practice-capital-title">
      <h2 id="practice-capital-title" className="text-ql-small font-semibold text-ql-secondary">Virtuální kapitál</h2>
      <p className="mt-1 break-words text-ql-celebration font-bold text-ql-link tabular-nums" data-testid="total-practice-capital" aria-label={`Virtuální kapitál: ${formattedCapital}`}>{formattedCapital}</p>
      <p className="mt-3 max-w-xl text-ql-small text-ql-secondary">Virtuální kapitál pro vzdělávací použití v investi. Nejde o skutečné peníze, nelze ho vybrat a nepředstavuje investiční doporučení.</p>
    </section>
    <p className="mt-10 flex min-w-0 flex-wrap items-baseline gap-x-3 text-ql-celebration font-bold"><span>{summary.completed.length}</span><span className="min-w-0 break-words text-ql-title font-normal text-ql-secondary">dokončených lekcí</span></p>
    <p data-testid="available-progress" className="mt-2 text-ql-small text-ql-secondary">Dokončeno {summary.completed.length} z {summary.lessons.length} dostupných lekcí</p>
    {summary.gamification && <div className="mt-7"><Streak days={summary.gamification.streak} /><div className="mt-6 max-w-sm"><DailyGoal completed={summary.gamification.todayCompleted} target={summary.gamification.dailyTarget} /></div></div>}
    <div className="mt-10 space-y-8">{moduleCatalog.filter((module) => module.status === "available").map((module) => {
      const completed = summary.completed.filter((lesson) => lesson.moduleSlug === module.slug).length;
      return <section key={module.slug}><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-ql-title font-semibold"><Link href={`/learn/${module.slug}`} className="hover:text-ql-link">{module.title}</Link></h2><span className="text-ql-small text-ql-secondary">{completed} / {module.lessonCount}</span></div><LearningProgressBar value={completed} total={module.lessonCount} label={`Dokončené lekce modulu ${module.title}`} /></section>;
    })}</div>
    <section className="mt-12 border-t border-ql-border pt-7" aria-labelledby="recent-title"><h2 id="recent-title" className="text-ql-title font-semibold">Nedávno probráno</h2>
      {summary.recent.length ? <ol className="mt-4">{summary.recent.slice(0, 3).map((state) => {
        const lesson = summary.lessons.find((lesson) => lesson.id === state.lessonId)!;
        return <li key={state.lessonId} className="flex flex-wrap items-center justify-between gap-3 py-3"><Link className="flex min-h-12 items-center text-ql-body underline decoration-ql-border-strong underline-offset-4 hover:text-ql-link" href={`/learn/${lesson.moduleSlug}/${lesson.slug}`}>{lesson.title}</Link><span className="text-ql-small text-ql-secondary">{state.completedAt ? formatDate(state.completedAt, { timeZone: summary.gamification?.timeZone ?? "UTC" }) : null}</span></li>;
      })}</ol> : <p className="mt-3 text-ql-body text-ql-secondary">Začni první lekcí.</p>}
    </section>
    <LearningLink className="mt-8 w-full sm:w-auto" href={summary.allComplete ? "/lab" : `/learn/${summary.next.moduleSlug}/${summary.next.slug}`}>{summary.allComplete ? "Prozkoumat Lab" : "Pokračovat v učení"}</LearningLink>
    <details className="mt-8 text-ql-small text-ql-secondary"><summary className="flex min-h-12 cursor-pointer items-center text-ql-link">Jak funguje pokrok</summary><p>První dokončení lekce přidá 60 XP. XP měří učení a nelze je utratit. Dokončením všech sedmi lekcí Základů investování a získáním 420 XP odemkneš Portfolio Lab a jednorázově dostaneš 5 000 Kč virtuálního kapitálu. Opakování další odměnu nepřidává.</p></details>
  </PageFrame>;
}
