import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { LearningLink } from "@/components/learning/learning-button";
import { PageFrame } from "@/components/shell/page-frame";
import type { evaluateUnlock } from "@/features/progression/unlocks";

type UnlockStatus = ReturnType<typeof evaluateUnlock>;

export function LockedPortfolioLab({ unlock }: { unlock: UnlockStatus }) {
  return <PageFrame width="focused">
    <Link href="/lab" className="inline-flex min-h-11 items-center text-small font-semibold text-primary-hover">← Lab</Link>
    <div className="mt-10"><LockKeyhole aria-hidden="true" className="size-8 text-ql-link" /><p className="mt-5 text-ql-small font-semibold text-ql-secondary">Locked · Unlock through learning</p><h1 className="mt-2 break-words text-section-title font-bold min-[375px]:text-page-title">Portfolio Lab</h1>
      <p className="mt-4 max-w-xl text-ql-body text-ql-secondary">Learn the foundations first, then use Practice Capital to build your first portfolio.</p>
      <div className="mt-8 space-y-4 border-y border-ql-border py-6" aria-label="Unlock requirements">
        <p className="text-ql-body"><span aria-hidden="true">{unlock.prerequisitesComplete ? "✓" : "○"}</span> Investing Foundations <span className="ml-2 text-ql-small text-ql-secondary">{unlock.completedPrerequisiteLessons} / {unlock.requiredPrerequisiteLessons} lessons</span></p>
        <p className="text-ql-body"><span aria-hidden="true">{unlock.totalXp >= unlock.xpRequired ? "✓" : "○"}</span> {unlock.totalXp} / {unlock.xpRequired} XP</p>
      </div>
      <p className="mt-4 text-ql-small text-ql-secondary">Complete all Investing Foundations lessons and earn 420 XP. Those seven lessons currently provide the required XP.</p>
      <LearningLink href="/learn" className="mt-8 w-full sm:w-auto">Continue learning</LearningLink>
    </div>
  </PageFrame>;
}
