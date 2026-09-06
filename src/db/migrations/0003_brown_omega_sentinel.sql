CREATE TABLE "api_pricing_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"model_slug" text NOT NULL,
	"provider" text NOT NULL,
	"scope" text NOT NULL,
	"tier_id" text NOT NULL,
	"min_context" integer NOT NULL,
	"max_context" integer,
	"rates" jsonb NOT NULL,
	"notes" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
