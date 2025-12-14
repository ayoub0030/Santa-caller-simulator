-- Create storage bucket for room photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-photos', 'room-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to room-photos bucket
CREATE POLICY "Allow public read access to room-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-photos');

-- Allow public insert to room-photos bucket
CREATE POLICY "Allow public insert to room-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'room-photos');

-- Allow public update to room-photos bucket
CREATE POLICY "Allow public update to room-photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'room-photos');

-- Allow public delete to room-photos bucket
CREATE POLICY "Allow public delete to room-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'room-photos');
