import { describe, expect, it } from "vitest";
import { evaluateUnlock, PORTFOLIO_LAB_UNLOCK_ID, progressionUnlocks } from "./unlocks";

const required = progressionUnlocks.PORTFOLIO_LAB.prerequisiteLessonIds;
const status = (xp: number, lessons: string[], persisted = false) => evaluateUnlock(PORTFOLIO_LAB_UNLOCK_ID, { totalXp: xp, completedLessonIds: new Set(lessons) }, persisted);

describe("Portfolio Lab unlock", () => {
  it("requires XP and every published Foundations lesson", () => {
    expect(status(0, []).unlocked).toBe(false);
    expect(status(420, required.slice(0, -1)).unlocked).toBe(false);
    expect(status(360, [...required]).unlocked).toBe(false);
    expect(status(420, [...required]).unlocked).toBe(true);
  });
  it("recognizes a recorded entitlement for existing users without fabricating XP", () => {
    const result = status(0, [], true);
    expect(result.unlocked).toBe(true);
    expect(result.totalXp).toBe(0);
  });
  it("uses the existing 60 XP receipt scale and exact minor units", () => {
    expect(required).toHaveLength(7);
    expect(progressionUnlocks.PORTFOLIO_LAB.xpRequired).toBe(required.length * 60);
    expect(progressionUnlocks.PORTFOLIO_LAB.rewardPracticeCapitalMinor).toBe(500_000n);
  });
});
