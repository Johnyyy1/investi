import { describe, expect, it } from "vitest";
import { demoSeed } from "./seed";
import { getGamification } from "@/features/gamification/domain";
import { getLearnerSummary } from "@/features/learning/learner-summary";
import { availableLessons } from "@/features/learning/catalog";
import { getPracticeCapitalSummary, LESSON_PRACTICE_CAPITAL_MINOR, REWARD_POLICY_VERSION } from "@/features/rewards/practice-capital";
it("creates a consistent populated lesson history and real reward ledger", () => {
  const now = new Date("2026-09-09T00:01:00Z");
  const seed = demoSeed(now);
  expect(getGamification(seed.awards, now, "UTC", 20)).toMatchObject({ totalXp: 360, streak: 4, todayCompleted: 1, dailyTarget: 2 });
  expect(getPracticeCapitalSummary(seed.awards)).toEqual({ earnedPracticeCapitalMinor: BigInt(1_200_000) });
  expect(seed.awards.every((award) => award.practiceCapitalMinor === LESSON_PRACTICE_CAPITAL_MINOR && award.rewardPolicyVersion === REWARD_POLICY_VERSION)).toBe(true);
  expect(seed.progress.filter((row) => row.status === "completed").map((row) => row.lessonId)).toEqual(seed.awards.map((row) => row.lessonId));
  expect(seed.awards.every((award) => award.awardedAt <= now)).toBe(true);
  expect(seed.progress.every((row) => availableLessons.some((lesson) => lesson.id === row.lessonId))).toBe(true);
  expect(getLearnerSummary(seed.progress).next.id).toBe("foundations-risk-reward");
});
describe("isolated deterministic seed values", () => {
  it("allocates fresh objects for every visitor", () => {
    const now = new Date("2026-09-09T12:00:00Z");
    const a = demoSeed(now), b = demoSeed(now);
    expect(a).toEqual(b);
    a.progress[0].lastPosition = 99;
    a.awards[0].xp = 999;
    a.awards[0].practiceCapitalMinor = BigInt(999);
    expect(b.progress[0].lastPosition).not.toBe(99);
    expect(b.awards[0].xp).toBe(60);
    expect(b.awards[0].practiceCapitalMinor).toBe(BigInt(200_000));
  });
});
