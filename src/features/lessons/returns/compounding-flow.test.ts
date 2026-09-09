import { describe, expect, it } from "vitest";
import { compoundingAndCumulativeReturnsLesson as lesson } from "./compounding-and-cumulative-returns";
import { compoundingRoute, compoundingSteps, getCompoundingSteps, usesLearningShell } from "./compounding-flow";
import { isQuestion } from "../question-evaluation";

describe("production compounding presentation", () => {
  it("preserves every authored block exactly once in ten learning steps", () => {
    const steps = getCompoundingSteps(lesson);
    expect(steps).toHaveLength(10);
    expect(steps.flatMap((step) => step.blocks)).toEqual(lesson.blocks);
    expect(new Set(compoundingSteps.flatMap((step) => [...step.blocks])).size).toBe(lesson.blocks.length);
  });
  it("ends question steps with one answer/check/continue interaction", () => {
    for (const step of getCompoundingSteps(lesson)) {
      const questions = step.blocks.filter(isQuestion);
      expect(questions.length).toBeLessThanOrEqual(1);
      if (questions.length) expect(step.blocks.at(-1)).toBe(questions[0]);
    }
  });
  it("opts only the two migrated routes into the new shell", () => {
    expect(usesLearningShell("/learn/returns")).toBe(true);
    expect(usesLearningShell(compoundingRoute)).toBe(true);
    for (const route of ["/dashboard", "/learn", "/sign-in", "/learn/returns/simple-returns", "/learn/returns/what-is-a-return", "/learn/volatility"]) expect(usesLearningShell(route)).toBe(false);
  });
});
