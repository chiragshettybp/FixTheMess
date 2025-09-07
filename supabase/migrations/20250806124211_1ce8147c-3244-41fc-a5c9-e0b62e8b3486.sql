-- First, let's update the user role for admin@ibolinva.com to superadmin
UPDATE users 
SET role = 'superadmin' 
WHERE email = 'admin@ibolinva.com';

-- Create tables for superadmin functionality
-- City admins table
CREATE TABLE public.city_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  assigned_city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Civic modules table for content management
CREATE TABLE public.civic_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  department_tag TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform settings table
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Report flags table for abuse tracking
CREATE TABLE public.report_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL,
  flag_type TEXT NOT NULL,
  reason TEXT,
  flagged_by_user_id UUID,
  is_auto_flagged BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.city_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_flags ENABLE ROW LEVEL SECURITY;

-- RLS policies for city_admins
CREATE POLICY "Superadmins can manage city admins" 
ON public.city_admins 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

-- RLS policies for civic_modules
CREATE POLICY "Superadmins can manage civic modules" 
ON public.civic_modules 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Users can view active civic modules" 
ON public.civic_modules 
FOR SELECT 
USING (is_active = true);

-- RLS policies for platform_settings
CREATE POLICY "Superadmins can manage platform settings" 
ON public.platform_settings 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

-- RLS policies for report_flags
CREATE POLICY "Superadmins can manage report flags" 
ON public.report_flags 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Users can view their own report flags" 
ON public.report_flags 
FOR SELECT 
USING (flagged_by_user_id = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_city_admins_updated_at
BEFORE UPDATE ON public.city_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_civic_modules_updated_at
BEFORE UPDATE ON public.civic_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_flags_updated_at
BEFORE UPDATE ON public.report_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, updated_by) VALUES
('auto_flag_threshold', '{"downvotes": 10, "abuse_reports": 5}', (SELECT id FROM users WHERE email = 'admin@ibolinva.com' LIMIT 1)),
('reporting_enabled', 'true', (SELECT id FROM users WHERE email = 'admin@ibolinva.com' LIMIT 1)),
('email_notifications', '{"enabled": true, "webhook_url": ""}', (SELECT id FROM users WHERE email = 'admin@ibolinva.com' LIMIT 1));

-- Create storage bucket for civic modules
INSERT INTO storage.buckets (id, name, public) VALUES ('civic-modules', 'civic-modules', true);

-- Create storage policies for civic modules
CREATE POLICY "Superadmins can upload civic modules" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'civic-modules' AND get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Anyone can view civic modules" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'civic-modules');

CREATE POLICY "Superadmins can update civic modules" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'civic-modules' AND get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Superadmins can delete civic modules" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'civic-modules' AND get_current_user_role() = 'superadmin'::user_role);