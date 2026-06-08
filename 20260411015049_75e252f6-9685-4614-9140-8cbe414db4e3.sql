
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
