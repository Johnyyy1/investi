import { ArrowRight } from "lucide-react";
import { LearningLink } from "@/components/learning/learning-button";
import Link from "next/link";
export const metadata = { title: "Lab" };
export default function LabPage() {
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-10 lg:py-14">
    <p className="text-ql-small font-semibold text-ql-link">The Lab</p>
    <h1 className="mt-3 text-ql-celebration font-bold">What happens if…</h1>
    <p className="mt-4 text-ql-emphasis text-ql-secondary">Change something. See the effect. Understand why.</p>
    <section className="mt-12 grid gap-8 border-y border-ql-border py-10 sm:grid-cols-[1fr_1fr] sm:items-center">
      <div><h2 className="text-ql-section font-semibold">Build a portfolio</h2><p className="mt-3 max-w-sm text-ql-body text-ql-secondary">Mix stocks, bonds, and cash. See how the same scenario changes with your allocation.</p><LearningLink href="/lab/portfolio" className="mt-6 w-full sm:w-auto">Open Portfolio Lab<ArrowRight aria-hidden="true" className="size-4" /></LearningLink></div>
      <div aria-hidden="true" className="space-y-5 sm:pl-8">{[["Stocks", "60%", "bg-ql-blue-500"], ["Bonds", "30%", "bg-ql-warning"], ["Cash", "10%", "bg-ql-success"]].map(([name, width, color]) => <div key={name}><div className="mb-2 flex justify-between text-ql-small"><span>{name}</span><span>{width}</span></div><div className="h-3 rounded-full bg-ql-border"><div className={`h-3 rounded-full ${color}`} style={{ width }} /></div></div>)}</div>
    </section>
    <Link href="/lab/backtesting" className="group flex items-center justify-between gap-5 py-8"><div><p className="text-ql-small text-ql-secondary">Demo data · synthetic monthly returns</p><h2 className="mt-2 text-ql-section font-semibold group-hover:text-ql-link">Follow an investment through time</h2><p className="mt-3 text-ql-body text-ql-secondary">Explore growth, drawdown, and the journey between them.</p><span className="mt-4 inline-block text-ql-small font-semibold text-ql-link">Open Backtesting Lab</span></div><ArrowRight aria-hidden="true" className="size-6 shrink-0 text-ql-link" /></Link>
  </main>;
}
