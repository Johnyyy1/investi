CREATE TABLE "lesson_award" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"xp" integer NOT NULL,
	"learning_date" date NOT NULL,
	"time_zone" text NOT NULL,
	"awarded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "lesson_award_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id"),
	CONSTRAINT "lesson_award_xp_check" CHECK ("lesson_award"."xp" = 60)
);
--> statement-breakpoint
ALTER TABLE "learning_profile" ADD COLUMN "time_zone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_award" ADD CONSTRAINT "lesson_award_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_award" ADD CONSTRAINT "lesson_award_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_award_user_date_idx" ON "lesson_award" USING btree ("user_id","learning_date");
--> statement-breakpoint
-- Preserve credit for existing completed learning. Historical timezone was not stored: use UTC.
INSERT INTO "lesson_award" ("user_id", "lesson_id", "xp", "learning_date", "time_zone", "awarded_at")
SELECT p.user_id, p.lesson_id, 60, (coalesce(p.completed_at, p.updated_at) AT TIME ZONE 'UTC')::date, 'UTC', coalesce(p.completed_at, p.updated_at)
FROM lesson_progress p JOIN lesson l ON l.id = p.lesson_id
WHERE p.status = 'completed' AND l.is_published = true
ON CONFLICT (user_id, lesson_id) DO NOTHING;
