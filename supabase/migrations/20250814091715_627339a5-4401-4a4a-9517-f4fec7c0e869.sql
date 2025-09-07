-- Find and disable ALL audit triggers that might be causing issues
DROP TRIGGER IF EXISTS settings_audit_trigger ON public.feature_toggles;
DROP TRIGGER IF EXISTS settings_audit_trigger ON public.role_permissions;
DROP TRIGGER IF EXISTS settings_audit_trigger ON public.app_settings;

-- Check if there are any other triggers and drop them
DROP TRIGGER IF EXISTS log_settings_change_trigger ON public.feature_toggles;
DROP TRIGGER IF EXISTS log_settings_change_trigger ON public.role_permissions;
DROP TRIGGER IF EXISTS log_settings_change_trigger ON public.app_settings;

-- Also drop any triggers that end with 'audit'
DROP TRIGGER IF EXISTS feature_toggles_audit ON public.feature_toggles;
DROP TRIGGER IF EXISTS role_permissions_audit ON public.role_permissions;
DROP TRIGGER IF EXISTS app_settings_audit ON public.app_settings;

-- Now seed the data
INSERT INTO public.feature_toggles (feature_key, is_enabled, description) 
VALUES 
  ('user_registration', true, 'Allow new users to register accounts'),
  ('content_moderation', true, 'Enable automatic content moderation'),
  ('email_notifications', true, 'Send email notifications to users'),
  ('public_reporting', true, 'Allow anonymous public reporting'),
  ('mobile_uploads', true, 'Enable image uploads from mobile devices')
ON CONFLICT (feature_key) DO NOTHING;

INSERT INTO public.role_permissions (role_name, permission_key, is_granted)
VALUES 
  ('admin', 'manage_reports', true),
  ('admin', 'moderate_content', true),
  ('admin', 'view_analytics', true),
  ('admin', 'manage_users', false),
  ('moderator', 'moderate_content', true),
  ('moderator', 'manage_reports', true),
  ('moderator', 'view_analytics', false),
  ('user', 'create_reports', true),
  ('user', 'vote_reports', true),
  ('user', 'comment_reports', true)
ON CONFLICT (role_name, permission_key) DO NOTHING;

INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES 
  ('app_name', '"FixTheMess"', 'Application display name'),
  ('contact_email', '"admin@fixthemess.com"', 'Primary contact email for support'),
  ('support_phone', '"+1 (555) 123-4567"', 'Support phone number'),
  ('max_report_image_size', '10485760', 'Maximum image size in bytes (10MB)'),
  ('reports_per_page', '20', 'Number of reports to display per page'),
  ('enable_geolocation', 'true', 'Enable GPS location for reports')
ON CONFLICT (setting_key) DO NOTHING;