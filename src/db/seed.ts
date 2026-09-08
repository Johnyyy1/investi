import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import { learningModule, lesson } from "./schema";
import { RETURNS_MODULE_ID, returnsLessons } from "@/features/lessons/returns/manifest";

const client = postgres(env.DATABASE_URL, { prepare: false });
const db = drizzle({ client });

async function seed() {
  const now = new Date();
  await db.insert(learningModule).values({ id: RETURNS_MODULE_ID, slug: "returns", title: "Returns", description: "From price changes to comparable investment outcomes.", position: 1, isPublished: true, createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: learningModule.id, set: { title: "Returns", description: "From price changes to comparable investment outcomes.", updatedAt: now } });
  await db.insert(lesson).values(returnsLessons.map((lessonDefinition, index) => ({ id: lessonDefinition.id, moduleId: RETURNS_MODULE_ID, slug: lessonDefinition.slug, title: lessonDefinition.title, summary: lessonDefinition.summary, position: index + 1, estimatedMinutes: lessonDefinition.estimatedMinutes, isPublished: lessonDefinition.status === "available", createdAt: now, updatedAt: now }))).onConflictDoUpdate({ target: lesson.id, set: { updatedAt: now } });
  await client.end();
}

seed().catch(async (error) => { console.error(error); await client.end(); process.exitCode = 1; });
