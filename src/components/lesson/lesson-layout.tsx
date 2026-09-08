import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { AuthoredLesson } from "@/features/lessons/types";
import { LessonNavigation } from "./lesson-navigation";

export function LessonLayout({ lesson, children }: { lesson: AuthoredLesson; children: ReactNode }) {
  return <main className="mx-auto max-w-[76rem] px-5 py-9 sm:px-8 lg:px-12 lg:py-12"><nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb"><Link href="/learn" className="hover:text-neutral-950">Learn</Link><ChevronRight size={14} aria-hidden="true" /><Link href={`/learn/${lesson.moduleSlug}`} className="hover:text-neutral-950">Returns</Link><ChevronRight size={14} aria-hidden="true" /><span className="text-neutral-950">{lesson.title}</span></nav><div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,48rem)_13rem]"><article className="min-w-0"><header className="border-b border-line pb-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{lesson.eyebrow} · Lesson 1</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">{lesson.title}</h1><p className="mt-4 text-sm text-muted">{lesson.estimatedMinutes} min read · Interactive practice included</p></header><div className="pt-8">{children}</div></article><aside className="xl:pt-2"><div className="sticky top-8"><LessonNavigation sections={lesson.sections} /></div></aside></div></main>;
}
