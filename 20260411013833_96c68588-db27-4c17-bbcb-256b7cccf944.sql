-- 1. Fix has_role to use the _user_id parameter correctly
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Keep EXECUTE restricted to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 2. Add anon SELECT deny on avatars and biblioteca storage buckets
DO $$
BEGIN
  -- Avatars: deny anon SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Deny anon select on avatars'
  ) THEN
    CREATE POLICY "Deny anon select on avatars"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id <> 'avatars');
  END IF;

  -- Biblioteca: deny anon SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Deny anon select on biblioteca'
  ) THEN
    CREATE POLICY "Deny anon select on biblioteca"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id <> 'biblioteca');
  END IF;
END $$;