-- Create app_settings table for core application settings
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature_toggles table for feature flags
CREATE TABLE public.feature_toggles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions table for role-based access control
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_name, permission_key)
);

-- Create settings_audit table for change logging
CREATE TABLE public.settings_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for superadmin access only
CREATE POLICY "Superadmins can manage app settings" ON public.app_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

CREATE POLICY "Superadmins can manage feature toggles" ON public.feature_toggles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

CREATE POLICY "Superadmins can manage role permissions" ON public.role_permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

CREATE POLICY "Superadmins can view audit logs" ON public.settings_audit
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- Create storage bucket for logo uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-assets', 'app-assets', true);

-- Create storage policies for app assets
CREATE POLICY "Superadmins can upload app assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'app-assets' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

CREATE POLICY "Superadmins can update app assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'app-assets' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

CREATE POLICY "App assets are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'app-assets');

-- Create triggers for updated_at columns
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_toggles_updated_at
  BEFORE UPDATE ON public.feature_toggles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
('app_name', '"FixTheMess"', 'Application name displayed throughout the platform'),
('contact_email', '"admin@fixthemess.com"', 'Primary contact email for support'),
('support_phone', '"+1-800-FIXMESS"', 'Support phone number'),
('app_logo_url', 'null', 'URL to the application logo');

-- Insert default feature toggles
INSERT INTO public.feature_toggles (feature_key, is_enabled, description) VALUES
('user_registration', true, 'Allow new users to register accounts'),
('content_moderation', true, 'Enable automatic content moderation'),
('email_notifications', true, 'Send email notifications to users'),
('anonymous_reporting', true, 'Allow anonymous report submissions'),
('social_sharing', true, 'Enable social media sharing features');

-- Insert default role permissions
INSERT INTO public.role_permissions (role_name, permission_key, is_granted) VALUES
('user', 'create_reports', true),
('user', 'vote_reports', true),
('user', 'comment_reports', true),
('user', 'share_reports', true),
('government', 'resolve_reports', true),
('government', 'update_report_status', true),
('government', 'view_all_reports', true),
('admin', 'moderate_content', true),
('admin', 'manage_users', true),
('admin', 'view_analytics', true),
('superadmin', 'manage_settings', true),
('superadmin', 'manage_admins', true),
('superadmin', 'access_audit_logs', true);

-- Create function to log setting changes
CREATE OR REPLACE FUNCTION public.log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings_audit (
    admin_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values,
    changes_summary
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New record created'
      WHEN TG_OP = 'UPDATE' THEN 'Record updated'
      WHEN TG_OP = 'DELETE' THEN 'Record deleted'
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE TRIGGER app_settings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_settings_change();

CREATE TRIGGER feature_toggles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.feature_toggles
  FOR EACH ROW EXECUTE FUNCTION public.log_settings_change();

CREATE TRIGGER role_permissions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_settings_change();