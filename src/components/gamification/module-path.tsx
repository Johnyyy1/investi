import { CircleCheck, LockKeyhole } from "lucide-react";
import { LearningButton } from "@/components/learning/learning-button";

export type ModulePathItem = { id: string; title: string; minutes: number; state: "completed" | "active" | "available" | "locked" };
export function ModulePath({ items, onOpen }: { items: ModulePathItem[]; onOpen: (id: string) => void }) {
  return <ol aria-label="Module learning path">{items.map((item, index) => <li key={item.id} className="relative flex gap-4 pb-7 last:pb-0 sm:gap-5" aria-current={item.state === "active" ? "step" : undefined}>
    {index < items.length - 1 ? <span aria-hidden="true" className="absolute top-10 bottom-0 left-5 w-0.5 bg-border-strong" /> : null}
    <span aria-hidden="true" className={`relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-small font-bold ${item.state === "completed" ? "border-success-ink bg-success text-data-dark" : item.state === "active" ? "border-primary-hover bg-primary-soft text-primary-hover ring-4 ring-surface" : item.state === "locked" ? "border-border-strong bg-surface-muted text-secondary" : "border-border-strong bg-surface text-secondary"}`}>{item.state === "completed" ? <CircleCheck className="size-5" /> : item.state === "locked" ? <LockKeyhole className="size-4" /> : index + 1}</span>
    <div className="min-w-0 flex-1"><p className="text-body font-bold">{item.title}</p><p className={`mt-1 text-small ${item.state === "completed" ? "font-semibold text-success-ink" : item.state === "active" ? "font-semibold text-primary-hover" : "text-secondary"}`}>{item.state === "locked" ? "Upcoming" : item.state === "active" ? "In progress" : item.state === "completed" ? "Completed" : "Ready to start"} · {item.minutes} min</p>
      {item.state !== "locked" ? <LearningButton className="mt-3" variant={item.state === "active" ? "primary" : "ghost"} onClick={() => onOpen(item.id)}>{item.state === "completed" ? "Review lesson" : item.state === "active" ? "Continue lesson" : "Start lesson"}</LearningButton> : null}
    </div>
  </li>)}</ol>;
}
