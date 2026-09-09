import Link from "next/link";
import { learningNavigation, type ShellNavItem } from "./navigation";

export function AppSidebar({ activeId, items = learningNavigation }: { activeId: string; items?: ShellNavItem[] }) {
  return <aside className="w-60 shrink-0 border-r border-ql-border bg-ql-surface p-6">
    <Link href="/dashboard" className="text-ql-page-title font-bold">investi<span className="text-ql-link">.</span></Link>
    <nav aria-label="Sidebar" className="mt-10 space-y-2">{items.map(({ id, label, icon: Icon, href }) => href ? <Link key={id} href={href} aria-current={activeId === id ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-ql-md px-3 text-ql-small font-semibold ${activeId === id ? "bg-ql-blue-50 text-ql-link" : "text-ql-secondary hover:bg-ql-page"}`}><Icon className="size-5" aria-hidden="true" />{label}</Link> : <span key={id} aria-disabled="true" className="flex min-h-12 items-center gap-3 px-3 text-ql-small text-ql-secondary"><Icon className="size-5" aria-hidden="true" />{label}<span className="sr-only"> — upcoming</span></span>)}</nav>
  </aside>;
}

