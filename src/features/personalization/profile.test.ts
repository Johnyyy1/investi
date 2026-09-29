import { describe, expect, it } from "vitest";
import { defaultPreferences, personalizedPreferencesSchema, primaryGoalValues, readLearnerProfile, requiresInitialOnboarding, sessionMinutes, toProfileColumns } from "./profile";

describe("existing learning profile extension", () => {
  it.each(primaryGoalValues)("accepts stable primary goal %s in reused columns", (primaryGoal) => {
    expect(toProfileColumns({ ...defaultPreferences, primaryGoal })).toMatchObject({ goals: [primaryGoal], experienceLevel: "BEGINNER", dailyGoalMinutes: 10 });
  });
  it.each(sessionMinutes)("accepts session time %i", (preferredSessionMinutes) => {
    expect(personalizedPreferencesSchema.safeParse({ ...defaultPreferences, preferredSessionMinutes }).success).toBe(true);
  });
  it("accepts multiple unique interests", () => {
    const interests = ["ETFS", "DATA", "BACKTESTING"];
    expect(toProfileColumns({ ...defaultPreferences, interests }).interests).toEqual(interests);
  });
  it.each([{ primaryGoal: "rich" }, { primaryGoal: ["QUANT", "PORTFOLIO"] }, { interests: ["CRYPTO"] }, { interests: ["ETFS", "ETFS"] }, { preferredSessionMinutes: 15 }, { preferredSessionMinutes: 0 }, { preferredSessionMinutes: "10" }, { selfAssessedExperience: "ADVANCED" }, { diagnosticLevel: "strong" }, { userId: "victim" }, { xp: 420 }, { lessonId: "foundations-why-invest", status: "completed" }, { entitlement: "PORTFOLIO_LAB" }, { practiceCapitalMinor: 500000 }, { recommendation: "returns" }, { scaffoldLevel: "compact" }, { score: 5 }])("rejects invalid new profile %j", (patch) => {
    expect(personalizedPreferencesSchema.safeParse({ ...defaultPreferences, ...patch }).success).toBe(false);
  });
  it("normalizes legacy answers without mutating stored fields or inventing evidence", () => {
    const old = { goals: ["MARKETS", "QUANT", "COMPANIES"], interests: ["MARKETS", "STOCKS"], experienceLevel: "ADVANCED", dailyGoalMinutes: 15 };
    const before = structuredClone(old);
    expect(readLearnerProfile(old)).toEqual({ primaryGoal: "QUANT", interests: ["STOCKS"], selfAssessedExperience: "INVESTOR", preferredSessionMinutes: 20, diagnostic: null, personalized: false });
    expect(old).toEqual(before);
  });
  it("uses neutral defaults for missing or skipped profiles", () => {
    expect(readLearnerProfile()).toEqual({ ...defaultPreferences, diagnostic: null, personalized: false });
    expect(readLearnerProfile(toProfileColumns(defaultPreferences))).toEqual(readLearnerProfile());
  });
  it("never gates existing history or completed onboarding on personalization", () => {
    expect(requiresInitialOnboarding(undefined, true)).toBe(false);
    expect(requiresInitialOnboarding({ onboardingCompletedAt: null }, true)).toBe(false);
    expect(requiresInitialOnboarding({ onboardingCompletedAt: new Date() }, false)).toBe(false);
    expect(requiresInitialOnboarding(undefined, false)).toBe(true);
  });
});
