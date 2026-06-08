-- Drop legacy Pix RPCs
DROP FUNCTION IF EXISTS public.submit_pix_payment();
DROP FUNCTION IF EXISTS public.confirm_pix_payment(uuid, integer);

-- Drop unused column
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS pix_payment_status;

-- Enable realtime so the client can listen to subscription status changes
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
