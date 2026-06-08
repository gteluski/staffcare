
-- Drop the overly-broad UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile safe fields" ON public.profiles;

-- Replace with deny-all: normal users cannot directly UPDATE profiles
-- All user-facing edits go through SECURITY DEFINER RPCs
CREATE POLICY "Deny direct profile updates"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);
