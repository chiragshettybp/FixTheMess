-- Create user_status table for user moderation
CREATE TABLE public.user_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
  strike_count INTEGER NOT NULL DEFAULT 0,
  suspension_until TIMESTAMP WITH TIME ZONE,
  reasons TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create actions_log table for audit trail
CREATE TABLE public.actions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  payload JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_sessions table for device tracking
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_status
CREATE POLICY "Superadmins can manage user status" 
ON public.user_status 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Users can view their own status" 
ON public.user_status 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS policies for actions_log
CREATE POLICY "Superadmins can view all actions" 
ON public.actions_log 
FOR SELECT 
USING (get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Superadmins can create actions" 
ON public.actions_log 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'superadmin'::user_role);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

-- RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (get_current_user_role() = 'superadmin'::user_role);

CREATE POLICY "Superadmins can manage sessions" 
ON public.user_sessions 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::user_role);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_status_updated_at
  BEFORE UPDATE ON public.user_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_status_user_id ON public.user_status(user_id);
CREATE INDEX idx_actions_log_target_user_id ON public.actions_log(target_user_id);
CREATE INDEX idx_actions_log_actor_id ON public.actions_log(actor_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);