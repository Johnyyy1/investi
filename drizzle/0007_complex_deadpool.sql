CREATE TABLE "progression_unlock" (
	"user_id" text NOT NULL,
	"unlock_id" text NOT NULL,
	"practice_capital_minor" bigint DEFAULT 0 NOT NULL,
	"reason" text NOT NULL,
	"unlocked_at" timestamp with time zone NOT NULL,
	CONSTRAINT "progression_unlock_user_id_unlock_id_pk" PRIMARY KEY("user_id","unlock_id"),
	CONSTRAINT "progression_unlock_capital_nonnegative_check" CHECK ("progression_unlock"."practice_capital_minor" >= 0)
);
--> statement-breakpoint
ALTER TABLE "progression_unlock" ADD CONSTRAINT "progression_unlock_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- A portfolio generation is evidence of prior use. For users without one, all seven
-- published Foundations completions plus at least 420 receipt XP are required.
-- Existing portfolio users retain access without a new capital contribution.
-- The primary key and conflict clause make this backfill safe to rerun.
INSERT INTO "progression_unlock" ("user_id", "unlock_id", "practice_capital_minor", "reason", "unlocked_at")
SELECT u."id", 'PORTFOLIO_LAB',
  CASE WHEN EXISTS (SELECT 1 FROM "portfolio" p WHERE p."user_id" = u."id")
    THEN 0 ELSE 500000 END,
  CASE WHEN EXISTS (SELECT 1 FROM "portfolio" p WHERE p."user_id" = u."id")
    THEN 'existing_portfolio' ELSE 'learning_requirements' END,
  now()
FROM "user" u
WHERE EXISTS (SELECT 1 FROM "portfolio" p WHERE p."user_id" = u."id")
  OR (
    (SELECT coalesce(sum(a."xp"), 0) FROM "lesson_award" a WHERE a."user_id" = u."id") >= 420
    AND (SELECT count(DISTINCT lp."lesson_id") FROM "lesson_progress" lp
      WHERE lp."user_id" = u."id" AND lp."status" = 'completed'
        AND lp."lesson_id" IN (
          'foundations-why-invest', 'foundations-stocks', 'foundations-etfs-indexes',
          'foundations-bonds-cash', 'foundations-markets', 'foundations-risk-reward',
          'foundations-portfolio'
        )) = 7
  )
ON CONFLICT ("user_id", "unlock_id") DO NOTHING;
