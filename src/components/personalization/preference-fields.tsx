"use client";
import { AnswerOption } from "@/components/learning/answer-option";
import type { PersonalizedPreferences } from "@/features/personalization/profile";
import { experienceLabels, goalLabels, interestLabels, questionTitles, sessionLabels } from "@/features/personalization/presentation";

export function PreferenceFields({ step, value, onChange, disabled, errorId }: {
  step: number; value: PersonalizedPreferences; onChange: (value: PersonalizedPreferences) => void; disabled?: boolean; errorId?: string;
}) {
  const labels = [goalLabels, interestLabels, experienceLabels, sessionLabels][step];
  const selected: (string | null)[] = step === 0 ? [value.primaryGoal] : step === 1 ? value.interests : step === 2 ? [value.selfAssessedExperience] : [String(value.preferredSessionMinutes)];
  function change(key: string) {
    if (step === 0) onChange({ ...value, primaryGoal: key as PersonalizedPreferences["primaryGoal"] });
    if (step === 1) {
      const interest = key as PersonalizedPreferences["interests"][number];
      onChange({ ...value, interests: value.interests.includes(interest) ? value.interests.filter((item) => item !== interest) : [...value.interests, interest] });
    }
    if (step === 2) onChange({ ...value, selfAssessedExperience: key as PersonalizedPreferences["selfAssessedExperience"] });
    if (step === 3) onChange({ ...value, preferredSessionMinutes: Number(key) as PersonalizedPreferences["preferredSessionMinutes"] });
  }
  return <fieldset disabled={disabled} aria-describedby={errorId} className="min-w-0 space-y-3">
    <legend className="sr-only">{questionTitles[step]}</legend>
    {Object.entries(labels).map(([key, label]) => <AnswerOption key={key} name={`preference-${step}`} type={step === 1 ? "checkbox" : "radio"} value={key} checked={selected.includes(key)} state={selected.includes(key) ? "selected" : "idle"} disabled={disabled} onChange={change}>{label}</AnswerOption>)}
  </fieldset>;
}
