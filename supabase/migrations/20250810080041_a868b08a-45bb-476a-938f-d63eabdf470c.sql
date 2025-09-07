-- Remove ad-related backend: RPCs and tables
-- Drop RPC functions if they exist
DROP FUNCTION IF EXISTS public.increment_ad_view(uuid);
DROP FUNCTION IF EXISTS public.increment_ad_click(uuid);
DROP FUNCTION IF EXISTS public._ensure_ad_performance_today(uuid);

-- Drop ad-related tables (children first)
DROP TABLE IF EXISTS public.ad_analytics CASCADE;
DROP TABLE IF EXISTS public.ad_audit_logs CASCADE;
DROP TABLE IF EXISTS public.ad_performance CASCADE;
DROP TABLE IF EXISTS public.ads CASCADE;