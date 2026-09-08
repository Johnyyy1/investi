export const RETURNS_MODULE_ID = "module-returns";

export const returnsLessons = [
  { id: "returns-what-is-a-return", slug: "what-is-a-return", title: "What is a return?", summary: "Move from price changes to comparable investment outcomes.", estimatedMinutes: 12, status: "available" as const },
  { id: "returns-simple-returns", slug: "simple-returns", title: "Simple returns", summary: "Calculate single-period returns from a price series.", estimatedMinutes: 10, status: "planned" as const },
  { id: "returns-compounding", slug: "compounding-and-cumulative-returns", title: "Compounding & cumulative returns", summary: "See how returns combine across periods.", estimatedMinutes: 12, status: "planned" as const },
  { id: "returns-log-returns", slug: "log-returns", title: "Log returns", summary: "Understand a useful alternative return convention.", estimatedMinutes: 10, status: "planned" as const },
  { id: "returns-comparing", slug: "comparing-investments", title: "Comparing investments", summary: "Compare outcomes on a common basis.", estimatedMinutes: 10, status: "planned" as const },
  { id: "returns-checkpoint", slug: "returns-checkpoint", title: "Returns checkpoint", summary: "Consolidate the core ideas.", estimatedMinutes: 8, status: "planned" as const },
] as const;
