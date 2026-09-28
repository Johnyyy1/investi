"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { quickStart, completeOnboarding, saveOnboardingDraft, updatePreferences } from "./repository";

async function save(input: unknown, operation: (id: string, input: unknown) => Promise<void>) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, message: "Relace skončila. Přihlas se znovu a vrať se k uloženým odpovědím.", signIn: true };
    await operation(user.id, input);
    revalidatePath("/learn", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: "Předvolby se nepodařilo uložit. Odpovědi tu zůstaly, zkus to znovu." };
  }
}
export async function saveDraftAction(input: unknown) { return save(input, saveOnboardingDraft); }
export async function completeOnboardingAction(input: unknown) { return save(input, completeOnboarding); }
export async function updatePreferencesAction(input: unknown) { return save(input, updatePreferences); }

export async function quickStartAction(input: unknown) {
  const result = await save(input, quickStart);
  if (!result.ok) return result;
  const { loadLearner } = await import("@/features/learning/load-learner");
  const summary = await loadLearner();
  return { ok: true as const, href: `/learn/${summary.next.moduleSlug}/${summary.next.slug}` };
}
