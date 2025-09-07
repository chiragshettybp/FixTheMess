-- Fix search path for existing functions to be immutable
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_vote_count(report_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER FROM public.votes WHERE votes.report_id = $1;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_voted(report_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(SELECT 1 FROM public.votes WHERE votes.report_id = $1 AND votes.user_id = $2);
$function$;

CREATE OR REPLACE FUNCTION public.get_share_count(report_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER FROM public.share_logs WHERE share_logs.report_id = $1;
$function$;

CREATE OR REPLACE FUNCTION public.get_abuse_report_count(report_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER FROM public.abuse_reports WHERE abuse_reports.report_id = $1;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_reported_abuse(report_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(SELECT 1 FROM public.abuse_reports WHERE abuse_reports.report_id = $1 AND abuse_reports.flagged_by_user_id = $2);
$function$;