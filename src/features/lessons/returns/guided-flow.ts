import type { AuthoredLesson } from "../types";
import { compoundingSteps } from "./compounding-flow";
import { foundationsSteps } from "../foundations/content";
import { availableLessons } from "../../learning/catalog";
import { returnsLessons } from "./manifest";

type Step = { title: string; kind?: "lesson" | "mastery"; blocks: readonly string[] };
const introductionSteps: Step[] = [
  { title: "Co měří výnos?", blocks: ["meaning", "price-change"] },
  { title: "Uveď změnu do kontextu", blocks: ["formula-one", "formula-two"] },
  { title: "Projdi si příklad", blocks: ["example-100", "positive-negative"] },
  { title: "Porovnej procentní změny", blocks: ["comparing", "compare-assets"] },
  { title: "Předpověz výsledek", blocks: ["prediction"] },
  { title: "Vyzkoušej kalkulačku výnosu", blocks: ["calculate"] },
  { title: "Vypočítej výnos", blocks: ["numeric"] },
  { title: "Ověř si porozumění", blocks: ["why-percent"] },
  { title: "Shrň si to", blocks: ["check", "takeaway", "checkpoint"] },
];
const simpleSteps: Step[] = [
  { title: "Jedno období po druhém", blocks: ["periods", "period-intro"] },
  { title: "Použij předchozí cenu", blocks: ["period-formula-one", "period-formula-two"] },
  { title: "Sleduj měnící se jmenovatel", blocks: ["period-example"] },
  { title: "Prozkoumej časovou řadu ceny", blocks: ["series", "series-figure"] },
  { title: "Vypočítej zisk", blocks: ["first-calculation"] },
  { title: "Vypočítej ztrátu", blocks: ["negative-return"] },
  { title: "Desetinná čísla a procenta", blocks: ["representation", "decimal-callout", "decimal-practice"] },
  { title: "Spočítej výnosová pozorování", blocks: ["comparison"] },
  { title: "Promysli dvě období", blocks: ["practice", "two-periods"] },
  { title: "Shrň si to", blocks: ["raw-differences", "takeaway", "checkpoint"] },
];
export function getStepDefinitions(lessonId: string): readonly Step[] {
  if (lessonId === returnsLessons[0].id) return introductionSteps;
  if (lessonId === returnsLessons[1].id) return simpleSteps;
  if (lessonId === returnsLessons[2].id) return compoundingSteps;
  if (foundationsSteps[lessonId]) return foundationsSteps[lessonId];
  throw new Error("This lesson is not available.");
}
/** Presentation only: the authored lessons remain the source of every concept and exercise. */
export function getGuidedSteps(lesson: AuthoredLesson) {
  return getStepDefinitions(lesson.id).map((step) => ({ title: step.title, kind: step.kind, blocks: step.blocks.map((id) => {
    const block = lesson.blocks.find((item) => item.id === id);
    if (!block) throw new Error(`Missing authored block: ${id}`);
    return block;
  }) }));
}
export function isFocusedLesson(pathname: string) {
  return availableLessons.some((lesson) => pathname === `/learn/${lesson.moduleSlug}/${lesson.slug}`);
}
