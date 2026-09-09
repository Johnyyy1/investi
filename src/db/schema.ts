import { sql } from "drizzle-orm";
import { experienceValues, goalValues, interestValues } from "../features/onboarding/domain";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const progressStatus = pgEnum("progress_status", [
  "not_started",
  "in_progress",
  "completed",
]);

// Better Auth tables remain separate from the learning domain tables.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const learningModule = pgTable(
  "learning_module",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    position: integer("position").notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("learning_module_slug_idx").on(table.slug)],
);

export const lesson = pgTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id").notNull().references(() => learningModule.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    position: integer("position").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    contentVersion: integer("content_version").notNull().default(1),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("lesson_module_slug_idx").on(table.moduleId, table.slug),
    index("lesson_module_position_idx").on(table.moduleId, table.position),
  ],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lesson.id, { onDelete: "cascade" }),
    status: progressStatus("status").notNull().default("not_started"),
    lastPosition: integer("last_position").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
    index("lesson_progress_user_idx").on(table.userId),
  ],
);

export const experienceLevelEnum = pgEnum("experience_level", experienceValues);
export const learningGoalEnum = pgEnum("learning_goal", goalValues);
export const learningInterestEnum = pgEnum("learning_interest", interestValues);
export const recommendedStartEnum = pgEnum("recommended_start", ["returns", "investing-foundations"]);

/** One learning profile per account; nullable answers allow resumable onboarding. */
export const learningProfile = pgTable("learning_profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  experienceLevel: experienceLevelEnum("experience_level"),
  goals: learningGoalEnum("goals").array().notNull().default([]),
  interests: learningInterestEnum("interests").array().notNull().default([]),
  dailyGoalMinutes: integer("daily_goal_minutes"),
  timeZone: text("time_zone"),
  recommendedStart: recommendedStartEnum("recommended_start"),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Completion receipt and learning-day ledger. One lifetime award per lesson per learner. */
export const lessonAward = pgTable("lesson_award", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull().references(() => lesson.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull(),
  learningDate: date("learning_date").notNull(),
  timeZone: text("time_zone").notNull(),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.lessonId] }),
  index("lesson_award_user_date_idx").on(table.userId, table.learningDate),
  check("lesson_award_xp_check", sql`${table.xp} = 60`),
]);
