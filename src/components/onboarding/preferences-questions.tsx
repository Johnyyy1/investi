"use client";
import { AnswerOption } from "@/components/learning/answer-option";
import { dailyGoals, experienceOptions, goalOptions, interestOptions, type OnboardingDraft } from "@/features/onboarding/domain";

export const questionTitles = ["", "How familiar are you with investing?", "What would you like to get better at?", "What are you most interested in?", "How much time would you like to learn each day?"];
export const questionHints = ["", "Choose the description that feels closest. There’s no test.", "Choose one or more goals. You can change these later.", "Choose one or more topics you’d like to explore.", "A little time, consistently. Choose a pace that fits your day."];

export function PreferencesQuestion({ step, answers, onChange, disabled = false }: {
  step: number; answers: OnboardingDraft; onChange: (answers: OnboardingDraft) => void; disabled?: boolean;
}) {
  const options = step === 1 ? experienceOptions : step === 2 ? goalOptions : step === 3 ? interestOptions : dailyGoals.map((value) => ({ value: String(value), label: `${value === 20 ? "20+" : value} minutes` }));
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
