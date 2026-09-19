DO $$ BEGIN
 CREATE TYPE "public"."currency_type" AS ENUM('USD', 'KES', 'TZS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."document_status" AS ENUM('draft', 'complete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."letter_type" AS ENUM('reference', 'resignation', 'application', 'employment-verification', 'salary-increase', 'promotion', 'leave-of-absence', 'job-offer', 'appointment-confirmation', 'termination', 'business-proposal', 'complaint', 'apology', 'inquiry', 'authorization', 'partnership-mou', 'vacate-notice', 'scholarship', 'internship', 'sponsorship', 'quotation', 'invoice', 'letterhead');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."plan_type" AS ENUM('trial', 'monthly', 'annual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'cancelled', 'expired', 'past_due');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_usage" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_event" (
	"id" text PRIMARY KEY NOT NULL,
	"install_id" text NOT NULL,
	"user_hash" text,
	"name" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"app_version" text,
	"platform" text,
	"device" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_release" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"apk_url" text NOT NULL,
	"size_bytes" integer,
	"notes_sw" text DEFAULT '' NOT NULL,
	"notes_en" text DEFAULT '' NOT NULL,
	"channel" text DEFAULT 'stable' NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'My Application' NOT NULL,
	"company_name" text DEFAULT '',
	"job_title" text DEFAULT '',
	"job_description" text DEFAULT '',
	"job_description_url" text DEFAULT '',
	"cv_id" text,
	"cover_letter_id" text,
	"match_score" integer,
	"job_profile" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"applied_at" timestamp,
	"notes" text DEFAULT '',
	"follow_up_reminded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ats_score_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"document_type" text DEFAULT 'cv' NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"checks" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_card" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'My Business Card' NOT NULL,
	"template_id" text DEFAULT 'classic' NOT NULL,
	"primary_color" text DEFAULT '#1e293b' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaign_event" (
	"id" text PRIMARY KEY NOT NULL,
	"src" text NOT NULL,
	"name" text NOT NULL,
	"visitor_id" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cover_letter" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cv_id" text,
	"title" text DEFAULT 'My Cover Letter' NOT NULL,
	"template_id" text DEFAULT 'classic' NOT NULL,
	"primary_color" text DEFAULT '#2563EB' NOT NULL,
	"font_family" text DEFAULT 'Georgia, serif' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"job_title" text,
	"company_name" text,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cv" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'My CV' NOT NULL,
	"template_id" text DEFAULT 'nakuru' NOT NULL,
	"template_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"primary_color" text DEFAULT '#2563EB' NOT NULL,
	"font_family" text DEFAULT 'Inter' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"public_slug" text,
	"public_show_contact" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cv_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "debug_event" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"user_id" text,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text NOT NULL,
	"push_token" text NOT NULL,
	"platform" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_version" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"document_id" text NOT NULL,
	"document_type" text DEFAULT 'cv' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "download_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"document_id" text NOT NULL,
	"document_type" text NOT NULL,
	"format" text DEFAULT 'pdf' NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eval_sample" (
	"id" text PRIMARY KEY NOT NULL,
	"user_hash" text NOT NULL,
	"tool" text NOT NULL,
	"prompt_version" text DEFAULT '' NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verdict" text,
	"verdict_detail" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"evaluated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job" (
	"id" text PRIMARY KEY NOT NULL,
	"source_job_id" text,
	"source" text DEFAULT 'unknown' NOT NULL,
	"source_url" text,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"industry" text,
	"location" text,
	"country" text,
	"is_remote" boolean DEFAULT false,
	"description" text,
	"requirements" jsonb DEFAULT '[]'::jsonb,
	"responsibilities" jsonb DEFAULT '[]'::jsonb,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" text DEFAULT 'KES',
	"salary_period" text DEFAULT 'annual',
	"equity" text,
	"benefits" jsonb DEFAULT '[]'::jsonb,
	"experience_level" text,
	"years_experience_min" integer,
	"years_experience_max" integer,
	"required_skills" jsonb DEFAULT '[]'::jsonb,
	"nice_to_have_skills" jsonb DEFAULT '[]'::jsonb,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"application_count" integer DEFAULT 0,
	"hash_tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_recommendation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"score" integer NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"matched_terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "letter" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'My Letter' NOT NULL,
	"letter_type" "letter_type" DEFAULT 'reference' NOT NULL,
	"template_id" text DEFAULT 'formal' NOT NULL,
	"primary_color" text DEFAULT '#1e293b' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outcome_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_hash" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text,
	"amount" integer NOT NULL,
	"currency" "currency_type" DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'pesapal' NOT NULL,
	"provider_ref" text,
	"provider_txn_id" text,
	"pesapal_order_id" text,
	"pesapal_tracking_id" text,
	"payment_method" text,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"premium_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provenance" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"doc_type" text NOT NULL,
	"doc_id" text NOT NULL,
	"field_path" text NOT NULL,
	"span_start" integer DEFAULT 0 NOT NULL,
	"span_end" integer DEFAULT 0 NOT NULL,
	"source_kind" text NOT NULL,
	"source_ref" text DEFAULT '' NOT NULL,
	"invocation_id" text,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referral_claim" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"referrer_user_id" text NOT NULL,
	"referred_user_id" text NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referral_code" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signal_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"notif_key" text NOT NULL,
	"type" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" "plan_type" DEFAULT 'trial' NOT NULL,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"trial_ends_at" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancelled_at" timestamp,
	"provider" text,
	"pesapal_order_id" text,
	"pesapal_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"submitter_name" text DEFAULT '' NOT NULL,
	"doc_type" text DEFAULT 'cv' NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"base_template_id" text NOT NULL,
	"primary_color" text DEFAULT '#DA4A1C' NOT NULL,
	"font_family" text DEFAULT 'Inter' NOT NULL,
	"section_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_invocation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"tool" text NOT NULL,
	"caller" text NOT NULL,
	"policy" text NOT NULL,
	"outcome" text NOT NULL,
	"cost_class" text DEFAULT 'none' NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"input_hash" text DEFAULT '' NOT NULL,
	"error_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"job_title" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"linkedin" text DEFAULT '',
	"website" text DEFAULT '',
	"photo" text DEFAULT '',
	"summary" text DEFAULT '' NOT NULL,
	"career_profile" jsonb DEFAULT 'null'::jsonb,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"lang" text,
	"analytics_opt_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "web_push_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_match" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"match_score" integer NOT NULL,
	"match_reasons" jsonb DEFAULT '[]'::jsonb,
	"missing_skills" jsonb DEFAULT '[]'::jsonb,
	"is_clicked" boolean DEFAULT false,
	"is_applied" boolean DEFAULT false,
	"is_ignored" boolean DEFAULT false,
	"ignored_reason" text,
	"user_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_job" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outcome_report" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cv_id" text,
	"cover_letter_id" text,
	"outcome" text DEFAULT 'none_yet' NOT NULL,
	"company_name" text,
	"job_title" text,
	"applied_via" text DEFAULT 'unknown',
	"document_created_at" timestamp DEFAULT now() NOT NULL,
	"application_sent_at" timestamp,
	"outcome_reported_at" timestamp DEFAULT now() NOT NULL,
	"interview_date" timestamp,
	"interview_type" text,
	"offer_accepted" text,
	"offer_salary_min" integer,
	"offer_salary_max" integer,
	"ai_helpful_rating" integer,
	"feedback_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_application" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cv_id" text,
	"cover_letter_id" text,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"job_title" text,
	"company_name" text,
	"job_description" text,
	"tracking_id" text NOT NULL,
	"email_sent_at" timestamp DEFAULT now() NOT NULL,
	"email_opened_at" timestamp,
	"email_clicked_at" timestamp,
	"clicked_links" jsonb DEFAULT '[]'::jsonb,
	"documents_generated" jsonb DEFAULT '{}'::jsonb,
	"email_subject" text,
	"email_body_preview" text,
	"delivery_status" text DEFAULT 'pending',
	"delivery_error" text,
	"export_format" text DEFAULT 'pdf',
	"source_job_id" text,
	"campaign_id" text,
	"ai_generated_cover_letter" boolean DEFAULT false,
	"ai_tailor_to_jd" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_application_tracking_id_unique" UNIQUE("tracking_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application" ADD CONSTRAINT "application_cv_id_cv_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cv"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application" ADD CONSTRAINT "application_cover_letter_id_cover_letter_id_fk" FOREIGN KEY ("cover_letter_id") REFERENCES "public"."cover_letter"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cover_letter" ADD CONSTRAINT "cover_letter_cv_id_cv_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cv"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_recommendation" ADD CONSTRAINT "job_recommendation_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment" ADD CONSTRAINT "payment_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_id_profile_id_fk" FOREIGN KEY ("id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_event_name_idx" ON "app_event" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_event_install_idx" ON "app_event" USING btree ("install_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_event_version_idx" ON "app_event" USING btree ("app_version","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_release_channel_idx" ON "app_release" USING btree ("channel","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_user_idx" ON "application" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ats_snapshot_doc_idx" ON "ats_score_snapshot" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ats_snapshot_user_idx" ON "ats_score_snapshot" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_card_user_idx" ON "business_card" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_event_src_idx" ON "campaign_event" USING btree ("src","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_event_visitor_idx" ON "campaign_event" USING btree ("visitor_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_event_name_idx" ON "campaign_event" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cover_letter_user_idx" ON "cover_letter" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_user_idx" ON "cv" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_public_slug_idx" ON "cv" USING btree ("public_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "debug_event_kind_idx" ON "debug_event" USING btree ("kind","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_token_device_uniq" ON "device_token" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_token_user_idx" ON "device_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_version_doc_idx" ON "document_version" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_version_user_idx" ON "document_version" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "download_log_user_idx" ON "download_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eval_sample_tool_idx" ON "eval_sample" USING btree ("tool","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eval_sample_pending_idx" ON "eval_sample" USING btree ("evaluated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_company_idx" ON "job" USING btree ("company");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_title_idx" ON "job" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_location_idx" ON "job" USING btree ("location");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_source_idx" ON "job" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_active_idx" ON "job" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_posted_idx" ON "job" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_recommendation_user_idx" ON "job_recommendation" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "job_recommendation_user_job_uniq" ON "job_recommendation" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "letter_user_idx" ON "letter" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_event_type_idx" ON "outcome_event" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_event_user_idx" ON "outcome_event" USING btree ("user_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_user_idx" ON "payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provenance_doc_idx" ON "provenance" USING btree ("doc_type","doc_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provenance_user_idx" ON "provenance" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "referral_claim_referred_uniq" ON "referral_claim" USING btree ("referred_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referral_claim_referrer_idx" ON "referral_claim" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_code_uniq" ON "referral_code" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_user_uniq" ON "referral_code" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "signal_notification_user_key_uniq" ON "signal_notification" USING btree ("user_id","notif_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_submission_status_idx" ON "template_submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_invocation_user_idx" ON "tool_invocation" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_invocation_tool_idx" ON "tool_invocation" USING btree ("tool","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "web_push_endpoint_uniq" ON "web_push_subscription" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "web_push_user_idx" ON "web_push_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_match_user_idx" ON "job_match" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_match_job_idx" ON "job_match" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_match_score_idx" ON "job_match" USING btree ("match_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_match_user_job_idx" ON "job_match" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_job_user_idx" ON "saved_job" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_job_job_idx" ON "saved_job" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_user_idx" ON "outcome_report" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_cv_idx" ON "outcome_report" USING btree ("cv_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_outcome_idx" ON "outcome_report" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_app_user_idx" ON "email_application" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_app_tracking_idx" ON "email_application" USING btree ("tracking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_app_email_idx" ON "email_application" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_app_delivery_idx" ON "email_application" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_app_sent_idx" ON "email_application" USING btree ("email_sent_at");