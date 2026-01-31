-- Enable realtime for donors and donor_availability tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.donors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donor_availability;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;

-- Add index for faster availability queries
CREATE INDEX idx_donor_availability_expires ON public.donor_availability(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_donors_blood_type_status ON public.donors(blood_type, status) WHERE is_verified = true;
CREATE INDEX idx_emergency_requests_status ON public.emergency_requests(status, blood_type);

-- Function to auto-expire availability status
CREATE OR REPLACE FUNCTION public.check_and_expire_availability()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update donors whose availability has expired
  UPDATE public.donors d
  SET status = 'unavailable', updated_at = now()
  FROM public.donor_availability da
  WHERE d.id = da.donor_id
    AND da.expires_at IS NOT NULL
    AND da.expires_at < now()
    AND d.status != 'unavailable';
END;
$$;

-- Create a notifications table for donor alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'emergency_request', 'verification_update', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- emergency_request_id or donor_id
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;