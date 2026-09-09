"use client";
import { useState, useTransition } from "react";
import { LearningButton } from "@/components/learning/learning-button";
import { preferencesSchema, type OnboardingDraft, type Preferences } from "@/features/onboarding/domain";
import { updatePreferencesAction } from "@/features/onboarding/actions";
import { PreferencesQuestion, questionTitles } from "./preferences-questions";


export function PreferencesEditor({ initialAnswers }: { initialAnswers: Preferences }) {
  const [answers, setAnswers] = useState<OnboardingDraft>(initialAnswers);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [pending, startTransition] = useTransition();
  const parsed = preferencesSchema.safeParse(answers);
  function save() {
    setMessage(undefined);
    startTransition(async () => {
      try {
        const result = await updatePreferencesAction(answers);
        setMessage({ ok: result.ok, text: result.ok ? "Your learning preferences have been saved." : result.message });
      } catch { setMessage({ ok: false, text: "We couldn’t connect. Your changes are still here. Please try again." }); }
    });
  }
  return <form action={save} className="mt-10 space-y-10">
    {[1, 2, 3, 4].map((step) => <section key={step}><h2 className="mb-3 text-ql-title font-semibold">{questionTitles[step]}</h2><PreferencesQuestion step={step} answers={answers} onChange={(next) => { setAnswers(next); setMessage(undefined); }} disabled={pending} /></section>)}
    <p className="text-ql-small text-ql-secondary">Daily minutes set a simple lesson goal: 5–10 minutes is one lesson; 15–20 is two. Goals and interests are optional.</p>
    <div>{message && <p className={`mb-4 text-ql-small ${message.ok ? "text-ql-success-ink" : "text-ql-danger-ink"}`} role={message.ok ? "status" : "alert"}>{message.text}</p>}<LearningButton type="submit" loading={pending} disabled={!parsed.success} className="w-full sm:w-auto">{pending ? "Saving…" : "Save preferences"}</LearningButton></div>
  </form>;
}
