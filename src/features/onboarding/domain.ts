import { z } from "zod";
import { recommendLearning } from "../personalization/recommendation";
import { readLearnerProfile } from "../personalization/profile";

export const experienceOptions = [
  { value: "BEGINNER", label: "Začínám úplně od nuly" },
  { value: "BASIC", label: "Znám základy" },
  { value: "INVESTOR", label: "Už investuji" },
  { value: "ADVANCED", label: "Vyznám se i v pokročilých pojmech" },
] as const;
export const goalOptions = [
  { value: "CONFIDENCE", label: "Začít investovat s jistotou" },
  { value: "MARKETS", label: "Porozumět trhům" },
  { value: "PORTFOLIO", label: "Sestavit lepší portfolio" },
  { value: "COMPANIES", label: "Analyzovat společnosti" },
  { value: "QUANT", label: "Naučit se kvantitativní investování" },
  { value: "KNOWLEDGE", label: "Rozšířit si znalosti investování" },
] as const;
export const interestOptions = [
  { value: "STOCKS", label: "Akcie" },
  { value: "ETFS", label: "ETFs" },
  { value: "PORTFOLIO", label: "Sestavování portfolia" },
  { value: "MARKETS", label: "Trhy a ekonomika" },
  { value: "FUNDAMENTALS", label: "Fundamentální analýza" },
  { value: "QUANT", label: "Kvantitativní strategie" },
] as const;
export const experienceValues = ["BEGINNER", "BASIC", "INVESTOR", "ADVANCED"] as const;
export const goalValues = ["CONFIDENCE", "MARKETS", "PORTFOLIO", "COMPANIES", "QUANT", "KNOWLEDGE", "LONG_TERM_ETF"] as const;
export const interestValues = ["STOCKS", "ETFS", "PORTFOLIO", "MARKETS", "FUNDAMENTALS", "QUANT", "DATA", "BACKTESTING"] as const;
export const dailyGoals = [5, 10, 15, 20] as const;
const goalsSchema = z.array(z.enum(goalValues)).max(6).refine((v) => new Set(v).size === v.length);
const interestsSchema = z.array(z.enum(interestValues)).max(9).refine((v) => new Set(v).size === v.length);
export const preferencesSchema = z.object({
  experienceLevel: z.enum(experienceValues),
  goals: goalsSchema,
  interests: interestsSchema,
  dailyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
}).strict();
export const draftSchema = z.object({
  experienceLevel: preferencesSchema.shape.experienceLevel.nullable(),
  goals: goalsSchema,
  interests: interestsSchema,
  dailyGoalMinutes: preferencesSchema.shape.dailyGoalMinutes.nullable(),
}).strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export type OnboardingDraft = z.infer<typeof draftSchema>;
export const emptyDraft: OnboardingDraft = { experienceLevel: null, goals: [], interests: [], dailyGoalMinutes: null };

/** Clamp persisted cursors to the first question still needing an answer. */
export function resumeStep(draft: OnboardingDraft, savedStep: number): number {
  const firstMissing = !draft.experienceLevel ? 1 : !draft.goals.length ? 2 : !draft.interests.length ? 3 : !draft.dailyGoalMinutes ? 4 : 6;
  return Math.max(0, Math.min(Number.isInteger(savedStep) ? savedStep : 0, firstMissing));
}
export function canContinue(draft: OnboardingDraft, step: number): boolean {
  return step === 1 ? draft.experienceLevel !== null : step === 2 ? draft.goals.length > 0 : step === 3 ? draft.interests.length > 0 : step === 4 ? draft.dailyGoalMinutes !== null : true;
}
export const draftPayloadSchema = z.object({ answers: draftSchema, step: z.number().int().min(0).max(6) }).strict()
  .refine(({ answers, step }) => resumeStep(answers, step) === step);

export type LearningRecommendation = {
  recommendedModule: { slug: "returns" | "investing-foundations"; title: string; href: "/learn/returns" | "/learn/investing-foundations" };
  reason: string;
  futureTargets: string[];
};
/** Recommendations link only to implemented modules; future targets have no URLs. */
export function recommendLearningPath({ experienceLevel, goals, interests }: Pick<Preferences, "experienceLevel" | "goals" | "interests">): LearningRecommendation {
  const targets: string[] = [];
  if (goals.includes("PORTFOLIO") || interests.includes("PORTFOLIO") || interests.includes("ETFS")) targets.push("Sestavování portfolia");
  if (goals.includes("QUANT") || interests.includes("QUANT")) targets.push("Kvantitativní investování");
  if (goals.includes("COMPANIES") || interests.includes("FUNDAMENTALS") || interests.includes("STOCKS")) targets.push("Fundamentální analýza");
  if (goals.includes("MARKETS") || interests.includes("MARKETS")) targets.push("Trhy a ekonomika");
  // Compatibility presenter for the old onboarding. All selection lives in the new engine.
  const recommendation = recommendLearning({ profile: readLearnerProfile({ experienceLevel, goals, interests, dailyGoalMinutes: 10 }) });
  const foundations = recommendation.nextLessonId?.startsWith("foundations-") ?? true;
  const reason = "Začni společnými Základy investování. Dokončením lekcí si ověříš pojmy potřebné pro další učení.";
  return { recommendedModule: foundations ? { slug: "investing-foundations", title: "Základy investování", href: "/learn/investing-foundations" } : { slug: "returns", title: "Výnos a složené zhodnocení", href: "/learn/returns" }, reason, futureTargets: targets.slice(0, 2) };
}

export const quickStartSchema = z.object({ experienceLevel: z.enum(experienceValues), timeZone: z.string().max(100) }).strict();
