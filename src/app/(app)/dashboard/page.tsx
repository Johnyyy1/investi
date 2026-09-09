import Link from "next/link";
import { loadLearner } from "@/features/learning/load-learner";
import { ContinueLearning } from "@/components/learning/continue-learning";
import { ReturnsPathPreview } from "@/components/learning/returns-path-preview";
import { LearnerGreeting } from "@/components/learning/learner-greeting";
import { LearningProgressBar } from "@/components/learning/lesson-progress";

export const metadata = { title: "Home" };
export default async function DashboardPage() {
  const summary = await loadLearner();
  return <main className="mx-auto max-w-5xl space-y-10 px-5 py-8 sm:px-10 lg:py-12">
    <header><LearnerGreeting name={summary.user?.name ?? "learner"} /><p className="mt-3 text-ql-body text-ql-secondary">Small steps. Strong foundations.</p></header>
    <ContinueLearning summary={summary} />
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <section aria-labelledby="path-heading"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 id="path-heading" className="text-ql-section font-semibold">Your learning path</h2><Link className="inline-flex min-h-12 items-center text-ql-small text-ql-link underline underline-offset-4" href="/learn">Browse curriculum</Link></div><ReturnsPathPreview states={summary.states} /></section>
      <section aria-labelledby="recent-heading" className="border-t border-ql-border pt-6 xl:border-t-0 xl:pt-0"><h2 id="recent-heading" className="text-ql-title font-semibold">Your progress</h2><p className="mt-3 mb-4 text-ql-small text-ql-secondary">{summary.completed.length} of {summary.lessons.length} available lessons complete</p><LearningProgressBar value={summary.completed.length} total={summary.lessons.length} label="Available learning progress" />
        <h3 className="mt-8 text-ql-small font-semibold">Recently completed</h3>{summary.recent.length ? <ul className="mt-3 space-y-4">{summary.recent.map((state) => { const lesson = summary.lessons.find((lesson) => lesson.id === state.lessonId)!; return <li key={state.lessonId}><Link className="text-ql-small text-ql-link underline underline-offset-4" href={`/learn/returns/${lesson.slug}`}>{lesson.title}</Link><p className="mt-1 text-ql-meta text-ql-secondary">Completed · Ready to review</p></li>; })}</ul> : <p className="mt-3 text-ql-small text-ql-secondary">Your first completed lesson will appear here. Start with what a return measures.</p>}
      </section>
    </div>
  </main>;
}
