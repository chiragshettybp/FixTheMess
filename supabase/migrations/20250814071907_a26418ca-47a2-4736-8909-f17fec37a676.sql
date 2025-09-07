-- Drop ad-related tables and storage bucket
-- First drop the tables with their triggers and functions
DROP TABLE IF EXISTS public.ad_metrics CASCADE;
DROP TABLE IF EXISTS public.ad_placements CASCADE;
DROP TABLE IF EXISTS public.ad_slots CASCADE;
DROP TABLE IF EXISTS public.ads CASCADE;

-- Drop the validation function for ad placements
DROP FUNCTION IF EXISTS public.validate_ad_placement_conflicts() CASCADE;

-- Remove all objects from the ads storage bucket first
DELETE FROM storage.objects WHERE bucket_id = 'ads';

-- Now remove the ads storage bucket
DELETE FROM storage.buckets WHERE id = 'ads';