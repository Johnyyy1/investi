import { describe, expect, it } from "vitest";
import type { LearnerState } from "@/features/learning/learner-summary";
import { weeklyActivity } from "./activity";

function completion(lessonId: string, date: string): LearnerState {
  const completedAt = new Date(date);
  return { lessonId, status: "completed", completedAt, updatedAt: completedAt, lastPosition: 1 };
}

describe("Progress calendar week presentation", () => {
  it("shows an empty Monday–Sunday week without invented activity", () => {
    const result = weeklyActivity([], new Date("2026-09-30T12:00:00Z"), "Europe/Prague");
    expect(result.completed).toBe(0);
    expect(result.days.map((day) => day.date)).toEqual(["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(result.days[2].today).toBe(true);
  });
  it("counts each completed lesson once and excludes future, old, and unfinished lessons", () => {
    const monday = completion("a", "2026-09-28T10:00:00Z");
    const rows = [monday, monday, completion("b", "2026-09-28T12:00:00Z"), completion("old", "2026-09-27T10:00:00Z"), completion("future", "2026-10-01T10:00:00Z"), { ...completion("active", "2026-09-29T10:00:00Z"), status: "in_progress" as const }, { ...monday, lessonId: "missing", completedAt: null }];
    const result = weeklyActivity(rows, new Date("2026-09-30T12:00:00Z"), "Europe/Prague");
    expect(result.completed).toBe(2);
    expect(result.days[0].completed).toBe(2);
  });
  it("uses local midnight and crosses the year boundary", () => {
    const result = weeklyActivity([completion("local-monday", "2025-12-28T23:30:00Z")], new Date("2026-01-01T12:00:00Z"), "Europe/Prague");
    expect(result.days[0]).toMatchObject({ date: "2025-12-29", completed: 1 });
    expect(result.days[6].date).toBe("2026-01-04");
  });
  it("keeps Sunday in the ending week through daylight saving time", () => {
    const result = weeklyActivity([completion("sunday", "2026-03-29T01:30:00Z")], new Date("2026-03-29T12:00:00Z"), "Europe/Prague");
    expect(result.days[0].date).toBe("2026-03-23");
    expect(result.days[6]).toMatchObject({ today: true, completed: 1 });
  });
});
