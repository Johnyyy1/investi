import { FOUNDATIONS_MODULE_ID, foundationsLessons } from "@/features/lessons/foundations/manifest";

export const PORTFOLIO_LAB_UNLOCK_ID = "PORTFOLIO_LAB";
export const PORTFOLIO_LAB_UNLOCK_CAPITAL_MINOR = 500_000n;

const foundationsLessonIds = foundationsLessons.filter((lesson) => lesson.status === "available").map((lesson) => lesson.id);

/** Seven published Foundations lessons earn 7 × 60 = 420 XP. The threshold is named
 * separately so later learning content can contribute without changing the prerequisite. */
export const progressionUnlocks = {
  [PORTFOLIO_LAB_UNLOCK_ID]: {
    id: PORTFOLIO_LAB_UNLOCK_ID,
    name: "Portfolio Lab",
    xpRequired: 420,
    prerequisiteModuleIds: [FOUNDATIONS_MODULE_ID],
    prerequisiteLessonIds: foundationsLessonIds,
    rewardPracticeCapitalMinor: PORTFOLIO_LAB_UNLOCK_CAPITAL_MINOR,
  },
} as const;

export type UnlockId = keyof typeof progressionUnlocks;
export type LearningProgression = { totalXp: number; completedLessonIds: ReadonlySet<string> };

export function evaluateUnlock(id: UnlockId, progression: LearningProgression, persisted = false) {
  const definition = progressionUnlocks[id];
  const completedPrerequisiteLessons = definition.prerequisiteLessonIds.filter((lessonId) => progression.completedLessonIds.has(lessonId)).length;
  const requiredPrerequisiteLessons = definition.prerequisiteLessonIds.length;
  const prerequisitesComplete = completedPrerequisiteLessons === requiredPrerequisiteLessons;
  return {
    id,
    name: definition.name,
    totalXp: progression.totalXp,
    xpRequired: definition.xpRequired,
    completedPrerequisiteLessons,
    requiredPrerequisiteLessons,
    prerequisitesComplete,
    unlocked: persisted || (progression.totalXp >= definition.xpRequired && prerequisitesComplete),
  };
}
