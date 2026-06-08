
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
