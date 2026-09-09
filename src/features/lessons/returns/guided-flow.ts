import type { AuthoredLesson } from "../types";
import { compoundingSteps } from "./compounding-flow";
import { foundationsSteps } from "../foundations/content";
import { availableLessons } from "../../learning/catalog";
import { returnsLessons } from "./manifest";

type Step = { title: string; blocks: readonly string[] };
const introductionSteps: Step[] = [
  { title: "What does a return measure?", blocks: ["meaning", "price-change"] },
  { title: "Put the change in context", blocks: ["formula-one", "formula-two"] },
  { title: "Follow a worked example", blocks: ["example-100", "positive-negative"] },
  { title: "Compare percentage changes", blocks: ["comparing", "compare-assets"] },
  { title: "Make a prediction", blocks: ["prediction"] },
  { title: "Try the return calculator", blocks: ["calculate"] },
  { title: "Calculate a return", blocks: ["numeric"] },
  { title: "Check your understanding", blocks: ["why-percent"] },
  { title: "Bring it together", blocks: ["check", "takeaway", "checkpoint"] },
];
const simpleSteps: Step[] = [
  { title: "One period at a time", blocks: ["periods", "period-intro"] },
  { title: "Use the previous price", blocks: ["period-formula-one", "period-formula-two"] },
  { title: "Follow the changing denominator", blocks: ["period-example"] },
  { title: "Explore a price series", blocks: ["series", "series-figure"] },
  { title: "Calculate a gain", blocks: ["first-calculation"] },
  { title: "Calculate a loss", blocks: ["negative-return"] },
  { title: "Decimals and percentages", blocks: ["representation", "decimal-callout", "decimal-practice"] },
  { title: "Compare two investments", blocks: ["comparison"] },
  { title: "Reason through two periods", blocks: ["practice", "two-periods"] },
  { title: "Bring it together", blocks: ["raw-differences", "takeaway", "checkpoint"] },
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
  return getStepDefinitions(lesson.id).map((step) => ({ title: step.title, blocks: step.blocks.map((id) => {
    const block = lesson.blocks.find((item) => item.id === id);
    if (!block) throw new Error(`Missing authored block: ${id}`);
    return block;
  }) }));
}
export function isFocusedLesson(pathname: string) {
  return availableLessons.some((lesson) => pathname === `/learn/${lesson.moduleSlug}/${lesson.slug}`);
}
