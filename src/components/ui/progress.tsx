import { cn } from "@/lib/utils";

export function Progress({ value, total = 100, label, className, tone = "primary" }: { value: number; total?: number; label: string; className?: string; tone?: "primary" | "success" }) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 1;
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(safeTotal, value)) : 0;
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeTotal} aria-valuenow={safeValue} className={cn("h-3 flex-1 overflow-hidden rounded-pill", tone === "success" ? "bg-success-soft" : "bg-primary-soft", className)}>
    <div className={cn("h-full rounded-pill transition-[width] duration-[var(--motion-surface)] ease-[var(--ease-standard)]", tone === "success" ? "bg-success" : "bg-primary-hover")} style={{ width: `${safeValue / safeTotal * 100}%` }} />
  </div>;
}
