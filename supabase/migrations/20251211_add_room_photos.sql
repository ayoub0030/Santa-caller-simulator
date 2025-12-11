-- Create room_photos table
CREATE TABLE public.room_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.room_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for room_photos
CREATE POLICY "Allow public read access on room_photos"
  ON public.room_photos FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on room_photos"
  ON public.room_photos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on room_photos"
  ON public.room_photos FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on room_photos"
  ON public.room_photos FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_room_photos_room_id ON public.room_photos(room_id);
CREATE INDEX idx_room_photos_created_at ON public.room_photos(created_at);

-- Add trigger for updated_at
CREATE TRIGGER set_room_photos_updated_at
  BEFORE UPDATE ON public.room_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
