-- Ads management schema
BEGIN;

-- Create ads table
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('image','video','text')),
  media_url TEXT,
  target_audience JSONB,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget NUMERIC,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Policies for ads
DO $$ BEGIN
  CREATE POLICY "Superadmins can manage ads"
  ON public.ads
  FOR ALL
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Active ads are viewable by everyone"
  ON public.ads
  FOR SELECT
  USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_ads_updated_at ON public.ads;
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create ad_performance table
CREATE TABLE IF NOT EXISTS public.ad_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  event_date DATE NOT NULL DEFAULT (now()::date),
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ad_id, event_date)
);

-- Enable RLS
ALTER TABLE public.ad_performance ENABLE ROW LEVEL SECURITY;

-- Policies for ad_performance
DO $$ BEGIN
  CREATE POLICY "Superadmins can manage ad performance"
  ON public.ad_performance
  FOR ALL
  USING (get_current_user_role() = 'superadmin')
  WITH CHECK (get_current_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_ad_performance_updated_at ON public.ad_performance;
CREATE TRIGGER update_ad_performance_updated_at
BEFORE UPDATE ON public.ad_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for ads media
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ads bucket
DO $$ BEGIN
  CREATE POLICY "Public can view ads files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ads');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Superadmins can upload ads files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'ads' AND get_current_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Superadmins can update ads files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'ads' AND get_current_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Superadmins can delete ads files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'ads' AND get_current_user_role() = 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;