
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
