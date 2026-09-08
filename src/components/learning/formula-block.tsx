import katex from "katex";
import type { ReactNode } from "react";

export function FormulaBlock({ formula, variables = [], explanation }: {
  formula: string; variables?: { symbol: string; meaning: string }[]; explanation?: ReactNode;
}) {
  let html: string;
  try {
    html = katex.renderToString(formula, { displayMode: true, output: "htmlAndMathml", throwOnError: true, trust: false, strict: "error" });
  } catch {
    return <figure className="rounded-ql-lg border border-ql-border bg-ql-surface p-6"><p role="status" className="text-ql-small text-ql-danger-ink">This formula could not be displayed.</p><code className="break-all text-ql-small">{formula}</code></figure>;
  }
  return <figure className="rounded-ql-lg border border-ql-border bg-ql-surface p-6">
    <div className="overflow-x-auto py-2" dangerouslySetInnerHTML={{ __html: html }} />
    {variables.length ? <dl className="mt-4 grid gap-3 sm:grid-cols-3">{variables.map(({ symbol, meaning }) => <div key={symbol}><dt className="text-ql-small font-semibold">{symbol}</dt><dd className="text-ql-small text-ql-secondary">{meaning}</dd></div>)}</dl> : null}
    {explanation ? <figcaption className="mt-4 text-ql-small text-ql-secondary">{explanation}</figcaption> : null}
  </figure>;
}

