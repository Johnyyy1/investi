"use client";
import { useEffect, useState, startTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
export function PersonalizationPrompt({ userId }: { userId: string }) {
  const [dismissed, setDismissed] = useState(false);
  const key = `investi-personalization-prompt:${userId}`;
  useEffect(() => { try { if (localStorage.getItem(key)) startTransition(() => setDismissed(true)); } catch { /* Optional UI preference. */ } }, [key]);
  if (dismissed) return null;
  return <section aria-labelledby="personalization-prompt" className="my-6 border-y border-border py-5">
    <h2 id="personalization-prompt" className="text-card-title font-bold">Přizpůsobit učení</h2>
    <p className="mt-2 text-small text-secondary">Řekni nám, co tě zajímá, a doporučení přizpůsobíme tvému cíli.</p>
    <div className="mt-3 flex flex-wrap gap-2"><ButtonLink variant="secondary" href="/onboarding?personalize=1">Přizpůsobit</ButtonLink><Button variant="ghost" onClick={() => { setDismissed(true); try { localStorage.setItem(key, "dismissed"); } catch { /* Dismiss for this visit. */ } }}>Teď ne</Button></div>
  </section>;
}
