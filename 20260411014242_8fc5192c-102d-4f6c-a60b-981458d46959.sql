-- Drop the two faulty PERMISSIVE anon SELECT policies that were granting cross-bucket access
DROP POLICY IF EXISTS "Deny anon select on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Deny anon select on biblioteca" ON storage.objects;

-- Revoke validate_invitation from PUBLIC (keep anon grant since invite flow needs it pre-auth)
REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO authenticated;

-- Revoke hash_invitation_token from PUBLIC
REVOKE EXECUTE ON FUNCTION public.hash_invitation_token(text) FROM PUBLIC;
-- hash_invitation_token is only called internally by other SECURITY DEFINER functions
-- No direct grant needed for anon or authenticated

-- Revoke search/match doctrinal functions from PUBLIC for hygiene (already blocked for anon)
REVOKE EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) TO authenticated;