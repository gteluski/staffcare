
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
