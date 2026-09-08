import type { ReactNode } from "react";

export function ConceptCard({ title, children }: { title: string; children: ReactNode }) {
  return <aside className="rounded-ql-lg border border-ql-border bg-ql-subtle p-6">
    <h3 className="text-ql-title font-semibold">{title}</h3>
    <div className="mt-2 text-ql-body text-ql-secondary">{children}</div>
  </aside>;
}

