CREATE TABLE "model_aliases" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_model_id" text NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "benchmark_results" ALTER COLUMN "scale_min" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "benchmark_results" ALTER COLUMN "scale_max" SET DEFAULT '100';--> statement-breakpoint
ALTER TABLE "benchmark_results" ALTER COLUMN "measured_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "normalized_score" integer;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "rank" integer;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "sample_count" integer;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "confidence_low" numeric;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "confidence_high" numeric;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "harness" text;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "evaluation_date" text;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "metadata_json" jsonb;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "model_pricing" ADD COLUMN "provider_name" text;--> statement-breakpoint
ALTER TABLE "model_pricing" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "model_pricing" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "license_notes" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "model_aliases" ADD CONSTRAINT "model_aliases_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "source_model_alias_idx" ON "model_aliases" USING btree ("source_name","source_model_id");