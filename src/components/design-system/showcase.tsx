"use client";
import { useState, type ReactNode } from "react";
import { LearningButton } from "@/components/learning/learning-button";
import { AnswerOption, type AnswerState } from "@/components/learning/answer-option";
import { LessonFeedback } from "@/components/learning/lesson-feedback";
import { ConceptCard } from "@/components/learning/concept-card";
import { FormulaBlock } from "@/components/learning/formula-block";
import { LearningChart } from "@/components/learning/learning-chart";
import { Streak } from "@/components/gamification/streak";
import { XpCounter } from "@/components/gamification/xp-counter";
import { DailyGoal } from "@/components/gamification/daily-goal";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { ModulePath } from "@/components/gamification/module-path";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { AppHeader } from "@/components/shell/app-header";
import { PracticeDemo } from "./practice-demo";
import { InputDemo } from "./input-demo";

function Section({ id, index, title, description, children }: { id: string; index: string; title: string; description: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-8 border-t border-ql-border py-10 sm:py-12">
    <div className="mb-8 flex gap-4"><span className="pt-1 text-ql-meta text-ql-secondary">{index}</span><div><h2 className="text-ql-section font-semibold">{title}</h2><p className="mt-2 max-w-2xl text-ql-small text-ql-secondary">{description}</p></div></div>{children}
  </section>;
}
const swatches = [
  ["Page", "bg-ql-page"], ["Surface", "bg-ql-surface"], ["Subtle", "bg-ql-subtle"],
  ["Primary", "bg-ql-blue-500"], ["Success", "bg-ql-success"], ["Warning", "bg-ql-warning"], ["Danger", "bg-ql-danger"],
];
const pathItems = [
  { id: "one", title: "What is a return?", minutes: 12, state: "completed" as const },
  { id: "two", title: "Simple returns", minutes: 14, state: "completed" as const },
  { id: "three", title: "Compounding & cumulative returns", minutes: 15, state: "active" as const },
  { id: "four", title: "Another practice", minutes: 5, state: "available" as const },
  { id: "five", title: "Log returns", minutes: 10, state: "locked" as const },
];
export function DesignSystemShowcase() {
  const [xp, setXp] = useState(120);
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [idleSelected, setIdleSelected] = useState(false);
  return <>
    <a href="#showcase-main" className="sr-only z-50 rounded-ql-xs bg-ql-surface p-4 focus:not-sr-only focus:fixed focus:top-4 focus:left-4">Skip to components</a>
    <div className="mx-auto max-w-7xl px-5 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ql-border py-6"><p className="text-ql-title font-semibold">QuantLearn<span className="text-ql-blue-600">.</span></p><p className="text-ql-meta text-ql-secondary">DESIGN SYSTEM / DEVELOPMENT ONLY</p></div>
      <main id="showcase-main">
        <div className="py-10 sm:py-16"><p className="mb-4 text-ql-small font-semibold text-ql-link">A clearer path to understanding.</p><AppHeader title="Small steps. Strong foundations." description="A lighter learning language for QuantLearn. Explore the components, try a question, and see how the system works together." />
          <nav aria-label="Showcase sections" className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-ql-small text-ql-link">{[["foundations", "Foundations"], ["practice", "Learning flow"], ["controls", "Controls"], ["explanations", "Explanations"], ["data", "Data"], ["motivation", "Motivation"], ["shell", "Shell"]].map(([id, label]) => <a key={id} href={`#${id}`} className="underline decoration-ql-border-strong underline-offset-4">{label}</a>)}</nav>
        </div>
        <Section id="foundations" index="01" title="Calm, with a little optimism" description="Soft surfaces, clear type, and color with a purpose. Nunito Sans at weights 400–700.">
          <div className="grid gap-8 lg:grid-cols-2"><div className="flex flex-wrap gap-4">{swatches.map(([name, color]) => <div key={name}><div className={`h-16 w-20 rounded-ql-md border border-ql-border ${color}`} /><p className="mt-2 text-ql-meta text-ql-secondary">{name}</p></div>)}</div><div className="space-y-3"><p className="text-ql-page-title font-semibold">Learning that stays with you.</p><p className="text-ql-title font-semibold">One idea at a time</p><p className="text-ql-body text-ql-secondary">Build confidence through clear explanations and useful practice.</p><p className="text-ql-meta text-ql-secondary">12 metadata · 14 secondary · 16 body · 20 title · 24 section · 32 page</p></div></div>
        </Section>
        <Section id="practice" index="02" title="A complete learning interaction" description="Choose an answer, check your reasoning, then continue. All progress and rewards here are demonstration values.">
          <div className="mx-auto max-w-3xl"><PracticeDemo /></div>
        </Section>
        <Section id="controls" index="03" title="Clear choices, confident actions" description="Touch-friendly buttons and native radio choices. Color reinforces the state; words and controls communicate it.">
          <div className="flex flex-wrap gap-3">{(["primary", "secondary", "success", "danger", "ghost"] as const).map((variant) => <LearningButton key={variant} variant={variant} onClick={() => setMessage(`${variant} button pressed.`)}>{variant.charAt(0).toUpperCase() + variant.slice(1)}</LearningButton>)}<LearningButton disabled>Disabled</LearningButton><LearningButton loading>Saving progress</LearningButton></div>
          <p role="status" className="mt-3 min-h-6 text-ql-small text-ql-secondary">{message}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">{(["idle", "selected", "correct", "incorrect", "disabled"] as AnswerState[]).map((state) => <AnswerOption key={state} name={`state-${state}`} value={state} state={state === "idle" && idleSelected ? "selected" : state} disabled={state !== "idle"} checked={state === "selected" || state === "idle" && idleSelected} onChange={() => setIdleSelected(true)}>{state.charAt(0).toUpperCase() + state.slice(1)} answer state</AnswerOption>)}</div>
          <div className="mt-8 space-y-4"><LessonFeedback state="correct" title="Correct">A percentage return compares a change with its starting value.</LessonFeedback><LessonFeedback state="incorrect" title="Try a different base">The second period starts from the first period’s ending value.</LessonFeedback><LessonFeedback state="informational" title="Take your time">Your answer has no effect on the example data.</LessonFeedback></div>
        </Section>
        <Section id="explanations" index="04" title="Make room for the idea" description="Concepts and mathematics share a calm reading surface. Formula output includes screen-reader-friendly MathML.">
          <div className="grid gap-6 lg:grid-cols-2"><ConceptCard title="The base changes every period">A return always has a starting point. A 20% loss after a gain applies to the new value.</ConceptCard><FormulaBlock formula={String.raw`R_t = \frac{P_t-P_{t-1}}{P_{t-1}}`} variables={[{ symbol: "Pₜ", meaning: "Current price" }, { symbol: "Pₜ₋₁", meaning: "Previous price" }, { symbol: "Rₜ", meaning: "Period return" }]} explanation="One period. One starting price." /></div>
        </Section>
        <Section id="data" index="05" title="Numbers you can work with" description="Raw text enters the field; the financial domain validates it. Chart defaults and output styles live in the component layer.">
          <InputDemo />
          <div className="mt-8 grid gap-6 lg:grid-cols-2"><LearningChart title="Follow the changing value" description="Example: 10,000 grows 20%, then falls 20%." data={[{ label: "Start", value: 10000 }, { label: "Period 1", value: 12000 }, { label: "Period 2", value: 9600 }]} formatValue={(value) => value.toLocaleString("en-US")} /><LearningChart title="Your next experiment" description="No observations yet." data={[]} /></div>
        </Section>
        <Section id="motivation" index="06" title="Progress worth noticing" description="Small acknowledgements for a daily practice. These are controlled visual components, with no new persisted gamification model.">
          <div className="grid gap-10 lg:grid-cols-2"><div className="space-y-8"><div className="flex flex-wrap items-center gap-6"><Streak days={6} /><XpCounter value={xp} /><LearningButton variant="ghost" onClick={() => setXp((value) => value + 20)}>Preview +20 XP</LearningButton></div><DailyGoal completed={2} target={3} /><AchievementBadge title="First principles" description="Finish your first Returns lesson." unlocked /><AchievementBadge title="A steady practice" description="Complete your weekly learning goal." unlocked={unlocked} /><LearningButton variant="secondary" onClick={() => setUnlocked((value) => !value)}>{unlocked ? "Reset achievement" : "Preview unlock"}</LearningButton></div><div><ModulePath items={pathItems} onOpen={(id) => setMessage(`Selected: ${pathItems.find((item) => item.id === id)?.title}. This is a preview.`)} /><p role="status" className="mt-4 text-ql-small text-ql-secondary">{message}</p></div></div>
        </Section>
        <Section id="shell" index="07" title="A little structure. Plenty of space." description="Desktop sidebar and mobile bottom navigation foundations. Practice and Progress remain unavailable until those routes exist; lesson mode hides the bottom navigation.">
          <div className="flex overflow-hidden rounded-ql-xl border border-ql-border"><div className="hidden sm:flex"><AppSidebar activeId="learn" /></div><div className="min-w-0 flex-1 p-6 sm:p-8"><AppHeader heading="h3" title="Keep learning" description="A shell preview, ready for the next screen migration." /><p className="mt-8 text-ql-small text-ql-secondary">Lesson mode gives the content the full viewport, using LessonProgress for navigation.</p></div></div>
          <div className="mt-6 overflow-hidden rounded-ql-lg border border-ql-border"><MobileNav activeId="learn" preview /></div>
        </Section>
      </main>
      <footer className="border-t border-ql-border py-8 text-ql-small text-ql-secondary">QuantLearn / Foundation 01 · Preview data only</footer>
    </div>
  </>;
}
