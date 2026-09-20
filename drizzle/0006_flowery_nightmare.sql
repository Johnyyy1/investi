ALTER TABLE "portfolio_trade" ADD COLUMN "fx_rate_provider" text;--> statement-breakpoint
ALTER TABLE "portfolio_trade" ADD COLUMN "fx_rate_dataset" text;--> statement-breakpoint
ALTER TABLE "portfolio_trade" ADD COLUMN "fx_rate_kind" text;--> statement-breakpoint
ALTER TABLE "portfolio_trade" ADD COLUMN "fx_rate_is_deterministic" boolean;--> statement-breakpoint
ALTER TABLE "portfolio_trade" ADD COLUMN "fx_reference_date" date;--> statement-breakpoint
ALTER TABLE "portfolio_trade" ADD COLUMN "fx_rate_retrieved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "portfolio_trade" ADD CONSTRAINT "portfolio_trade_fx_provenance_complete_check" CHECK ((
    ("portfolio_trade"."fx_rate_provider" is null and "portfolio_trade"."fx_rate_dataset" is null and "portfolio_trade"."fx_rate_kind" is null and "portfolio_trade"."fx_rate_is_deterministic" is null and "portfolio_trade"."fx_reference_date" is null and "portfolio_trade"."fx_rate_retrieved_at" is null)
    or ("portfolio_trade"."fx_rate_provider" is not null and "portfolio_trade"."fx_rate_dataset" is not null and "portfolio_trade"."fx_rate_kind" is not null and "portfolio_trade"."fx_rate_is_deterministic" is not null and "portfolio_trade"."fx_reference_date" is not null and "portfolio_trade"."fx_rate_retrieved_at" is not null)
  ));--> statement-breakpoint
ALTER TABLE "portfolio_trade" ADD CONSTRAINT "portfolio_trade_fx_kind_check" CHECK ("portfolio_trade"."fx_rate_kind" is null or "portfolio_trade"."fx_rate_kind" in ('synthetic', 'reference'));