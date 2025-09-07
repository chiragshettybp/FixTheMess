-- Create system_health table for performance metrics
CREATE TABLE public.system_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create error_logs table for system errors
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  component TEXT NOT NULL CHECK (component IN ('frontend', 'backend', 'api', 'database')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for system_health
CREATE POLICY "Superadmins can manage system health" 
ON public.system_health 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

-- Create policies for error_logs
CREATE POLICY "Superadmins can manage error logs" 
ON public.error_logs 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

-- Create indexes for better performance
CREATE INDEX idx_system_health_metric_timestamp ON public.system_health(metric_name, timestamp DESC);
CREATE INDEX idx_error_logs_severity_timestamp ON public.error_logs(severity, timestamp DESC);
CREATE INDEX idx_error_logs_component_timestamp ON public.error_logs(component, timestamp DESC);
CREATE INDEX idx_error_logs_status ON public.error_logs(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_error_logs_updated_at
  BEFORE UPDATE ON public.error_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_error_logs_updated_at();

-- Insert some sample data for testing
INSERT INTO public.system_health (metric_name, value, unit) VALUES
  ('cpu_usage', 65.5, 'percent'),
  ('memory_usage', 72.8, 'percent'),
  ('disk_usage', 45.2, 'percent'),
  ('active_connections', 156, 'count'),
  ('response_time', 245, 'milliseconds'),
  ('api_latency', 89, 'milliseconds'),
  ('active_users', 1247, 'count');

INSERT INTO public.error_logs (error_type, severity, component, message) VALUES
  ('Database Connection Error', 'critical', 'database', 'Connection pool exhausted - unable to connect to database'),
  ('API Rate Limit Exceeded', 'high', 'api', 'Rate limit exceeded for endpoint /api/reports - 1000 requests/minute'),
  ('Memory Leak Detected', 'medium', 'backend', 'Memory usage increased by 15% over last hour'),
  ('Frontend Build Warning', 'low', 'frontend', 'Deprecated API usage detected in user dashboard component'),
  ('Authentication Timeout', 'high', 'api', 'JWT token validation failing - session timeout issues reported'),
  ('Disk Space Warning', 'medium', 'backend', 'Disk usage at 85% - cleanup required soon');