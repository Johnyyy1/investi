-- Expand: keep the new fields nullable until historical receipts are reconciled.
ALTER TABLE "lesson_award" ADD COLUMN IF NOT EXISTS "practice_capital_minor" bigint;--> statement-breakpoint
ALTER TABLE "lesson_award" ADD COLUMN IF NOT EXISTS "reward_policy_version" integer;--> statement-breakpoint

-- Reconcile the historical inconsistency recognized by the original reward migration:
-- a completed, currently published lesson is entitled to one receipt. Historical timezone
-- was not recorded, so use UTC exactly as migration 0003 did. Incomplete and unpublished
-- lessons are intentionally excluded, and the primary key makes this rerunnable.
INSERT INTO "lesson_award" (
	"user_id",
	"lesson_id",
	"xp",
	"practice_capital_minor",
	"reward_policy_version",
	"learning_date",
	"time_zone",
	"awarded_at"
)
SELECT
	p.user_id,
	p.lesson_id,
	60,
	200000,
	1,
	(coalesce(p.completed_at, p.updated_at) AT TIME ZONE 'UTC')::date,
	'UTC',
	coalesce(p.completed_at, p.updated_at)
FROM lesson_progress p
JOIN lesson l ON l.id = p.lesson_id
WHERE p.status = 'completed' AND l.is_published = true
ON CONFLICT (user_id, lesson_id) DO NOTHING;--> statement-breakpoint

-- Backfill: every pre-existing receipt is authoritative. Capital is not calculated from XP.
UPDATE "lesson_award"
SET "practice_capital_minor" = 200000, "reward_policy_version" = 1
WHERE "practice_capital_minor" IS NULL OR "reward_policy_version" IS NULL;--> statement-breakpoint

-- Enforce the receipt invariant after all eligible historical rows are complete.
ALTER TABLE "lesson_award" ALTER COLUMN "practice_capital_minor" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_award" ALTER COLUMN "reward_policy_version" SET NOT NULL;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'lesson_award_practice_capital_positive_check'
			AND conrelid = 'lesson_award'::regclass
	) THEN
		ALTER TABLE "lesson_award"
			ADD CONSTRAINT "lesson_award_practice_capital_positive_check"
			CHECK ("practice_capital_minor" > 0);
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'lesson_award_reward_policy_version_positive_check'
			AND conrelid = 'lesson_award'::regclass
	) THEN
		ALTER TABLE "lesson_award"
			ADD CONSTRAINT "lesson_award_reward_policy_version_positive_check"
			CHECK ("reward_policy_version" > 0);
	END IF;
END
$$;
