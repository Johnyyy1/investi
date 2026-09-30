import { learningDate, shiftDate } from "@/features/gamification/domain";
import type { LearnerState } from "@/features/learning/learner-summary";

const labels = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

/** Presentation of first completions in the learner's current local calendar week. */
export function weeklyActivity(states: readonly LearnerState[], now: Date, timeZone: string) {
  const today = learningDate(now, timeZone);
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const monday = shiftDate(today, -weekday);
  const dates = new Map<string, number>();
  for (const state of new Map(states.map((state) => [state.lessonId, state])).values()) {
    if (state.status !== "completed" || !state.completedAt || state.completedAt > now) continue;
    const date = learningDate(state.completedAt, timeZone);
    dates.set(date, (dates.get(date) ?? 0) + 1);
  }
  const days = labels.map((label, index) => {
    const date = shiftDate(monday, index);
    return { label, date, completed: dates.get(date) ?? 0, today: date === today };
  });
  return { days, completed: days.reduce((sum, day) => sum + day.completed, 0) };
}
