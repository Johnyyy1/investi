import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form-controls";

/** Text entry counterpart to FinanceInput, sharing its label, control and focus treatment. */
export function TextInput({ label, hint, className, id, ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  const generated = useId();
  const inputId = id ?? generated;
  return <div><label htmlFor={inputId} className="mb-2 block text-small font-bold">{label}</label><Input {...props} id={inputId} aria-describedby={hint ? `${inputId}-hint` : undefined} className={cn(className)} />{hint ? <p id={`${inputId}-hint`} className="mt-2 text-small text-secondary">{hint}</p> : null}</div>;
}
