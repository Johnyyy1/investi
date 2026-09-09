"use client";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type LearningChartPoint = { label: string; value: number };
export const learningChartStyle = {
  margin: { top: 16, right: 16, left: 0, bottom: 8 },
  axis: { fill: "var(--color-ql-secondary)", fontSize: 12 },
  tooltip: { background: "var(--color-ql-surface)", color: "var(--color-ql-text)", border: "1px solid var(--color-ql-border)", borderRadius: "var(--radius-ql-md)", boxShadow: "var(--shadow-ql-sm)", fontSize: 14 },
  colors: { primary: "var(--color-ql-blue-600)", positive: "var(--color-ql-success-ink)", negative: "var(--color-ql-danger-ink)" },
};
export function LearningChart({ data, title, description, valueLabel = "Value", sentiment = "primary", formatValue = String, yDomain }: {
  data: LearningChartPoint[]; title: string; description: string; valueLabel?: string;
  yDomain?: [number, number];
  sentiment?: keyof typeof learningChartStyle.colors; formatValue?: (value: number) => string;
}) {
  if (!data.length) return <figure className="rounded-ql-lg border border-ql-border bg-ql-surface p-6"><figcaption className="text-ql-title font-semibold">{title}</figcaption><p className="mt-4 text-ql-small text-ql-secondary" role="status">No data to display yet.</p></figure>;
  if (data.some((point) => !Number.isFinite(point.value))) return <p role="status" className="text-ql-small text-ql-danger-ink">This chart needs finite numeric values.</p>;
  return <figure className="min-w-0 rounded-ql-lg border border-ql-border bg-ql-surface p-6">
    <figcaption><h3 className="text-ql-title font-semibold">{title}</h3><p className="mt-1 text-ql-small text-ql-secondary">{description}</p></figcaption>
    <div className="mt-4 h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart accessibilityLayer data={data} margin={learningChartStyle.margin}>
          <CartesianGrid stroke="var(--color-ql-border)" vertical={false} />
          <XAxis dataKey="label" tick={learningChartStyle.axis} tickLine={false} axisLine={false} />
          <YAxis domain={yDomain} tick={learningChartStyle.axis} tickLine={false} axisLine={false} width={64} tickFormatter={formatValue} />
          <Tooltip contentStyle={learningChartStyle.tooltip} formatter={(value) => [formatValue(Number(value)), valueLabel]} />
          <Line name={valueLabel} type="linear" dataKey="value" stroke={learningChartStyle.colors[sentiment]} strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <details className="mt-3 text-ql-small"><summary className="cursor-pointer text-ql-link">View data table</summary>
      <table className="mt-3 w-full text-left"><caption className="sr-only">{title} data</caption><thead><tr><th scope="col" className="py-2 font-semibold">Period</th><th scope="col" className="py-2 text-right font-semibold">{valueLabel}</th></tr></thead><tbody>{data.map((point, index) => <tr key={index} className="border-t border-ql-border"><th scope="row" className="py-2 font-normal">{point.label}</th><td className="py-2 text-right tabular-nums">{formatValue(point.value)}</td></tr>)}</tbody></table>
    </details>
  </figure>;
}
