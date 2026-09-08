export type LessonSection = { id: string; label: string };

type BaseBlock = { id: string };

export type LessonBlock =
  | (BaseBlock & { type: "heading"; title: string; body?: string })
  | (BaseBlock & { type: "paragraph"; content: string })
  | (BaseBlock & { type: "formula"; expression: string; variables: { symbol: string; description: string }[] })
  | (BaseBlock & { type: "workedExample"; title: string; introduction?: string; steps: { label: string; value: string; emphasis?: boolean }[]; conclusion: string })
  | (BaseBlock & { type: "conceptCallout"; title: string; content: string })
  | (BaseBlock & { type: "interactiveFigure"; figure: "return-calculator"; title: string; description: string })
  | (BaseBlock & { type: "multipleChoiceQuestion"; prompt: string; options: { id: string; label: string }[]; correctOptionId: string; correctExplanation: string; incorrectExplanation: string })
  | (BaseBlock & { type: "numericQuestion"; prompt: string; answer: number; tolerance: number; unit: string; correctExplanation: string; incorrectExplanation: string })
  | (BaseBlock & { type: "explanation"; title: string; content: string })
  | (BaseBlock & { type: "takeaway"; title: string; content: string })
  | (BaseBlock & { type: "checkpoint"; label: string; content: string });

export type AuthoredLesson = {
  id: string;
  moduleSlug: string;
  slug: string;
  title: string;
  eyebrow: string;
  estimatedMinutes: number;
  sections: LessonSection[];
  blocks: LessonBlock[];
};
