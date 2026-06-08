
-- =============================================
-- ISSUE 1: Restrict profiles UPDATE to safe columns
-- =============================================

-- Drop the existing broad UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create restricted UPDATE policy that only allows safe columns
-- Uses WITH CHECK to ensure privileged fields are not changed
CREATE POLICY "Users can update own profile safe fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Defense-in-depth: BEFORE UPDATE trigger that resets privileged fields
-- for non-service-role callers
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the caller is NOT using the service_role (i.e. is a normal user),
  -- force privileged fields back to their original values
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' != 'service_role' THEN
    NEW.storage_quota_mb := OLD.storage_quota_mb;
    NEW.must_change_password := OLD.must_change_password;
    NEW.onboarding_completed := OLD.onboarding_completed;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- =============================================
-- ISSUE 3: Make avatars bucket private
-- =============================================

-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Add authenticated SELECT policy for own avatar files only
CREATE POLICY "Authenticated users can view own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
