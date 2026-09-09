import { moduleCatalog, getModuleLessons } from "@/features/learning/catalog";
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
    <ol className="mt-10 border-l border-ql-border pl-5 sm:pl-8" aria-label="Available learning journey">{moduleCatalog.filter((module) => module.status === "available").map((module, index) => {
      const completed = summary.completed.filter((lesson) => lesson.moduleSlug === module.slug).length;
      const planned = getModuleLessons(module.slug).length - module.lessonCount;
      return <li key={module.slug} className="relative pb-10 last:pb-0"><p className="text-ql-small font-semibold text-ql-link">{index === 0 ? "START HERE · CHAPTER 01" : "THEN · CHAPTER 02"}</p><h2 className="mt-3 text-ql-section font-semibold">{module.title}</h2><p className="mt-3 max-w-xl text-ql-body text-ql-secondary">{module.description}</p>
        <div className="mt-6 rounded-ql-xl border border-ql-border bg-ql-surface p-6 sm:p-8"><p className="text-ql-small text-ql-secondary">{module.lessonCount} available lessons · {module.estimatedMinutes} min · {planned} upcoming</p><div className="mt-5 max-w-md"><LearningProgressBar value={completed} total={module.lessonCount} label={`Available ${module.title} learning`} /></div><p className="mt-3 text-ql-small text-ql-secondary">{completed} of {module.lessonCount} available lessons complete</p><LearningLink href={`/learn/${module.slug}`} className="mt-6">{index === 0 ? "Explore Foundations" : "Explore Returns"}</LearningLink></div>
      </li>;
    })}</ol>
    <section className="mt-12" aria-labelledby="roadmap-title"><h2 id="roadmap-title" className="text-ql-section font-semibold">Where your learning can take you</h2><p className="mt-3 text-ql-small text-ql-secondary">The road ahead. These areas are planned and are not available yet.</p><ol className="mt-8">{roadmap.map(([title, description], index) => <li key={title} className="flex gap-5 border-t border-ql-border py-6"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-ql-full bg-ql-subtle text-ql-small text-ql-secondary">{index + 3}</span><div><p className="text-ql-meta font-semibold text-ql-secondary">UPCOMING</p><h3 className="mt-1 text-ql-title font-semibold">{title}</h3><p className="mt-2 text-ql-small text-ql-secondary">{description}</p></div></li>)}</ol></section>
  </main>;
}
