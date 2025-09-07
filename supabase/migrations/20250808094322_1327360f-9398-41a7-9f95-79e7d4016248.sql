-- Enable realtime for reports and votes tables
ALTER TABLE public.reports REPLICA IDENTITY FULL;
ALTER TABLE public.votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- Function: Top reporters with limited public profile (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_top_reporters_public(limit_count integer DEFAULT 5)
RETURNS TABLE (
  user_id uuid,
  name text,
  username text,
  avatar_url text,
  report_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Function: Top voted reports
CREATE OR REPLACE FUNCTION public.get_top_voted_reports(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  media_url text,
  vote_count integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT r.id, r.title, r.media_url, COALESCE(v.vote_count, 0)::integer AS vote_count
  FROM public.reports r
  LEFT JOIN (
    SELECT report_id, COUNT(*) AS vote_count
    FROM public.votes
    GROUP BY report_id
  ) v ON v.report_id = r.id
  ORDER BY COALESCE(v.vote_count, 0) DESC, r.created_at DESC
  LIMIT limit_count;
$$;

-- Function: Batch get public profiles
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.name, u.username, u.avatar_url
  FROM public.users u
  WHERE u.id = ANY (user_ids);
$$;

-- Function: Batch get vote counts for report ids
CREATE OR REPLACE FUNCTION public.get_vote_counts(report_ids uuid[])
RETURNS TABLE (
  report_id uuid,
  vote_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.report_id, COUNT(v.*)::integer AS vote_count
  FROM public.votes v
  WHERE v.report_id = ANY (report_ids)
  GROUP BY v.report_id;
$$;