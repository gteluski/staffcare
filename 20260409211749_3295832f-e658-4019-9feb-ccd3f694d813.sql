
-- Explicitly block all client-side writes to methodist-docs bucket
-- Only service_role (bypasses RLS) can manage files

CREATE POLICY "Block client uploads to methodist-docs"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id != 'methodist-docs');

CREATE POLICY "Block client updates to methodist-docs"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id != 'methodist-docs');

CREATE POLICY "Block client deletes from methodist-docs"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id != 'methodist-docs');
