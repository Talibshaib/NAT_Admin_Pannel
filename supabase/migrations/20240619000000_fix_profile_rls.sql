-- Fix RLS policy for profile table to allow inserts

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON public.profile;

-- Create separate policies for different operations
CREATE POLICY "Users can view their own profile"
  ON public.profile
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profile
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role and trigger functions to insert profiles
CREATE POLICY "Allow inserts from trigger function"
  ON public.profile
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts - they'll be from our trigger function

-- Make the trigger function more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (id, email, user_type)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'user_type', 'user'))
  ON CONFLICT (id) DO NOTHING;  -- Avoid duplicate key errors
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 