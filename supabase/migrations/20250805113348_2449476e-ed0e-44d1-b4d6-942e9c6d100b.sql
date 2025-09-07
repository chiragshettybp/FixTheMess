-- Fix security issues by updating functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_vote_count(report_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*)::INTEGER FROM public.votes WHERE votes.report_id = $1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_voted(report_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(SELECT 1 FROM public.votes WHERE votes.report_id = $1 AND votes.user_id = $2);
$$;