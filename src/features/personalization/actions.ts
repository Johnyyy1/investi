"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { completePersonalization, retakeDiagnostic, skipPersonalization, updatePersonalizedPreferences } from "./repository";

async function save(input: unknown, operation: (userId: string, input: unknown) => Promise<void>) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false as const, message: "Přihlas se znovu a ulož své předvolby.", signIn: true };
    await operation(user.id, input);
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: "Přizpůsobení se nepodařilo uložit. Zkontroluj odpovědi a zkus to znovu." };
  }
}
export async function completePersonalizationAction(input: unknown) { return save(input, completePersonalization); }
export async function updatePersonalizedPreferencesAction(input: unknown) { return save(input, updatePersonalizedPreferences); }
export async function retakeDiagnosticAction(input: unknown) { return save(input, retakeDiagnostic); }
export async function skipPersonalizationAction(input: unknown) { return save(input, skipPersonalization); }
