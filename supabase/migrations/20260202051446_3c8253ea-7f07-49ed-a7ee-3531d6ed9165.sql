-- Add GPS coordinates to profiles for hybrid location matching
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add phone verification status
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Add donation cooldown tracking to donors
ALTER TABLE public.donors
ADD COLUMN IF NOT EXISTS next_eligible_date DATE,
ADD COLUMN IF NOT EXISTS donation_locked_until DATE;

-- Create phone OTP verification table
CREATE TABLE public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on phone_verifications
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own verifications
CREATE POLICY "Users can manage their own phone verifications"
ON public.phone_verifications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create report types enum
CREATE TYPE public.report_type AS ENUM ('spam', 'fake_profile', 'harassment', 'inappropriate', 'other');

-- Create report status enum  
CREATE TYPE public.report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Create reports table for reporting abusive users
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  reported_emergency_id UUID REFERENCES public.emergency_requests(id) ON DELETE SET NULL,
  report_type report_type NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Authenticated users can create reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
USING (reporter_id = auth.uid());

-- Admins can manage all reports
CREATE POLICY "Admins can manage all reports"
ON public.reports
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create blocked users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can manage their own blocks
CREATE POLICY "Users can manage their own blocks"
ON public.blocked_users
FOR ALL
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);

-- Admins can view all blocks
CREATE POLICY "Admins can view all blocks"
ON public.blocked_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add GPS coordinates to emergency requests for location matching
ALTER TABLE public.emergency_requests
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R DECIMAL := 6371; -- Earth's radius in km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$;

-- Create function to find nearby donors
CREATE OR REPLACE FUNCTION public.find_nearby_donors(
  req_blood_type blood_type,
  req_lat DECIMAL,
  req_lon DECIMAL,
  req_location_id UUID,
  max_distance_km DECIMAL DEFAULT 10
)
RETURNS TABLE(
  donor_id UUID,
  profile_id UUID,
  full_name TEXT,
  phone TEXT,
  blood_type blood_type,
  status availability_status,
  distance_km DECIMAL,
  is_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as donor_id,
    d.profile_id,
    p.full_name,
    p.phone,
    d.blood_type,
    d.status,
    calculate_distance_km(req_lat, req_lon, p.latitude, p.longitude) as distance_km,
    d.is_verified
  FROM donors d
  JOIN profiles p ON d.profile_id = p.id
  WHERE d.blood_type = req_blood_type
    AND d.status = 'available'
    AND d.is_verified = true
    AND (d.donation_locked_until IS NULL OR d.donation_locked_until <= CURRENT_DATE)
    AND p.id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = auth.uid()
    )
    AND (
      -- GPS-based matching if coordinates available
      (p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND req_lat IS NOT NULL AND req_lon IS NOT NULL
       AND calculate_distance_km(req_lat, req_lon, p.latitude, p.longitude) <= max_distance_km)
      OR
      -- Fallback to location hierarchy matching
      (p.location_id = req_location_id)
      OR
      -- Match parent location (tehsil/district level)
      (p.location_id IN (
        SELECT id FROM locations WHERE parent_id = (
          SELECT parent_id FROM locations WHERE id = req_location_id
        )
      ))
    )
  ORDER BY 
    CASE WHEN p.latitude IS NOT NULL THEN calculate_distance_km(req_lat, req_lon, p.latitude, p.longitude) ELSE 999 END,
    d.is_verified DESC;
END;
$$;

-- Function to lock donor after donation (90-day cooldown)
CREATE OR REPLACE FUNCTION public.record_donation(
  p_donor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE donors
  SET 
    last_donation_date = CURRENT_DATE,
    next_eligible_date = CURRENT_DATE + INTERVAL '90 days',
    donation_locked_until = CURRENT_DATE + INTERVAL '90 days',
    total_donations = total_donations + 1,
    status = 'unavailable',
    updated_at = now()
  WHERE id = p_donor_id;
END;
$$;

-- Create trigger to auto-expire emergency requests
CREATE OR REPLACE FUNCTION public.auto_expire_emergency_requests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set default expiry to 12 hours for critical, 24 hours for others
  IF NEW.expires_at IS NULL THEN
    IF NEW.urgency = 'critical' THEN
      NEW.expires_at := NEW.created_at + INTERVAL '6 hours';
    ELSIF NEW.urgency = 'urgent' THEN
      NEW.expires_at := NEW.created_at + INTERVAL '12 hours';
    ELSE
      NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_emergency_expiry
BEFORE INSERT ON public.emergency_requests
FOR EACH ROW
EXECUTE FUNCTION public.auto_expire_emergency_requests();

-- Add trigger for reports updated_at
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();