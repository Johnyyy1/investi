ALTER TYPE "public"."learning_goal" ADD VALUE 'LONG_TERM_ETF';--> statement-breakpoint
ALTER TYPE "public"."learning_interest" ADD VALUE 'DATA';--> statement-breakpoint
ALTER TYPE "public"."learning_interest" ADD VALUE 'BACKTESTING';--> statement-breakpoint
ALTER TABLE "learning_profile" ADD COLUMN "diagnostic_result" jsonb;--> statement-breakpoint
ALTER TABLE "learning_profile" ADD COLUMN "personalized_onboarding_completed_at" timestamp with time zone;