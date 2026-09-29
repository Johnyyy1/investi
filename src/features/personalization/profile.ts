import { z } from "zod";
import { diagnosticSubmissionSchema, readDiagnostic } from "./diagnostic";

// Reuse existing PostgreSQL identifiers; new labels are never persisted.
export const primaryGoalValues = ["CONFIDENCE", "LONG_TERM_ETF", "COMPANIES", "PORTFOLIO", "QUANT"] as const;
export const profileInterestValues = ["STOCKS", "ETFS", "PORTFOLIO", "FUNDAMENTALS", "DATA", "QUANT", "BACKTESTING"] as const;
export const selfAssessmentValues = ["BEGINNER", "BASIC", "INVESTOR"] as const;
export const sessionMinutes = [5, 10, 20, 30] as const;
export const personalizedPreferencesSchema = z.object({
  primaryGoal: z.enum(primaryGoalValues).nullable(),
  interests: z.array(z.enum(profileInterestValues)).max(7).refine((values) => new Set(values).size === values.length, "Duplicitní zájmy nejsou povolené."),
  selfAssessedExperience: z.enum(selfAssessmentValues),
  preferredSessionMinutes: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(30)]),
}).strict();
export const personalizationSubmissionSchema = z.object({
  preferences: personalizedPreferencesSchema,
  diagnostic: diagnosticSubmissionSchema,
}).strict();
export const skipPersonalizationSchema = z.object({}).strict();
export type PersonalizedPreferences = z.infer<typeof personalizedPreferencesSchema>;
export const defaultPreferences: PersonalizedPreferences = {
  primaryGoal: null, interests: [], selfAssessedExperience: "BEGINNER", preferredSessionMinutes: 10,
};
/** The existing columns remain the only source of truth for preferences. */
export function toProfileColumns(input: unknown) {
  const preferences = personalizedPreferencesSchema.parse(input);
  return {
    goals: preferences.primaryGoal ? [preferences.primaryGoal] : [],
    interests: preferences.interests,
    experienceLevel: preferences.selfAssessedExperience,
    dailyGoalMinutes: preferences.preferredSessionMinutes,
  };
}
export type StoredProfile = {
  goals: readonly string[]; interests: readonly string[]; experienceLevel: string | null;
  dailyGoalMinutes: number | null; diagnosticResult?: unknown;
  personalizedOnboardingCompletedAt?: Date | null;
};
/** Legacy multi-goal profiles retain their data. Read the first supported goal deterministically.
 * ADVANCED maps to investing; legacy 15-minute sessions map to the new 15–20 minute bucket.
 * Unknown future diagnostic versions are retained in storage and read as neutral evidence. */
export function readLearnerProfile(profile?: StoredProfile | null) {
  const goal = profile?.goals.find((value) => primaryGoalValues.some((known) => known === value));
  const preferences: PersonalizedPreferences = {
    primaryGoal: (goal as PersonalizedPreferences["primaryGoal"]) ?? null,
    interests: profileInterestValues.filter((value) => profile?.interests.includes(value)),
    selfAssessedExperience: profile?.experienceLevel === "BASIC" ? "BASIC" : ["INVESTOR", "ADVANCED"].includes(profile?.experienceLevel ?? "") ? "INVESTOR" : "BEGINNER",
    preferredSessionMinutes: profile?.dailyGoalMinutes === 15 ? 20 : sessionMinutes.find((value) => value === profile?.dailyGoalMinutes) ?? 10,
  };
  return { ...preferences, diagnostic: readDiagnostic(profile?.diagnosticResult), personalized: Boolean(profile?.personalizedOnboardingCompletedAt) };
}
export type LearnerProfile = ReturnType<typeof readLearnerProfile>;
export function requiresInitialOnboarding(profile: { onboardingCompletedAt: Date | null } | undefined, hasLearningHistory: boolean) {
  return !profile?.onboardingCompletedAt && !hasLearningHistory;
}
