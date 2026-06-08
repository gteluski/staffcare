
-- 1. Drop all invitation-related functions
DROP FUNCTION IF EXISTS public.validate_invitation(text);
DROP FUNCTION IF EXISTS public.accept_invitation(text);
DROP FUNCTION IF EXISTS public.preview_invitation(text);
DROP FUNCTION IF EXISTS public.create_invitation(text, text);
DROP FUNCTION IF EXISTS public.hash_invitation_token(text);

-- 2. Drop the invitations table (cascades RLS policies)
DROP TABLE IF EXISTS public.invitations CASCADE;

-- 3. Update handle_new_user to remove invitation auto-accept block
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

  RETURN NEW;
END;
$$;
