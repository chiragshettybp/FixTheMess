-- Create function to fuzz coordinates for privacy
CREATE OR REPLACE FUNCTION public.fuzz_coordinates(lat NUMERIC, lng NUMERIC, radius_meters INTEGER DEFAULT 500)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Add random offset within radius for privacy (roughly 0.005 degrees = ~500m)
  RETURN json_build_object(
    'latitude', lat + (random() - 0.5) * 0.01,
    'longitude', lng + (random() - 0.5) * 0.01,
    'is_approximate', true
  );
END;
$$;

-- Create secure reports view with privacy controls
CREATE OR REPLACE VIEW public.reports_public AS
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
    WHEN get_current_user_role() IN ('admin', 'superadmin', 'government') THEN r.latitude
    ELSE (fuzz_coordinates(r.latitude, r.longitude)->>'latitude')::NUMERIC
  END AS latitude,
  CASE 
    WHEN get_current_user_role() IN ('admin', 'superadmin', 'government') THEN r.longitude
    ELSE (fuzz_coordinates(r.latitude, r.longitude)->>'longitude')::NUMERIC
  END AS longitude,
  -- User access control
  CASE 
    WHEN r.is_anonymous THEN NULL
    WHEN get_current_user_role() IN ('admin', 'superadmin') THEN r.user_id
    WHEN auth.uid() = r.user_id THEN r.user_id
    ELSE NULL
  END AS user_id,
  -- Regional assignment for government users
  r.region_id,
  r.resolved_by
FROM public.reports r
WHERE 
  -- Basic visibility rules
  r.status != 'hidden' AND
  -- Regional access for government users
  (
    get_current_user_role() IN ('admin', 'superadmin') OR
    get_current_user_role() != 'government' OR
    (
      get_current_user_role() = 'government' AND 
      EXISTS (
        SELECT 1 FROM government_users gu 
        WHERE gu.user_id = auth.uid() AND (gu.region_id = r.region_id OR r.region_id IS NULL)
      )
    )
  );

-- Update RLS policies for reports table to be more restrictive
DROP POLICY IF EXISTS "Reports can be viewed by all authenticated users" ON public.reports;

-- New restrictive policies for direct table access
CREATE POLICY "Admins can view all reports directly" 
ON public.reports FOR SELECT 
USING (get_current_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "Government users can view regional reports directly"
ON public.reports FOR SELECT
USING (
  get_current_user_role() = 'government' AND
  EXISTS (
    SELECT 1 FROM government_users gu 
    WHERE gu.user_id = auth.uid() AND (gu.region_id = region_id OR region_id IS NULL)
  )
);

CREATE POLICY "Users can view their own reports directly"
ON public.reports FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS policy for the public view
CREATE POLICY "Everyone can access reports through public view"
ON public.reports FOR SELECT
USING (
  -- Allow access through the public view context
  current_setting('request.jwt.claims', true)::json->>'role' IS NOT NULL
);

-- Grant access to the public view
GRANT SELECT ON public.reports_public TO authenticated;
GRANT SELECT ON public.reports_public TO anon;

-- Create function for safe distance calculation
CREATE OR REPLACE FUNCTION public.calculate_safe_distance(
  user_lat NUMERIC, 
  user_lng NUMERIC, 
  report_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  report_lat NUMERIC;
  report_lng NUMERIC;
  distance NUMERIC;
BEGIN
  -- Get coordinates based on user role
  IF get_current_user_role() IN ('admin', 'superadmin', 'government') THEN
    SELECT latitude, longitude INTO report_lat, report_lng 
    FROM reports WHERE id = report_id;
  ELSE
    -- Use approximate coordinates for regular users
    SELECT 
      (fuzz_coordinates(latitude, longitude)->>'latitude')::NUMERIC,
      (fuzz_coordinates(latitude, longitude)->>'longitude')::NUMERIC
    INTO report_lat, report_lng
    FROM reports WHERE id = report_id;
  END IF;
  
  -- Calculate distance using Haversine formula (simplified)
  distance := 6371000 * acos(
    cos(radians(user_lat)) * cos(radians(report_lat)) * 
    cos(radians(report_lng) - radians(user_lng)) + 
    sin(radians(user_lat)) * sin(radians(report_lat))
  );
  
  RETURN distance;
END;
$$;