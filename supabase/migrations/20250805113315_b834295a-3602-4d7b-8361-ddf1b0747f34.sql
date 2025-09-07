-- Create votes table for upvoting system
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_id)
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies for votes
CREATE POLICY "Users can view all votes" 
ON public.votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own votes" 
ON public.votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add vote count function for reports
CREATE OR REPLACE FUNCTION public.get_vote_count(report_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.votes WHERE votes.report_id = $1;
$$ LANGUAGE SQL STABLE;

-- Add user vote check function
CREATE OR REPLACE FUNCTION public.user_has_voted(report_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.votes WHERE votes.report_id = $1 AND votes.user_id = $2);
$$ LANGUAGE SQL STABLE;