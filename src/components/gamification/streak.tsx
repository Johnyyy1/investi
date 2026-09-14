import { Flame } from "lucide-react";
export function Streak({ days }: { days: number }) {
  return <span className="inline-flex min-w-0 items-center gap-2 text-ql-small">
    <Flame className="size-5 shrink-0 text-ql-warning-ink" aria-hidden="true" />
    <span className="min-w-0"><span className="block text-microcopy font-semibold text-secondary">Streak</span><span className="block font-bold">{days} {days === 1 ? "day" : "days"}</span></span>
  </span>;
}
