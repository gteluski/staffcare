
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
