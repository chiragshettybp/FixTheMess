-- Add campaign_type column to ads for filtering by campaign type
ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS campaign_type TEXT;

-- Create ad_metrics table for daily aggregated analytics
CREATE TABLE IF NOT EXISTS public.ad_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT (now()::date),
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ad_metrics_non_negative CHECK (impressions >= 0 AND clicks >= 0 AND conversions >= 0),
  CONSTRAINT ad_metrics_unique_per_day UNIQUE (ad_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.ad_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: only superadmins can access/manage ad_metrics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ad_metrics' AND policyname = 'Superadmins can manage ad metrics'
  ) THEN
    CREATE POLICY "Superadmins can manage ad metrics"
    ON public.ad_metrics
    FOR ALL
    USING (get_current_user_role() = 'superadmin'::user_role)
    WITH CHECK (get_current_user_role() = 'superadmin'::user_role);
  END IF;
END$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_metrics_ad_id ON public.ad_metrics (ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_metric_date ON public.ad_metrics (metric_date);

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_ad_metrics_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_ad_metrics_updated_at
    BEFORE UPDATE ON public.ad_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;