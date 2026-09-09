import { AppHeader } from "@/components/shell/app-header";
import { LearningLink } from "@/components/learning/learning-button";
import { LearningProgressBar } from "@/components/learning/lesson-progress";
import { loadLearner } from "@/features/learning/load-learner";

export const metadata = { title: "Learn" };
const roadmap = [
  ["Risk & diversification", "Understand uncertainty and how investments work together."],
  ["Portfolio construction", "Connect individual investments to a broader plan."],
  ["Fundamental analysis & markets", "Understand businesses and the markets around them."],
  ["Strategies & quantitative investing", "Build on your foundations with systematic reasoning."],
  ["Backtesting", "Learn to question and evaluate historical results."],
];
export default async function LearnPage() {
  const summary = await loadLearner();
  return <main className="mx-auto max-w-4xl px-5 py-8 sm:px-10 lg:py-12">
    <AppHeader title="Learn investing, step by step" description="Start with the fundamentals. Build toward deeper investing and quantitative concepts, one clear idea at a time." />
    <section className="mt-10" aria-labelledby="foundations-title"><p className="text-ql-small font-semibold text-ql-link">CHAPTER 01 · INVESTING FOUNDATIONS</p><h2 id="foundations-title" className="mt-3 text-ql-section font-semibold">Start with returns</h2><p className="mt-3 max-w-xl text-ql-body text-ql-secondary">Understand what an investment earns, compare price changes, and see how returns compound over time.</p>
      <div className="mt-6 rounded-ql-xl border border-ql-border bg-ql-surface p-6 sm:p-8"><h3 className="text-ql-title font-semibold">Returns &amp; Compounding</h3><p className="mt-2 text-ql-small text-ql-secondary">3 available lessons · {summary.lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0)} min</p><div className="mt-5 max-w-md"><LearningProgressBar value={summary.completed.length} total={summary.lessons.length} label="Available Returns learning" /></div><p className="mt-3 text-ql-small text-ql-secondary">{summary.completed.length} of 3 available lessons complete</p><LearningLink href="/learn/returns" className="mt-6">Explore Returns</LearningLink></div>
    </section>
    <section className="mt-12" aria-labelledby="roadmap-title"><h2 id="roadmap-title" className="text-ql-section font-semibold">Where your learning can take you</h2><p className="mt-3 text-ql-small text-ql-secondary">The road ahead. These areas are planned and are not available yet.</p><ol className="mt-8">{roadmap.map(([title, description], index) => <li key={title} className="flex gap-5 border-t border-ql-border py-6"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-ql-full bg-ql-subtle text-ql-small text-ql-secondary">{index + 2}</span><div><p className="text-ql-meta font-semibold text-ql-secondary">UPCOMING</p><h3 className="mt-1 text-ql-title font-semibold">{title}</h3><p className="mt-2 text-ql-small text-ql-secondary">{description}</p></div></li>)}</ol></section>
  </main>;
}
