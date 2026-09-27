"use client";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { learningChartStyle } from "@/components/learning/learning-chart";
import { formatDecimal } from "@/lib/formatters";
export type ComparisonPoint = { label: string; value: number; benchmark: number };
export function BacktestChart({ data }: { data: ComparisonPoint[] }) {
  const compact = (value: number) => `${formatDecimal(value / 1000, { maximumFractionDigits: 0 })} tis.`;
  return <figure className="min-w-0">
    <figcaption className="text-ql-title font-semibold">Cesta tvé investice</figcaption>
    <p className="mt-2 text-ql-small text-ql-secondary">Hodnota v Kč · <span className="font-semibold text-ql-link">━ Tvůj mix</span> · ┄ Akciový benchmark</p>
    <div className="mt-4 h-64 min-w-0 max-w-full overflow-hidden sm:h-80"><ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={data} accessibilityLayer margin={{ top: 10, right: 8, bottom: 8, left: 0 }}>
      <CartesianGrid stroke="var(--color-ql-border)" vertical={false} /><XAxis dataKey="label" tick={learningChartStyle.axis} minTickGap={60} tickFormatter={(value: string) => value.slice(0, 4)} tickLine={false} axisLine={false} /><YAxis width={45} tick={learningChartStyle.axis} tickFormatter={compact} tickLine={false} axisLine={false} />
      <Tooltip contentStyle={learningChartStyle.tooltip} formatter={(value) => [`${formatDecimal(Number(value), { maximumFractionDigits: 0 })} Kč`]} />
      <Line dataKey="value" name="Tvůj mix" stroke="var(--color-ql-link)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
      <Line dataKey="benchmark" name="Akciový benchmark" stroke="var(--color-ql-secondary)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
    </LineChart></ResponsiveContainer></div>
    <details className="mt-3 text-ql-small"><summary className="flex min-h-12 cursor-pointer items-center text-ql-link">Zobrazit tabulku dat</summary><div className="max-h-80 overflow-y-auto" tabIndex={0} aria-label="Tabulka měsíčních hodnot"><table className="w-full table-fixed text-left tabular-nums [overflow-wrap:anywhere]"><caption className="sr-only">Měsíční hodnoty v Kč včetně počáteční investice</caption><thead><tr><th scope="col" className="py-3">Měsíc</th><th scope="col" className="text-right">Tvůj mix</th><th scope="col" className="text-right">Benchmark</th></tr></thead><tbody>{data.map((point) => <tr key={point.label} className="border-t border-ql-border"><th scope="row" className="py-3 font-normal">{point.label}</th><td className="text-right">{formatDecimal(Math.round(point.value))}</td><td className="text-right">{formatDecimal(Math.round(point.benchmark))}</td></tr>)}</tbody></table></div></details>
  </figure>;
}
