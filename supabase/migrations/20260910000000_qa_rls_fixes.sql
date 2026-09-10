-- QA round: RLS fixes found during live end-to-end testing (2026-09-10)

-- 1. users table was missing an admin UPDATE policy - SuperadminEditUser role/email
--    updates silently failed (HTTP 200 but no row changed).
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE
  USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]))
  WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

-- 2. Government UPDATE policy on reports was role-wide only (any gov could edit any
--    report anywhere). Restricted to the gov user's own region so a Municipal
--    Officer in one region cannot silently resolve reports in another.
DROP POLICY IF EXISTS "Government users can update reports" ON public.reports;
DROP POLICY IF EXISTS "Government users can update reports in their region" ON public.reports;
CREATE POLICY "Government users can update reports in their region" ON public.reports
  FOR UPDATE
  USING (
    get_current_user_role() = 'government'::user_role
    AND region_id IS NOT NULL
    AND region_id IN (
      SELECT gu.region_id FROM public.government_users gu WHERE gu.user_id = auth.uid()
    )
  );

-- 3. reports table had NO DELETE policy - report owners could not delete their own
--    reports (ViewReport.tsx Delete button), and SuperadminReports delete/bulk-delete
--    silently failed (HTTP 200, rows remained).
CREATE POLICY "Users can delete their own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any report" ON public.reports
  FOR DELETE USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

-- 4. users table had NO DELETE policy - EditProfile "Delete my account" left the
--    profile row in place.
CREATE POLICY "Users can delete their own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- 5. abuse_reports had NO DELETE policy - account deletion and report cascade
--    deletion silently skipped abuse rows.
CREATE POLICY "Users can delete their own abuse reports" ON public.abuse_reports
  FOR DELETE USING (flagged_by_user_id = auth.uid());
CREATE POLICY "Admins can delete any abuse report" ON public.abuse_reports
  FOR DELETE USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

-- 6. share_logs had NO DELETE policy - account deletion and report cascade
--    deletion silently skipped share rows.
CREATE POLICY "Users can delete their own share logs" ON public.share_logs
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can delete any share log" ON public.share_logs
  FOR DELETE USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

-- 7. storage objects: report-media had no admin DELETE policy. ReportIssue uploads to
--    `reports/<file>` while the user delete policy expects `{user_id}/<file>`, so media
--    files could never be removed and SuperadminReportEdit.removeMediaFile toasted
--    "File removed" while the object stayed on the bucket.
CREATE POLICY "Superadmins can delete report media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'report-media'::text
    AND get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role])
  );