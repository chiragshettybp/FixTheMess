-- Add missing columns to ads table
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS advertiser_id uuid NULL,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text NULL;

-- Add foreign key to users table for advertiser_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ads_advertiser_id_fkey'
  ) THEN
    ALTER TABLE public.ads
      ADD CONSTRAINT ads_advertiser_id_fkey
      FOREIGN KEY (advertiser_id)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create ad_audit_logs table
CREATE TABLE IF NOT EXISTS public.ad_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL,
  action text NOT NULL,
  details text,
  performed_by uuid,
  performed_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_audit_logs_ad_id ON public.ad_audit_logs(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_audit_logs_performed_at ON public.ad_audit_logs(performed_at);

-- Enable RLS
ALTER TABLE public.ad_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: only superadmins can manage audit logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ad_audit_logs' AND policyname = 'Superadmins can manage ad audit logs'
  ) THEN
    CREATE POLICY "Superadmins can manage ad audit logs"
    ON public.ad_audit_logs
    FOR ALL
    USING (get_current_user_role() = 'superadmin'::user_role)
    WITH CHECK (get_current_user_role() = 'superadmin'::user_role);
  END IF;
END $$;

-- Trigger function to log ad changes
CREATE OR REPLACE FUNCTION public.log_ad_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  actor uuid;
BEGIN
  actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ad_audit_logs (ad_id, action, details, performed_by)
    VALUES (NEW.id, 'Created', 'Ad created', actor);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.ad_audit_logs (ad_id, action, details, performed_by)
      VALUES (NEW.id, 'Status Changed', format('Status %s -> %s', COALESCE(OLD.status,'null'), COALESCE(NEW.status,'null')), actor);
    END IF;
    IF NEW.is_deleted IS DISTINCT FROM OLD.is_deleted AND NEW.is_deleted = true THEN
      INSERT INTO public.ad_audit_logs (ad_id, action, details, performed_by)
      VALUES (NEW.id, 'Deleted', 'Ad soft-deleted', actor);
    END IF;
    IF (NEW.title IS DISTINCT FROM OLD.title)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.media_url IS DISTINCT FROM OLD.media_url)
       OR (NEW.target_url IS DISTINCT FROM OLD.target_url)
       OR (NEW.start_date IS DISTINCT FROM OLD.start_date)
       OR (NEW.end_date IS DISTINCT FROM OLD.end_date)
       OR (NEW.budget IS DISTINCT FROM OLD.budget)
       OR (NEW.placement IS DISTINCT FROM OLD.placement) THEN
      INSERT INTO public.ad_audit_logs (ad_id, action, details, performed_by)
      VALUES (NEW.id, 'Edited', 'Ad fields updated', actor);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.ad_audit_logs (ad_id, action, details, performed_by)
    VALUES (OLD.id, 'Deleted', 'Ad deleted', actor);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers on ads table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ads_log_insert'
  ) THEN
    CREATE TRIGGER trg_ads_log_insert
    AFTER INSERT ON public.ads
    FOR EACH ROW EXECUTE FUNCTION public.log_ad_changes();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ads_log_update'
  ) THEN
    CREATE TRIGGER trg_ads_log_update
    AFTER UPDATE ON public.ads
    FOR EACH ROW EXECUTE FUNCTION public.log_ad_changes();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ads_log_delete'
  ) THEN
    CREATE TRIGGER trg_ads_log_delete
    AFTER DELETE ON public.ads
    FOR EACH ROW EXECUTE FUNCTION public.log_ad_changes();
  END IF;
END $$;