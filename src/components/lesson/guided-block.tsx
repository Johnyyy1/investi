import type { LessonBlock } from "@/features/lessons/types";
import { ConceptCard } from "@/components/learning/concept-card";
import { FormulaBlock } from "@/components/learning/formula-block";
import { MetricResult } from "@/components/learning/metric-result";
import { CompoundingExplorer } from "./compounding-explorer";
import { RecoveryExplorer } from "./recovery-explorer";

/** Presentation adapter for existing authored blocks, not a second content source. */
export function GuidedBlock({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "heading": return <div><h3 className="text-ql-title font-semibold">{block.title}</h3>{block.body ? <p className="mt-3 text-ql-body text-ql-secondary">{block.body}</p> : null}</div>;
    case "paragraph": return <p className="text-ql-body text-ql-secondary">{block.content}</p>;
    case "formula": return <FormulaBlock formula={block.latex ?? block.expression} variables={block.variables.map((variable) => ({ symbol: variable.symbol, meaning: variable.description }))} />;
    case "workedExample": return <section aria-label={block.title}>
      <h3 className="text-ql-title font-semibold">{block.title}</h3>
      {block.introduction ? <p className="mt-3 text-ql-body text-ql-secondary">{block.introduction}</p> : null}
      <div className="my-6 grid gap-6 sm:grid-cols-2">{block.steps.map((step) => <MetricResult key={step.label} label={step.label} value={step.value} />)}</div>
      <p className="text-ql-body text-ql-secondary">{block.conclusion}</p>
    </section>;
    case "conceptCallout": case "explanation": case "takeaway": return <ConceptCard title={block.title}>{block.content}</ConceptCard>;
    case "checkpoint": return <section><h3 className="text-ql-title font-semibold">{block.label}</h3><p className="mt-3 text-ql-body text-ql-secondary">{block.content}</p></section>;
    case "interactiveFigure": return <div><p className="mb-6 text-ql-body text-ql-secondary">{block.description}</p>{block.figure === "compounding-explorer" ? <CompoundingExplorer /> : block.figure === "recovery-explorer" ? <RecoveryExplorer /> : null}</div>;
    default: return null; // Questions own their Check → feedback → Continue interaction.
  }
}
