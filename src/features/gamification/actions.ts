"use server";
import { getCurrentUser } from "@/lib/session";
import { initializeTimeZone } from "./repository";
import { revalidatePath } from "next/cache";
export async function initializeTimeZoneAction(timeZone: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false };
    await initializeTimeZone(user.id, timeZone);
    revalidatePath("/learn");
    return { ok: true };
  } catch { return { ok: false }; }
}
