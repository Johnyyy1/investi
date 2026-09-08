"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { absoluteChange, consecutiveSimpleReturns } from "@/features/finance/returns";

const prices = [
  { date: "Day 0", price: 100 },
  { date: "Day 1", price: 105 },
  { date: "Day 2", price: 102 },
  { date: "Day 3", price: 108 },
] as const;

function formatPrice(value: number) { return value.toFixed(2); }
function formatChange(value: number) { return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`; }
function formatReturn(value: number) { return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`; }

export function PriceSeriesExplorer() {
  const [activePeriod, setActivePeriod] = useState(0);
  const returns = useMemo(() => consecutiveSimpleReturns(prices.map((point) => point.price)), []);
  const current = prices[activePeriod + 1];
  const previous = prices[activePeriod];
  const currentChange = absoluteChange(previous.price, current.price);
  const currentReturn = returns[activePeriod];
  return <section className="my-9 border border-line bg-surface p-5 sm:p-6" aria-labelledby="price-series-heading"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">Interactive figure</p><h3 id="price-series-heading" className="mt-2 text-lg font-semibold tracking-[-0.03em]">Daily return explorer</h3></div><p className="text-sm text-muted">Deterministic example series</p></div><div className="mt-6 h-52" role="img" aria-label="Line chart of prices from 100 on Day 0 to 108 on Day 3"><ResponsiveContainer width="100%" height="100%"><LineChart data={prices} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#deded8" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#73736e", fontSize: 12 }} tickLine={false} axisLine={false} /><YAxis domain={[95, 110]} tick={{ fill: "#73736e", fontSize: 12 }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [formatPrice(Number(value)), "Price"]} contentStyle={{ borderRadius: 0, borderColor: "#deded8", fontSize: 12 }} /><Line type="linear" dataKey="price" stroke="#191919" strokeWidth={2} dot={{ r: 3, fill: "#191919" }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[34rem] border-collapse text-left text-sm"><thead className="border-y border-line text-xs uppercase tracking-[0.12em] text-muted"><tr><th className="py-3 font-medium">Date</th><th className="py-3 font-medium">Price</th><th className="py-3 font-medium">Daily change</th><th className="py-3 font-medium">Daily return</th><th className="py-3"><span className="sr-only">Inspect</span></th></tr></thead><tbody>{prices.map((point, index) => { const periodIndex = index - 1; const returnValue = index === 0 ? undefined : returns[periodIndex]; const change = index === 0 ? undefined : absoluteChange(prices[index - 1].price, point.price); return <tr key={point.date} className={periodIndex === activePeriod ? "bg-[#f0f6f2]" : "border-b border-line"}><td className="py-3 font-medium">{point.date}</td><td className="py-3 font-mono tabular-nums">{formatPrice(point.price)}</td><td className="py-3 font-mono tabular-nums">{change === undefined ? "—" : formatChange(change)}</td><td className={`py-3 font-mono tabular-nums ${returnValue !== undefined && returnValue >= 0 ? "text-positive" : ""}`}>{returnValue === undefined ? "—" : formatReturn(returnValue)}</td><td className="py-3 text-right">{periodIndex >= 0 ? <button type="button" onClick={() => setActivePeriod(periodIndex)} className="text-xs font-medium underline underline-offset-4">Inspect</button> : null}</td></tr>; })}</tbody></table></div><div className="mt-6 border-l-2 border-positive bg-[#f0f6f2] px-5 py-4" aria-live="polite"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Selected period</p><p className="mt-2 text-sm leading-6"><span className="font-mono">{previous.date} {formatPrice(previous.price)}</span> → <span className="font-mono">{current.date} {formatPrice(current.price)}</span></p><p className="mt-2 text-sm leading-6 text-neutral-700">Previous price <span className="font-mono">{formatPrice(previous.price)}</span> is the denominator. The change is <span className="font-mono">{formatChange(currentChange)}</span>, so the return is <span className="font-mono font-semibold">{formatReturn(currentReturn)}</span>.</p></div></section>;
}
