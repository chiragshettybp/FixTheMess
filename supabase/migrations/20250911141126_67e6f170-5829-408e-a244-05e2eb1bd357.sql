-- Fix security issues from previous migration

-- Drop the problematic view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.reports_public;

-- Fix function search paths for existing functions  
CREATE OR REPLACE FUNCTION public.get_vote_count(report_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COUNT(*)::INTEGER FROM public.votes WHERE votes.report_id = $1;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_voted(report_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS(SELECT 1 FROM public.votes WHERE votes.report_id = $1 AND votes.user_id = $2);
$function$;

CREATE OR REPLACE FUNCTION public.get_top_reporters_public(limit_count integer DEFAULT 5)
RETURNS TABLE(user_id uuid, name text, username text, avatar_url text, report_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT u.id AS user_id,
         u.name,
         u.username,
         u.avatar_url,
         COUNT(r.*)::integer AS report_count
  FROM public.reports r
  JOIN public.users u ON u.id = r.user_id
  GROUP BY u.id, u.name, u.username, u.avatar_url
  ORDER BY COUNT(r.*) DESC
  LIMIT limit_count;
$function$;

-- Create a secure function to get safe report data instead of view
CREATE OR REPLACE FUNCTION public.get_safe_reports(
  user_role text DEFAULT NULL,
  user_region_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  media_url text,
  issue_type text,
  status text,
  is_anonymous boolean,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  resolved_image_url text,
  latitude numeric,
  longitude numeric,
  user_id uuid,
  region_id uuid,
  resolved_by uuid,
  is_approximate boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role text;
  current_region_id uuid;
BEGIN
  -- Get current user role if not provided
  IF user_role IS NULL THEN
    current_user_role := get_current_user_role()::text;
  ELSE
    current_user_role := user_role;
  END IF;
  
  -- Get user's region if government user
  IF current_user_role = 'government' AND user_region_id IS NULL THEN
    SELECT gu.region_id INTO current_region_id
    FROM government_users gu
    WHERE gu.user_id = auth.uid()
    LIMIT 1;
  ELSE
    current_region_id := user_region_id;
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    r.media_url,
    r.issue_type,
    r.status,
    r.is_anonymous,
    r.created_at,
    r.updated_at,
    r.resolved_at,
    r.resolved_image_url,
    -- Conditional coordinate access based on user role
    CASE 
      WHEN current_user_role IN ('admin', 'superadmin', 'government') THEN r.latitude
      ELSE r.latitude + (random() - 0.5) * 0.01  -- Fuzz by ~500m
    END AS latitude,
    CASE 
      WHEN current_user_role IN ('admin', 'superadmin', 'government') THEN r.longitude
      ELSE r.longitude + (random() - 0.5) * 0.01  -- Fuzz by ~500m  
    END AS longitude,
    -- User access control
    CASE 
      WHEN r.is_anonymous THEN NULL
      WHEN current_user_role IN ('admin', 'superadmin') THEN r.user_id
      WHEN auth.uid() = r.user_id THEN r.user_id
      ELSE NULL
    END AS user_id,
    r.region_id,
    r.resolved_by,
    -- Indicate if coordinates are approximate
    CASE 
      WHEN current_user_role IN ('admin', 'superadmin', 'government') THEN false
      ELSE true
    END AS is_approximate
  FROM public.reports r
  WHERE 
    -- Basic visibility rules
    r.status != 'hidden' AND
    -- Regional access for government users
    (
      current_user_role IN ('admin', 'superadmin') OR
      current_user_role != 'government' OR
      (
        current_user_role = 'government' AND 
        (current_region_id = r.region_id OR r.region_id IS NULL)
      )
    );
END;
$$;

-- Grant access to the safe function
GRANT EXECUTE ON FUNCTION public.get_safe_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_reports TO anon;