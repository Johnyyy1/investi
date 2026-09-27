"use client";
import { AnswerOption } from "@/components/learning/answer-option";
import { dailyGoals, experienceOptions, goalOptions, interestOptions, type OnboardingDraft } from "@/features/onboarding/domain";

export const questionTitles = ["", "Jak se vyznáš v investování?", "V čem se chceš zlepšit?", "Co tě zajímá nejvíc?", "Kolik času chceš každý den věnovat učení?"];
export const questionHints = ["", "Vyber popis, který ti sedí nejlépe. Není to test.", "Volitelné. Vyber cíle, které se ti hodí.", "Volitelné. Vyber témata, která chceš prozkoumat.", "Trocha času pravidelně. Zvol tempo, které vyhovuje tvému dni."];

export function PreferencesQuestion({ step, answers, onChange, disabled = false }: {
  step: number; answers: OnboardingDraft; onChange: (answers: OnboardingDraft) => void; disabled?: boolean;
}) {
  const options = step === 1 ? experienceOptions : step === 2 ? goalOptions : step === 3 ? interestOptions : dailyGoals.map((value) => ({ value: String(value), label: `${value === 20 ? "20+" : value} minut` }));
  const selected = step === 1 ? [answers.experienceLevel] : step === 2 ? answers.goals : step === 3 ? answers.interests : [String(answers.dailyGoalMinutes)];
  function select(value: string) {
    if (step === 1) onChange({ ...answers, experienceLevel: value as OnboardingDraft["experienceLevel"] });
    if (step === 4) onChange({ ...answers, dailyGoalMinutes: Number(value) as OnboardingDraft["dailyGoalMinutes"] });
    if (step === 2 || step === 3) {
      const key = step === 2 ? "goals" : "interests";
      const values: string[] = answers[key];
      onChange({ ...answers, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] });
    }
  }
  return <fieldset disabled={disabled} aria-describedby={`question-hint-${step}`}>
    <legend className="sr-only">{questionTitles[step]}</legend>
    <p id={`question-hint-${step}`} className="mb-7 text-ql-body text-ql-secondary">{questionHints[step]}</p>
    <div className="grid gap-3">{options.map(({ value, label }) => <AnswerOption key={value} name={`preference-${step}`} value={value} type={step === 2 || step === 3 ? "checkbox" : "radio"} checked={selected.some((item) => item === value)} state={selected.some((item) => item === value) ? "selected" : "idle"} onChange={select}>{label}</AnswerOption>)}</div>
  </fieldset>;
}
