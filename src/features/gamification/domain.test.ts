import { describe, expect, it } from "vitest";
import { dailyLessonTarget, getGamification, learningDate, LESSON_XP, validTimeZone } from "./domain";
const now = new Date("2026-09-09T12:00:00Z");
const award = (lessonId: string, learningDate: string) => ({ lessonId, learningDate, xp: LESSON_XP, awardedAt: now });
describe("persisted learning-day read model", () => {
  it("has no invented progress for a new learner", () => expect(getGamification([], now, "UTC", 10)).toEqual({ totalXp: 0, streak: 0, todayCompleted: 0, dailyTarget: 1, timeZone: "UTC" }));
  it("deduplicates lessons but counts multiple new lessons on the same day", () => {
    const rows = [award("a", "2026-09-08"), award("b", "2026-09-09"), award("c", "2026-09-09")];
    expect(getGamification([...rows, rows[2]], now, "UTC", 20)).toMatchObject({ totalXp: 180, streak: 2, todayCompleted: 2, dailyTarget: 2 });
  });
  it("keeps yesterday's streak available until today ends", () => expect(getGamification([award("a", "2026-09-07"), award("b", "2026-09-08")], now, "UTC").streak).toBe(2));
  it("a missed day resets the active streak without removing XP", () => expect(getGamification([award("a", "2026-09-07")], now, "UTC")).toMatchObject({ streak: 0, totalXp: 60 }));
  it("resumes at one after a gap, ignoring future activity for streaks", () => expect(getGamification([award("a", "2026-09-07"), award("b", "2026-09-09"), award("c", "2026-09-10")], now, "UTC").streak).toBe(1));
  it("uses local calendar boundaries, including DST and leap days", () => {
    expect(learningDate(new Date("2026-09-09T23:30:00Z"), "Europe/Prague")).toBe("2026-09-10");
    expect(learningDate(new Date("2026-09-09T01:30:00Z"), "America/New_York")).toBe("2026-09-08");
    expect(getGamification([award("a", "2026-03-28"), award("b", "2026-03-29"), award("c", "2026-03-30")], new Date("2026-03-30T00:30:00Z"), "Europe/Prague").streak).toBe(3);
    expect(getGamification([award("a", "2024-02-28"), award("b", "2024-02-29"), award("c", "2024-03-01")], new Date("2024-03-01T12:00:00Z"), "UTC").streak).toBe(3);
  });
  it.each([[5, 1], [10, 1], [15, 2], [20, 2], [null, 1]])("maps a %s minute preference to %s lessons", (minutes, target) => expect(dailyLessonTarget(minutes)).toBe(target));
  it.each(["not/a-zone", "", null, 5])("rejects invalid timezone %s", (zone) => expect(() => validTimeZone(zone)).toThrow());
});
