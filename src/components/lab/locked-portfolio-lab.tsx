import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { LearningLink } from "@/components/learning/learning-button";
import { PageFrame } from "@/components/shell/page-frame";
import type { evaluateUnlock } from "@/features/progression/unlocks";

type UnlockStatus = ReturnType<typeof evaluateUnlock>;

export function LockedPortfolioLab({ unlock }: { unlock: UnlockStatus }) {
  return <PageFrame width="focused">
    <Link href="/lab" className="inline-flex min-h-11 items-center text-small font-semibold text-primary-hover">← Lab</Link>
    <div className="mt-10"><LockKeyhole aria-hidden="true" className="size-8 text-ql-link" /><p className="mt-5 text-ql-small font-semibold text-ql-secondary">Zamčeno · odemkni učením</p><h1 className="mt-2 break-words text-section-title font-bold min-[375px]:text-page-title">Portfolio Lab</h1>
      <p className="mt-4 max-w-xl text-ql-body text-ql-secondary">Nejdřív zvládni základy, potom si s Practice Capitalem sestav první portfolio.</p>
      <div className="mt-8 space-y-4 border-y border-ql-border py-6" aria-label="Podmínky odemčení">
        <p className="text-ql-body"><span aria-hidden="true">{unlock.prerequisitesComplete ? "✓" : "○"}</span> Základy investování <span className="ml-2 text-ql-small text-ql-secondary">{unlock.completedPrerequisiteLessons} / {unlock.requiredPrerequisiteLessons} lekcí</span></p>
        <p className="text-ql-body"><span aria-hidden="true">{unlock.totalXp >= unlock.xpRequired ? "✓" : "○"}</span> {unlock.totalXp} / {unlock.xpRequired} XP</p>
      </div>
      <p className="mt-4 text-ql-small text-ql-secondary">Dokonči všech sedm lekcí Základů investování a získej 420 XP. Odemčením dostaneš jednorázově 5 000 Kč Practice Capital.</p>
      <LearningLink href="/learn" className="mt-8 w-full sm:w-auto">Pokračovat v učení</LearningLink>
    </div>
  </PageFrame>;
}
