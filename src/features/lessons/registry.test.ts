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

describe("published curriculum integrity", () => {
  it("has exactly one authored lesson per available manifest entry", async () => {
    const { availableLessons, curriculumLessons } = await import("../learning/catalog");
    const { authoredLessons } = await import("./registry");
    expect(new Set(authoredLessons.map((lesson) => lesson.id)).size).toBe(authoredLessons.length);
    expect(authoredLessons.map((lesson) => lesson.id).sort()).toEqual(availableLessons.map((lesson) => lesson.id).sort());
    for (const definition of availableLessons) {
      expect(getAuthoredLesson(definition.moduleSlug, definition.slug)).toMatchObject({ id: definition.id, title: definition.title, estimatedMinutes: definition.estimatedMinutes });
    }
    for (const definition of curriculumLessons.filter((lesson) => lesson.status === "planned")) {
      expect(getAuthoredLesson(definition.moduleSlug, definition.slug)).toBeUndefined();
    }
  });
});
