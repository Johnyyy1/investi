"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AppSidebar } from "./shell/app-sidebar";
import { MobileNav } from "./shell/mobile-nav";
import { LearningButton } from "./learning/learning-button";
import { isFocusedLesson } from "@/features/lessons/returns/guided-flow";
import { authClient } from "@/lib/auth-client";

export function AppShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const activeId = pathname.startsWith("/learn") ? "learn" : pathname === "/progress" ? "progress" : pathname.startsWith("/settings") ? "settings" : "home";
  async function signOut() {
    setPending(true); setError(undefined);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/sign-in"); router.refresh();
    } catch { setError("Could not sign out. Please try again."); setPending(false); }
  }
  if (isFocusedLesson(pathname)) return children;
  return <div className="min-h-screen lg:flex">
    <a href="#main-content" className="sr-only z-50 bg-ql-surface p-4 focus:not-sr-only focus:fixed">Skip to content</a>
    <div className="hidden lg:flex"><AppSidebar activeId={activeId} /></div>
    <div className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-ql-border px-5 sm:px-10">
        <Link href="/dashboard" className="text-ql-title font-bold lg:hidden">investi<span className="text-ql-link">.</span></Link>
        <p className="min-w-0 max-w-48 truncate text-ql-small text-ql-secondary">{userName}</p>
        <LearningButton variant="ghost" loading={pending} onClick={() => void signOut()}>Sign out</LearningButton>
        {error ? <p role="alert" className="w-full pb-3 text-ql-small text-ql-danger-ink">{error}</p> : null}
      </header>
      <div id="main-content" tabIndex={-1}>{children}</div>
    </div>
    <MobileNav activeId={activeId} />
  </div>;
}
