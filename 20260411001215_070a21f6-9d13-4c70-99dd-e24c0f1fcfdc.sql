-- 1. Create the protected admin/system table
CREATE TABLE public.profile_settings (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_quota_mb integer NOT NULL DEFAULT 5120,
  must_change_password boolean NOT NULL DEFAULT true,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Migrate existing data
INSERT INTO public.profile_settings (id, storage_quota_mb, must_change_password, onboarding_completed, created_at, updated_at)
SELECT id, storage_quota_mb, must_change_password, onboarding_completed, created_at, updated_at
FROM public.profiles;

-- 3. Enable RLS on profile_settings
ALTER TABLE public.profile_settings ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own settings row (needed for auth flow)
CREATE POLICY "Users can view own settings"
  ON public.profile_settings FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- No INSERT/UPDATE/DELETE for authenticated users — all writes via service role
CREATE POLICY "Deny user insert on profile_settings"
  ON public.profile_settings FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny user update on profile_settings"
  ON public.profile_settings FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny user delete on profile_settings"
  ON public.profile_settings FOR DELETE TO authenticated
  USING (false);

-- Block anon entirely
CREATE POLICY "Deny anon all on profile_settings"
  ON public.profile_settings FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- 4. Remove privileged columns from profiles
ALTER TABLE public.profiles DROP COLUMN storage_quota_mb;
ALTER TABLE public.profiles DROP COLUMN must_change_password;
ALTER TABLE public.profiles DROP COLUMN onboarding_completed;

-- 5. Drop the deny-all UPDATE policy and the old trigger
DROP POLICY IF EXISTS "Deny direct profile updates" ON public.profiles;
DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_privileged_fields();

-- 6. Add normal owner-scoped UPDATE policy (safe — only personal fields remain)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7. Update handle_new_user to also create profile_settings row
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, pastoral_title, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'pastoral_title', 'Pastor'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL)
  );

  INSERT INTO public.profile_settings (id, must_change_password)
  VALUES (NEW.id, true);

  -- Auto-accept any pending invitation for this email
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending';

  RETURN NEW;
END;
$$;

-- 8. Add updated_at trigger for profile_settings
CREATE TRIGGER update_profile_settings_updated_at
  BEFORE UPDATE ON public.profile_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Update the edge function's target: update-profile-flags already uses service_role
-- so it will work against profile_settings. But we need to update the update_my_profile
-- RPC to do direct UPDATE instead of SECURITY DEFINER (since profiles is now safe)

-- Drop old RPCs that are no longer needed for profiles
DROP FUNCTION IF EXISTS public.update_my_profile(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.set_my_avatar_path(text);