"use client";
import { startTransition as restoreTransition, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnswerOption } from "@/components/learning/answer-option";
import { Button } from "@/components/ui/button";
import { completePersonalizationAction, retakeDiagnosticAction, skipPersonalizationAction } from "@/features/personalization/actions";
import type { PersonalizedPreferences } from "@/features/personalization/profile";
import { type PersonalizationDraft, type PublicQuestion, restoreDraft } from "@/features/personalization/draft";
import { questionTitles } from "@/features/personalization/presentation";
import { PreferenceFields } from "./preference-fields";
import styles from "./personalization-flow.module.css";

export function PersonalizationFlow({ initialPreferences, questions, version, draftKey, retake = false }: {
  initialPreferences: PersonalizedPreferences; questions: readonly PublicQuestion[]; version: string; draftKey: string; retake?: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<PersonalizationDraft>({ preferences: initialPreferences, step: retake ? 4 : 0, question: -1, answers: {} });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    let saved: PersonalizationDraft | null = null;
    try { saved = restoreDraft(sessionStorage.getItem(draftKey), questions); } catch { /* Storage can be disabled. */ }
    restoreTransition(() => { if (saved) setDraft({ ...saved, step: retake ? 4 : saved.step }); setReady(true); });
  }, [draftKey, questions, retake]);
  useEffect(() => {
    if (ready) { try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* The form still works without local recovery. */ } }
  }, [draft, draftKey, ready]);
  useEffect(() => {
    if (moved.current) { heading.current?.focus(); window.scrollTo({ top: 0, behavior: "instant" }); }
  }, [draft.step, draft.question]);
  function move(update: Partial<PersonalizationDraft>) { moved.current = true; setError(undefined); setDraft((current) => ({ ...current, ...update })); }
  function submit(skip = false) {
    if (busy.current) return;
    busy.current = true; setError(undefined);
    startTransition(async () => {
      try {
        const diagnostic = { version, answers: draft.answers };
        const result = await (skip ? skipPersonalizationAction({}) : retake ? retakeDiagnosticAction(diagnostic) : completePersonalizationAction({ preferences: draft.preferences, diagnostic }));
        if (!result.ok) { setError(result.message); return; }
        try { sessionStorage.removeItem(draftKey); } catch { /* Optional recovery storage. */ }
        router.replace(skip ? "/learn" : "/onboarding/plan"); router.refresh();
      } catch { setError("Připojení se nepodařilo. Odpovědi tu zůstaly, zkus je odeslat znovu."); }
      finally { busy.current = false; }
    });
  }
  const current = draft.step === 4 && draft.question >= 0 ? questions[draft.question] : undefined;
  const title = draft.step < 4 ? questionTitles[draft.step] : current?.prompt ?? (retake ? "Zopakovat krátkou diagnostiku" : "Najdeme vhodný začátek");
  const canContinue = draft.step === 0 ? Boolean(draft.preferences.primaryGoal) : current ? Boolean(draft.answers[current.id]) : true;
  function next() {
    if (!canContinue || pending) return;
    if (draft.step < 4) move({ step: draft.step + 1 });
    else if (draft.question < questions.length - 1) move({ question: draft.question + 1 });
    else submit();
  }
  return <main className={`${styles.flow} mx-auto min-h-dvh w-full max-w-2xl px-4 py-6 sm:px-8 sm:py-10`}>
    <Link href="/learn" className="inline-flex min-h-12 items-center text-card-title font-bold">investi<span className="text-primary-hover">.</span></Link>
    {!ready ? <p role="status" className="mt-12">Načítám tvé předvolby…</p> : <>
      <p role="status" aria-live="polite" className="mt-8 text-small font-semibold text-secondary">{retake ? "Krátká diagnostika" : `Krok ${draft.step + 1} z 6 · ${["Cíl", "Zájmy", "Zkušenosti", "Tempo", "Diagnostika"][draft.step]}`}{current ? ` · Otázka ${draft.question + 1} z ${questions.length}` : ""}</p>
      <h1 ref={heading} tabIndex={-1} className="mt-3 text-section-title font-bold outline-none">{title}</h1>
      {draft.step === 1 && <p className="mt-3 text-body text-secondary">Vyber libovolný počet témat. Zájmy můžeš doplnit i později.</p>}
      {draft.step === 3 && <p className="mt-3 text-body text-secondary">Jde o přibližné tempo jednoho sezení. Kdykoli si můžeš dát pauzu.</p>}
      <form className="mt-7" onSubmit={(event) => { event.preventDefault(); next(); }} aria-describedby={error ? "personalization-error" : undefined}>
        {draft.step < 4 ? <PreferenceFields step={draft.step} value={draft.preferences} onChange={(preferences) => { setError(undefined); setDraft({ ...draft, preferences }); }} disabled={pending} errorId={error ? "personalization-error" : undefined} /> : current ? <fieldset disabled={pending} aria-describedby={error ? "personalization-error" : undefined} className="min-w-0 space-y-3">
          <legend className="sr-only">{current.prompt}</legend>
          {current.options.map((option) => <AnswerOption key={option.id} name={current.id} value={option.id} checked={draft.answers[current.id] === option.id} state={draft.answers[current.id] === option.id ? "selected" : "idle"} disabled={pending} onChange={(answer) => setDraft({ ...draft, answers: { ...draft.answers, [current.id]: answer } })}>{option.label}</AnswerOption>)}
        </fieldset> : <div className="space-y-3 text-body text-secondary"><p>5 krátkých otázek nám pomůže doporučit, kde začít.</p><p>Výsledek nic neodemkne ani nepřeskakuje.</p></div>}
        {error && <p id="personalization-error" role="alert" className="mt-5 text-body text-danger-ink">{error} <Link className="underline" href="/sign-in">Přihlášení</Link></p>}
        <div className="mt-8 flex flex-col gap-2 min-[420px]:flex-row-reverse">
          <Button type="submit" className="min-w-0 flex-1 whitespace-normal" loading={pending} disabled={!canContinue}>{pending ? "Ukládám odpovědi…" : draft.step === 4 ? draft.question === questions.length - 1 ? "Zobrazit můj plán" : draft.question === -1 ? "Začít diagnostiku" : "Další otázka" : "Pokračovat"}</Button>
          {(draft.step > 0 && !retake || draft.question >= 0) && <Button variant="ghost" disabled={pending} onClick={() => move(draft.step === 4 && draft.question >= 0 ? { question: draft.question - 1 } : { step: draft.step - 1 })}>Zpět</Button>}
        </div>
      </form>
      <div className="mt-6 border-t border-border pt-3">{retake ? <Link href="/settings" className="inline-flex min-h-12 items-center text-small text-secondary underline">Zpět do nastavení</Link> : <Button variant="ghost" className="w-full whitespace-normal px-2 text-small text-secondary" disabled={pending} onClick={() => submit(true)}>Přeskočit personalizaci</Button>}</div>
    </>}
  </main>;
}
