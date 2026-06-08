-- Create a public storage bucket for official Methodist documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('methodist-docs', 'methodist-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public documents)
CREATE POLICY "Public read access for methodist docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'methodist-docs');

-- Only admins can upload/update/delete (via service role or dashboard)
-- No INSERT/UPDATE/DELETE policies = no client-side writes