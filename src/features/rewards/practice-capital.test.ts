import { describe, expect, it } from "vitest";
import {
  LESSON_PRACTICE_CAPITAL_MINOR,
  REWARD_POLICY_VERSION,
  getPracticeCapitalSummary,
} from "./practice-capital";

describe("Practice Capital reward policy", () => {
  it("awards exactly 2,000.00 CZK in minor units under policy v1", () => {
    expect(LESSON_PRACTICE_CAPITAL_MINOR).toBe(BigInt(200_000));
    expect(REWARD_POLICY_VERSION).toBe(1);
  });

  it("derives an exact total from authoritative lesson receipts", () => {
    const awards = [
      { lessonId: "a", practiceCapitalMinor: BigInt(200_000), rewardPolicyVersion: 1 },
      { lessonId: "b", practiceCapitalMinor: BigInt(200_000), rewardPolicyVersion: 1 },
      { lessonId: "c", practiceCapitalMinor: BigInt(200_000), rewardPolicyVersion: 1 },
    ];

    expect(getPracticeCapitalSummary(awards)).toEqual({ earnedPracticeCapitalMinor: BigInt(600_000) });
  });

  it("counts each lesson receipt once without deriving capital from XP", () => {
    const receipt = { lessonId: "lesson-a", xp: 0, practiceCapitalMinor: BigInt(200_000), rewardPolicyVersion: 1 };
    const awards = [receipt, { ...receipt, xp: 999_999, practiceCapitalMinor: BigInt(999_999) }];

    expect(getPracticeCapitalSummary(awards)).toEqual({ earnedPracticeCapitalMinor: BigInt(200_000) });
  });
});
