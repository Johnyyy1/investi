import { describe, expect, it } from "vitest";
import { getAuthoredLesson } from "./registry";
import { returnsLessons } from "./returns/manifest";

describe("authored lesson registry", () => {
  it("registers the first Returns lesson against the published manifest", () => {
    const lesson = getAuthoredLesson("returns", "what-is-a-return");
    expect(lesson).toMatchObject({ id: returnsLessons[0].id, title: "What is a return?" });
  });

  it("keeps unpublished Returns lessons out of the authored registry", () => {
    expect(getAuthoredLesson("returns", "simple-returns")).toBeUndefined();
  });
});
