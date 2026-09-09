export type LessonSection = { id: string; label: string };

type BaseBlock = { id: string };

export type LessonBlock =
  | (BaseBlock & { type: "heading"; title: string; body?: string })
  | (BaseBlock & { type: "paragraph"; content: string })
  | (BaseBlock & { type: "formula"; expression: string; latex?: string; variables: { symbol: string; description: string }[] })
  | (BaseBlock & { type: "workedExample"; title: string; introduction?: string; steps: { label: string; value: string; emphasis?: boolean }[]; conclusion: string })
  | (BaseBlock & { type: "conceptCallout"; title: string; content: string })
  | (BaseBlock & { type: "interactiveFigure"; figure: "return-calculator" | "price-series-explorer" | "compounding-explorer" | "recovery-explorer" | "growth-comparison" | "ownership-explorer" | "market-cap-explorer" | "index-etf-visual" | "bond-cashflow-explorer" | "asset-comparison"; title: string; description: string })
  | (BaseBlock & { type: "multipleChoiceQuestion"; prompt: string; options: { id: string; label: string }[]; correctOptionId: string; correctExplanation: string; incorrectExplanation: string })
  | (BaseBlock & { type: "numericQuestion"; prompt: string; answer: number; tolerance: number; unit: string; correctExplanation: string; incorrectExplanation: string })
  | (BaseBlock & { type: "multiNumericQuestion"; prompt: string; answers: { id: string; label: string; answer: number; tolerance: number; unit: string }[]; correctExplanation: string; incorrectExplanation: string })
  | (BaseBlock & { type: "explanation"; title: string; content: string })
  | (BaseBlock & { type: "takeaway"; title: string; content: string })
  | (BaseBlock & { type: "checkpoint"; label: string; content: string });

export type AuthoredLesson = {
  id: string;
  moduleSlug: string;
  slug: string;
  title: string;
  eyebrow: string;
  position: number;
  estimatedMinutes: number;
  sections: LessonSection[];
  navigation?: { previous?: { href: string; label: string }; next?: { href: string; label: string } };
  blocks: LessonBlock[];
};
