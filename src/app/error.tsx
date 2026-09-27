"use client";
import { PageState } from "@/components/learning/page-state";
import { LearningButton } from "@/components/learning/learning-button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageState title="Tuto stránku se nepodařilo načíst" action={<LearningButton onClick={reset}>Zkusit znovu</LearningButton>}>Zkus to za chvíli. Tvůj uložený postup zůstává propojený s účtem.</PageState>;
}
