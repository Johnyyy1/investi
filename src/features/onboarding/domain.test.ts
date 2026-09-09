import { describe, expect, it } from "vitest";
import { canContinue, draftPayloadSchema, draftSchema, emptyDraft, experienceValues, preferencesSchema, recommendLearningPath, resumeStep, type Preferences } from "./domain";
import { moduleCatalog } from "../learning/catalog";

const answers: Preferences = { experienceLevel: "BASIC", goals: ["CONFIDENCE"], interests: ["STOCKS"], dailyGoalMinutes: 10 };
describe("learning recommendations", () => {
  it.each(experienceValues)("provides an honest published start for %s", (experienceLevel) => {
    const path = recommendLearningPath({ ...answers, experienceLevel });
    expect(moduleCatalog.find((module) => module.slug === path.recommendedModule.slug)?.status).toBe("available");
    expect(path.recommendedModule.href).toBe(`/learn/${path.recommendedModule.slug}`);
    expect(path.reason.length).toBeGreaterThan(40);
  });
  it("starts every beginner with Foundations even with quantitative interests", () => {
    expect(recommendLearningPath({ ...answers, experienceLevel: "BEGINNER", goals: ["QUANT"], interests: ["QUANT"] }).recommendedModule.slug).toBe("investing-foundations");
  });
  it("uses goals and interests for future targets, with no more than two", () => {
    expect(recommendLearningPath({ ...answers, experienceLevel: "INVESTOR", interests: ["PORTFOLIO"] }).futureTargets).toEqual(["Portfolio Construction"]);
    expect(recommendLearningPath({ ...answers, experienceLevel: "ADVANCED", goals: ["QUANT"], interests: ["QUANT"] }).futureTargets).toEqual(["Quantitative Investing"]);
    expect(recommendLearningPath({ ...answers, goals: ["PORTFOLIO", "QUANT", "COMPANIES", "MARKETS"] }).futureTargets).toEqual(["Portfolio Construction", "Quantitative Investing"]);
  });
  it("uses BASIC goals and interests to select the appropriate published module", () => {
    expect(recommendLearningPath(answers).recommendedModule.slug).toBe("investing-foundations");
    expect(recommendLearningPath({ ...answers, goals: ["PORTFOLIO"], interests: ["ETFS"] }).recommendedModule.slug).toBe("investing-foundations");
    expect(recommendLearningPath({ ...answers, goals: ["KNOWLEDGE"] }).recommendedModule.slug).toBe("returns");
    expect(recommendLearningPath({ ...answers, goals: ["QUANT"], interests: ["QUANT"] }).recommendedModule.slug).toBe("returns");
  });
  it.each(["INVESTOR", "ADVANCED"] as const)("starts %s at Returns", (experienceLevel) => {
    expect(recommendLearningPath({ ...answers, experienceLevel }).recommendedModule.slug).toBe("returns");
  });
  it("is deterministic and does not mutate input", () => {
    const before = structuredClone(answers);
    expect(recommendLearningPath(answers)).toEqual(recommendLearningPath(answers));
    expect(answers).toEqual(before);
  });
});
describe("preferences validation", () => {
  it.each([5, 10, 15, 20])("accepts supported daily goal %s", (dailyGoalMinutes) => expect(preferencesSchema.safeParse({ ...answers, dailyGoalMinutes }).success).toBe(true));
  it.each([
    { experienceLevel: "EXPERT" }, { experienceLevel: null }, { goals: ["RICH"] }, { interests: ["CRYPTO"] },
    { goals: [] }, { interests: [] }, { goals: ["CONFIDENCE", "CONFIDENCE"] }, { interests: ["STOCKS", "STOCKS"] },
    { dailyGoalMinutes: 0 }, { dailyGoalMinutes: 25 }, { dailyGoalMinutes: "10" }, { dailyGoalMinutes: 5.5 },
    { recommendedStart: "fake" }, { userId: "another-user" }, { onboardingCompletedAt: new Date() },
  ])("rejects invalid completion payload %j", (patch) => expect(preferencesSchema.safeParse({ ...answers, ...patch }).success).toBe(false));
  it("allows incomplete drafts but still validates every supplied enum", () => {
    expect(draftSchema.safeParse(emptyDraft).success).toBe(true);
    expect(draftSchema.safeParse({ ...emptyDraft, interests: ["INVALID"] }).success).toBe(false);
  });
});
describe("onboarding state", () => {
  it("starts new learners at welcome", () => expect(resumeStep(emptyDraft, 0)).toBe(0));
  it("resumes the saved cursor while preserving earlier answers", () => {
    const draft = { ...emptyDraft, experienceLevel: "BASIC" as const, goals: ["CONFIDENCE" as const] };
    expect(resumeStep(draft, 3)).toBe(3);
    expect(resumeStep(draft, 6)).toBe(3);
    expect(resumeStep(draft, 1)).toBe(1);
    expect(draft.goals).toEqual(["CONFIDENCE"]);
  });
  it("cannot jump past unanswered questions", () => {
    expect(draftPayloadSchema.safeParse({ answers: emptyDraft, step: 6 }).success).toBe(false);
    expect(draftPayloadSchema.safeParse({ answers, step: 6 }).success).toBe(true);
    expect(draftPayloadSchema.safeParse({ answers, step: 7 }).success).toBe(false);
  });
  it("allows review and ready to resume independently of completion", () => {
    expect(resumeStep(answers, 5)).toBe(5);
    expect(resumeStep(answers, 6)).toBe(6);
  });
  it("requires an answer on each question", () => {
    for (const step of [1, 2, 3, 4]) {
      expect(canContinue(emptyDraft, step)).toBe(false);
      expect(canContinue(answers, step)).toBe(true);
    }
    expect(canContinue(emptyDraft, 0)).toBe(true);
  });
});
