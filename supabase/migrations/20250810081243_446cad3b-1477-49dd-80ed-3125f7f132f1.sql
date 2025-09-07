-- Create ads table
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 50),
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('homepage','feed')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active')),
  paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Superadmins can manage ads" ON public.ads;
CREATE POLICY "Superadmins can manage ads"
ON public.ads
FOR ALL
USING (public.get_current_user_role() = 'superadmin')
WITH CHECK (public.get_current_user_role() = 'superadmin');

DROP POLICY IF EXISTS "Users can view active, scheduled, unpaused ads" ON public.ads;
CREATE POLICY "Users can view active, scheduled, unpaused ads"
ON public.ads
FOR SELECT
USING (
  status = 'active' AND paused = false AND now() BETWEEN start_date AND end_date
);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_ads_updated_at ON public.ads;
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create public storage bucket for ads images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ads bucket
DO $$
BEGIN
  -- Allow public read access to ads images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Ad images are publicly accessible'
  ) THEN
    CREATE POLICY "Ad images are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'ads');
  END IF;

  -- Allow superadmins to manage ads images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Superadmins can manage ads images'
  ) THEN
    CREATE POLICY "Superadmins can manage ads images"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'ads' AND public.get_current_user_role() = 'superadmin')
    WITH CHECK (bucket_id = 'ads' AND public.get_current_user_role() = 'superadmin');
  END IF;
END $$;