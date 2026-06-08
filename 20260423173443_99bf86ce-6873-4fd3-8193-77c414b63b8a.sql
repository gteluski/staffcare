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