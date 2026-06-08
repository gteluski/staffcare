
-- 1. Secure profile update RPC (only safe fields)
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_pastoral_title text,
  p_church_name text,
  p_district text,
  p_region text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET
    full_name = p_full_name,
    phone = NULLIF(p_phone, ''),
    pastoral_title = p_pastoral_title,
    church_name = NULLIF(p_church_name, ''),
    district = NULLIF(p_district, ''),
    region = NULLIF(p_region, ''),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- 2. Secure avatar path update RPC
CREATE OR REPLACE FUNCTION public.set_my_avatar_path(
  p_avatar_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET
    avatar_url = p_avatar_url,
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- 3. Safe invitation preview (no email exposed)
CREATE OR REPLACE FUNCTION public.preview_invitation(
  invitation_token uuid
)
RETURNS TABLE(name text, expires_at timestamptz, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.name, i.expires_at, i.status
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;
