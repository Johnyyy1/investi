import { AppHeader } from "@/components/shell/app-header";
import { loadLearner } from "@/features/learning/load-learner";
import { ContinueLearning } from "@/components/learning/continue-learning";
import { ModulePathPreview } from "@/components/learning/module-path-preview";
import { LearningProgressBar } from "@/components/learning/lesson-progress";
import { LearningLink } from "@/components/learning/learning-button";
import { moduleCatalog, getModuleLessons } from "@/features/learning/catalog";

export const metadata = { title: "Progress" };
export default async function ProgressPage() {
  const summary = await loadLearner();
  return <main className="mx-auto max-w-4xl space-y-10 px-5 py-8 sm:px-10 lg:py-12">
    <AppHeader title="Your progress" description="Every completed lesson adds to your investing foundations." />
    <p data-testid="available-progress" className="text-ql-small text-ql-secondary">{summary.completed.length} of {summary.lessons.length} available lessons complete. Planned lessons and future modules are excluded.</p>
    <ContinueLearning summary={summary} />
    {moduleCatalog.filter((module) => module.status === "available").map((module) => {
      const completed = summary.completed.filter((lesson) => lesson.moduleSlug === module.slug).length;
      return <section key={module.slug} aria-labelledby={`${module.slug}-progress`} className="border-t border-ql-border pt-6"><div className="mb-4 flex flex-wrap justify-between gap-3"><h2 id={`${module.slug}-progress`} className="text-ql-title font-semibold">{module.title}</h2><p className="text-ql-small text-ql-secondary">{completed} of {module.lessonCount} available lessons complete</p></div><LearningProgressBar value={completed} total={module.lessonCount} label={`Available ${module.title} lessons`} /><p className="mt-4 mb-8 text-ql-small text-ql-secondary">{getModuleLessons(module.slug).length - module.lessonCount} additional lessons planned. Completion measures available learning only.</p><ModulePathPreview slug={module.slug} states={summary.states} /><LearningLink variant="ghost" href={`/learn/${module.slug}`} className="mt-6">View full module path</LearningLink></section>;
    })}
  </main>;
}
