
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
