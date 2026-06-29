
-- Create storage bucket for materials
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'study-materials');

-- Allow anyone to read materials  
CREATE POLICY "Anyone can read materials" ON storage.objects FOR SELECT USING (bucket_id = 'study-materials');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update materials" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'study-materials');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete materials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'study-materials');

-- Allow authenticated users to insert materials into the materials table
CREATE POLICY "Authenticated users can insert materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (true);
