
-- Remove anon access from accept_invitation (requires auth anyway)
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid) FROM anon;

-- Remove anon access from preview_invitation (only used in authenticated contexts)
REVOKE EXECUTE ON FUNCTION public.preview_invitation(uuid) FROM anon;
