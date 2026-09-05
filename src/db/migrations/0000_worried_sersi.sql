CREATE TABLE "benchmark_results" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"source_id" text NOT NULL,
	"benchmark" text NOT NULL,
	"metric" text NOT NULL,
	"raw_value" numeric NOT NULL,
	"scale_min" numeric NOT NULL,
	"scale_max" numeric NOT NULL,
	"measured_at" timestamp NOT NULL,
	CONSTRAINT "valid_benchmark_scale" CHECK ("benchmark_results"."scale_max" > "benchmark_results"."scale_min")
);
--> statement-breakpoint
CREATE TABLE "catalog_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"sha256" text NOT NULL,
	"data_kind" text NOT NULL,
	"catalog" jsonb NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_kind" CHECK ("catalog_snapshots"."data_kind" in ('mock', 'verified', 'mixed'))
);
--> statement-breakpoint
CREATE TABLE "internal_test_results" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"source_id" text NOT NULL,
	"task" text NOT NULL,
	"result" jsonb NOT NULL,
	"measured_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"source_id" text NOT NULL,
	"fact_path" text NOT NULL,
	"last_verified_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_history" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"metric" text NOT NULL,
	"value" integer NOT NULL,
	"confidence" integer NOT NULL,
	"methodology" text NOT NULL,
	"evidence_ids" jsonb NOT NULL,
	"calculated_at" timestamp NOT NULL,
	CONSTRAINT "score_range" CHECK ("score_history"."value" between 0 and 100),
	CONSTRAINT "confidence_range" CHECK ("score_history"."confidence" between 0 and 100),
	CONSTRAINT "score_evidence_required" CHECK (jsonb_array_length("score_history"."evidence_ids") > 0)
);
--> statement-breakpoint
CREATE TABLE "task_cost_estimates" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"task_profile_id" text NOT NULL,
	"cost" numeric NOT NULL,
	"currency" text NOT NULL,
	"assumptions" jsonb NOT NULL,
	"estimated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"input_per_million" numeric(10, 4) NOT NULL,
	"output_per_million" numeric(10, 4) NOT NULL,
	"cached_input_per_million" numeric(10, 4),
	"currency" text DEFAULT 'USD' NOT NULL,
	"source_id" text NOT NULL,
	"effective_from" text NOT NULL,
	"last_verified_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_scores" (
	"model_id" text PRIMARY KEY NOT NULL,
	"overall" integer NOT NULL,
	"intelligence" integer NOT NULL,
	"coding" integer NOT NULL,
	"agentic" integer NOT NULL,
	"daily_use" integer NOT NULL,
	"research" integer NOT NULL,
	"writing" integer NOT NULL,
	"vision" integer NOT NULL,
	"speed" integer NOT NULL,
	"reliability" integer NOT NULL,
	"cost_efficiency" integer NOT NULL,
	"confidence" integer NOT NULL,
	"methodology_version" text NOT NULL,
	"score_updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"provider_id" text NOT NULL,
	"family" text NOT NULL,
	"release_date" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"description" text NOT NULL,
	"context_window" integer NOT NULL,
	"max_output_tokens" integer NOT NULL,
	"supports_vision" boolean DEFAULT false NOT NULL,
	"supports_audio" boolean DEFAULT false NOT NULL,
	"supports_tools" boolean DEFAULT true NOT NULL,
	"supports_structured_output" boolean DEFAULT true NOT NULL,
	"open_weights" boolean DEFAULT false NOT NULL,
	"api_available" boolean DEFAULT true NOT NULL,
	"last_verified_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"website" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"source_type" text NOT NULL,
	"publisher" text NOT NULL,
	"retrieved_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"estimated_input_tokens" integer NOT NULL,
	"estimated_output_tokens" integer NOT NULL,
	"typical_tool_calls" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "task_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD CONSTRAINT "benchmark_results_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_results" ADD CONSTRAINT "benchmark_results_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_test_results" ADD CONSTRAINT "internal_test_results_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_test_results" ADD CONSTRAINT "internal_test_results_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_sources" ADD CONSTRAINT "model_sources_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_sources" ADD CONSTRAINT "model_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_history" ADD CONSTRAINT "score_history_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_cost_estimates" ADD CONSTRAINT "task_cost_estimates_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_cost_estimates" ADD CONSTRAINT "task_cost_estimates_task_profile_id_task_profiles_id_fk" FOREIGN KEY ("task_profile_id") REFERENCES "public"."task_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_pricing" ADD CONSTRAINT "model_pricing_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_scores" ADD CONSTRAINT "model_scores_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_snapshot_hash" ON "catalog_snapshots" USING btree ("sha256");