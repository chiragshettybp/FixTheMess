-- 1) Function: validate ad_placement conflicts, date ordering, and slot type compatibility
CREATE OR REPLACE FUNCTION public.validate_ad_placement_conflicts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_conflict boolean;
BEGIN
  -- Ensure dates are valid
  IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
    RAISE EXCEPTION 'start_date and end_date must be provided';
  END IF;
  IF NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION 'start_date (%) cannot be after end_date (%)', NEW.start_date, NEW.end_date;
  END IF;

  -- Prevent overlapping active placements on the same slot for different ads
  has_conflict := EXISTS (
    SELECT 1
    FROM public.ad_placements ap
    WHERE ap.slot_id = NEW.slot_id
      AND ap.active = true
      AND COALESCE(NEW.active, true) = true
      AND ap.id IS DISTINCT FROM NEW.id
      AND tstzrange(ap.start_date, ap.end_date, '[]') && tstzrange(NEW.start_date, NEW.end_date, '[]')
  );

  IF has_conflict THEN
    RAISE EXCEPTION 'Placement conflict: another active ad is scheduled for this slot within the selected date range.';
  END IF;

  -- Validate media type compatibility with slot allowed_types
  IF EXISTS (
    SELECT 1
    FROM public.ad_slots s
    JOIN public.ads a ON a.id = NEW.ad_id
    WHERE s.id = NEW.slot_id
      AND NOT (COALESCE(a.campaign_type, 'image') = ANY(s.allowed_types))
  ) THEN
    RAISE EXCEPTION 'Incompatible media type: ad.campaign_type is not allowed in the selected slot.';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Trigger to enforce validations on ad_placements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_ad_placements'
  ) THEN
    CREATE TRIGGER trg_validate_ad_placements
    BEFORE INSERT OR UPDATE ON public.ad_placements
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_ad_placement_conflicts();
  END IF;
END
$$;

-- 3) Updated-at triggers for relevant tables using existing helper function
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ad_placements_updated_at') THEN
    CREATE TRIGGER trg_ad_placements_updated_at
    BEFORE UPDATE ON public.ad_placements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ad_slots_updated_at') THEN
    CREATE TRIGGER trg_ad_slots_updated_at
    BEFORE UPDATE ON public.ad_slots
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ad_metrics_updated_at') THEN
    CREATE TRIGGER trg_ad_metrics_updated_at
    BEFORE UPDATE ON public.ad_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- 4) Performance indexes
CREATE INDEX IF NOT EXISTS idx_ad_placements_slot_active_dates
  ON public.ad_placements (slot_id, active, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ad_placements_ad
  ON public.ad_placements (ad_id);

CREATE INDEX IF NOT EXISTS idx_ad_metrics_ad_slot_date
  ON public.ad_metrics (ad_id, slot_id, metric_date);
