import { returnsLessons } from "../lessons/returns/manifest";
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
  { slug: "returns", title: "Returns", description: "From price changes to comparable investment outcomes.", lessonCount: returnsLessons.filter((lesson) => lesson.status === "available").length, estimatedMinutes: returnsLessons.filter((lesson) => lesson.status === "available").reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0), status: "available" },
  { slug: "volatility", title: "Volatility", description: "Measuring the range and uncertainty of returns.", lessonCount: 5, estimatedMinutes: 55, status: "planned" },
  { slug: "correlation", title: "Correlation", description: "How assets move together—and when they do not.", lessonCount: 4, estimatedMinutes: 40, status: "planned" },
  { slug: "diversification", title: "Diversification", description: "Constructing portfolios that spread risk deliberately.", lessonCount: 5, estimatedMinutes: 50, status: "planned" },
  { slug: "portfolio-lab", title: "Portfolio Lab", description: "Test allocation choices against a controlled dataset.", lessonCount: 3, estimatedMinutes: 60, status: "planned" },
  { slug: "backtesting-lab", title: "Backtesting Lab", description: "Evaluate a rule before trusting its historical result.", lessonCount: 4, estimatedMinutes: 70, status: "planned" },
];

export function getModuleBySlug(slug: string) {
  return moduleCatalog.find((module) => module.slug === slug);
}
