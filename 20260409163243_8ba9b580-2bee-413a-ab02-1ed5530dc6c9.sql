
-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('biblioteca', 'biblioteca', false);

-- Storage policies
CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT USING (bucket_id = 'biblioteca' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'biblioteca' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'biblioteca' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'biblioteca' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Folders table
CREATE TABLE public.library_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.library_folders(id) ON DELETE CASCADE,
  icon TEXT NOT NULL DEFAULT 'folder',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.library_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own folders" ON public.library_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON public.library_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.library_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.library_folders FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_library_folders_parent ON public.library_folders (user_id, parent_id);

CREATE TRIGGER update_library_folders_updated_at
BEFORE UPDATE ON public.library_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Files table
CREATE TABLE public.library_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.library_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.library_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own files" ON public.library_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own files" ON public.library_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON public.library_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON public.library_files FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_library_files_folder ON public.library_files (user_id, folder_id);

CREATE TRIGGER update_library_files_updated_at
BEFORE UPDATE ON public.library_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
