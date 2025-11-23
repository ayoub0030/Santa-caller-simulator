-- Create enum for room status
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'cleaning', 'maintenance');

-- Create enum for room type
CREATE TYPE room_type AS ENUM ('standard', 'deluxe', 'suite');

-- Create enum for reservation status
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled');

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  room_type room_type NOT NULL,
  status room_status NOT NULL DEFAULT 'available',
  price_per_night DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create guests table
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  total_stays INTEGER DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create PUBLIC access policies (no authentication required)
-- Rooms policies
CREATE POLICY "Allow public read access on rooms"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on rooms"
  ON public.rooms FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on rooms"
  ON public.rooms FOR DELETE
  USING (true);

-- Guests policies
CREATE POLICY "Allow public read access on guests"
  ON public.guests FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on guests"
  ON public.guests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on guests"
  ON public.guests FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on guests"
  ON public.guests FOR DELETE
  USING (true);

-- Reservations policies
CREATE POLICY "Allow public read access on reservations"
  ON public.reservations FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on reservations"
  ON public.reservations FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on reservations"
  ON public.reservations FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_reservations_guest_id ON public.reservations(guest_id);
CREATE INDEX idx_reservations_room_id ON public.reservations(room_id);
CREATE INDEX idx_reservations_dates ON public.reservations(check_in_date, check_out_date);
CREATE INDEX idx_rooms_status ON public.rooms(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data
INSERT INTO public.rooms (room_number, room_type, status, price_per_night, description) VALUES
  ('101', 'standard', 'available', 120.00, 'Comfortable standard room with queen bed'),
  ('102', 'standard', 'occupied', 120.00, 'Comfortable standard room with queen bed'),
  ('103', 'standard', 'cleaning', 120.00, 'Comfortable standard room with queen bed'),
  ('201', 'deluxe', 'available', 180.00, 'Spacious deluxe room with king bed and city view'),
  ('202', 'deluxe', 'occupied', 180.00, 'Spacious deluxe room with king bed and city view'),
  ('203', 'deluxe', 'maintenance', 180.00, 'Spacious deluxe room with king bed and city view'),
  ('301', 'suite', 'available', 280.00, 'Luxurious suite with separate living area'),
  ('302', 'suite', 'occupied', 280.00, 'Luxurious suite with separate living area');

INSERT INTO public.guests (name, email, phone, total_stays, last_visit) VALUES
  ('John Smith', 'john.smith@email.com', '+1 234-567-8900', 5, '2024-01-10'),
  ('Sarah Johnson', 'sarah.j@email.com', '+1 234-567-8901', 3, '2024-01-05'),
  ('Michael Brown', 'm.brown@email.com', '+1 234-567-8902', 8, '2023-12-28'),
  ('Jane Doe', 'jane.doe@email.com', '+1 234-567-8903', 2, '2024-01-01'),
  ('Bob Johnson', 'bob.j@email.com', '+1 234-567-8904', 4, '2023-12-15');