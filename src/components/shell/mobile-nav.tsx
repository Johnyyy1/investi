import Link from "next/link";
import { learningNavigation, type ShellNavItem } from "./navigation";

export function MobileNav({ activeId, lessonMode = false, items = learningNavigation, preview = false }: { activeId: string; lessonMode?: boolean; items?: ShellNavItem[]; preview?: boolean }) {
  if (lessonMode) return null;
  return <nav aria-label="Mobile navigation" className={`grid grid-cols-4 border-t border-ql-border bg-ql-surface px-2 pb-[env(safe-area-inset-bottom)] ${preview ? "" : "fixed inset-x-0 bottom-0 z-30 lg:hidden"}`}>{items.map(({ id, label, icon: Icon, href }) => href ? <Link href={href} key={id} aria-current={id === activeId ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-ql-xs text-ql-meta ${id === activeId ? "font-semibold text-ql-link" : "text-ql-secondary"}`}><Icon className="size-5" aria-hidden="true" />{label}</Link> : <span key={id} aria-disabled="true" className="flex min-h-16 flex-col items-center justify-center gap-1 text-ql-meta text-ql-secondary"><Icon className="size-5" aria-hidden="true" />{label}<span className="sr-only"> — upcoming</span></span>)}</nav>;
}

