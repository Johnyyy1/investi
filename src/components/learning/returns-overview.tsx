"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModulePath, type ModulePathItem } from "@/components/gamification/module-path";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { LearningProgressBar } from "./lesson-progress";
import { returnsLessons } from "@/features/lessons/returns/manifest";

export function ReturnsOverview({ items, completedLessons }: { items: ModulePathItem[]; completedLessons: number }) {
  const router = useRouter();
  return <div className="flex min-h-screen">
    <a href="#returns-main" className="sr-only z-50 bg-ql-surface p-4 focus:not-sr-only focus:fixed">Skip to Returns</a>
    <div className="hidden lg:flex"><AppSidebar activeId="learn" /></div>
    <main id="returns-main" className="mx-auto w-full min-w-0 max-w-4xl px-5 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-10 lg:py-12">
      <Link href="/learn" className="inline-flex min-h-12 items-center text-ql-small text-ql-link underline underline-offset-4">All modules</Link>
      <div className="mt-6"><AppHeader title="Returns" description="Learn how investment performance is measured and how returns combine over time." /></div>
      <section aria-label="Module progress" className="mt-8 max-w-xl border-y border-ql-border py-6">
        <div className="mb-3 flex flex-wrap justify-between gap-2 text-ql-small"><p className="font-semibold">{completedLessons === returnsLessons.length ? "Module complete" : "Your progress"}</p><p data-testid="module-progress" className="text-ql-secondary">{completedLessons} of {returnsLessons.length} lessons complete</p></div>
        <LearningProgressBar value={completedLessons} total={returnsLessons.length} label="Returns module progress" />
        {completedLessons > 0 ? <div className="mt-6"><AchievementBadge title="Building your foundations" description={`${completedLessons} ${completedLessons === 1 ? "lesson completed" : "lessons completed"}. Your progress is saved to your account.`} unlocked /></div> : <p className="mt-4 text-ql-small text-ql-secondary">Start with one idea. Each completed lesson becomes part of your foundation.</p>}
      </section>
      <section className="mt-10 max-w-xl" aria-labelledby="returns-path-title">
        <h2 id="returns-path-title" className="mb-8 text-ql-section font-semibold">Your learning path</h2>
        <ModulePath items={items} onOpen={(id) => {
          const lesson = returnsLessons.find((item) => item.id === id && item.status === "available");
          if (lesson) router.push(`/learn/returns/${lesson.slug}`);
        }} />
      </section>
    </main>
    <MobileNav activeId="learn" />
  </div>;
}
