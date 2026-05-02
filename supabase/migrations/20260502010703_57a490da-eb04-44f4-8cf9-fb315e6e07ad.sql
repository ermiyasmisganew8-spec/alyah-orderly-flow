-- Add payment_method to company_requests
ALTER TABLE public.company_requests
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('telebirr', 'cbe'));

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Platform admins can view contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can update contact messages"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'platform_admin'::app_role));