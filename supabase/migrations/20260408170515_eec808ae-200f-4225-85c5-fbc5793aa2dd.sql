-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: only admin can read
CREATE POLICY "Admin can read roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add insert policies to streams, subjects, topics, sub_topics for authenticated users
CREATE POLICY "Authenticated users can insert streams" ON public.streams
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert subjects" ON public.subjects
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert topics" ON public.topics
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert sub_topics" ON public.sub_topics
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow public read on profiles for leaderboard (name, xp, streak only via query)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

-- Create resources bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- Storage policies for resources bucket
CREATE POLICY "Public can read resources files" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Admin can upload resources files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete resources files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resources' AND public.has_role(auth.uid(), 'admin'));