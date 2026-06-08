
-- Invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (token)
);

-- Index for token lookups
CREATE INDEX idx_invitations_token ON public.invitations (token);
CREATE INDEX idx_invitations_email ON public.invitations (email);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can view all invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Secure function to validate invitation token (callable without auth)
CREATE OR REPLACE FUNCTION public.validate_invitation(invitation_token uuid)
RETURNS TABLE(id uuid, email text, name text, status text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.email, i.name, i.status, i.expires_at
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- Function to mark invitation as accepted (called after signup)
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE token = invitation_token AND status = 'pending';
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
