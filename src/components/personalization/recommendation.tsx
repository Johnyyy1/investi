import { ButtonLink } from "@/components/ui/button";
import type { LearningRecommendation } from "@/features/personalization/recommendation";
import { contextLabels, presentRecommendation, scaffoldLabels } from "@/features/personalization/presentation";

export function Recommendation({ recommendation, plan = false }: { recommendation: LearningRecommendation; plan?: boolean }) {
  const view = presentRecommendation(recommendation);
  return <section aria-label="Doporučeno pro tebe" className="min-w-0 rounded-panel border border-primary/30 bg-surface p-5 shadow-elevation-1 sm:p-8">
    <p className="text-small font-bold text-primary-hover">{plan ? "Doporučený začátek" : "Doporučeno pro tebe"}</p>
    <h2 className="mt-2 text-section-title font-bold [overflow-wrap:anywhere]">{view.lesson?.title ?? (recommendation.reasonCode === "CURRICULUM_COMPLETE" ? "Všechny lekce máš hotové" : "Doporučení není dostupné")}</h2>
    {view.lesson && <p className="mt-2 text-small text-secondary">{view.moduleTitle} · přibližně {view.lesson.estimatedMinutes} min</p>}
    <p className="mt-4 text-body">{view.reason}</p>
    {view.lesson && <>
      <p className="mt-2 text-small text-secondary">{contextLabels[recommendation.exampleContext]}</p>
      <details className="mt-4 text-small text-secondary"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-hover">Jak si rozvrhnout učení</summary><p className="mt-2">{scaffoldLabels[recommendation.scaffoldLevel]}</p>{recommendation.splitLessonAcrossSessions && <p className="mt-2">Lekci si můžeš rozdělit do více sezení. Uložený postup tě dovede zpět.</p>}</details>
    </>}
    <ButtonLink href={view.href ?? "/learn#curriculum"} className="mt-5 w-full min-w-0 whitespace-normal text-center [overflow-wrap:anywhere] sm:w-auto">{view.href ? plan ? "Začít doporučenou lekci" : "Pokračovat" : "Zobrazit celé učení"}</ButtonLink>
  </section>;
}
