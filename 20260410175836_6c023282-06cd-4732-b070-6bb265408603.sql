
-- Strengthen the profiles privileged fields trigger to REJECT (not silently reset)
-- attempts to modify admin/system fields by non-service-role users.
-- This is the definitive database-level column protection.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- If the caller is NOT using service_role, enforce column-level restrictions
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' != 'service_role' THEN

    -- HARD BLOCK: raise error if user attempts to change privileged fields
    IF NEW.storage_quota_mb IS DISTINCT FROM OLD.storage_quota_mb THEN
      RAISE EXCEPTION 'Cannot modify storage_quota_mb';
    END IF;

    IF NEW.must_change_password IS DISTINCT FROM OLD.must_change_password THEN
      RAISE EXCEPTION 'Cannot modify must_change_password';
    END IF;

    IF NEW.onboarding_completed IS DISTINCT FROM OLD.onboarding_completed THEN
      RAISE EXCEPTION 'Cannot modify onboarding_completed';
    END IF;

    -- Prevent changing the row identity or creation timestamp
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Cannot modify profile id';
    END IF;

    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Cannot modify created_at';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;
