
-- Harden accept_invitation: require auth + email match
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _caller_email text;
  _inv_email text;
BEGIN
  -- Require authenticated caller
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get caller email
  SELECT email INTO _caller_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Get invitation email
  SELECT i.email INTO _inv_email
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending';

  -- Verify match
  IF _inv_email IS NULL THEN
    RAISE EXCEPTION 'Invalid or already used invitation';
  END IF;

  IF lower(_caller_email) <> lower(_inv_email) THEN
    RAISE EXCEPTION 'Email mismatch';
  END IF;

  -- Accept
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE token = invitation_token AND status = 'pending';
END;
$$;
