
-- ============ documents ============
DROP POLICY "Users can view own documents" ON public.documents;
DROP POLICY "Users can create own documents" ON public.documents;
DROP POLICY "Users can update own documents" ON public.documents;
DROP POLICY "Users can delete own documents" ON public.documents;

CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ events ============
DROP POLICY "Users can view own events" ON public.events;
DROP POLICY "Users can create own events" ON public.events;
DROP POLICY "Users can update own events" ON public.events;
DROP POLICY "Users can delete own events" ON public.events;

CREATE POLICY "Users can view own events" ON public.events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ financial_entries ============
DROP POLICY "Users can view own entries" ON public.financial_entries;
DROP POLICY "Users can create own entries" ON public.financial_entries;
DROP POLICY "Users can update own entries" ON public.financial_entries;
DROP POLICY "Users can delete own entries" ON public.financial_entries;

CREATE POLICY "Users can view own entries" ON public.financial_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own entries" ON public.financial_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.financial_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.financial_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ library_files ============
DROP POLICY "Users can view own files" ON public.library_files;
DROP POLICY "Users can create own files" ON public.library_files;
DROP POLICY "Users can update own files" ON public.library_files;
DROP POLICY "Users can delete own files" ON public.library_files;

CREATE POLICY "Users can view own files" ON public.library_files FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own files" ON public.library_files FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON public.library_files FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON public.library_files FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ library_folders ============
DROP POLICY "Users can view own folders" ON public.library_folders;
DROP POLICY "Users can create own folders" ON public.library_folders;
DROP POLICY "Users can update own folders" ON public.library_folders;
DROP POLICY "Users can delete own folders" ON public.library_folders;

CREATE POLICY "Users can view own folders" ON public.library_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON public.library_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.library_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.library_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ notes ============
DROP POLICY "Users can view own notes" ON public.notes;
DROP POLICY "Users can create own notes" ON public.notes;
DROP POLICY "Users can update own notes" ON public.notes;
DROP POLICY "Users can delete own notes" ON public.notes;

CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ sermons ============
DROP POLICY "Users can view own sermons" ON public.sermons;
DROP POLICY "Users can create own sermons" ON public.sermons;
DROP POLICY "Users can update own sermons" ON public.sermons;
DROP POLICY "Users can delete own sermons" ON public.sermons;

CREATE POLICY "Users can view own sermons" ON public.sermons FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sermons" ON public.sermons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sermons" ON public.sermons FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sermons" ON public.sermons FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ tasks ============
DROP POLICY "Users can view own tasks" ON public.tasks;
DROP POLICY "Users can create own tasks" ON public.tasks;
DROP POLICY "Users can update own tasks" ON public.tasks;
DROP POLICY "Users can delete own tasks" ON public.tasks;

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ storage: biblioteca bucket ============
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'biblioteca' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'biblioteca' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'biblioteca' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'biblioteca' AND (auth.uid())::text = (storage.foldername(name))[1]);
