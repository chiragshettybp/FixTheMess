-- Create government_users table for storing additional government officer metadata
CREATE TABLE public.government_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  region_id UUID REFERENCES public.regions(id),
  government_id_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.government_users ENABLE ROW LEVEL SECURITY;

-- Create policies for government_users
CREATE POLICY "Government users can view their own profile" 
ON public.government_users 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Government users can insert their own profile" 
ON public.government_users 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Government users can update their own profile" 
ON public.government_users 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all government users" 
ON public.government_users 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_government_users_updated_at
BEFORE UPDATE ON public.government_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();