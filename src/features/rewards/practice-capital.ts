/**
 * Reward policy v1: one eligible first lesson completion earns 2,000.00 CZK
 * (200,000 minor units) of virtual, non-withdrawable Practice Capital.
 */
export const LESSON_PRACTICE_CAPITAL_MINOR = BigInt(200_000);
export const REWARD_POLICY_VERSION = 1;

export type PracticeCapitalAward = {
  lessonId: string;
  practiceCapitalMinor: bigint;
  rewardPolicyVersion: number;
};

/** Exact receipt-derived entitlement; there is deliberately no mutable balance counter. */
export function getPracticeCapitalSummary(awards: readonly PracticeCapitalAward[]) {
  const unique = new Map<string, PracticeCapitalAward>();
  for (const award of awards) {
    if (!unique.has(award.lessonId)) unique.set(award.lessonId, award);
  }
  return {
    earnedPracticeCapitalMinor: [...unique.values()].reduce(
      (total, award) => total + award.practiceCapitalMinor,
      BigInt(0),
    ),
  };
}
