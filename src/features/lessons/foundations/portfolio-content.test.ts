import { describe, expect, it } from "vitest";
import { getGuidedSteps } from "../returns/guided-flow";
import { getAuthoredLesson } from "../registry";

describe("Your first portfolio content integrity", () => {
  const lesson = getAuthoredLesson("investing-foundations", "your-first-portfolio")!;

  it("uses twelve meaningful steps and the shared guided flow", () => {
    const steps = getGuidedSteps(lesson);
    expect(steps).toHaveLength(12);
    expect(steps.map((step) => step.title)).toEqual([
      "A collection shaped by its parts",
      "One outcome can dominate",
      "See what spreading exposure can change",
      "Allocation gives each part a share",
      "Build, predict, and observe",
      "Each asset can play more than one role",
      "Weights shape the one-period result",
      "Diversification reduces some dependencies",
      "Match uncertainty to the time available",
      "Emotional comfort is not financial capacity",
      "Every portfolio is a set of trade-offs",
      "The mix is the decision",
    ]);
    expect(steps.flatMap((step) => step.blocks)).toEqual(lesson.blocks);
  });

  it("includes the required interactive models and weighted-return formula", () => {
    const figures = lesson.blocks.filter((block) => block.type === "interactiveFigure").map((block) => block.figure);
    expect(figures).toEqual(["diversification-impact", "portfolio-builder", "asset-comparison", "portfolio-horizon-scenario", "risk-capacity-scenario"]);
    expect(lesson.blocks.find((block) => block.id === "weighted-formula")).toMatchObject({ type: "formula", latex: "R_p = \\sum_{i=1}^{n} w_i R_i" });
    expect(lesson.blocks.find((block) => block.id === "weighted-check")).toMatchObject({ type: "numericQuestion", answer: 5 });
  });

  it("states the key safeguards without presenting a universal allocation", () => {
    const copy = lesson.blocks.map((block) => JSON.stringify(block)).join(" ");
    expect(copy).toContain("Diversification does not guarantee profit");
    expect(copy).toContain("does not guarantee recovery or profit");
    expect(copy).toContain("not a default, ideal, or recommendation");
    expect(copy).toContain("Risk tolerance is emotional willingness; risk capacity is the financial ability to absorb losses");
    expect(copy).toContain("no universally optimal beginner portfolio");
  });
});
