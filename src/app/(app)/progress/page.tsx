import { AppHeader } from "@/components/shell/app-header";
import { loadLearner } from "@/features/learning/load-learner";
import { ContinueLearning } from "@/components/learning/continue-learning";
import { ReturnsPathPreview } from "@/components/learning/returns-path-preview";
import { LearningProgressBar } from "@/components/learning/lesson-progress";

export const metadata = { title: "Progress" };
export default async function ProgressPage() {
  const summary = await loadLearner();
  return <main className="mx-auto max-w-4xl space-y-10 px-5 py-8 sm:px-10 lg:py-12">
    <AppHeader title="Your progress" description="Every completed lesson adds to your investing foundations." />
    <section aria-labelledby="returns-progress" className="border-y border-ql-border py-6"><div className="mb-4 flex flex-wrap justify-between gap-3"><h2 id="returns-progress" className="text-ql-title font-semibold">Returns</h2><p className="text-ql-small text-ql-secondary" data-testid="available-progress">{summary.completed.length} of {summary.lessons.length} available lessons complete · {summary.percentage}%</p></div><LearningProgressBar value={summary.completed.length} total={summary.lessons.length} label="Available Returns lessons" /><p className="mt-4 text-ql-small text-ql-secondary">{summary.allComplete ? "All available lessons completed. Three more lessons are coming soon." : summary.states.some((state) => state.status === "in_progress") ? "In progress. Continue from your saved place below." : summary.completed.length ? "Ready for your next lesson." : "Ready to begin. Your progress will appear as you learn."}</p></section>
    <ContinueLearning summary={summary} />
    <section aria-labelledby="lesson-progress"><h2 id="lesson-progress" className="mb-6 text-ql-section font-semibold">Your lessons</h2><ReturnsPathPreview states={summary.states} /></section>
  </main>;
}
