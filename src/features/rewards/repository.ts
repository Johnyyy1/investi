import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessonAward, progressionUnlock } from "@/db/schema";

/** Returns the exact Practice Capital entitlement from immutable lesson receipts. */
export async function loadPracticeCapitalSummary(userId: string) {
  const [result] = await db
    .select({
      earnedPracticeCapitalMinor: sql<string>`coalesce(sum(${lessonAward.practiceCapitalMinor}), 0)::text`,
    })
    .from(lessonAward)
    .where(eq(lessonAward.userId, userId));

  const [grant] = await db.select({ total: sql<string>`coalesce(sum(${progressionUnlock.practiceCapitalMinor}), 0)::text` })
    .from(progressionUnlock).where(eq(progressionUnlock.userId, userId));
  return { earnedPracticeCapitalMinor: BigInt(result?.earnedPracticeCapitalMinor ?? "0") + BigInt(grant?.total ?? "0") };
}
