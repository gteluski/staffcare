
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro')),
  church_name TEXT,
  district TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();



ALTER TABLE public.profiles DROP COLUMN IF EXISTS gender;
ALTER TABLE public.profiles ADD COLUMN pastoral_title TEXT CHECK (pastoral_title IN ('Pastor', 'Pastora'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, pastoral_title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'pastoral_title', 'Pastor')
  );
  RETURN NEW;
END;
$$;



-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'Outro' CHECK (category IN ('Culto', 'Visita Pastoral', 'Reunião da Igreja', 'Reunião Pessoal', 'Devocional', 'Sala de Oração', 'Compromisso Financeiro', 'Outro')),
  calendar_context TEXT NOT NULL DEFAULT 'principal' CHECK (calendar_context IN ('principal', 'pessoal', 'pregacoes')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_events_user_time ON public.events (user_id, start_time);
CREATE INDEX idx_events_category ON public.events (user_id, category);

-- Timestamp trigger (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Outra' CHECK (category IN ('Pastoral', 'Administrativa', 'Pessoal', 'Estudo', 'Financeira', 'Outra')),
  priority TEXT NOT NULL DEFAULT 'média' CHECK (priority IN ('alta', 'média', 'baixa')),
  status TEXT NOT NULL DEFAULT 'a_fazer' CHECK (status IN ('a_fazer', 'em_andamento', 'concluido')),
  due_date DATE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_tasks_user_status ON public.tasks (user_id, status);

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



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



CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  doc_type TEXT NOT NULL DEFAULT 'Outro' CHECK (doc_type IN ('Sermão', 'Estudo', 'Nota', 'Documento', 'Outro')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_documents_user ON public.documents (user_id, updated_at DESC);

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TABLE public.financial_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('receita', 'despesa')),
  category TEXT NOT NULL DEFAULT 'Outro' CHECK (category IN ('Aluguel', 'Cartão', 'INSS', 'Dízimo', 'Oferta', 'Transporte', 'Alimentação', 'Outro')),
  due_date DATE,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON public.financial_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own entries" ON public.financial_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.financial_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.financial_entries FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_financial_entries_user ON public.financial_entries (user_id, due_date);

CREATE TRIGGER update_financial_entries_updated_at
BEFORE UPDATE ON public.financial_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TABLE public.sermons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  bible_text TEXT,
  main_points TEXT,
  speech_highlights TEXT,
  notes TEXT,
  sermon_date DATE,
  location_type TEXT NOT NULL DEFAULT 'local' CHECK (location_type IN ('local', 'externa')),
  church_name TEXT,
  series_name TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'preparado', 'pregado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sermons" ON public.sermons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sermons" ON public.sermons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sermons" ON public.sermons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sermons" ON public.sermons FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_sermons_user_date ON public.sermons (user_id, sermon_date DESC);

CREATE TRIGGER update_sermons_updated_at
BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



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



-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No public insert/update/delete on roles
-- Roles are assigned only via security definer functions

-- 3. Add must_change_password to profiles
ALTER TABLE public.profiles ADD COLUMN must_change_password boolean NOT NULL DEFAULT true;

-- 4. Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Function to assign default role + admin for specific email
CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Every user gets 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  -- Protected admin assignment for specific email
  IF NEW.email = 'guiteluskibx@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Trigger for role assignment on new user
CREATE TRIGGER on_auth_user_created_assign_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_user_role();

-- 7. Update handle_new_user to set must_change_password
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, pastoral_title, phone, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'pastoral_title', 'Pastor'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
    true
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger for handle_new_user (in case it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();



-- Explicitly deny all write operations on user_roles for authenticated users
-- RLS is already enabled; with no permissive INSERT/UPDATE/DELETE policies, writes are denied by default.
-- Adding explicit restrictive-style "deny" policies for clarity and defense-in-depth:

CREATE POLICY "Deny direct insert on user_roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny direct update on user_roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny direct delete on user_roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (false);

-- Also block anon role explicitly
CREATE POLICY "Deny anon insert on user_roles"
ON public.user_roles FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anon select on user_roles"
ON public.user_roles FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anon update on user_roles"
ON public.user_roles FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny anon delete on user_roles"
ON public.user_roles FOR DELETE
TO anon
USING (false);



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


CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

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


-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create doctrinal chunks table for RAG
CREATE TABLE public.doctrinal_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id TEXT NOT NULL,
  doc_title TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,
  doc_group TEXT NOT NULL DEFAULT 'A',
  category TEXT NOT NULL DEFAULT 'doutrina',
  tradition TEXT NOT NULL DEFAULT 'metodista',
  section TEXT,
  content TEXT NOT NULL,
  embedding vector(768),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  doc_year INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS — deny all access from public/authenticated roles
ALTER TABLE public.doctrinal_chunks ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no access from anon or authenticated roles
-- Only service_role (used by edge functions) can access this table

-- Create indexes for performance
CREATE INDEX idx_doctrinal_chunks_doc_id ON public.doctrinal_chunks(doc_id);
CREATE INDEX idx_doctrinal_chunks_tier ON public.doctrinal_chunks(tier);
CREATE INDEX idx_doctrinal_chunks_tradition ON public.doctrinal_chunks(tradition);
CREATE INDEX idx_doctrinal_chunks_category ON public.doctrinal_chunks(category);
CREATE INDEX idx_doctrinal_chunks_embedding ON public.doctrinal_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- Create similarity search function (security definer — runs as owner)
CREATE OR REPLACE FUNCTION public.match_doctrinal_chunks(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 8,
  filter_tradition TEXT DEFAULT 'metodista',
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  doc_id TEXT,
  doc_title TEXT,
  tier INTEGER,
  section TEXT,
  content TEXT,
  category TEXT,
  tradition TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.doc_id,
    dc.doc_title,
    dc.tier,
    dc.section,
    dc.content,
    dc.category,
    dc.tradition,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.doctrinal_chunks dc
  WHERE 
    1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (filter_tradition IS NULL OR dc.tradition = filter_tradition)
    AND (filter_category IS NULL OR dc.category = filter_category)
  ORDER BY dc.tier ASC, similarity DESC
  LIMIT match_count;
END;
$$;


-- Add tsvector column for Portuguese full-text search
ALTER TABLE public.doctrinal_chunks
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', coalesce(section, '')), 'A') ||
  setweight(to_tsvector('portuguese', content), 'B')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_doctrinal_chunks_fts ON public.doctrinal_chunks USING GIN (fts);

-- Create full-text search function (replaces vector-based match_doctrinal_chunks for now)
CREATE OR REPLACE FUNCTION public.search_doctrinal_chunks(
  search_query text,
  max_results integer DEFAULT 6,
  filter_tradition text DEFAULT 'metodista',
  filter_category text DEFAULT NULL,
  include_comparative boolean DEFAULT false
)
RETURNS TABLE(
  id uuid,
  doc_id text,
  doc_title text,
  tier integer,
  section text,
  content text,
  category text,
  tradition text,
  rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ts_query tsquery;
BEGIN
  -- Build Portuguese tsquery from search input
  ts_query := plainto_tsquery('portuguese', search_query);
  
  -- If query produces empty tsquery, try websearch format
  IF ts_query = ''::tsquery THEN
    ts_query := websearch_to_tsquery('portuguese', search_query);
  END IF;
  
  -- If still empty, return nothing (graceful fallback)
  IF ts_query = ''::tsquery THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.doc_id,
    dc.doc_title,
    dc.tier,
    dc.section,
    dc.content,
    dc.category,
    dc.tradition,
    ts_rank_cd(dc.fts, ts_query) AS rank
  FROM public.doctrinal_chunks dc
  WHERE
    dc.fts @@ ts_query
    AND (filter_tradition IS NULL OR dc.tradition = filter_tradition)
    AND (filter_category IS NULL OR dc.category = filter_category)
    AND (include_comparative = true OR dc.tier < 6)
  ORDER BY dc.tier ASC, ts_rank_cd(dc.fts, ts_query) DESC
  LIMIT max_results;
END;
$$;


-- Ministry history table
CREATE TABLE public.ministry_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  is_current BOOLEAN NOT NULL DEFAULT false,
  church_name TEXT NOT NULL,
  city TEXT NOT NULL,
  ministry_function TEXT NOT NULL,
  notes TEXT DEFAULT '',
  reflections TEXT DEFAULT '',
  plans TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ministry_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ministry_history" ON public.ministry_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ministry_history" ON public.ministry_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ministry_history" ON public.ministry_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ministry_history" ON public.ministry_history FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ministry_history_updated_at BEFORE UPDATE ON public.ministry_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Missionary trips table
CREATE TABLE public.missionary_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  start_date DATE,
  end_date DATE,
  church_community TEXT DEFAULT '',
  description TEXT DEFAULT '',
  results TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.missionary_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missionary_trips" ON public.missionary_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own missionary_trips" ON public.missionary_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missionary_trips" ON public.missionary_trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own missionary_trips" ON public.missionary_trips FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_missionary_trips_updated_at BEFORE UPDATE ON public.missionary_trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Spiritual experiences table
CREATE TABLE public.spiritual_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  experience_date DATE,
  experience_text TEXT DEFAULT '',
  words_from_god TEXT DEFAULT '',
  prayer_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spiritual_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spiritual_experiences" ON public.spiritual_experiences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own spiritual_experiences" ON public.spiritual_experiences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spiritual_experiences" ON public.spiritual_experiences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spiritual_experiences" ON public.spiritual_experiences FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_spiritual_experiences_updated_at BEFORE UPDATE ON public.spiritual_experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TABLE public.ministry_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'semanal',
  week_start DATE,
  month TEXT,
  title TEXT DEFAULT '',
  focus TEXT DEFAULT '',
  commitments TEXT DEFAULT '',
  visits_discipleship TEXT DEFAULT '',
  preaching_studies TEXT DEFAULT '',
  prayer_devotional TEXT DEFAULT '',
  family_rest TEXT DEFAULT '',
  next_steps TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  goals TEXT DEFAULT '',
  priorities TEXT DEFAULT '',
  reflection TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ministry_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ministry_plans" ON public.ministry_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ministry_plans" ON public.ministry_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ministry_plans" ON public.ministry_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ministry_plans" ON public.ministry_plans FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ministry_plans_updated_at BEFORE UPDATE ON public.ministry_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Add avatar_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;

-- Create avatars storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;


-- Invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (token)
);

-- Index for token lookups
CREATE INDEX idx_invitations_token ON public.invitations (token);
CREATE INDEX idx_invitations_email ON public.invitations (email);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can view all invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Secure function to validate invitation token (callable without auth)
CREATE OR REPLACE FUNCTION public.validate_invitation(invitation_token uuid)
RETURNS TABLE(id uuid, email text, name text, status text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.email, i.name, i.status, i.expires_at
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- Function to mark invitation as accepted (called after signup)
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE token = invitation_token AND status = 'pending';
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



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



-- =============================================
-- 1. FIX ministry_history: public → authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view own ministry_history" ON public.ministry_history;
DROP POLICY IF EXISTS "Users can create own ministry_history" ON public.ministry_history;
DROP POLICY IF EXISTS "Users can update own ministry_history" ON public.ministry_history;
DROP POLICY IF EXISTS "Users can delete own ministry_history" ON public.ministry_history;

CREATE POLICY "Users can view own ministry_history" ON public.ministry_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ministry_history" ON public.ministry_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ministry_history" ON public.ministry_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ministry_history" ON public.ministry_history
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 2. FIX ministry_plans: public → authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view own ministry_plans" ON public.ministry_plans;
DROP POLICY IF EXISTS "Users can create own ministry_plans" ON public.ministry_plans;
DROP POLICY IF EXISTS "Users can update own ministry_plans" ON public.ministry_plans;
DROP POLICY IF EXISTS "Users can delete own ministry_plans" ON public.ministry_plans;

CREATE POLICY "Users can view own ministry_plans" ON public.ministry_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ministry_plans" ON public.ministry_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ministry_plans" ON public.ministry_plans
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ministry_plans" ON public.ministry_plans
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 3. FIX missionary_trips: public → authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view own missionary_trips" ON public.missionary_trips;
DROP POLICY IF EXISTS "Users can create own missionary_trips" ON public.missionary_trips;
DROP POLICY IF EXISTS "Users can update own missionary_trips" ON public.missionary_trips;
DROP POLICY IF EXISTS "Users can delete own missionary_trips" ON public.missionary_trips;

CREATE POLICY "Users can view own missionary_trips" ON public.missionary_trips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own missionary_trips" ON public.missionary_trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missionary_trips" ON public.missionary_trips
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own missionary_trips" ON public.missionary_trips
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 4. FIX spiritual_experiences: public → authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view own spiritual_experiences" ON public.spiritual_experiences;
DROP POLICY IF EXISTS "Users can create own spiritual_experiences" ON public.spiritual_experiences;
DROP POLICY IF EXISTS "Users can update own spiritual_experiences" ON public.spiritual_experiences;
DROP POLICY IF EXISTS "Users can delete own spiritual_experiences" ON public.spiritual_experiences;

CREATE POLICY "Users can view own spiritual_experiences" ON public.spiritual_experiences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own spiritual_experiences" ON public.spiritual_experiences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spiritual_experiences" ON public.spiritual_experiences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spiritual_experiences" ON public.spiritual_experiences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 5. FIX storage: replace broad policies with role-specific ones
-- =============================================
DROP POLICY IF EXISTS "Block client uploads to methodist-docs" ON storage.objects;
DROP POLICY IF EXISTS "Block client updates to methodist-docs" ON storage.objects;
DROP POLICY IF EXISTS "Block client deletes from methodist-docs" ON storage.objects;

-- Block anon from ALL writes (anon should never write to any bucket)
CREATE POLICY "Deny anon insert on storage" ON storage.objects
  FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on storage" ON storage.objects
  FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on storage" ON storage.objects
  FOR DELETE TO anon USING (false);

-- Block authenticated users from writing to methodist-docs specifically
CREATE POLICY "Block auth uploads to methodist-docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id != 'methodist-docs');
CREATE POLICY "Block auth updates to methodist-docs" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id != 'methodist-docs');
CREATE POLICY "Block auth deletes from methodist-docs" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id != 'methodist-docs');



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



-- Harden accept_invitation: require auth + email match
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _caller_email text;
  _inv_email text;
BEGIN
  -- Require authenticated caller
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get caller email
  SELECT email INTO _caller_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Get invitation email
  SELECT i.email INTO _inv_email
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending';

  -- Verify match
  IF _inv_email IS NULL THEN
    RAISE EXCEPTION 'Invalid or already used invitation';
  END IF;

  IF lower(_caller_email) <> lower(_inv_email) THEN
    RAISE EXCEPTION 'Email mismatch';
  END IF;

  -- Accept
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE token = invitation_token AND status = 'pending';
END;
$$;



CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, pastoral_title, phone, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'pastoral_title', 'Pastor'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
    true
  );

  -- Auto-accept any pending invitation for this email
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending';

  RETURN NEW;
END;
$$;



-- =============================================
-- ISSUE 1: Restrict profiles UPDATE to safe columns
-- =============================================

-- Drop the existing broad UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create restricted UPDATE policy that only allows safe columns
-- Uses WITH CHECK to ensure privileged fields are not changed
CREATE POLICY "Users can update own profile safe fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Defense-in-depth: BEFORE UPDATE trigger that resets privileged fields
-- for non-service-role callers
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the caller is NOT using the service_role (i.e. is a normal user),
  -- force privileged fields back to their original values
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' != 'service_role' THEN
    NEW.storage_quota_mb := OLD.storage_quota_mb;
    NEW.must_change_password := OLD.must_change_password;
    NEW.onboarding_completed := OLD.onboarding_completed;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- =============================================
-- ISSUE 3: Make avatars bucket private
-- =============================================

-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Add authenticated SELECT policy for own avatar files only
CREATE POLICY "Authenticated users can view own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);



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



-- 1. Secure profile update RPC (only safe fields)
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_pastoral_title text,
  p_church_name text,
  p_district text,
  p_region text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET
    full_name = p_full_name,
    phone = NULLIF(p_phone, ''),
    pastoral_title = p_pastoral_title,
    church_name = NULLIF(p_church_name, ''),
    district = NULLIF(p_district, ''),
    region = NULLIF(p_region, ''),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- 2. Secure avatar path update RPC
CREATE OR REPLACE FUNCTION public.set_my_avatar_path(
  p_avatar_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET
    avatar_url = p_avatar_url,
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- 3. Safe invitation preview (no email exposed)
CREATE OR REPLACE FUNCTION public.preview_invitation(
  invitation_token uuid
)
RETURNS TABLE(name text, expires_at timestamptz, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.name, i.expires_at, i.status
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;



-- Drop the overly-broad UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile safe fields" ON public.profiles;

-- Replace with deny-all: normal users cannot directly UPDATE profiles
-- All user-facing edits go through SECURITY DEFINER RPCs
CREATE POLICY "Deny direct profile updates"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);



-- 1. Drop and recreate validate_invitation with reduced return surface
DROP FUNCTION IF EXISTS public.validate_invitation(uuid);

CREATE FUNCTION public.validate_invitation(invitation_token uuid)
 RETURNS TABLE(email text, name text, status text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT i.email, i.name, i.status, i.expires_at
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- validate_invitation must remain callable by anon (invite page is pre-auth)
-- but revoke from PUBLIC and grant explicitly to anon + authenticated
REVOKE EXECUTE ON FUNCTION public.validate_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(uuid) TO anon, authenticated;

-- 2. Restrict accept_invitation to authenticated only
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;

-- 3. Restrict preview_invitation to authenticated only
REVOKE EXECUTE ON FUNCTION public.preview_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_invitation(uuid) TO authenticated;



-- Remove anon access from accept_invitation (requires auth anyway)
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid) FROM anon;

-- Remove anon access from preview_invitation (only used in authenticated contexts)
REVOKE EXECUTE ON FUNCTION public.preview_invitation(uuid) FROM anon;


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


-- ========================================================
-- 1. Invitation token hashing infrastructure
-- ========================================================

-- 1a. Hash helper function (SECURITY INVOKER, internal use)
CREATE OR REPLACE FUNCTION public.hash_invitation_token(raw_token text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT encode(extensions.digest(raw_token::bytea, 'sha256'), 'hex')
$$;

-- 1b. Add token_hash column
ALTER TABLE public.invitations ADD COLUMN token_hash text;

-- 1c. Migrate existing tokens to hashes
UPDATE public.invitations
SET token_hash = public.hash_invitation_token(token::text)
WHERE token IS NOT NULL AND token_hash IS NULL;

-- 1d. Make token_hash NOT NULL and unique
ALTER TABLE public.invitations ALTER COLUMN token_hash SET NOT NULL;
CREATE UNIQUE INDEX idx_invitations_token_hash ON public.invitations (token_hash);

-- 1e. Drop plaintext token column
ALTER TABLE public.invitations DROP COLUMN token;

-- ========================================================
-- 2. Create invitation RPC (admin-only, returns plaintext token)
-- ========================================================

CREATE OR REPLACE FUNCTION public.create_invitation(p_email text, p_name text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _raw_token uuid;
  _hash text;
BEGIN
  -- Only admins can create invitations
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  _raw_token := gen_random_uuid();
  _hash := public.hash_invitation_token(_raw_token::text);

  INSERT INTO public.invitations (email, name, invited_by, token_hash)
  VALUES (lower(trim(p_email)), nullif(trim(p_name), ''), auth.uid(), _hash);

  -- Return plaintext token for the invite link (never stored)
  RETURN _raw_token::text;
END;
$$;

-- ========================================================
-- 3. Update SECURITY DEFINER functions to use hash lookups
-- ========================================================

-- 3a. Drop old UUID-typed overloads
DROP FUNCTION IF EXISTS public.validate_invitation(uuid);
DROP FUNCTION IF EXISTS public.accept_invitation(uuid);
DROP FUNCTION IF EXISTS public.preview_invitation(uuid);

-- 3b. validate_invitation (text token → hash lookup)
CREATE OR REPLACE FUNCTION public.validate_invitation(invitation_token text)
RETURNS TABLE(email text, name text, status text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hash text;
BEGIN
  _hash := public.hash_invitation_token(invitation_token);
  RETURN QUERY
  SELECT i.email, i.name, i.status, i.expires_at
  FROM public.invitations i
  WHERE i.token_hash = _hash
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- 3c. accept_invitation (text token → hash lookup)
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_email text;
  _inv_email text;
  _hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  _hash := public.hash_invitation_token(invitation_token);

  SELECT email INTO _caller_email
  FROM auth.users
  WHERE id = auth.uid();

  SELECT i.email INTO _inv_email
  FROM public.invitations i
  WHERE i.token_hash = _hash
    AND i.status = 'pending';

  IF _inv_email IS NULL THEN
    RAISE EXCEPTION 'Invalid or already used invitation';
  END IF;

  IF lower(_caller_email) <> lower(_inv_email) THEN
    RAISE EXCEPTION 'Email mismatch';
  END IF;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE token_hash = _hash AND status = 'pending';
END;
$$;

-- 3d. preview_invitation (text token → hash lookup)
CREATE OR REPLACE FUNCTION public.preview_invitation(invitation_token text)
RETURNS TABLE(name text, expires_at timestamptz, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hash text;
BEGIN
  _hash := public.hash_invitation_token(invitation_token);
  RETURN QUERY
  SELECT i.name, i.expires_at, i.status
  FROM public.invitations i
  WHERE i.token_hash = _hash
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- ========================================================
-- 4. Restrict EXECUTE permissions on all security functions
-- ========================================================

-- has_role: only authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- validate_invitation: anon + authenticated (pre-auth invite page)
REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon, authenticated;

-- accept_invitation: authenticated only
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

-- preview_invitation: authenticated only
REVOKE EXECUTE ON FUNCTION public.preview_invitation(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.preview_invitation(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.preview_invitation(text) TO authenticated;

-- create_invitation: authenticated only
REVOKE EXECUTE ON FUNCTION public.create_invitation(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_invitation(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_invitation(text, text) TO authenticated;

-- hash_invitation_token: no external access (used internally by SECURITY DEFINER functions)
REVOKE EXECUTE ON FUNCTION public.hash_invitation_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.hash_invitation_token(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.hash_invitation_token(text) FROM authenticated;

-- Other security functions: restrict
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- match/search doctrinal: authenticated only
REVOKE EXECUTE ON FUNCTION public.match_doctrinal_chunks(extensions.vector, double precision, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_doctrinal_chunks(extensions.vector, double precision, integer, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_doctrinal_chunks(extensions.vector, double precision, integer, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) TO authenticated;

-- ========================================================
-- 5. Fix methodist-docs storage policy (public → anon,authenticated)
-- ========================================================

DROP POLICY IF EXISTS "Public read access for methodist docs" ON storage.objects;
CREATE POLICY "Read access for methodist docs"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'methodist-docs');



-- Revoke direct EXECUTE on trigger functions (they're invoked by the database engine, not clients)
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.assign_user_role() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;


-- 1. Replace has_role to only check caller's own role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

-- Restrict EXECUTE to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 2. Add explicit anon deny on invitations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invitations'
      AND policyname = 'Deny anon all on invitations'
  ) THEN
    CREATE POLICY "Deny anon all on invitations"
      ON public.invitations
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- 1. Fix has_role to use the _user_id parameter correctly
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Keep EXECUTE restricted to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 2. Add anon SELECT deny on avatars and biblioteca storage buckets
DO $$
BEGIN
  -- Avatars: deny anon SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Deny anon select on avatars'
  ) THEN
    CREATE POLICY "Deny anon select on avatars"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id <> 'avatars');
  END IF;

  -- Biblioteca: deny anon SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Deny anon select on biblioteca'
  ) THEN
    CREATE POLICY "Deny anon select on biblioteca"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id <> 'biblioteca');
  END IF;
END $$;

-- Drop the two faulty PERMISSIVE anon SELECT policies that were granting cross-bucket access
DROP POLICY IF EXISTS "Deny anon select on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Deny anon select on biblioteca" ON storage.objects;

-- Revoke validate_invitation from PUBLIC (keep anon grant since invite flow needs it pre-auth)
REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO authenticated;

-- Revoke hash_invitation_token from PUBLIC
REVOKE EXECUTE ON FUNCTION public.hash_invitation_token(text) FROM PUBLIC;
-- hash_invitation_token is only called internally by other SECURITY DEFINER functions
-- No direct grant needed for anon or authenticated

-- Revoke search/match doctrinal functions from PUBLIC for hygiene (already blocked for anon)
REVOKE EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_doctrinal_chunks(text, integer, text, text, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) TO authenticated;


-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  trial_start timestamp with time zone NOT NULL DEFAULT now(),
  trial_end timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  subscription_status text NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  payment_method text DEFAULT NULL
    CHECK (payment_method IS NULL OR payment_method IN ('pix', 'credit_card')),
  paid_until timestamp with time zone DEFAULT NULL,
  activated_at timestamp with time zone DEFAULT NULL,
  pix_payment_status text DEFAULT NULL
    CHECK (pix_payment_status IS NULL OR pix_payment_status IN ('pending', 'confirmed', 'rejected')),
  notes text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Block all direct mutations from normal users
CREATE POLICY "Deny user insert on subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny user update on subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny user delete on subscriptions"
  ON public.subscriptions FOR DELETE
  TO authenticated
  USING (false);

-- Block anon entirely
CREATE POLICY "Deny anon all on subscriptions"
  ON public.subscriptions FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Admin policies for managing subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create subscription with 7-day trial for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, trial_start, trial_end, subscription_status)
  VALUES (NEW.id, now(), now() + interval '7 days', 'trialing')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Edge function to confirm Pix payment (admin-only RPC)
CREATE OR REPLACE FUNCTION public.confirm_pix_payment(p_user_id uuid, p_months integer DEFAULT 1)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.subscriptions
  SET
    subscription_status = 'active',
    payment_method = 'pix',
    pix_payment_status = 'confirmed',
    activated_at = COALESCE(activated_at, now()),
    paid_until = COALESCE(
      CASE WHEN paid_until > now() THEN paid_until ELSE now() END,
      now()
    ) + (p_months || ' months')::interval,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Revoke public execute, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.confirm_pix_payment(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_pix_payment(uuid, integer) TO authenticated;

-- RPC for user to submit pix payment request
CREATE OR REPLACE FUNCTION public.submit_pix_payment()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.subscriptions
  SET
    payment_method = 'pix',
    pix_payment_status = 'pending',
    updated_at = now()
  WHERE user_id = auth.uid()
    AND subscription_status IN ('trialing', 'expired', 'past_due', 'cancelled');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_pix_payment() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_pix_payment() TO authenticated;



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


-- Add Stripe-specific columns to existing subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox';

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id
  ON public.subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON public.subscriptions(stripe_customer_id);


-- Drop legacy Pix RPCs
DROP FUNCTION IF EXISTS public.submit_pix_payment();
DROP FUNCTION IF EXISTS public.confirm_pix_payment(uuid, integer);

-- Drop unused column
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS pix_payment_status;

-- Enable realtime so the client can listen to subscription status changes
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;


CREATE OR REPLACE FUNCTION public.assign_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Every user gets 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  -- Protected admin assignment for specific emails
  IF NEW.email IN ('guiteluskibx@gmail.com', 'lucasgeneroso50@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;


-- Webhook event log for operational monitoring (Stripe + future providers)
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  event_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  -- references for cross-linking (no FK; preserves logs even if user deleted)
  user_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  error_message TEXT,
  payload_summary JSONB DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_received_at ON public.webhook_events (received_at DESC);
CREATE INDEX idx_webhook_events_status ON public.webhook_events (status);
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events (event_type);
CREATE INDEX idx_webhook_events_user_id ON public.webhook_events (user_id);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Deny anon entirely
CREATE POLICY "Deny anon all on webhook_events"
  ON public.webhook_events FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- Admins only: read
CREATE POLICY "Admins can view webhook_events"
  ON public.webhook_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Block direct writes from clients; only service_role (used by edge function) can insert/update
CREATE POLICY "Deny user insert on webhook_events"
  ON public.webhook_events FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny user update on webhook_events"
  ON public.webhook_events FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny user delete on webhook_events"
  ON public.webhook_events FOR DELETE TO authenticated
  USING (false);



-- Webhook event log for operational monitoring (Stripe + future providers)
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  event_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  -- references for cross-linking (no FK; preserves logs even if user deleted)
  user_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  error_message TEXT,
  payload_summary JSONB DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_received_at ON public.webhook_events (received_at DESC);
CREATE INDEX idx_webhook_events_status ON public.webhook_events (status);
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events (event_type);
CREATE INDEX idx_webhook_events_user_id ON public.webhook_events (user_id);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Deny anon entirely
CREATE POLICY "Deny anon all on webhook_events"
  ON public.webhook_events FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- Admins only: read
CREATE POLICY "Admins can view webhook_events"
  ON public.webhook_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Block direct writes from clients; only service_role (used by edge function) can insert/update
CREATE POLICY "Deny user insert on webhook_events"
  ON public.webhook_events FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny user update on webhook_events"
  ON public.webhook_events FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny user delete on webhook_events"
  ON public.webhook_events FOR DELETE TO authenticated
  USING (false);


-- Lightweight audit history for RLS validation runs
CREATE TABLE public.rls_audit_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ran_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executor_user_id UUID,
  executor_email TEXT,
  safe_mode BOOLEAN NOT NULL DEFAULT true,
  total_pass INTEGER NOT NULL DEFAULT 0,
  total_fail INTEGER NOT NULL DEFAULT 0,
  total_warn INTEGER NOT NULL DEFAULT 0,
  total_skipped INTEGER NOT NULL DEFAULT 0,
  total_pending INTEGER NOT NULL DEFAULT 0,
  critical_failures INTEGER NOT NULL DEFAULT 0,
  snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_rls_audit_runs_ran_at ON public.rls_audit_runs (ran_at DESC);

ALTER TABLE public.rls_audit_runs ENABLE ROW LEVEL SECURITY;

-- Block anon entirely
CREATE POLICY "Deny anon all on rls_audit_runs"
  ON public.rls_audit_runs
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Admin-only access
CREATE POLICY "Admins can view rls_audit_runs"
  ON public.rls_audit_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert rls_audit_runs"
  ON public.rls_audit_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND executor_user_id = auth.uid()
  );

CREATE POLICY "Admins can delete rls_audit_runs"
  ON public.rls_audit_runs
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Block updates entirely (audit records are immutable)
CREATE POLICY "Deny update on rls_audit_runs"
  ON public.rls_audit_runs
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.rls_audit_runs ADD COLUMN IF NOT EXISTS notes TEXT;

