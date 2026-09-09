import { foundationsLessons, FOUNDATIONS_MODULE_ID } from "../lessons/foundations/manifest";
import { RETURNS_MODULE_ID, returnsLessons } from "../lessons/returns/manifest";
export type ModuleStatus = "available" | "planned";

export type LearningModuleDefinition = {
  slug: string;
  title: string;
  description: string;
  lessonCount: number;
  estimatedMinutes: number;
  status: ModuleStatus;
};

/** Product-facing curriculum registry until the editorial CMS is introduced. */
export const moduleCatalog: readonly LearningModuleDefinition[] = [
  { slug: "investing-foundations", title: "Investing Foundations", description: "Build the mental models you need before analyzing investments.", lessonCount: foundationsLessons.filter((lesson) => lesson.status === "available").length, estimatedMinutes: foundationsLessons.filter((lesson) => lesson.status === "available").reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0), status: "available" },
  { slug: "returns", title: "Returns & Compounding", description: "From price changes to comparable investment outcomes.", lessonCount: returnsLessons.filter((lesson) => lesson.status === "available").length, estimatedMinutes: returnsLessons.filter((lesson) => lesson.status === "available").reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0), status: "available" },
  { slug: "volatility", title: "Volatility", description: "Measuring the range and uncertainty of returns.", lessonCount: 5, estimatedMinutes: 55, status: "planned" },
  { slug: "correlation", title: "Correlation", description: "How assets move together—and when they do not.", lessonCount: 4, estimatedMinutes: 40, status: "planned" },
  { slug: "diversification", title: "Diversification", description: "Constructing portfolios that spread risk deliberately.", lessonCount: 5, estimatedMinutes: 50, status: "planned" },
  { slug: "portfolio-lab", title: "Portfolio Lab", description: "Test allocation choices against a controlled dataset.", lessonCount: 3, estimatedMinutes: 60, status: "planned" },
  { slug: "backtesting-lab", title: "Backtesting Lab", description: "Evaluate a rule before trusting its historical result.", lessonCount: 4, estimatedMinutes: 70, status: "planned" },
];

export function getModuleBySlug(slug: string) {
  return moduleCatalog.find((module) => module.slug === slug);
}

/** One typed manifest for routing, persistence, and all module paths. Historical IDs stay stable. */
export const curriculumLessons = [
  ...foundationsLessons.map((lesson) => ({ ...lesson, moduleSlug: "investing-foundations", moduleId: FOUNDATIONS_MODULE_ID })),
  ...returnsLessons.map((lesson) => ({ ...lesson, moduleSlug: "returns", moduleId: RETURNS_MODULE_ID })),
];
export const availableLessons = curriculumLessons.filter((lesson) => lesson.status === "available");
export function getModuleLessons(slug: string) { return curriculumLessons.filter((lesson) => lesson.moduleSlug === slug); }
export function getModulePath(slug: string, states: { lessonId: string; status: string }[]) {
  return getModuleLessons(slug).map((lesson) => {
    const status = states.find((state) => state.lessonId === lesson.id)?.status;
    const state = lesson.status !== "available" ? "locked" : status === "completed" ? "completed" : status === "in_progress" ? "active" : "available";
    return { id: lesson.id, title: lesson.title, minutes: lesson.estimatedMinutes, state } as const;
  });
}
