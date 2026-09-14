CREATE TYPE "public"."portfolio_trade_side" AS ENUM('BUY', 'SELL');--> statement-breakpoint
CREATE TABLE "portfolio" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"base_currency" text DEFAULT 'CZK' NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"reset_from_portfolio_id" text,
	"reset_idempotency_key" text,
	"opening_capital_minor" bigint NOT NULL,
	CONSTRAINT "portfolio_base_currency_check" CHECK ("portfolio"."base_currency" in ('CZK', 'USD', 'EUR')),
	CONSTRAINT "portfolio_opening_capital_nonnegative_check" CHECK ("portfolio"."opening_capital_minor" >= 0),
	CONSTRAINT "portfolio_closed_after_opened_check" CHECK ("portfolio"."closed_at" is null or "portfolio"."closed_at" >= "portfolio"."opened_at"),
	CONSTRAINT "portfolio_reset_not_self_check" CHECK ("portfolio"."reset_from_portfolio_id" is null or "portfolio"."reset_from_portfolio_id" <> "portfolio"."id")
);
--> statement-breakpoint
CREATE TABLE "portfolio_trade" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"instrument_id" text NOT NULL,
	"instrument_symbol" text NOT NULL,
	"instrument_name" text NOT NULL,
	"instrument_asset_type" text NOT NULL,
	"side" "portfolio_trade_side" NOT NULL,
	"quantity" numeric(24, 8) NOT NULL,
	"unit_price" numeric(24, 8) NOT NULL,
	"quote_currency" text NOT NULL,
	"fx_rate_to_base" numeric(24, 12) NOT NULL,
	"gross_amount_base_minor" bigint NOT NULL,
	"fee_base_minor" bigint DEFAULT 0 NOT NULL,
	"cash_delta_base_minor" bigint NOT NULL,
	"quote_observed_at" timestamp with time zone NOT NULL,
	"executed_at" timestamp with time zone NOT NULL,
	"market_data_provider" text NOT NULL,
	"market_data_dataset" text NOT NULL,
	"market_data_kind" text NOT NULL,
	"market_data_is_deterministic" boolean NOT NULL,
	"client_idempotency_key" text NOT NULL,
	CONSTRAINT "portfolio_trade_quantity_positive_check" CHECK ("portfolio_trade"."quantity" > 0),
	CONSTRAINT "portfolio_trade_unit_price_positive_check" CHECK ("portfolio_trade"."unit_price" > 0),
	CONSTRAINT "portfolio_trade_fx_positive_check" CHECK ("portfolio_trade"."fx_rate_to_base" > 0),
	CONSTRAINT "portfolio_trade_gross_positive_check" CHECK ("portfolio_trade"."gross_amount_base_minor" > 0),
	CONSTRAINT "portfolio_trade_fee_nonnegative_check" CHECK ("portfolio_trade"."fee_base_minor" >= 0),
	CONSTRAINT "portfolio_trade_currency_check" CHECK ("portfolio_trade"."quote_currency" in ('CZK', 'USD', 'EUR')),
	CONSTRAINT "portfolio_trade_asset_type_check" CHECK ("portfolio_trade"."instrument_asset_type" in ('equity', 'etf', 'bond', 'cash', 'index')),
	CONSTRAINT "portfolio_trade_data_kind_check" CHECK ("portfolio_trade"."market_data_kind" in ('synthetic', 'historical', 'live')),
	CONSTRAINT "portfolio_trade_cash_delta_check" CHECK ((
    ("portfolio_trade"."side" = 'BUY' and "portfolio_trade"."cash_delta_base_minor" = -("portfolio_trade"."gross_amount_base_minor" + "portfolio_trade"."fee_base_minor"))
    or ("portfolio_trade"."side" = 'SELL' and "portfolio_trade"."cash_delta_base_minor" = "portfolio_trade"."gross_amount_base_minor" - "portfolio_trade"."fee_base_minor")
  ))
);
--> statement-breakpoint
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_reset_from_portfolio_id_portfolio_id_fk" FOREIGN KEY ("reset_from_portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_trade" ADD CONSTRAINT "portfolio_trade_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portfolio_user_opened_idx" ON "portfolio" USING btree ("user_id","opened_at");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_one_active_per_user_idx" ON "portfolio" USING btree ("user_id") WHERE "portfolio"."closed_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_reset_idempotency_idx" ON "portfolio" USING btree ("user_id","reset_idempotency_key");--> statement-breakpoint
CREATE INDEX "portfolio_trade_portfolio_executed_idx" ON "portfolio_trade" USING btree ("portfolio_id","executed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_trade_idempotency_idx" ON "portfolio_trade" USING btree ("portfolio_id","client_idempotency_key");