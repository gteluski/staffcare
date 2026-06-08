
-- Explicitly deny all write operations on user_roles for authenticated users
-- RLS is already enabled; with no permissive INSERT/UPDATE/DELETE policies, writes are denied by default.
-- Adding explicit restrictive-style "deny" policies for clarity and defense-in-depth:

CREATE POLICY "Deny direct insert on user_roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny direct update on user_roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny direct delete on user_roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (false);

-- Also block anon role explicitly
CREATE POLICY "Deny anon insert on user_roles"
ON public.user_roles FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anon select on user_roles"
ON public.user_roles FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anon update on user_roles"
ON public.user_roles FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny anon delete on user_roles"
ON public.user_roles FOR DELETE
TO anon
USING (false);
