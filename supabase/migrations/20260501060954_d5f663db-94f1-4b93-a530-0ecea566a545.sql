
-- 1. branch_tables
CREATE TABLE IF NOT EXISTS public.branch_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.restaurant_branches(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  assigned_staff_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, table_number)
);

ALTER TABLE public.branch_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tables are publicly readable"
  ON public.branch_tables FOR SELECT USING (true);

CREATE POLICY "Branch admins manage tables"
  ON public.branch_tables FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'branch_admin'::app_role) AND branch_id = get_user_branch_id(auth.uid()));

CREATE POLICY "Company admins manage tables in company"
  ON public.branch_tables FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'company_admin'::app_role));

CREATE TRIGGER update_branch_tables_updated_at
  BEFORE UPDATE ON public.branch_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. packages
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  yearly_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages are publicly readable"
  ON public.packages FOR SELECT USING (true);

CREATE POLICY "Platform admins manage packages"
  ON public.packages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default 3 packages
INSERT INTO public.packages (name, features, monthly_price, yearly_price, display_order) VALUES
  ('Basic', '["1 branch","Up to 100 orders/month","Basic analytics","Email support"]'::jsonb, 500, 5000, 1),
  ('Standard', '["Up to 5 branches","Unlimited orders","Advanced analytics","Promotions engine","Priority support"]'::jsonb, 1500, 15000, 2),
  ('Premium', '["Unlimited branches","Dedicated account manager","Custom branding","API access","Phone support"]'::jsonb, 3000, 30000, 3);

-- 3. restaurant_companies branding fields
ALTER TABLE public.restaurant_companies
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS footer_data JSONB DEFAULT '{}'::jsonb;

-- 4. company_requests new fields
ALTER TABLE public.company_requests
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

-- 5. Storage bucket for company assets (logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Company assets are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated can upload company assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Authenticated can update company assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated can delete company assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets');
