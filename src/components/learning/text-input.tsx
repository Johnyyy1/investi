import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Text entry counterpart to FinanceInput, sharing its label, control and focus treatment. */
export function TextInput({ label, hint, className, id, ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  const generated = useId();
  const inputId = id ?? generated;
  return <div><label htmlFor={inputId} className="mb-2 block text-ql-small font-semibold">{label}</label><input {...props} id={inputId} aria-describedby={hint ? `${inputId}-hint` : undefined} className={cn("min-h-12 w-full min-w-0 rounded-ql-md border border-ql-control bg-ql-surface px-4 text-ql-body placeholder:text-ql-secondary", className)} />{hint ? <p id={`${inputId}-hint`} className="mt-2 text-ql-small text-ql-secondary">{hint}</p> : null}</div>;
}
