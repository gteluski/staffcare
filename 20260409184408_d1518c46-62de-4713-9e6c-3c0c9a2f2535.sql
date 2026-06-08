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