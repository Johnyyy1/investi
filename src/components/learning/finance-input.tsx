"use client";
import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type FinanceInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "prefix"> & {
  label: string; mode?: "number" | "currency" | "percentage"; value: string;
  onValueChange: (value: string) => void; prefix?: string; suffix?: string; error?: string; hint?: string;
};
/** Raw strings cross the boundary unchanged. Domain code owns parsing and validation. */
export function FinanceInput({ label, mode = "number", value, onValueChange, prefix, suffix, error, hint, id, className, ...props }: FinanceInputProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const descriptionId = `${inputId}-description`;
  return <div className={cn("min-w-0", className)}>
    <label htmlFor={inputId} className="mb-2 block text-ql-small font-semibold">{label}</label>
    <div className={cn("flex min-h-12 items-center gap-2 rounded-ql-md border bg-ql-surface px-4", error ? "border-ql-danger-ink" : "border-ql-control")}>
      {prefix ? <span className="text-ql-small text-ql-secondary">{prefix}</span> : null}
      <input {...props} id={inputId} type="text" inputMode="decimal" value={value} onChange={(event) => onValueChange(event.target.value)} aria-invalid={props["aria-invalid"] ?? Boolean(error)} aria-describedby={[props["aria-describedby"], error || hint ? descriptionId : undefined].filter(Boolean).join(" ") || undefined} className="min-h-12 w-full min-w-0 bg-transparent text-ql-body tabular-nums disabled:text-ql-secondary" />
      {suffix || mode === "percentage" ? <span className="text-ql-small text-ql-secondary">{suffix ?? "%"}</span> : null}
    </div>
    {error || hint ? <p id={descriptionId} className={cn("mt-2 text-ql-small", error ? "text-ql-danger-ink" : "text-ql-secondary")}>{error ?? hint}</p> : null}
  </div>;
}

