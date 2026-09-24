/**
 * Reward policy v2: a first lesson completion earns XP only. Historical v1
 * receipts retain their stored Practice Capital amount and remain authoritative.
 */
export const LEGACY_REWARD_POLICY_VERSION = 1;
export const XP_ONLY_REWARD_POLICY_VERSION = 2;
export const LESSON_PRACTICE_CAPITAL_MINOR = BigInt(0);
export const REWARD_POLICY_VERSION = XP_ONLY_REWARD_POLICY_VERSION;
export const LEGACY_LESSON_PRACTICE_CAPITAL_MINOR = BigInt(200_000);

export type PracticeCapitalAward = {
  lessonId: string;
  practiceCapitalMinor: bigint;
  rewardPolicyVersion: number;
};

/** Exact receipt-derived entitlement; there is deliberately no mutable balance counter. */
export function getPracticeCapitalSummary(awards: readonly PracticeCapitalAward[], unlockGrants: readonly bigint[] = []) {
  const unique = new Map<string, PracticeCapitalAward>();
  for (const award of awards) {
    if (!unique.has(award.lessonId)) unique.set(award.lessonId, award);
  }
  return {
    earnedPracticeCapitalMinor: [...unique.values()].reduce(
      (total, award) => total + award.practiceCapitalMinor,
      unlockGrants.reduce((total, amount) => total + amount, BigInt(0)),
    ),
  };
}
