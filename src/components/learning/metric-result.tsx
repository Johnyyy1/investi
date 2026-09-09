import type { ReactNode } from "react";
const sentimentColor = { positive: "text-ql-success-ink", negative: "text-ql-danger-ink", neutral: "text-ql-text" };
export function MetricResult({ label, value, sentiment = "neutral", note }: {
  label: string; value: ReactNode; sentiment?: keyof typeof sentimentColor; note?: string;
}) {
  return <div className="min-w-0"><p className="text-ql-small text-ql-secondary">{label}</p><p className={`mt-1 break-words [overflow-wrap:anywhere] text-ql-section font-semibold tabular-nums ${sentimentColor[sentiment]}`}>{value}</p>{note ? <p className="mt-1 text-ql-meta text-ql-secondary">{note}</p> : null}</div>;
}

