"use client";

import { useMemo, useState } from "react";
import { LearningChart } from "@/components/learning/learning-chart";
import { LearningButton } from "@/components/learning/learning-button";
import { ConceptCard } from "@/components/learning/concept-card";
import { absoluteChange, consecutiveSimpleReturns, simpleReturn } from "@/features/finance/returns";

const prices = [
  { label: "P₀", price: 100 },
  { label: "P₁", price: 103 },
  { label: "P₂", price: 101 },
  { label: "P₃", price: 106 },
] as const;

const priceFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
const changeFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2, signDisplay: "exceptZero" });
const returnFormat = new Intl.NumberFormat("cs-CZ", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero" });
const formatPrice = (value: number) => priceFormat.format(value);
const formatChange = (value: number) => changeFormat.format(value);
const formatReturn = (value: number) => returnFormat.format(value);

export function PriceSeriesExplorer() {
  const [activePeriod, setActivePeriod] = useState(0);
  const returns = useMemo(() => consecutiveSimpleReturns(prices.map((point) => point.price)), []);
  const current = prices[activePeriod + 1];
  const previous = prices[activePeriod];
  const currentChange = absoluteChange(previous.price, current.price);
  const currentReturn = returns[activePeriod];
  const selectPeriod = (index: number) => <LearningButton variant="ghost" className="min-h-11 px-3" aria-label={`Prohlédnout období ${index + 1}`} aria-pressed={index === activePeriod} onClick={() => setActivePeriod(index)}>Prohlédnout</LearningButton>;

  return <section aria-label="Průzkumník výnosů za období" className="min-w-0 space-y-6">
    <p className="text-ql-small text-ql-secondary">Ukázková cenová řada · pevná data pro výuku</p>
    <LearningChart data={prices.map((point) => ({ label: point.label, value: point.price }))} title="Cenová data" description="100 → 103 → 101 → 106. Ceny jsou úrovně při čtyřech po sobě jdoucích pozorováních." valueLabel="Cena" formatValue={formatPrice} yDomain={[95, 110]} />
    <div>
      <h3 className="text-ql-title font-semibold">Výnosová data</h3>
      <p className="mt-2 font-semibold">{prices.length} ceny → {returns.length} výnosy · N cen → N−1 výnosů</p>
      <ol aria-label="Řada výnosů" className="mt-3 flex flex-wrap gap-x-6 gap-y-2 tabular-nums">
        {returns.map((value, index) => <li key={index}>R{["₁", "₂", "₃"][index]}: {formatReturn(value)}</li>)}
      </ol>
      <p className="mt-2 text-ql-small text-ql-secondary">Každý výnos vzniká z jedné sousední dvojice cen. Výpočty používají nezaokrouhlené desetinné výnosy; zaokrouhlení patří jen do zobrazení.</p>
    </div>
    <div className="hidden rounded-ql-md border border-ql-border md:block">
      <table className="w-full text-left text-ql-small">
        <caption className="sr-only">Pozorované ceny a výnosy z předchozí ceny</caption>
        <thead className="bg-ql-subtle"><tr>{["Pozorování", "Cena", "Změna", "Výnos", "Období"].map((label) => <th key={label} scope="col" className="p-3 font-semibold">{label}</th>)}</tr></thead>
        <tbody>{prices.map((point, index) => {
          const periodIndex = index - 1;
          return <tr key={point.label} className={`border-t border-ql-border ${periodIndex === activePeriod ? "bg-ql-blue-50" : ""}`}>
            <th scope="row" className="p-3 font-semibold">{point.label}</th>
            <td className="p-3 tabular-nums">{formatPrice(point.price)}</td>
            <td className="p-3 tabular-nums">{index === 0 ? "—" : formatChange(absoluteChange(prices[index - 1].price, point.price))}</td>
            <td className="p-3 tabular-nums">{index === 0 ? "Nedefinovaný" : formatReturn(returns[periodIndex])}</td>
            <td className="p-3">{index === 0 ? "Chybí předchozí cena" : selectPeriod(periodIndex)}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <ol aria-label="Ceny a sousední dvojice" className="divide-y divide-ql-border md:hidden">
      {prices.map((point, index) => <li key={point.label} className={`py-4 ${index - 1 === activePeriod ? "bg-ql-blue-50" : ""}`}>
        <p className="font-semibold">{point.label} · Cena {formatPrice(point.price)}</p>
        {index === 0 ? <p className="mt-2 text-ql-small">Výnos: nedefinovaný — chybí předchozí cena.</p> : <>
          <p className="mt-2 text-ql-small">Dvojice {prices[index - 1].label} → {point.label}: {formatPrice(prices[index - 1].price)} → {formatPrice(point.price)}</p>
          <p className="mt-2 tabular-nums">Změna {formatChange(absoluteChange(prices[index - 1].price, point.price))} · Výnos {formatReturn(returns[index - 1])}</p>
          <div className="mt-2">{selectPeriod(index - 1)}</div>
        </>}
      </li>)}
    </ol>
    <div aria-live="polite"><ConceptCard title={`${previous.label} → ${current.label}`}>
      <p>{formatPrice(previous.price)} → {formatPrice(current.price)}</p>
      <p className="mt-3">Předchozí cena {formatPrice(previous.price)} je jmenovatel. Změna je {formatChange(currentChange)} a výnos je {formatReturn(currentReturn)}.</p>
    </ConceptCard></div>
    <div className="border-t border-ql-border pt-4">
      <h3 className="font-semibold">Nulový výnos není chybějící výnos</h3>
      <p className="mt-2">Samostatný příklad: 100 → 100 znamená {formatReturn(simpleReturn(100, 100))}. Máme dvě pozorované ceny a jsou stejné.</p>
      <p className="mt-2">U první ceny P₀ předchozí pozorování chybí, proto výnos není definovaný. Nulu sem nedoplňujeme.</p>
    </div>
  </section>;
}
