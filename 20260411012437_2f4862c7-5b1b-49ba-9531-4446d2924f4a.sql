
-- Revoke direct EXECUTE on trigger functions (they're invoked by the database engine, not clients)
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
