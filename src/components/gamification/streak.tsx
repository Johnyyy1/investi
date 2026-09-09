import { Flame } from "lucide-react";
export function Streak({ days }: { days: number }) {
  return <span className="inline-flex items-center gap-2 text-ql-small font-semibold"><Flame className="size-5 text-ql-warning-ink" aria-hidden="true" />{days} day streak</span>;
}

