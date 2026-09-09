import { z } from "zod";

export const experienceOptions = [
  { value: "BEGINNER", label: "I’m completely new" },
  { value: "BASIC", label: "I know the basics" },
  { value: "INVESTOR", label: "I already invest" },
  { value: "ADVANCED", label: "I’m comfortable with advanced concepts" },
] as const;
export const goalOptions = [
  { value: "CONFIDENCE", label: "Start investing confidently" },
  { value: "MARKETS", label: "Understand markets" },
  { value: "PORTFOLIO", label: "Build a better portfolio" },
  { value: "COMPANIES", label: "Analyze companies" },
  { value: "QUANT", label: "Learn quantitative investing" },
  { value: "KNOWLEDGE", label: "Improve my existing investing knowledge" },
] as const;
export const interestOptions = [
  { value: "STOCKS", label: "Stocks" },
  { value: "ETFS", label: "ETFs" },
  { value: "PORTFOLIO", label: "Portfolio building" },
  { value: "MARKETS", label: "Markets & economics" },
  { value: "FUNDAMENTALS", label: "Fundamental analysis" },
  { value: "QUANT", label: "Quantitative strategies" },
] as const;
export const experienceValues = ["BEGINNER", "BASIC", "INVESTOR", "ADVANCED"] as const;
export const goalValues = ["CONFIDENCE", "MARKETS", "PORTFOLIO", "COMPANIES", "QUANT", "KNOWLEDGE"] as const;
export const interestValues = ["STOCKS", "ETFS", "PORTFOLIO", "MARKETS", "FUNDAMENTALS", "QUANT"] as const;
export const dailyGoals = [5, 10, 15, 20] as const;
const goalsSchema = z.array(z.enum(goalValues)).max(6).refine((v) => new Set(v).size === v.length);
const interestsSchema = z.array(z.enum(interestValues)).max(6).refine((v) => new Set(v).size === v.length);
export const preferencesSchema = z.object({
  experienceLevel: z.enum(experienceValues),
  goals: goalsSchema,
  interests: interestsSchema,
  dailyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
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
  if (goals.includes("PORTFOLIO") || interests.includes("PORTFOLIO") || interests.includes("ETFS")) targets.push("Portfolio Construction");
  if (goals.includes("QUANT") || interests.includes("QUANT")) targets.push("Quantitative Investing");
  if (goals.includes("COMPANIES") || interests.includes("FUNDAMENTALS") || interests.includes("STOCKS")) targets.push("Fundamental Analysis");
  if (goals.includes("MARKETS") || interests.includes("MARKETS")) targets.push("Markets & Economics");
  const foundations = experienceLevel === "BEGINNER" || (experienceLevel === "BASIC" && (goals.includes("CONFIDENCE") || (interests.includes("ETFS") && !goals.includes("QUANT") && !goals.includes("KNOWLEDGE"))));
  const reason = {
    BEGINNER: "You told us you’re new to investing, so we’ll start with the concepts that make everything else easier to understand.",
    BASIC: foundations ? "Build confidence with the ideas behind investing, company ownership, and funds before comparing investment returns." : "You know some basics. Returns and compounding are a useful next step toward understanding how investments change in value.",
    INVESTOR: "Since you already invest, start by strengthening how you compare returns and understand compounding before exploring your chosen topics.",
    ADVANCED: "Start with a shared foundation in returns and compounding, then build toward your chosen topics as the curriculum grows.",
  }[experienceLevel];
  return { recommendedModule: foundations ? { slug: "investing-foundations", title: "Investing Foundations", href: "/learn/investing-foundations" } : { slug: "returns", title: "Returns & Compounding", href: "/learn/returns" }, reason, futureTargets: targets.slice(0, 2) };
}

export const quickStartSchema = z.object({ experienceLevel: z.enum(experienceValues), timeZone: z.string().max(100) }).strict();
