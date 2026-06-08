
ALTER TABLE public.profiles ADD COLUMN phone text;

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
  RETURN NEW;
END;
$$;
