import { describe, expect, it } from "vitest";
import { getModuleBySlug, getModulePath, moduleCatalog } from "./catalog";
import { returnsLessons } from "../lessons/returns/manifest";

describe("module catalog", () => {
  it("exposes Investing Foundations as the first available module", () => {
    expect(moduleCatalog[0]).toMatchObject({ slug: "investing-foundations", status: "available" });
  });

  it("returns undefined for an unknown module", () => {
    expect(getModuleBySlug("unknown-module")).toBeUndefined();
  });
});

describe("persisted Returns path", () => {
  it("shows available lessons without inventing in-progress state", () => {
    expect(getModulePath("returns", []).map((item) => item.state)).toEqual(["available", "available", "available", "available", "available", "locked"]);
  });
  it("matches unordered persisted rows by lesson id, not array position", () => {
    const items = getModulePath("returns", [{ lessonId: returnsLessons[2].id, status: "in_progress" }, { lessonId: returnsLessons[0].id, status: "completed" }]);
    expect(items.map((item) => item.state)).toEqual(["completed", "available", "active", "available", "available", "locked"]);
  });
  it("never unlocks an unimplemented lesson from a stray progress row", () => {
    const planned = returnsLessons.filter((lesson) => lesson.status === "planned");
    const path = getModulePath("returns", planned.map((lesson) => ({ lessonId: lesson.id, status: "completed" })));
    expect(path.filter((item) => planned.some((lesson) => lesson.id === item.id)).map((item) => item.state)).toEqual(["locked"]);
  });
});
