-- Create enum for blood types
CREATE TYPE public.blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Create enum for availability status
CREATE TYPE public.availability_status AS ENUM ('available', 'available_later', 'unavailable');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('donor', 'volunteer', 'admin');

-- Create enum for location levels
CREATE TYPE public.location_level AS ENUM ('village', 'tehsil', 'district');

-- Create enum for emergency urgency
CREATE TYPE public.emergency_urgency AS ENUM ('critical', 'urgent', 'standard');

-- Create enum for emergency status
CREATE TYPE public.emergency_status AS ENUM ('pending', 'active', 'fulfilled', 'cancelled');

-- Locations table (hierarchical: district > tehsil > village)
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level location_level NOT NULL,
  parent_id UUID REFERENCES public.locations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  location_id UUID REFERENCES public.locations(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Donors table
CREATE TABLE public.donors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  blood_type blood_type NOT NULL,
  status availability_status NOT NULL DEFAULT 'available',
  last_donation_date DATE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_notes TEXT,
  total_donations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Donor availability tracking with expiry
CREATE TABLE public.donor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
  status availability_status NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Emergency requests table
CREATE TABLE public.emergency_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  blood_type blood_type NOT NULL,
  units_needed INTEGER NOT NULL DEFAULT 1,
  location_id UUID REFERENCES public.locations(id),
  hospital_name TEXT,
  contact_phone TEXT NOT NULL,
  urgency emergency_urgency NOT NULL DEFAULT 'urgent',
  status emergency_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get profile_id for current user
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Locations policies (publicly readable)
CREATE POLICY "Locations are publicly readable"
  ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage locations"
  ON public.locations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and volunteers can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Donors policies
CREATE POLICY "Users can view their own donor record"
  ON public.donors FOR SELECT
  USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Admins and volunteers can view all donors"
  ON public.donors FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Verified donors are publicly visible"
  ON public.donors FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Users can create their own donor record"
  ON public.donors FOR INSERT
  WITH CHECK (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can update their own donor record"
  ON public.donors FOR UPDATE
  USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Admins can update any donor record"
  ON public.donors FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Donor availability policies
CREATE POLICY "Users can view their own availability"
  ON public.donor_availability FOR SELECT
  USING (donor_id IN (SELECT id FROM public.donors WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Admins can view all availability"
  ON public.donor_availability FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own availability"
  ON public.donor_availability FOR ALL
  USING (donor_id IN (SELECT id FROM public.donors WHERE profile_id = public.get_current_profile_id()));

-- User roles policies (only admins can manage)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Emergency requests policies
CREATE POLICY "Emergency requests are publicly visible"
  ON public.emergency_requests FOR SELECT
  USING (status IN ('pending', 'active'));

CREATE POLICY "Authenticated users can create requests"
  ON public.emergency_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Requesters can update their own requests"
  ON public.emergency_requests FOR UPDATE
  USING (requester_id = public.get_current_profile_id());

CREATE POLICY "Admins can manage all requests"
  ON public.emergency_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donors_updated_at
  BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_requests_updated_at
  BEFORE UPDATE ON public.emergency_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Kashmir locations
INSERT INTO public.locations (id, name, level, parent_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Srinagar', 'district', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Anantnag', 'district', NULL),
  ('33333333-3333-3333-3333-333333333333', 'Baramulla', 'district', NULL),
  ('44444444-4444-4444-4444-444444444444', 'Budgam', 'district', NULL),
  ('55555555-5555-5555-5555-555555555555', 'Pulwama', 'district', NULL);

-- Srinagar tehsils
INSERT INTO public.locations (name, level, parent_id) VALUES
  ('Hazratbal', 'tehsil', '11111111-1111-1111-1111-111111111111'),
  ('Soura', 'tehsil', '11111111-1111-1111-1111-111111111111'),
  ('Lal Chowk', 'tehsil', '11111111-1111-1111-1111-111111111111'),
  ('Bemina', 'tehsil', '11111111-1111-1111-1111-111111111111'),
  ('Rainawari', 'tehsil', '11111111-1111-1111-1111-111111111111');