-- Add staff_position column to user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS staff_position text DEFAULT 'waiter';

-- Add tip_amount and staff_id to feedback
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS tip_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS staff_id uuid;

-- Add staff_id to orders (links order to a waiter — references auth user id)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS staff_id uuid;

-- Helper: get current user's staff_position
CREATE OR REPLACE FUNCTION public.get_user_staff_position(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT staff_position FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;
