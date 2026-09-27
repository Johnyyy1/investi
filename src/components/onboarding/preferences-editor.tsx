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
        setMessage({ ok: result.ok, text: result.ok ? "Tvoje předvolby učení jsou uložené." : result.message });
      } catch { setMessage({ ok: false, text: "Připojení se nepodařilo. Změny tu zůstaly, zkus to znovu." }); }
    });
  }
  return <form action={save} className="mt-10 space-y-10">
    {[1, 2, 3, 4].map((step) => <section key={step}><h2 className="mb-3 text-ql-title font-semibold">{questionTitles[step]}</h2><PreferencesQuestion step={step} answers={answers} onChange={(next) => { setAnswers(next); setMessage(undefined); }} disabled={pending} /></section>)}
    <p className="text-ql-small text-ql-secondary">Denní čas nastavuje jednoduchý cíl: 5–10 minut je jedna lekce, 15–20 jsou dvě. Cíle i zájmy jsou volitelné.</p>
    <div>{message && <p className={`mb-4 text-ql-small ${message.ok ? "text-ql-success-ink" : "text-ql-danger-ink"}`} role={message.ok ? "status" : "alert"}>{message.text}</p>}<LearningButton type="submit" loading={pending} disabled={!parsed.success} className="w-full sm:w-auto">{pending ? "Ukládám…" : "Uložit předvolby"}</LearningButton></div>
  </form>;
}
