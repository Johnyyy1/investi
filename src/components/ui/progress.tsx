import { cn } from "@/lib/utils";

export function Progress({ value, total = 100, label, className }: { value: number; total?: number; label: string; className?: string }) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 1;
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(safeTotal, value)) : 0;
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeTotal} aria-valuenow={safeValue} className={cn("h-3 flex-1 overflow-hidden rounded-pill bg-primary-soft", className)}>
    <div className="h-full rounded-pill bg-primary-hover transition-[width] duration-[var(--motion-surface)] ease-[var(--ease-standard)]" style={{ width: `${safeValue / safeTotal * 100}%` }} />
  </div>;
}
