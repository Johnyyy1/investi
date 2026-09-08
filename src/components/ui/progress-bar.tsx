import { cn } from "@/lib/utils";

type ProgressBarProps = { value: number; className?: string; label: string };

export function ProgressBar({ value, className, label }: ProgressBarProps) {
  const boundedValue = Math.max(0, Math.min(value, 100));
  return <div className={cn("space-y-2", className)}>
    <div className="h-1.5 overflow-hidden bg-neutral-200" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={boundedValue}>
      <div className="h-full bg-positive transition-[width]" style={{ width: `${boundedValue}%` }} />
    </div>
    <p className="text-xs tabular-nums text-muted">{boundedValue}% complete</p>
  </div>;
}
