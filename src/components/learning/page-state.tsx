import type { ReactNode } from "react";
export function PageState({ title, children, action, status = false }: { title: string; children: ReactNode; action?: ReactNode; status?: boolean }) {
  return <main className="mx-auto max-w-2xl px-5 py-16 sm:px-10" role={status ? "status" : undefined}><h1 className="text-ql-page-title font-semibold">{title}</h1><div className="mt-4 text-ql-body text-ql-secondary">{children}</div>{action ? <div className="mt-8">{action}</div> : null}</main>;
}
