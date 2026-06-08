
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
