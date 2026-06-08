-- =====================================================================
-- RLS POLICIES FOR STAFFCARE TABLES
-- =====================================================================

-- 1. profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);


-- 2. events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_own" ON public.events
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "events_insert_own" ON public.events
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "events_update_own" ON public.events
  FOR UPDATE USING (auth.uid()::uuid = user_id) WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "events_delete_own" ON public.events
  FOR DELETE USING (auth.uid()::uuid = user_id);


-- 3. tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE USING (auth.uid()::uuid = user_id) WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE USING (auth.uid()::uuid = user_id);


-- 4. documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "documents_update_own" ON public.documents
  FOR UPDATE USING (auth.uid()::uuid = user_id) WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE USING (auth.uid()::uuid = user_id);


-- 5. library_files
ALTER TABLE public.library_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_files_select_own" ON public.library_files
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "library_files_insert_own" ON public.library_files
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "library_files_update_own" ON public.library_files
  FOR UPDATE USING (auth.uid()::uuid = user_id) WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "library_files_delete_own" ON public.library_files
  FOR DELETE USING (auth.uid()::uuid = user_id);


-- 6. notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_select_own" ON public.notes
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "notes_insert_own" ON public.notes
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "notes_update_own" ON public.notes
  FOR UPDATE USING (auth.uid()::uuid = user_id) WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "notes_delete_own" ON public.notes
  FOR DELETE USING (auth.uid()::uuid = user_id);


-- 7. financial_entries
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_entries_select_own" ON public.financial_entries
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "financial_entries_insert_own" ON public.financial_entries
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "financial_entries_update_own" ON public.financial_entries
  FOR UPDATE USING (auth.uid()::uuid = user_id) WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "financial_entries_delete_own" ON public.financial_entries
  FOR DELETE USING (auth.uid()::uuid = user_id);


-- 8. user_roles (Auto-elevação bloqueada, somente leitura dos próprios dados)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- INSERT/UPDATE/DELETE devem ser restritos (gerenciados via triggers de sistema SECURITY DEFINER)
-- Nenhuma política pública de alteração é gerada aqui para bloquear modificação manual por não-admins.


-- 9. webhook_events (Apenas Admins podem ver)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Helper function: assume has_role() exists in the db
CREATE POLICY "webhook_events_admin_select" ON public.webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid()::uuid AND role = 'admin'
    )
  );


-- 10. subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own_or_admin" ON public.subscriptions
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- Bloqueia UPDATE/INSERT manual de não-admins (realizado apenas por webhook/service_role)


-- 11. profile_settings
ALTER TABLE public.profile_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_settings_select_own" ON public.profile_settings
  FOR SELECT USING (auth.uid()::uuid = id);

-- Escrita via edge function ou RPC dedicada


-- 12. doctrinal_chunks (Busca semântica apenas por RPC, bloqueia SELECT geral)
ALTER TABLE public.doctrinal_chunks ENABLE ROW LEVEL SECURITY;

-- Sem políticas de SELECT geradas por padrão (SELECT direto retorna vazio/erro)
