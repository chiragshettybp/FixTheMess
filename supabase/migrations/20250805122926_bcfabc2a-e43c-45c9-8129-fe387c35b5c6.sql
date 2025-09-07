-- Create share_logs table to track when users share reports
CREATE TABLE public.share_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  report_id UUID REFERENCES public.reports(id) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('whatsapp', 'email', 'twitter', 'facebook', 'telegram', 'copy_link', 'authority_email')),
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.share_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all share logs" 
ON public.share_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own share logs" 
ON public.share_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to get share count for a report
CREATE OR REPLACE FUNCTION public.get_share_count(report_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT COUNT(*)::INTEGER FROM public.share_logs WHERE share_logs.report_id = $1;
$function$;