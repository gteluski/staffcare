
-- 1. Drop and recreate validate_invitation with reduced return surface
DROP FUNCTION IF EXISTS public.validate_invitation(uuid);

CREATE FUNCTION public.validate_invitation(invitation_token uuid)
 RETURNS TABLE(email text, name text, status text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT i.email, i.name, i.status, i.expires_at
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- validate_invitation must remain callable by anon (invite page is pre-auth)
-- but revoke from PUBLIC and grant explicitly to anon + authenticated
REVOKE EXECUTE ON FUNCTION public.validate_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(uuid) TO anon, authenticated;

-- 2. Restrict accept_invitation to authenticated only
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;

-- 3. Restrict preview_invitation to authenticated only
REVOKE EXECUTE ON FUNCTION public.preview_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_invitation(uuid) TO authenticated;
