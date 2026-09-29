import type { PersonalizedPreferences } from "./profile";
import { experienceLabels, goalLabels, interestLabels, sessionLabels } from "./presentation";

export type PublicQuestion = { id: string; prompt: string; options: readonly { id: string; label: string }[] };
export type PersonalizationDraft = { preferences: PersonalizedPreferences; step: number; question: number; answers: Record<string, string> };
/** Local recovery only. Saved input is revalidated by the server before every mutation. */
export function restoreDraft(raw: string | null, questions: readonly PublicQuestion[]): PersonalizationDraft | null {
  try {
    const draft = JSON.parse(raw ?? "null");
    const p = draft?.preferences;
    if (!p || (p.primaryGoal !== null && !Object.hasOwn(goalLabels, p.primaryGoal)) || !Object.hasOwn(experienceLabels, p.selfAssessedExperience) || !Object.hasOwn(sessionLabels, p.preferredSessionMinutes)) return null;
    if (!Array.isArray(p.interests) || p.interests.some((key: string) => !Object.hasOwn(interestLabels, key)) || new Set(p.interests).size !== p.interests.length) return null;
    if (!Number.isInteger(draft.step) || draft.step < 0 || draft.step > 4 || !Number.isInteger(draft.question) || draft.question < -1 || draft.question >= questions.length) return null;
    if (!draft.answers || typeof draft.answers !== "object" || Array.isArray(draft.answers)) return null;
    if (Object.entries(draft.answers).some(([id, answer]) => !questions.find((q) => q.id === id)?.options.some((option) => option.id === answer))) return null;
    // Never let a corrupted draft jump past unanswered questions or the required goal.
    if (draft.step > 0 && !p.primaryGoal) return null;
    if (draft.question > 0 && questions.slice(0, draft.question).some((q) => !draft.answers[q.id])) return null;
    return { preferences: { primaryGoal: p.primaryGoal, interests: p.interests, selfAssessedExperience: p.selfAssessedExperience, preferredSessionMinutes: Number(p.preferredSessionMinutes) as PersonalizedPreferences["preferredSessionMinutes"] }, step: draft.step, question: draft.question, answers: draft.answers };
  } catch { return null; }
}
