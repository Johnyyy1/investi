import { describe, expect, it } from "vitest";
import { saveLessonProgressSchema } from "./schemas";

describe("saveLessonProgressSchema", () => {
  it("accepts a completion checkpoint", () => {
    expect(saveLessonProgressSchema.parse({ lessonId: "lesson-returns-01", status: "completed", lastPosition: 4 })).toMatchObject({ status: "completed", lastPosition: 4 });
  });

  it("rejects a negative lesson position", () => {
    expect(() => saveLessonProgressSchema.parse({ lessonId: "lesson-returns-01", status: "in_progress", lastPosition: -1 })).toThrow();
  });
});
