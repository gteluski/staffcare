
-- ========================================================
-- 1. Invitation token hashing infrastructure
-- ========================================================

-- 1a. Hash helper function (SECURITY INVOKER, internal use)
CREATE OR REPLACE FUNCTION public.hash_invitation_token(raw_token text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT encode(extensions.digest(raw_token::bytea, 'sha256'), 'hex')
$$;

-- 1b. Add token_hash column
ALTER TABLE public.invitations ADD COLUMN token_hash text;

-- 1c. Migrate existing tokens to hashes
UPDATE public.invitations
SET token_hash = public.hash_invitation_token(token::text)
WHERE token IS NOT NULL AND token_hash IS NULL;

-- 1d. Make token_hash NOT NULL and unique
ALTER TABLE public.invitations ALTER COLUMN token_hash SET NOT NULL;
CREATE UNIQUE INDEX idx_invitations_token_hash ON public.invitations (token_hash);

-- 1e. Drop plaintext token column
ALTER TABLE public.invitations DROP COLUMN token;

-- ========================================================
-- 2. Create invitation RPC (admin-only, returns plaintext token)
-- ========================================================

CREATE OR REPLACE FUNCTION public.create_invitation(p_email text, p_name text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _raw_token uuid;
  _hash text;
BEGIN
  -- Only admins can create invitations
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  _raw_token := gen_random_uuid();
  _hash := public.hash_invitation_token(_raw_token::text);

  INSERT INTO public.invitations (email, name, invited_by, token_hash)
  VALUES (lower(trim(p_email)), nullif(trim(p_name), ''), auth.uid(), _hash);

  -- Return plaintext token for the invite link (never stored)
  RETURN _raw_token::text;
END;
$$;

-- ========================================================
-- 3. Update SECURITY DEFINER functions to use hash lookups
-- ========================================================

-- 3a. Drop old UUID-typed overloads
DROP FUNCTION IF EXISTS public.validate_invitation(uuid);
DROP FUNCTION IF EXISTS public.accept_invitation(uuid);
DROP FUNCTION IF EXISTS public.preview_invitation(uuid);

-- 3b. validate_invitation (text token → hash lookup)
CREATE OR REPLACE FUNCTION public.validate_invitation(invitation_token text)
RETURNS TABLE(email text, name text, status text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hash text;
BEGIN
  _hash := public.hash_invitation_token(invitation_token);
  RETURN QUERY
  SELECT i.email, i.name, i.status, i.expires_at
  FROM public.invitations i
  WHERE i.token_hash = _hash
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- 3c. accept_invitation (text token → hash lookup)
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_email text;
  _inv_email text;
  _hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  _hash := public.hash_invitation_token(invitation_token);

  SELECT email INTO _caller_email
  FROM auth.users
  WHERE id = auth.uid();

  SELECT i.email INTO _inv_email
  FROM public.invitations i
  WHERE i.token_hash = _hash
    AND i.status = 'pending';

  IF _inv_email IS NULL THEN
    RAISE EXCEPTION 'Invalid or already used invitation';
  END IF;

  IF lower(_caller_email) <> lower(_inv_email) THEN
    RAISE EXCEPTION 'Email mismatch';
  END IF;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE token_hash = _hash AND status = 'pending';
END;
$$;

-- 3d. preview_invitation (text token → hash lookup)
CREATE OR REPLACE FUNCTION public.preview_invitation(invitation_token text)
RETURNS TABLE(name text, expires_at timestamptz, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hash text;
BEGIN
  _hash := public.hash_invitation_token(invitation_token);
  RETURN QUERY
  SELECT i.name, i.expires_at, i.status
  FROM public.invitations i
  WHERE i.token_hash = _hash
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- ========================================================
-- 4. Restrict EXECUTE permissions on all security functions
-- ========================================================

-- has_role: only authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- validate_invitation: anon + authenticated (pre-auth invite page)
REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon, authenticated;

-- accept_invitation: authenticated only
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

-- preview_invitation: authenticated only
REVOKE EXECUTE ON FUNCTION public.preview_invitation(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.preview_invitation(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.preview_invitation(text) TO authenticated;

-- create_invitation: authenticated only
REVOKE EXECUTE ON FUNCTION public.create_invitation(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_invitation(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_invitation(text, text) TO authenticated;

-- hash_invitation_token: no external access (used internally by SECURITY DEFINER functions)
REVOKE EXECUTE ON FUNCTION public.hash_invitation_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.hash_invitation_token(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.hash_invitation_token(text) FROM authenticated;

-- Other security functions: restrict
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- match/search doctrinal: authenticated only
REVOKE EXECUTE ON FUNCTION public.match_doctrinal_chunks(extensions.vector, double precision, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_doctrinal_chunks(extensions.vector, double precision, integer, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_doctrinal_chunks(extensions.vector, double precision, integer, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) TO authenticated;

-- ========================================================
-- 5. Fix methodist-docs storage policy (public → anon,authenticated)
-- ========================================================

DROP POLICY IF EXISTS "Public read access for methodist docs" ON storage.objects;
CREATE POLICY "Read access for methodist docs"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'methodist-docs');
