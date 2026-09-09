/** Only first-time lesson completions earn credit. No client-supplied reward amounts. */
export const LESSON_XP = 60;
export type LearningAward = { lessonId: string; xp: number; learningDate: string; awardedAt: Date };

export function validTimeZone(value: unknown): string {
  if (typeof value !== "string" || value.length > 100) throw new Error("Choose a valid timezone.");
  try { return new Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions().timeZone; }
  catch { throw new Error("Choose a valid timezone."); }
}
export function learningDate(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: validTimeZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
/** 5/10 minutes → one lesson; 15/20 minutes → two. Credit is lessons, never claimed time-on-task. */
export function dailyLessonTarget(minutes: number | null | undefined) {
  return Math.max(1, Math.ceil((minutes ?? 10) / 10));
}
export function getGamification(awards: readonly LearningAward[], now: Date, timeZone: string, dailyGoalMinutes?: number | null) {
  const today = learningDate(now, timeZone);
  // Deduplication makes the pure read model resilient; the DB enforces the same uniqueness.
  const unique = [...new Map(awards.map((award) => [award.lessonId, award])).values()];
  const dates = new Set(unique.map((award) => award.learningDate).filter((date) => date <= today));
  let cursor = dates.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (dates.has(cursor)) { streak++; cursor = shiftDate(cursor, -1); }
  return {
    totalXp: unique.reduce((sum, award) => sum + award.xp, 0),
    streak,
    todayCompleted: unique.filter((award) => award.learningDate === today).length,
    dailyTarget: dailyLessonTarget(dailyGoalMinutes),
    timeZone,
  };
}
export type Gamification = ReturnType<typeof getGamification>;
