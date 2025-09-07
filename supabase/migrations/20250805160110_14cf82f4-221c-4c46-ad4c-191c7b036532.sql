-- Clean up overlapping RLS policies and create a streamlined set
DROP POLICY IF EXISTS "Users can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Government users can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Allow select after update for government users" ON public.reports;

-- Create a single comprehensive SELECT policy
CREATE POLICY "Reports can be viewed by all authenticated users"
ON public.reports
FOR SELECT
USING (true);

-- Ensure the government update policy is working
DROP POLICY IF EXISTS "Government users can update any report" ON public.reports;
CREATE POLICY "Government users can update reports"
ON public.reports
FOR UPDATE
USING (get_current_user_role() = 'government');