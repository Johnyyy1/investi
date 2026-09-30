import "dotenv/config";

import assert from "node:assert/strict";
import { asc, eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { learningModule, lesson } from "../src/db/schema";
import { availableLessons, getModuleLessons, moduleCatalog } from "../src/features/learning/catalog";

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "DATABASE_URL is required.");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname), "Requires a local test database.");

const client = postgres(databaseUrl, { prepare: false });
const db = drizzle({ client });

try {
  const canonicalLessons = availableLessons.map((definition) => ({
    id: definition.id,
    moduleId: definition.moduleId,
    isPublished: true,
  }));
  const canonicalIds = canonicalLessons.map(({ id }) => id).sort();
  assert.equal(new Set(canonicalIds).size, canonicalIds.length, "Canonical lesson IDs must be unique.");

  const seededLessons = await db
    .select({ id: lesson.id, moduleId: lesson.moduleId, isPublished: lesson.isPublished })
    .from(lesson)
    .where(eq(lesson.isPublished, true))
    .orderBy(asc(lesson.id));
  assert.deepEqual(seededLessons.map(({ id }) => id), canonicalIds, "Seeded published lesson IDs must match the canonical curriculum.");
  assert.deepEqual(
    seededLessons.map(({ id, moduleId, isPublished }) => ({ id, moduleId, isPublished })).sort((left, right) => left.id.localeCompare(right.id)),
    canonicalLessons.sort((left, right) => left.id.localeCompare(right.id)),
    "Seeded lessons must preserve canonical module ownership.",
  );

  // Include planned entries so publication and ordering are checked together.
  for (const learningModuleDefinition of moduleCatalog.filter(({ status }) => status === "available")) {
    const definitions = getModuleLessons(learningModuleDefinition.slug);
    const rows = await db.select({ id: lesson.id, position: lesson.position, isPublished: lesson.isPublished })
      .from(lesson).where(eq(lesson.moduleId, definitions[0].moduleId)).orderBy(asc(lesson.position));
    assert.deepEqual(rows, definitions.map((definition, index) => ({
      id: definition.id, position: index + 1, isPublished: definition.status === "available",
    })), "All seeded positions and planned/published states must match the curriculum.");
  }

  const availableModules = moduleCatalog.filter(({ status }) => status === "available");
  const seededModules = await db
    .select({ id: learningModule.id, slug: learningModule.slug, isPublished: learningModule.isPublished })
    .from(learningModule)
    .where(eq(learningModule.isPublished, true))
    .orderBy(asc(learningModule.slug));
  assert.deepEqual(
    seededModules,
    availableModules.map((module) => ({
      id: getModuleLessons(module.slug)[0]?.moduleId,
      slug: module.slug,
      isPublished: true,
    })).sort((left, right) => left.slug.localeCompare(right.slug)),
    "Seeded published modules must match the available canonical modules.",
  );

  console.log(`PASS: curriculum seed matches ${canonicalLessons.length} published lessons across ${availableModules.length} modules.`);
} finally {
  await client.end();
}
