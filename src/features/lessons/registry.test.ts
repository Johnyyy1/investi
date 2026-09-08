import { describe, expect, it } from "vitest";
import { getAuthoredLesson } from "./registry";
import { returnsLessons } from "./returns/manifest";

describe("authored lesson registry", () => {
  it("registers the first Returns lesson against the published manifest", () => {
    const lesson = getAuthoredLesson("returns", "what-is-a-return");
    expect(lesson).toMatchObject({ id: returnsLessons[0].id, title: "What is a return?" });
  });

  it("registers the three published Returns lessons while later lessons stay unavailable", () => {
    expect(getAuthoredLesson("returns", "simple-returns")).toMatchObject({ title: "Simple returns" });
    expect(getAuthoredLesson("returns", "compounding-and-cumulative-returns")).toMatchObject({ title: "Compounding & cumulative returns" });
    expect(getAuthoredLesson("returns", "log-returns")).toBeUndefined();
  });
});
