ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tip_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS staff_id uuid;