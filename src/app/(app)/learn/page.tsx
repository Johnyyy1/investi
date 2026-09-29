import { LearningStats } from "@/components/gamification/learning-stats";
import Link from "next/link";
import { loadLearner } from "@/features/learning/load-learner";
import { Recommendation } from "@/components/personalization/recommendation";
import { PersonalizationPrompt } from "@/components/personalization/personalization-prompt";
import { JourneyOverview } from "@/components/learning/journey-overview";
import { LearnerGreeting } from "@/components/learning/learner-greeting";
import { PageFrame } from "@/components/shell/page-frame";

export const metadata = { title: "Učení" };
export default async function LearnPage() {
  const summary = await loadLearner();
  return <PageFrame width="standard">
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8"><LearnerGreeting name={summary.user?.name ?? "student"} />{summary.gamification && <div className="min-w-0 max-w-full rounded-surface border border-border bg-surface px-4 py-2 shadow-elevation-1"><LearningStats stats={summary.gamification} earnedPracticeCapitalMinor={summary.practiceCapital.earnedPracticeCapitalMinor} /></div>}</header>
    <Recommendation recommendation={summary.recommendation} />
    {summary.state?.status === "in_progress" && summary.next.id !== summary.recommendation.nextLessonId && <Link href={`/learn/${summary.next.moduleSlug}/${summary.next.slug}`} className="mt-4 inline-flex min-h-12 items-center text-small font-semibold text-primary-hover underline">Vrátit se k rozpracované lekci: {summary.next.title}</Link>}
    {!summary.profile?.personalizedOnboardingCompletedAt && summary.user && <PersonalizationPrompt userId={summary.user.id} />}
    <div id="curriculum"><JourneyOverview summary={summary} /></div>
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-small"><span className="text-secondary">Vyzkoušet nápad</span><Link className="inline-flex min-h-12 items-center font-semibold text-primary-hover underline underline-offset-4" href="/lab/portfolio">Portfolio Lab</Link><Link className="inline-flex min-h-12 items-center font-semibold text-primary-hover underline underline-offset-4" href="/lab/backtesting">Backtesting Lab</Link></div>
  </PageFrame>;
}
