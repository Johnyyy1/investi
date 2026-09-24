import { describe, expect, it } from "vitest";
import {
  LEGACY_LESSON_PRACTICE_CAPITAL_MINOR,
  LEGACY_REWARD_POLICY_VERSION,
  LESSON_PRACTICE_CAPITAL_MINOR,
  REWARD_POLICY_VERSION,
  XP_ONLY_REWARD_POLICY_VERSION,
  getPracticeCapitalSummary,
} from "./practice-capital";

describe("Practice Capital reward policy", () => {
  it("awards XP-only lesson receipts under policy v2", () => {
    expect(LESSON_PRACTICE_CAPITAL_MINOR).toBe(BigInt(0));
    expect(REWARD_POLICY_VERSION).toBe(XP_ONLY_REWARD_POLICY_VERSION);
  });

  it("preserves historical v1 capital while new v2 receipts add none", () => {
    const awards = [
      { lessonId: "a", practiceCapitalMinor: LEGACY_LESSON_PRACTICE_CAPITAL_MINOR, rewardPolicyVersion: LEGACY_REWARD_POLICY_VERSION },
      { lessonId: "b", practiceCapitalMinor: BigInt(0), rewardPolicyVersion: XP_ONLY_REWARD_POLICY_VERSION },
    ];

    expect(getPracticeCapitalSummary(awards, [BigInt(500_000)])).toEqual({ earnedPracticeCapitalMinor: BigInt(700_000) });
  });

  it("counts each lesson receipt once without deriving capital from XP", () => {
    const receipt = { lessonId: "lesson-a", xp: 0, practiceCapitalMinor: LEGACY_LESSON_PRACTICE_CAPITAL_MINOR, rewardPolicyVersion: LEGACY_REWARD_POLICY_VERSION };
    const awards = [receipt, { ...receipt, xp: 999_999, practiceCapitalMinor: BigInt(999_999) }];

    expect(getPracticeCapitalSummary(awards)).toEqual({ earnedPracticeCapitalMinor: LEGACY_LESSON_PRACTICE_CAPITAL_MINOR });
  });
});
