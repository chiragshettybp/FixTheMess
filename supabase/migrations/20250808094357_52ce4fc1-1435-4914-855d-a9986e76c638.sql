-- Add search_path to get_top_voted_reports to satisfy linter
CREATE OR REPLACE FUNCTION public.get_top_voted_reports(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  media_url text,
  vote_count integer
)
LANGUAGE sql
STABLE
SET search_path = public
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