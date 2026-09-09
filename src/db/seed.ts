import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { env } from "@/lib/env";
import { learningModule, lesson } from "./schema";
import { moduleCatalog, getModuleLessons } from "@/features/learning/catalog";

const client = postgres(env.DATABASE_URL, { prepare: false });
const db = drizzle({ client });

async function seed() {
  const now = new Date();
  await db.transaction(async (tx) => {
    for (const [index, module] of moduleCatalog.filter((module) => module.status === "available").entries()) {
      const definitions = getModuleLessons(module.slug);
      const moduleId = definitions[0].moduleId;
      await tx.insert(learningModule).values({ id: moduleId, slug: module.slug, title: module.title, description: module.description, position: index + 1, isPublished: true, createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: learningModule.id, set: { title: module.title, description: module.description, position: index + 1, isPublished: true, updatedAt: now } });
      await tx.insert(lesson).values(definitions.map((definition, position) => ({ id: definition.id, moduleId, slug: definition.slug, title: definition.title, summary: definition.summary, position: position + 1, estimatedMinutes: definition.estimatedMinutes, isPublished: definition.status === "available", createdAt: now, updatedAt: now }))).onConflictDoUpdate({ target: lesson.id, set: { title: sql`excluded.title`, summary: sql`excluded.summary`, position: sql`excluded.position`, estimatedMinutes: sql`excluded.estimated_minutes`, isPublished: sql`excluded.is_published`, updatedAt: now } });
    }
  });
  await client.end();
}

seed().catch(async (error) => { console.error(error); await client.end(); process.exitCode = 1; });
