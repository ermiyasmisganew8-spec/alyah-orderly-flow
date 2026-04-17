-- 1. Add menu_item_id to feedback table
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL;

-- 2. Add about_content + opening_hours + phone + location to restaurant_companies
ALTER TABLE public.restaurant_companies
  ADD COLUMN IF NOT EXISTS about_story text DEFAULT 'Welcome to our restaurant. We serve delicious meals prepared with the freshest ingredients and authentic recipes, in a warm and welcoming atmosphere.',
  ADD COLUMN IF NOT EXISTS values_text text DEFAULT 'Authenticity • Community • Quality • Freshness',
  ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{"weekdays":"7:00 AM – 10:00 PM","saturday":"8:00 AM – 11:00 PM","sunday":"8:00 AM – 9:00 PM"}'::jsonb,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS location text;

-- 3. Create public storage bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-images bucket
DROP POLICY IF EXISTS "Menu images are publicly readable" ON storage.objects;
CREATE POLICY "Menu images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Branch admins can upload menu images" ON storage.objects;
CREATE POLICY "Branch admins can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images' AND has_role(auth.uid(), 'branch_admin'::app_role));

DROP POLICY IF EXISTS "Branch admins can update menu images" ON storage.objects;
CREATE POLICY "Branch admins can update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images' AND has_role(auth.uid(), 'branch_admin'::app_role));

DROP POLICY IF EXISTS "Branch admins can delete menu images" ON storage.objects;
CREATE POLICY "Branch admins can delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images' AND has_role(auth.uid(), 'branch_admin'::app_role));