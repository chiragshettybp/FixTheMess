-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  report_updates BOOLEAN NOT NULL DEFAULT true,
  comment_alerts BOOLEAN NOT NULL DEFAULT true,
  resolution_alerts BOOLEAN NOT NULL DEFAULT true,
  nearby_alerts BOOLEAN NOT NULL DEFAULT true,
  nearby_radius_km INTEGER NOT NULL DEFAULT 5,
  community_updates BOOLEAN NOT NULL DEFAULT true,
  reply_notifications BOOLEAN NOT NULL DEFAULT true,
  abuse_report_feedback BOOLEAN NOT NULL DEFAULT true,
  delivery_method TEXT NOT NULL DEFAULT 'both' CHECK (delivery_method IN ('email', 'app', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification settings" 
ON public.notification_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON public.notification_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();