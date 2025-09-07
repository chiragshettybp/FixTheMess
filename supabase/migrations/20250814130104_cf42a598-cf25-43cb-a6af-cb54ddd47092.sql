-- Add foreign key constraint between users and user_status tables
-- First, ensure user_status table has user_id column if it doesn't exist
DO $$ 
BEGIN
    -- Check if user_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_status' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_status ADD COLUMN user_id UUID;
    END IF;
END $$;

-- Add foreign key constraint from user_status.user_id to users.id
ALTER TABLE public.user_status 
ADD CONSTRAINT fk_user_status_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create unique constraint to ensure one status record per user
ALTER TABLE public.user_status 
ADD CONSTRAINT unique_user_status 
UNIQUE (user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON public.user_status(user_id);

-- Insert default status records for existing users that don't have one
INSERT INTO public.user_status (user_id, status, strike_count, suspension_until)
SELECT u.id, 'active', 0, NULL
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_status us WHERE us.user_id = u.id);