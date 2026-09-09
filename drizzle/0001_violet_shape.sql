CREATE TYPE "public"."experience_level" AS ENUM('BEGINNER', 'BASIC', 'INVESTOR', 'ADVANCED');--> statement-breakpoint
CREATE TYPE "public"."learning_goal" AS ENUM('CONFIDENCE', 'MARKETS', 'PORTFOLIO', 'COMPANIES', 'QUANT', 'KNOWLEDGE');--> statement-breakpoint
CREATE TYPE "public"."learning_interest" AS ENUM('STOCKS', 'ETFS', 'PORTFOLIO', 'MARKETS', 'FUNDAMENTALS', 'QUANT');--> statement-breakpoint
CREATE TYPE "public"."recommended_start" AS ENUM('returns');--> statement-breakpoint
CREATE TABLE "learning_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"experience_level" "experience_level",
	"goals" "learning_goal"[] DEFAULT '{}' NOT NULL,
	"interests" "learning_interest"[] DEFAULT '{}' NOT NULL,
	"daily_goal_minutes" integer,
	"recommended_start" "recommended_start",
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_profile" ADD CONSTRAINT "learning_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;