-- Create ad_analytics table to track aggregated views/clicks
CREATE TABLE IF NOT EXISTS public.ad_analytics (
  ad_id uuid PRIMARY KEY REFERENCES public.ads (id) ON DELETE CASCADE,
  views integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage ad_analytics
DROP POLICY IF EXISTS "Superadmins can manage ad analytics" ON public.ad_analytics;
CREATE POLICY "Superadmins can manage ad analytics"
ON public.ad_analytics
FOR ALL
TO public
USING (get_current_user_role() = 'superadmin')
WITH CHECK (get_current_user_role() = 'superadmin');

-- Timestamp trigger function (reuse global if exists, else create idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ad_analytics_updated_at ON public.ad_analytics;
CREATE TRIGGER set_ad_analytics_updated_at
BEFORE UPDATE ON public.ad_analytics
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Helper: upsert today row in ad_performance
CREATE OR REPLACE FUNCTION public._ensure_ad_performance_today(p_ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.ad_performance
  SET updated_at = now()
  WHERE ad_id = p_ad_id AND event_date = CURRENT_DATE;
  IF NOT FOUND THEN
    INSERT INTO public.ad_performance (ad_id, event_date, impressions, clicks)
    VALUES (p_ad_id, CURRENT_DATE, 0, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

-- RPC: increment view
CREATE OR REPLACE FUNCTION public.increment_ad_view(p_ad_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.ad_analytics (ad_id, views, clicks, last_viewed_at)
  VALUES (p_ad_id, 1, 0, now())
  ON CONFLICT (ad_id)
  DO UPDATE SET views = public.ad_analytics.views + 1, last_viewed_at = now(), updated_at = now();

  PERFORM public._ensure_ad_performance_today(p_ad_id);
  UPDATE public.ad_performance
  SET impressions = impressions + 1, updated_at = now()
  WHERE ad_id = p_ad_id AND event_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

-- RPC: increment click
CREATE OR REPLACE FUNCTION public.increment_ad_click(p_ad_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.ad_analytics (ad_id, views, clicks)
  VALUES (p_ad_id, 0, 1)
  ON CONFLICT (ad_id)
  DO UPDATE SET clicks = public.ad_analytics.clicks + 1, updated_at = now();

  PERFORM public._ensure_ad_performance_today(p_ad_id);
  UPDATE public.ad_performance
  SET clicks = clicks + 1, updated_at = now()
  WHERE ad_id = p_ad_id AND event_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;