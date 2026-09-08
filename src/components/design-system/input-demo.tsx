"use client";
import { useState } from "react";
import { FinanceInput } from "@/components/learning/finance-input";
import { MetricResult } from "@/components/learning/metric-result";
export function InputDemo() {
  const [value, setValue] = useState("10000");
  const [returnValue, setReturn] = useState("20");
  const [invalid, setInvalid] = useState("");
  return <div className="space-y-8">
    <div className="grid gap-6 md:grid-cols-3">
      <FinanceInput mode="currency" label="Starting value" value={value} onValueChange={setValue} suffix="Kč" hint="Currency unit supplied by the lesson." />
      <FinanceInput mode="percentage" label="Period return" value={returnValue} onValueChange={setReturn} hint="Enter a percentage, such as 20." />
      <FinanceInput label="Number of periods" value={invalid} onValueChange={setInvalid} error={invalid.trim() === "" ? "Enter a value to continue." : undefined} hint="Demo input; calculations are unchanged." />
    </div>
    <div className="flex flex-wrap gap-x-12 gap-y-6 border-t border-ql-border pt-6">
      <MetricResult label="Period return" value="+20.0%" sentiment="positive" />
      <MetricResult label="Ending value" value="9,600 Kč" />
      <MetricResult label="Cumulative return" value="−4.0%" sentiment="negative" note="Illustrative results, not linked to these inputs." />
    </div>
  </div>;
}

