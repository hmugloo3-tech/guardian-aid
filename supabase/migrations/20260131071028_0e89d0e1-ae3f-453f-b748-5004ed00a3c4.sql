-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive insert policy - notifications are created via edge functions using service role
-- No direct client inserts allowed
CREATE POLICY "No direct client inserts for notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (false);