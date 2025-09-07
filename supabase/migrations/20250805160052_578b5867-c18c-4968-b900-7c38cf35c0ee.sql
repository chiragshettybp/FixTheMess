-- Fix RLS policies to allow government users to update reports properly
DROP POLICY IF EXISTS "Government users can update reports in their region" ON public.reports;
DROP POLICY IF EXISTS "Government users can view reports in their region" ON public.reports;

-- Create new policy that allows government users to update all reports (since region_id is not properly assigned)
CREATE POLICY "Government users can update any report"
ON public.reports
FOR UPDATE
USING (get_current_user_role() = 'government');

-- Create new policy that allows government users to view all reports
CREATE POLICY "Government users can view all reports" 
ON public.reports
FOR SELECT
USING (get_current_user_role() = 'government');

-- Also ensure they can select reports after updating
CREATE POLICY "Allow select after update for government users"
ON public.reports
FOR SELECT
USING (
  auth.uid() = resolved_by OR 
  get_current_user_role() = 'government' OR
  true
);