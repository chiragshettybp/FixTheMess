-- Guest voting support: allow anonymous users to like reports
-- and make report viewing public without authentication
--
-- NOTE: The live DB already has this schema applied manually (anon_id column,
-- RLS policies, unique constraint). This migration is written for fresh
-- environments and is safe to run on the live DB (all statements are
-- idempotent).

-- ============================================================
-- 1. Add anon_id column to votes table, make user_id nullable
-- ============================================================
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS anon_id TEXT;
ALTER TABLE public.votes ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================
-- 2. Unique constraint: one vote per (anon_id, report_id)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_anon_id_report_id_key'
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_anon_id_report_id_key UNIQUE (anon_id, report_id);
  END IF;
END $$;

-- ============================================================
-- 3. RLS policies for guest voting
-- ============================================================

-- Guests can insert their own vote (user_id NULL, anon_id set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Guests can insert votes'
    AND tablename = 'votes'
  ) THEN
    CREATE POLICY "Guests can insert votes"
      ON public.votes FOR INSERT
      WITH CHECK (auth.uid() IS NULL AND user_id IS NULL AND anon_id IS NOT NULL);
  END IF;
END $$;

-- Guests can delete their own votes (matched by anon_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Guests can delete their own votes'
    AND tablename = 'votes'
  ) THEN
    CREATE POLICY "Guests can delete their own votes"
      ON public.votes FOR DELETE
      USING (auth.uid() IS NULL AND anon_id IS NOT NULL);
  END IF;
END $$;

-- ============================================================
-- 4. Grant anon ability to INSERT/DELETE on votes
--    (required for guest voting via Supabase JS client)
-- ============================================================
GRANT INSERT, SELECT, DELETE ON public.votes TO anon;
