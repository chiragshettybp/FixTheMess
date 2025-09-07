-- Create reports table for civic issue reporting
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  description TEXT,
  issue_type TEXT NOT NULL DEFAULT 'other',
  media_url TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports access
CREATE POLICY "Users can view all reports" 
ON public.reports 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (
  (is_anonymous = true AND user_id IS NULL) OR 
  (is_anonymous = false AND auth.uid() = user_id)
);

CREATE POLICY "Users can update their own reports" 
ON public.reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any report" 
ON public.reports 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for report media
INSERT INTO storage.buckets (id, name, public) VALUES ('report-media', 'report-media', true);

-- Create storage policies for report media
CREATE POLICY "Report media is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'report-media');

CREATE POLICY "Authenticated users can upload report media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'report-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own report media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'report-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own report media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'report-media' AND auth.uid() IS NOT NULL);