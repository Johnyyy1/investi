import { FlaskConical, ListChecks } from "lucide-react";

export function PortfolioLabBridge({ title, children }: { title: string; children: string }) {
  return <aside className="rounded-surface border border-primary/30 bg-primary-soft px-5 py-5 sm:px-6" aria-label={title}>
    <div className="flex gap-3">
      <FlaskConical aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-hover" />
      <div><h3 className="text-body font-bold text-primary-hover">{title}</h3><p className="mt-1 text-small text-secondary">{children}</p></div>
    </div>
  </aside>;
}

export function LessonSummary({ title, children }: { title: string; children: string }) {
  return <section className="border-y border-border py-6" aria-label={title}>
    <div className="flex gap-3">
      <ListChecks aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success-ink" />
      <div><h3 className="text-body font-bold">{title}</h3><p className="mt-2 text-body text-secondary">{children}</p></div>
    </div>
  </section>;
}
