-- Simplify database to single profile table
-- Remove all existing tables and create a minimal profile table

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.vehicle_types CASCADE;
DROP TABLE IF EXISTS public.toll_transactions CASCADE;
DROP TABLE IF EXISTS public.toll_profiles CASCADE;
DROP TABLE IF EXISTS public.toll_booths CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.tolls CASCADE;
DROP TABLE IF EXISTS public.other_services CASCADE;
DROP TABLE IF EXISTS public.profile CASCADE;

-- Create a minimal profile table
CREATE TABLE public.profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  user_type TEXT, -- 'restaurant', 'toll', etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security for profile table
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

-- Create policy for profile table
CREATE POLICY "Users can view and edit their own profile"
  ON public.profile
  USING (auth.uid() = id);

-- Trigger function to automatically add a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (id, email, user_type)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 