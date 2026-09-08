import { CircleCheck, LockKeyhole } from "lucide-react";
import { LearningButton } from "@/components/learning/learning-button";

export type ModulePathItem = { id: string; title: string; minutes: number; state: "completed" | "active" | "available" | "locked" };
export function ModulePath({ items, onOpen }: { items: ModulePathItem[]; onOpen: (id: string) => void }) {
  return <ol aria-label="Module learning path">{items.map((item, index) => <li key={item.id} className="relative flex gap-5 pb-8 last:pb-0" aria-current={item.state === "active" ? "step" : undefined}>
    {index < items.length - 1 ? <span aria-hidden="true" className="absolute top-12 bottom-0 left-6 w-px bg-ql-border-strong" /> : null}
    <span aria-hidden="true" className={`relative flex size-12 shrink-0 items-center justify-center rounded-ql-md border text-ql-body font-semibold ${item.state === "completed" ? "border-ql-success bg-ql-success-bg text-ql-success-ink" : item.state === "active" ? "border-ql-blue-700 bg-ql-blue-100 text-ql-text" : "border-ql-border-strong bg-ql-surface text-ql-secondary"}`}>{item.state === "completed" ? <CircleCheck className="size-5" /> : item.state === "locked" ? <LockKeyhole className="size-5" /> : index + 1}</span>
    <div className="min-w-0 flex-1 pt-1"><p className="text-ql-body font-semibold">{item.title}</p><p className="mt-1 text-ql-small text-ql-secondary">{item.state === "locked" ? "Upcoming" : item.state === "active" ? "In progress" : item.state === "completed" ? "Completed" : "Ready to start"} · {item.minutes} min</p>
      {item.state !== "locked" ? <LearningButton className="mt-3" variant={item.state === "active" ? "primary" : "ghost"} onClick={() => onOpen(item.id)}>{item.state === "completed" ? "Review lesson" : item.state === "active" ? "Continue lesson" : "Start lesson"}</LearningButton> : null}
    </div>
  </li>)}</ol>;
}

