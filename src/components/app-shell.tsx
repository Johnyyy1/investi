"use client";

import { initializeTimeZoneAction } from "@/features/gamification/actions";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { learningNavigation } from "./shell/navigation";
import { MobileNav } from "./shell/mobile-nav";
import { LearningButton } from "./learning/learning-button";
import { availableLessons } from "@/features/learning/catalog";
import { authClient } from "@/lib/auth-client";

export function AppShell({ children, userName, isDemo = false, needsTimeZone = false }: { children: React.ReactNode; userName: string; isDemo?: boolean; needsTimeZone?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const activeId = pathname.startsWith("/learn") ? "learn" : pathname === "/progress" ? "progress" : pathname.startsWith("/lab") ? "lab" : "learn";
  useEffect(() => { if (needsTimeZone) void initializeTimeZoneAction(Intl.DateTimeFormat().resolvedOptions().timeZone); }, [needsTimeZone]);
  async function signOut() {
    setPending(true); setError(undefined);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/sign-in"); router.refresh();
    } catch { setError("Could not sign out. Please try again."); setPending(false); }
  }
  if (availableLessons.some((lesson) => pathname === `/learn/${lesson.moduleSlug}/${lesson.slug}`)) return children;
  return <div className="min-h-dvh">
    <a href="#main-content" className="sr-only z-50 bg-ql-surface p-4 focus:not-sr-only focus:fixed">Skip to content</a>
    <header className="border-b border-ql-border bg-ql-surface">
      <div className="mx-auto flex min-h-[80px] max-w-6xl items-center justify-between gap-[16px] px-[20px] sm:px-10">
        <Link href="/learn" className="shrink-0 text-ql-section font-bold" aria-label="investi — Learn">investi<span className="text-ql-link">.</span>{isDemo && <span className="ml-3 hidden text-ql-small font-normal text-ql-secondary min-[375px]:inline">Demo</span>}</Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-10 lg:flex">{learningNavigation.map(({ id, label, href }) => <Link key={id} href={href!} aria-current={activeId === id ? "page" : undefined} className={`flex min-h-20 items-center border-b-2 px-1 text-ql-body font-semibold ${activeId === id ? "border-ql-link text-ql-link" : "border-transparent text-ql-secondary hover:text-ql-link"}`}>{label}</Link>)}</nav>
        <details key={pathname} className="relative shrink-0" onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}>
          <summary aria-label="Account menu" className="flex size-[48px] cursor-pointer list-none items-center justify-center rounded-full bg-ql-subtle font-bold text-ql-link">{userName.charAt(0).toUpperCase()}</summary>
          <div className="absolute right-0 z-40 mt-3 w-56 rounded-ql-md border border-ql-border bg-ql-surface p-3 shadow-ql-md">
            <p className="truncate px-3 py-2 text-ql-small text-ql-secondary">{isDemo ? "Private demo · 24 hours" : userName}</p>
            <Link href="/settings" className="flex min-h-12 items-center rounded-ql-xs px-3 text-ql-small font-semibold hover:bg-ql-subtle">Settings</Link>
            <LearningButton variant="ghost" className="w-full justify-start" loading={pending} onClick={() => void signOut()}>Sign out</LearningButton>
            {error ? <p role="alert" className="p-3 text-ql-small text-ql-danger-ink">{error}</p> : null}
          </div>
        </details>
      </div>
    </header>
    <div id="main-content" tabIndex={-1} className="pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>
    <MobileNav activeId={activeId} />
  </div>;
}
