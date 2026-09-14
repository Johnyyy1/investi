import type { Gamification } from "@/features/gamification/domain";
import type { SerializedPracticeCapitalMinor } from "@/features/rewards/presentation";

export type LearningMomentum = Pick<Gamification, "streak" | "todayCompleted" | "dailyTarget" | "timeZone">;

export type CompletionRewardPresentation = {
  practiceCapitalAwardedMinor: SerializedPracticeCapitalMinor;
  earnedPracticeCapitalMinor: SerializedPracticeCapitalMinor;
  learningMomentum: LearningMomentum;
  nextHref: string;
  nextTitle: string;
  allComplete: boolean;
};

/** Keeps legacy XP inside the server/domain model rather than the UI contract. */
export function toLearningMomentum(gamification: Gamification): LearningMomentum {
  return {
    streak: gamification.streak,
    todayCompleted: gamification.todayCompleted,
    dailyTarget: gamification.dailyTarget,
    timeZone: gamification.timeZone,
  };
}
