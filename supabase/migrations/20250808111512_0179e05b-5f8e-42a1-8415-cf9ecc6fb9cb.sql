-- Update validate_ad_schedule to set a fixed search_path
CREATE OR REPLACE FUNCTION public.validate_ad_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.placement IS NOT NULL AND NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    IF NEW.end_time <= NEW.start_time THEN
      RAISE EXCEPTION 'end_time must be after start_time';
    END IF;

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
$$;