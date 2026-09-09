import { describe, expect, it } from "vitest";
import { getReturnsPath } from "./returns-path";
import { returnsLessons } from "../lessons/returns/manifest";

describe("persisted Returns path", () => {
  it("shows available lessons without inventing in-progress state", () => {
    expect(getReturnsPath([]).map((item) => item.state)).toEqual(["available", "available", "available", "locked", "locked", "locked"]);
  });
  it("matches unordered persisted rows by lesson id, not array position", () => {
    const items = getReturnsPath([{ lessonId: returnsLessons[2].id, status: "in_progress" }, { lessonId: returnsLessons[0].id, status: "completed" }]);
    expect(items.map((item) => item.state)).toEqual(["completed", "available", "active", "locked", "locked", "locked"]);
  });
  it("never unlocks an unimplemented lesson from a stray progress row", () => {
    expect(getReturnsPath([{ lessonId: returnsLessons[3].id, status: "completed" }])[3].state).toBe("locked");
  });
});
