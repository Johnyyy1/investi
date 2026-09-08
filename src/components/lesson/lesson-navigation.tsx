import Link from "next/link";
import type { LessonSection } from "@/features/lessons/types";

export function LessonNavigation({ sections }: { sections: LessonSection[] }) {
  return <nav className="hidden border-l border-line pl-5 xl:block" aria-label="Lesson sections"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">In this lesson</p><ol className="mt-4 space-y-3">{sections.map((section, index) => <li key={section.id}><Link href={`#${section.id}`} className="text-sm leading-5 text-neutral-600 hover:text-neutral-950"><span className="mr-2 font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>{section.label}</Link></li>)}</ol></nav>;
}
