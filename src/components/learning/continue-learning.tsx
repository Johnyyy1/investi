import { getModuleBySlug } from "@/features/learning/catalog";
import { ArrowRight } from "lucide-react";
import { getLearnerSummary } from "@/features/learning/learner-summary";
import { LearningLink } from "./learning-button";
import { LearningProgressBar } from "./lesson-progress";

export function ContinueLearning({ summary }: { summary: ReturnType<typeof getLearnerSummary> }) {
  const { next, state, allComplete, position, stepCount } = summary;
  return <section aria-labelledby="continue-heading" className="rounded-ql-xl border border-ql-border bg-ql-surface p-6 shadow-ql-sm sm:p-8">
    <p className="text-ql-small font-semibold text-ql-link">{getModuleBySlug(next.moduleSlug)?.title} · {next.estimatedMinutes} min</p>
    <h2 id="continue-heading" className="mt-3 text-ql-section font-semibold">{allComplete ? "Your foundations are growing" : "Continue learning"}</h2>
    <p className="mt-2 text-ql-emphasis">{allComplete ? "You’ve completed every currently available lesson." : next.title}</p>
    <p className="mt-2 text-ql-small text-ql-secondary">{allComplete ? "Revisit an idea to strengthen your understanding. More lessons are coming soon." : state?.status === "in_progress" ? `Step ${position + 1} of ${stepCount} · Your place is saved` : "A new idea, a worked example, and a chance to try it yourself."}</p>
    {!allComplete ? <div className="mt-5 max-w-md"><LearningProgressBar value={position} total={stepCount} label="Current lesson progress" /></div> : null}
    <LearningLink href={`/learn/${next.moduleSlug}/${next.slug}`} className="mt-6">{allComplete ? "Review lesson" : state?.status === "in_progress" ? "Continue lesson" : "Start lesson"}<ArrowRight aria-hidden="true" className="size-5" /></LearningLink>
  </section>;
}
