-- Extend ads table with campaign fields
ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS target_url text,
ADD COLUMN IF NOT EXISTS platforms text[] NOT NULL DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS audience_segments text[] NOT NULL DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS placement text,
ADD COLUMN IF NOT EXISTS daily_budget numeric,
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS start_time timestamptz,
ADD COLUMN IF NOT EXISTS end_time timestamptz,
ADD COLUMN IF NOT EXISTS ad_category text;

-- URL validation (simple http/https)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ads_target_url_http_check'
  ) THEN
    ALTER TABLE public.ads
    ADD CONSTRAINT ads_target_url_http_check CHECK (
      target_url IS NULL OR target_url ~* '^https?://'
    );
  END IF;
END $$;

-- Index to speed up overlap checks for active campaigns
CREATE INDEX IF NOT EXISTS idx_ads_placement_time_active ON public.ads(placement, start_time, end_time) WHERE status = 'active';

-- Validation function for schedule overlap and time logic
CREATE OR REPLACE FUNCTION public.validate_ad_schedule()
RETURNS trigger AS $$
BEGIN
  -- If publishing/activating with schedule provided
  IF NEW.status = 'active' AND NEW.placement IS NOT NULL AND NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    -- end must be after start
    IF NEW.end_time <= NEW.start_time THEN
      RAISE EXCEPTION 'end_time must be after start_time';
    END IF;

    -- Overlap check for same placement
    IF EXISTS (
      SELECT 1 FROM public.ads a
      WHERE a.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        AND a.status = 'active'
        AND a.placement = NEW.placement
        AND a.start_time IS NOT NULL
        AND a.end_time IS NOT NULL
        AND NOT (a.end_time <= NEW.start_time OR a.start_time >= NEW.end_time)
    ) THEN
      RAISE EXCEPTION 'Schedule overlaps with an existing active ad for the same placement';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for inserts and updates
DROP TRIGGER IF EXISTS trg_ads_validate ON public.ads;
CREATE TRIGGER trg_ads_validate
BEFORE INSERT OR UPDATE ON public.ads
FOR EACH ROW EXECUTE FUNCTION public.validate_ad_schedule();