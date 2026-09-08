import Link from "next/link";
import { BookOpen, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

type AppShellProps = { children: React.ReactNode; userName: string };
const navigation = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/learn", label: "Learn", icon: BookOpen }];

export function AppShell({ children, userName }: AppShellProps) {
  return <div className="min-h-screen bg-background lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
    <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col">
      <div className="border-b border-line px-7 py-7"><Link href="/dashboard" className="text-base font-semibold tracking-[-0.04em]">Quantlearn</Link><p className="mt-1 text-xs text-muted">Quantitative finance, clearly.</p></div>
      <nav className="flex-1 px-4 py-5" aria-label="Primary navigation">{navigation.map(({ href, label, icon: Icon }) => <Link className={cn("mb-1 flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950", href === "/dashboard" && "bg-neutral-100 text-neutral-950")} href={href} key={href}><Icon aria-hidden="true" size={16} strokeWidth={1.7} />{label}</Link>)}</nav>
      <div className="border-t border-line px-7 py-5"><p className="truncate text-sm font-medium">{userName}</p><p className="mt-1 text-xs text-muted">Learner</p></div>
    </aside>
    <div className="min-w-0"><header className="flex min-h-15 items-center justify-between gap-3 border-b border-line bg-surface px-5 lg:hidden"><Link href="/dashboard" className="text-base font-semibold tracking-[-0.04em]">Quantlearn</Link><nav className="flex items-center gap-4 text-sm text-neutral-600" aria-label="Primary navigation"><Link href="/dashboard" className="hover:text-neutral-950">Dashboard</Link><Link href="/learn" className="hover:text-neutral-950">Learn</Link></nav></header>{children}</div>
  </div>;
}
