-- Create analytics tables for tracking views, taps, and summary metrics

-- Views tracking table
CREATE TABLE public.views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid NOT NULL,
  content_type text NOT NULL DEFAULT 'report',
  user_id uuid REFERENCES public.users(id),
  device_type text NOT NULL DEFAULT 'web',
  page_path text,
  session_id text,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Taps/clicks tracking table
CREATE TABLE public.taps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature text NOT NULL,
  element_type text NOT NULL DEFAULT 'button',
  user_id uuid REFERENCES public.users(id),
  device_type text NOT NULL DEFAULT 'web',
  page_path text,
  session_id text,
  metadata jsonb,
  tapped_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Analytics summary table for aggregated daily metrics
CREATE TABLE public.analytics_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  total_views integer NOT NULL DEFAULT 0,
  total_taps integer NOT NULL DEFAULT 0,
  total_reports integer NOT NULL DEFAULT 0,
  avg_attention_time_minutes numeric(10,2),
  active_users integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Report attention tracking table
CREATE TABLE public.report_attention (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid REFERENCES public.users(id),
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES public.users(id),
  attention_time_minutes numeric(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(report_id)
);

-- Enable RLS
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_attention ENABLE ROW LEVEL SECURITY;

-- RLS policies for views
CREATE POLICY "Superadmins can view all analytics data"
ON public.views
FOR ALL
USING (get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Users can create their own view logs"
ON public.views
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for taps
CREATE POLICY "Superadmins can view all tap analytics"
ON public.taps
FOR ALL
USING (get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Users can create their own tap logs"
ON public.taps
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for analytics_summary
CREATE POLICY "Superadmins can manage analytics summary"
ON public.analytics_summary
FOR ALL
USING (get_current_user_role() = 'superadmin'::user_role);

-- RLS policies for report_attention
CREATE POLICY "Superadmins can manage report attention"
ON public.report_attention
FOR ALL
USING (get_current_user_role() = 'superadmin'::user_role);

-- Create indexes for performance
CREATE INDEX idx_views_content_id ON public.views(content_id);
CREATE INDEX idx_views_user_id ON public.views(user_id);
CREATE INDEX idx_views_viewed_at ON public.views(viewed_at);
CREATE INDEX idx_views_device_type ON public.views(device_type);

CREATE INDEX idx_taps_feature ON public.taps(feature);
CREATE INDEX idx_taps_user_id ON public.taps(user_id);
CREATE INDEX idx_taps_tapped_at ON public.taps(tapped_at);
CREATE INDEX idx_taps_device_type ON public.taps(device_type);

CREATE INDEX idx_analytics_summary_date ON public.analytics_summary(date);
CREATE INDEX idx_report_attention_report_id ON public.report_attention(report_id);

-- Create function to calculate attention time
CREATE OR REPLACE FUNCTION public.calculate_attention_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Update attention time when report status changes
  IF OLD.status != NEW.status THEN
    INSERT INTO public.report_attention (report_id, acknowledged_at, acknowledged_by)
    VALUES (NEW.id, now(), auth.uid())
    ON CONFLICT (report_id) 
    DO UPDATE SET
      acknowledged_at = COALESCE(report_attention.acknowledged_at, now()),
      acknowledged_by = COALESCE(report_attention.acknowledged_by, auth.uid()),
      resolved_at = CASE WHEN NEW.status = 'resolved' THEN now() ELSE report_attention.resolved_at END,
      resolved_by = CASE WHEN NEW.status = 'resolved' THEN auth.uid() ELSE report_attention.resolved_by END,
      attention_time_minutes = CASE 
        WHEN NEW.status = 'resolved' AND report_attention.acknowledged_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (now() - report_attention.acknowledged_at)) / 60.0
        ELSE report_attention.attention_time_minutes
      END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for attention time tracking
CREATE TRIGGER trigger_calculate_attention_time
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_attention_time();

-- Enable realtime for all analytics tables
ALTER TABLE public.views REPLICA IDENTITY FULL;
ALTER TABLE public.taps REPLICA IDENTITY FULL;
ALTER TABLE public.analytics_summary REPLICA IDENTITY FULL;
ALTER TABLE public.report_attention REPLICA IDENTITY FULL;