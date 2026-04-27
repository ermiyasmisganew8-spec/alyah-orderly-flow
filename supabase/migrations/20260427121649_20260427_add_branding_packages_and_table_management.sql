/*
  # Add Branding, Packages, and Table Management

  1. New Tables
    - `packages` - subscription tiers with monthly/yearly pricing
    - `branch_tables` - table management for branches with QR codes

  2. Modified Tables
    - `restaurant_companies` - add logo_url and footer_data (JSON)
    - `company_requests` - add package_id, billing_cycle, payment_status

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for data access
*/

-- Add branding columns to restaurant_companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_companies' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE restaurant_companies ADD COLUMN logo_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_companies' AND column_name = 'footer_data'
  ) THEN
    ALTER TABLE restaurant_companies ADD COLUMN footer_data JSONB DEFAULT '{
      "address": "",
      "phone": "",
      "email": "",
      "opening_hours": "Mon-Sun: 9AM-10PM",
      "social_links": {},
      "about_text": "Welcome to our restaurant"
    }'::jsonb;
  END IF;
END $$;

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_price DECIMAL(10,2) NOT NULL,
  yearly_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active packages"
  ON packages FOR SELECT
  USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Platform admins can manage packages"
  ON packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'platform_admin'
    )
  );

-- Create branch_tables table
CREATE TABLE IF NOT EXISTS branch_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES restaurant_branches(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  assigned_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch_id, table_number)
);

ALTER TABLE branch_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branch admins can view their tables"
  ON branch_tables FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (user_roles.role = 'branch_admin' OR user_roles.role = 'company_admin')
    )
  );

CREATE POLICY "Branch admins can manage their tables"
  ON branch_tables FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (user_roles.role = 'branch_admin' OR user_roles.role = 'company_admin')
    )
  );

CREATE POLICY "Branch admins can update their tables"
  ON branch_tables FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (user_roles.role = 'branch_admin' OR user_roles.role = 'company_admin')
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (user_roles.role = 'branch_admin' OR user_roles.role = 'company_admin')
    )
  );

CREATE POLICY "Branch admins can delete their tables"
  ON branch_tables FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (user_roles.role = 'branch_admin' OR user_roles.role = 'company_admin')
    )
  );

-- Add columns to company_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_requests' AND column_name = 'package_id'
  ) THEN
    ALTER TABLE company_requests ADD COLUMN package_id INTEGER REFERENCES packages(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_requests' AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE company_requests ADD COLUMN billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_requests' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE company_requests ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid'));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_branch_tables_branch_id ON branch_tables(branch_id);
CREATE INDEX IF NOT EXISTS idx_packages_display_order ON packages(display_order);
CREATE INDEX IF NOT EXISTS idx_company_requests_status ON company_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_requests_payment_status ON company_requests(payment_status);