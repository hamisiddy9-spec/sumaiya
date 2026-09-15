-- TemplateHub Database Migrations
-- Initialize schema for template system

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  name text,
  created_at timestamp DEFAULT now(),
  last_used_at timestamp,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  source text NOT NULL,
  category text NOT NULL,
  family text,
  description text,
  preview_url text,
  tier text DEFAULT 'core',
  editable_fields jsonb,
  accessible_to jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS template_families (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  tier text DEFAULT 'core',
  templates jsonb,
  preview_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS render_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL,
  product_id text NOT NULL,
  render_time_ms integer,
  format text,
  created_at timestamp DEFAULT now(),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_family ON templates(family);
CREATE INDEX IF NOT EXISTS idx_templates_tier ON templates(tier);
CREATE INDEX IF NOT EXISTS idx_render_analytics_template_id ON render_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_render_analytics_created_at ON render_analytics(created_at);
