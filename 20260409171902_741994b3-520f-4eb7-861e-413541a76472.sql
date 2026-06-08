-- Add storage quota column with 5GB default
ALTER TABLE public.profiles
ADD COLUMN storage_quota_mb integer NOT NULL DEFAULT 5120;

-- Function to get a user's total storage usage in bytes
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(file_size), 0)::bigint
  FROM public.library_files
  WHERE user_id = _user_id
$$;