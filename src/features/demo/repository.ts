import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { learningProfile, lessonAward, lessonProgress, user } from "@/db/schema";
import { demoSeed } from "./seed";

/** Called before Better Auth creates a demo session. Failure leaves no usable partial demo. */
export async function ensureDemoSeed(userId: string, now = new Date()) {
  await db.transaction(async (tx) => {
    const [owner] = await tx.select().from(user).where(eq(user.id, userId)).for("update");
    if (!owner?.isAnonymous) throw new Error("Only demo identities can receive demo data.");
    const [profile] = await tx.select().from(learningProfile).where(eq(learningProfile.userId, userId));
    if (profile?.onboardingCompletedAt) return;
    const seed = demoSeed(now);
    await tx.insert(learningProfile).values({ userId, experienceLevel: "BEGINNER", dailyGoalMinutes: 20, timeZone: "UTC", recommendedStart: "investing-foundations", onboardingStep: 6, onboardingCompletedAt: now, updatedAt: now }).onConflictDoNothing();
    await tx.insert(lessonProgress).values(seed.progress.map((progress) => ({ userId, ...progress }))).onConflictDoNothing();
    await tx.insert(lessonAward).values(seed.awards.map((award) => ({ userId, ...award }))).onConflictDoNothing();
  });
}
