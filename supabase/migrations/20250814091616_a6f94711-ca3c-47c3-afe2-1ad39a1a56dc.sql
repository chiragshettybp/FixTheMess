-- Seed initial feature toggles if they don't exist
INSERT INTO public.feature_toggles (feature_key, is_enabled, description) 
VALUES 
  ('user_registration', true, 'Allow new users to register accounts'),
  ('content_moderation', true, 'Enable automatic content moderation'),
  ('email_notifications', true, 'Send email notifications to users'),
  ('public_reporting', true, 'Allow anonymous public reporting'),
  ('mobile_uploads', true, 'Enable image uploads from mobile devices')
ON CONFLICT (feature_key) DO NOTHING;

-- Seed initial role permissions if they don't exist
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

-- Seed initial app settings if they don't exist
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES 
  ('app_name', '"FixTheMess"', 'Application display name'),
  ('contact_email', '"admin@fixthemess.com"', 'Primary contact email for support'),
  ('support_phone', '"+1 (555) 123-4567"', 'Support phone number'),
  ('max_report_image_size', '10485760', 'Maximum image size in bytes (10MB)'),
  ('reports_per_page', '20', 'Number of reports to display per page'),
  ('enable_geolocation', 'true', 'Enable GPS location for reports')
ON CONFLICT (setting_key) DO NOTHING;