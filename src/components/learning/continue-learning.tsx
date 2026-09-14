import { getModuleBySlug } from "@/features/learning/catalog";
import { ArrowRight, BookOpen } from "lucide-react";
import { getLearnerSummary } from "@/features/learning/learner-summary";
import { LearningLink } from "./learning-button";
import { LearningProgressBar } from "./lesson-progress";

export function ContinueLearning({ summary }: { summary: ReturnType<typeof getLearnerSummary> }) {
  const { next, state, allComplete, position, stepCount } = summary;
  const currentStep = state?.status === "in_progress" ? position + 1 : 1;
  return <section aria-labelledby="continue-heading" className="min-w-0 overflow-hidden rounded-panel border border-primary/30 bg-surface shadow-elevation-1">
    <div className="flex items-center gap-3 border-b border-primary/20 bg-primary-soft px-5 py-4 sm:px-8">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface text-primary-hover shadow-elevation-1"><BookOpen className="size-5" /></span>
      <div className="min-w-0">
        <p className="text-microcopy font-extrabold tracking-[0.08em] text-primary-hover uppercase">Continue learning</p>
        <p className="mt-0.5 break-words text-small text-secondary">{getModuleBySlug(next.moduleSlug)?.title} · {next.estimatedMinutes} min</p>
      </div>
    </div>
    <div className="flex min-w-0 flex-wrap items-end gap-7 px-5 py-6 sm:px-8 sm:py-8">
      <div className="min-w-0 basis-[32rem] flex-1">
        <h2 id="continue-heading" className="break-words text-card-title font-bold text-primary-hover">Continue learning</h2>
        <h3 className="mt-2 break-words text-section-title font-bold tracking-[-0.02em]">{allComplete ? "Your foundations are growing" : next.title}</h3>
        <p className="mt-2 break-words text-small text-secondary">{allComplete ? "You’ve completed every currently available lesson. Revisit an idea whenever you want a refresher." : state?.status === "in_progress" ? `Step ${currentStep} of ${stepCount} · Your place is saved` : `Step 1 of ${stepCount} · Ready when you are`}</p>
        {!allComplete ? <div className="mt-5 max-w-xl">
          <div className="mb-2 flex items-center justify-between gap-4 text-microcopy font-semibold text-secondary"><span>Lesson progress</span><span className="shrink-0 tabular-nums">{currentStep} / {stepCount}</span></div>
          <LearningProgressBar value={position} total={stepCount} label="Current lesson progress" />
        </div> : null}
      </div>
      <LearningLink href={`/learn/${next.moduleSlug}/${next.slug}`} className="min-w-0 w-full px-3 md:w-auto md:min-w-56 md:px-5"><span className="min-w-0 break-words [overflow-wrap:anywhere]">{allComplete ? "Review lesson" : state?.status === "in_progress" ? "Continue learning" : "Start learning"}</span><ArrowRight aria-hidden="true" className="size-5 shrink-0" /></LearningLink>
    </div>
  </section>;
}
