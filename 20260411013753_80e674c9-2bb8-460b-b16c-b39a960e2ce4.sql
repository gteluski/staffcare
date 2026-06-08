-- 1. Replace has_role to only check caller's own role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

-- Restrict EXECUTE to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 2. Add explicit anon deny on invitations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invitations'
      AND policyname = 'Deny anon all on invitations'
  ) THEN
    CREATE POLICY "Deny anon all on invitations"
      ON public.invitations
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;