-- Create abuse_reports table for flagging inappropriate reports
CREATE TABLE public.abuse_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) NOT NULL,
  flagged_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'false_misleading', 'inappropriate_content', 'duplicate', 'harassment', 'other')),
  additional_comments TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own abuse reports" 
ON public.abuse_reports 
FOR SELECT 
USING (auth.uid() = flagged_by_user_id);

CREATE POLICY "Users can create abuse reports" 
ON public.abuse_reports 
FOR INSERT 
WITH CHECK (auth.uid() = flagged_by_user_id);

CREATE POLICY "Admins can view all abuse reports" 
ON public.abuse_reports 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

CREATE POLICY "Admins can update abuse reports" 
ON public.abuse_reports 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

-- Create unique constraint to prevent duplicate reports from same user
CREATE UNIQUE INDEX idx_abuse_reports_unique_user_report 
ON public.abuse_reports (report_id, flagged_by_user_id);

-- Create function to get abuse report count for a report
CREATE OR REPLACE FUNCTION public.get_abuse_report_count(report_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT COUNT(*)::INTEGER FROM public.abuse_reports WHERE abuse_reports.report_id = $1;
$function$;

-- Create function to check if user has reported a specific report
CREATE OR REPLACE FUNCTION public.user_has_reported_abuse(report_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS(SELECT 1 FROM public.abuse_reports WHERE abuse_reports.report_id = $1 AND abuse_reports.flagged_by_user_id = $2);
$function$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_abuse_reports_updated_at
BEFORE UPDATE ON public.abuse_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();