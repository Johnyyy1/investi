import { ArrowRight, BookOpen } from "lucide-react";
import { recommendLearningPath, type Preferences } from "@/features/onboarding/domain";

export function PathRecommendation({ answers }: { answers: Preferences }) {
  const path = recommendLearningPath(answers);
  return <div>
    <p className="text-ql-body text-ql-secondary">{path.reason}</p>
    <div className="mt-8 rounded-ql-lg border border-ql-border bg-ql-surface p-5 sm:p-7">
      <p className="flex items-center gap-2 text-ql-small font-semibold text-ql-link"><BookOpen aria-hidden="true" className="size-5" /> Start here · Available now</p>
      <h2 className="mt-3 text-ql-section font-semibold">{path.recommendedModule.title}</h2>
      <p className="mt-2 text-ql-small text-ql-secondary">Begin with “What is a return?” and build toward compounding.</p>
      {path.futureTargets.length > 0 && <div className="mt-6 border-t border-ql-border pt-5"><h3 className="text-ql-small font-semibold">Coming later</h3><p className="mt-1 text-ql-small text-ql-secondary">Based on the goals and interests you chose.</p><ul className="mt-3 space-y-3">{path.futureTargets.map((target) => <li className="flex items-center gap-2 text-ql-small" key={target}><ArrowRight aria-hidden="true" className="size-4 shrink-0 text-ql-secondary" />{target}</li>)}</ul></div>}
    </div>
  </div>;
}
