-- Add region_id to reports table to enable government filtering by region
ALTER TABLE public.reports 
ADD COLUMN region_id UUID REFERENCES public.regions(id);

-- Add index for better performance on region filtering
CREATE INDEX idx_reports_region_id ON public.reports(region_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_region_status ON public.reports(region_id, status);

-- Update RLS policies to allow government users to view reports in their region
CREATE POLICY "Government users can view reports in their region" 
ON public.reports 
FOR SELECT 
USING (
  EXISTS(
    SELECT 1 FROM public.government_users gu 
    WHERE gu.user_id = auth.uid() 
    AND gu.region_id = reports.region_id
  )
);

-- Allow government users to update reports in their region
CREATE POLICY "Government users can update reports in their region" 
ON public.reports 
FOR UPDATE 
USING (
  EXISTS(
    SELECT 1 FROM public.government_users gu 
    WHERE gu.user_id = auth.uid() 
    AND gu.region_id = reports.region_id
  )
);