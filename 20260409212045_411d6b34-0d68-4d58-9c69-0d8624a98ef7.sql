
-- =============================================
-- 1. FIX avatars bucket: public → authenticated for writes
-- =============================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- =============================================
-- 2. FIX doctrinal_chunks: explicit deny for client access
-- =============================================
CREATE POLICY "Deny authenticated direct access to doctrinal_chunks" ON public.doctrinal_chunks
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny anon access to doctrinal_chunks" ON public.doctrinal_chunks
  FOR ALL TO anon USING (false) WITH CHECK (false);
