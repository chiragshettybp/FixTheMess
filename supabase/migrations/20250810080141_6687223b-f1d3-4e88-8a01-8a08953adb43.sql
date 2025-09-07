-- Clean up orphaned ad-related functions
DROP FUNCTION IF EXISTS public.validate_ad_schedule();
DROP FUNCTION IF EXISTS public.log_ad_changes();