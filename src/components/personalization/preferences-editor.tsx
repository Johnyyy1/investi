"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import type { PersonalizedPreferences } from "@/features/personalization/profile";
import { questionTitles } from "@/features/personalization/presentation";
import { updatePersonalizedPreferencesAction } from "@/features/personalization/actions";
import { PreferenceFields } from "./preference-fields";

export function PersonalizationEditor({ initialPreferences, personalized, hasDiagnostic }: {
  initialPreferences: PersonalizedPreferences; personalized: boolean; hasDiagnostic: boolean;
}) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [pending, startTransition] = useTransition();
  function save() {
    setMessage(undefined);
    startTransition(async () => {
      try {
        const result = await updatePersonalizedPreferencesAction(preferences);
        setMessage({ ok: result.ok, text: result.ok ? "Tvoje předvolby učení jsou uložené." : result.message });
        if (result.ok) router.refresh();
      } catch { setMessage({ ok: false, text: "Změny se nepodařilo uložit. Zkus to znovu." }); }
    });
  }
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    {/* React may request a native reset after the action transition, including a handled failure.
        Keep the controlled draft authoritative for these inputs until the user edits it. */}
    <form onReset={(event) => event.preventDefault()} onSubmit={(event) => { event.preventDefault(); save(); }} className="mt-8 space-y-8" aria-describedby={message && !message.ok ? "preferences-message" : undefined}>
      {[0, 1, 2, 3].map((step) => <section key={step}><h2 className="mb-4 text-card-title font-bold">{questionTitles[step]}</h2><PreferenceFields step={step} value={preferences} onChange={(next) => { setPreferences(next); setMessage(undefined); }} disabled={pending} errorId={message && !message.ok ? "preferences-message" : undefined} /></section>)}
      <p className="text-small text-secondary">Tempo je přibližná délka jednoho sezení. Úprava předvoleb zachová diagnostiku i postup v lekcích.</p>
      {message && <p id="preferences-message" role={message.ok ? "status" : "alert"} className={message.ok ? "text-success-ink" : "text-danger-ink"}>{message.text}</p>}
      <Button type="submit" loading={pending} className="w-full whitespace-normal sm:w-auto">{pending ? "Ukládám předvolby…" : "Uložit předvolby"}</Button>
    </form>
    <section aria-labelledby="diagnostic-heading" className="mt-10 border-t border-border pt-6">
      <h2 id="diagnostic-heading" className="text-card-title font-bold">Krátká diagnostika</h2>
      <p className="mt-3 text-body text-secondary">{hasDiagnostic ? "Tvoje odpovědi jsou uložené a pomáhají doporučit další krok." : "Diagnostiku zatím nemáš dokončenou."}</p>
      <ButtonLink href={personalized ? "/onboarding?retake=1" : "/onboarding?personalize=1"} variant="secondary" className="mt-4 w-full whitespace-normal text-center sm:w-auto">{personalized ? "Zopakovat krátkou diagnostiku" : "Dokončit přizpůsobení"}</ButtonLink>
    </section>
  </div>;
}
