
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('customer', 'staff', 'branch_admin', 'company_admin', 'platform_admin');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'served', 'paid', 'cancelled');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create discount type enum
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed', 'bogo');

-- Create company status enum
CREATE TYPE public.entity_status AS ENUM ('active', 'suspended', 'inactive');

-- ============ TABLES ============

-- Restaurant Companies
CREATE TABLE public.restaurant_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  address TEXT,
  status public.entity_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Restaurant Branches
CREATE TABLE public.restaurant_branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.restaurant_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  table_count INTEGER NOT NULL DEFAULT 10,
  status public.entity_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles (separate table per security best practices)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  company_id UUID REFERENCES public.restaurant_companies(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.restaurant_branches(id) ON DELETE SET NULL,
  UNIQUE (user_id, role)
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.restaurant_branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Menu Items
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.restaurant_branches(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  prep_time_minutes INTEGER DEFAULT 15,
  modifiers JSONB DEFAULT '[]'::jsonb,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.restaurant_branches(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  modifiers JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  status public.payment_status NOT NULL DEFAULT 'pending',
  transaction_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promotions
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.restaurant_branches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity Logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  role TEXT,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  company_id UUID REFERENCES public.restaurant_companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ INDEXES ============

CREATE INDEX idx_branches_company ON public.restaurant_branches(company_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_branch ON public.user_roles(branch_id);
CREATE INDEX idx_categories_branch ON public.categories(branch_id);
CREATE INDEX idx_menu_items_branch ON public.menu_items(branch_id);
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX idx_orders_branch ON public.orders(branch_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_promotions_branch ON public.promotions(branch_id);
CREATE INDEX idx_feedback_order ON public.feedback(order_id);
CREATE INDEX idx_activity_logs_company ON public.activity_logs(company_id);

-- ============ UPDATED_AT TRIGGER ============

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.restaurant_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.restaurant_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SECURITY DEFINER FUNCTIONS ============

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT branch_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ============ RLS ============

ALTER TABLE public.restaurant_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Companies: public read, platform admin write
CREATE POLICY "Companies are publicly readable" ON public.restaurant_companies FOR SELECT USING (true);
CREATE POLICY "Platform admins manage companies" ON public.restaurant_companies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'platform_admin'));

-- Branches: public read
CREATE POLICY "Branches are publicly readable" ON public.restaurant_branches FOR SELECT USING (true);
CREATE POLICY "Company admins manage their branches" ON public.restaurant_branches FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Platform admins manage all branches" ON public.restaurant_branches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'platform_admin'));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Platform admins manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Company admins manage roles in company" ON public.user_roles FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Branch admins manage staff roles" ON public.user_roles FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'branch_admin') AND branch_id = public.get_user_branch_id(auth.uid())
);

-- Profiles
CREATE POLICY "Profiles are viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Auto-insert on signup" ON public.profiles FOR INSERT WITH CHECK (true);

-- Categories: public read
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Branch admins manage categories" ON public.categories FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'branch_admin') AND branch_id = public.get_user_branch_id(auth.uid())
);

-- Menu Items: public read
CREATE POLICY "Menu items are publicly readable" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Branch admins manage menu items" ON public.menu_items FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'branch_admin') AND branch_id = public.get_user_branch_id(auth.uid())
);

-- Orders: customers can create, staff/admins can manage
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view their orders" ON public.orders FOR SELECT USING (
  customer_id = auth.uid() OR
  (public.has_role(auth.uid(), 'staff') AND branch_id = public.get_user_branch_id(auth.uid())) OR
  (public.has_role(auth.uid(), 'branch_admin') AND branch_id = public.get_user_branch_id(auth.uid())) OR
  public.has_role(auth.uid(), 'company_admin') OR
  public.has_role(auth.uid(), 'platform_admin')
);
CREATE POLICY "Anonymous can view orders by id" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Staff can update order status" ON public.orders FOR UPDATE TO authenticated USING (
  (public.has_role(auth.uid(), 'staff') AND branch_id = public.get_user_branch_id(auth.uid())) OR
  (public.has_role(auth.uid(), 'branch_admin') AND branch_id = public.get_user_branch_id(auth.uid()))
);

-- Order Items
CREATE POLICY "Order items are readable with order" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Payments
CREATE POLICY "Payments are readable" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Anyone can create payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'branch_admin') OR public.has_role(auth.uid(), 'platform_admin')
);

-- Promotions: public read
CREATE POLICY "Active promotions are publicly readable" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Branch admins manage promotions" ON public.promotions FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'branch_admin') AND branch_id = public.get_user_branch_id(auth.uid())
);

-- Feedback
CREATE POLICY "Feedback is publicly readable" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Branch admins can update feedback" ON public.feedback FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'branch_admin')
);

-- Activity Logs
CREATE POLICY "Admins can view logs" ON public.activity_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'platform_admin') OR
  (public.has_role(auth.uid(), 'company_admin') AND company_id = public.get_user_company_id(auth.uid()))
);
CREATE POLICY "System can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
