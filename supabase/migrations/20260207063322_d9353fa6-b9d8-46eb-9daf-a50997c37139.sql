
-- Drop the existing restrictive INSERT policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can create requests" ON public.emergency_requests;

-- Create a new permissive INSERT policy allowing anyone to create emergency requests
-- This is critical for an SOS system - requiring login during emergencies is a barrier
CREATE POLICY "Anyone can create emergency requests"
ON public.emergency_requests
FOR INSERT
WITH CHECK (true);
