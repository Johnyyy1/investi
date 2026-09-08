import type { ReactNode } from "react";

type FormulaProps = { expression: string; variables: { symbol: string; description: string }[] };

export function Formula({ expression, variables }: FormulaProps) {
  return <figure className="my-9 border-y border-line py-6"><div className="overflow-x-auto font-mono text-lg tracking-[-0.04em] sm:text-xl" aria-label={`Formula: ${expression}`}>{expression}</div><dl className="mt-5 grid gap-2 text-sm sm:grid-cols-3">{variables.map((variable) => <div key={variable.symbol}><dt className="font-mono text-xs text-neutral-950">{variable.symbol}</dt><dd className="mt-1 leading-5 text-muted">{variable.description}</dd></div>)}</dl></figure>;
}

export function LessonHeading({ id, title, body }: { id: string; title: string; body?: ReactNode }) {
  return <section id={id} className="scroll-mt-8 pt-7 first:pt-0"><h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-[1.7rem]">{title}</h2>{body ? <p className="mt-3 text-base leading-7 text-neutral-600">{body}</p> : null}</section>;
}
