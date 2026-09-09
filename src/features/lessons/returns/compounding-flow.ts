import type { AuthoredLesson } from "../types";
import { returnsLessons } from "./manifest";

export const compoundingRoute = `/learn/returns/${returnsLessons[2].slug}`;

/** Presentation order only. Explanations, examples and answers stay in the authored lesson. */
export const compoundingSteps = [
  { title: "From one period to a sequence", blocks: ["why-addition-fails", "recap"] },
  { title: "Make a prediction", blocks: ["prediction"] },
  { title: "The starting value changes", blocks: ["twenty-example"] },
  { title: "Think in growth factors", blocks: ["growth-factors", "growth-callout"] },
  { title: "Multiply the growth factors", blocks: ["cumulative-formula", "value-formula"] },
  { title: "Explore compounding", blocks: ["explore", "compounding-explorer", "two-gains"] },
  { title: "Connect returns to prices", blocks: ["price-series", "price-series-example", "multi-period"] },
  { title: "Recovering from a loss", blocks: ["asymmetry", "recovery-explorer", "loss-practice"] },
  { title: "Check your understanding", blocks: ["concept"] },
  { title: "Bring it together", blocks: ["takeaway", "checkpoint"] },
] as const;

export function getCompoundingSteps(lesson: AuthoredLesson) {
  return compoundingSteps.map((step) => ({ title: step.title, blocks: step.blocks.map((id) => {
    const block = lesson.blocks.find((item) => item.id === id);
    if (!block) throw new Error(`Missing authored compounding block: ${id}`);
    return block;
  }) }));
}
