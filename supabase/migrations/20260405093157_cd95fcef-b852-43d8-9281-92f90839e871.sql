
CREATE TABLE public.company_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  branch_count TEXT NOT NULL DEFAULT '1',
  preferred_plan TEXT NOT NULL DEFAULT 'basic',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a request"
ON public.company_requests
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Platform admins can view requests"
ON public.company_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can update requests"
ON public.company_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE TRIGGER update_company_requests_updated_at
BEFORE UPDATE ON public.company_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
