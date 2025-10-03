-- Sample Retailers Data for Testing Autocomplete
-- Copy and paste this into Supabase SQL Editor to add test stores

-- Insert sample retailers (will skip if they already exist based on name)
INSERT INTO public.retailers (name, address, location, email, phone, source, created_at)
VALUES 
  ('Pet Paradise', '123 Main Street, New York, NY 10001', '123 Main Street, New York, NY 10001', 'contact@petparadise.com', '555-0101', 'import', now()),
  ('Coffee Corner', '456 Oak Avenue, Los Angeles, CA 90001', '456 Oak Avenue, Los Angeles, CA 90001', 'hello@coffeecorner.com', '555-0102', 'import', now()),
  ('Yoga Studio Downtown', '789 Elm Street, Chicago, IL 60601', '789 Elm Street, Chicago, IL 60601', 'info@yogastudio.com', '555-0103', 'import', now()),
  ('The Book Nook', '321 Pine Road, Austin, TX 78701', '321 Pine Road, Austin, TX 78701', 'books@booknook.com', '555-0104', 'import', now()),
  ('Petco Store', '654 Maple Drive, Seattle, WA 98101', '654 Maple Drive, Seattle, WA 98101', 'store@petco.com', '555-0105', 'import', now()),
  ('Pet Supplies Plus', '987 Cedar Lane, Miami, FL 33101', '987 Cedar Lane, Miami, FL 33101', 'contact@petsupplies.com', '555-0106', 'import', now()),
  ('Organic Market', '147 Birch Boulevard, Denver, CO 80201', '147 Birch Boulevard, Denver, CO 80201', 'info@organicmarket.com', '555-0107', 'import', now()),
  ('Fitness First Gym', '258 Spruce Street, Boston, MA 02101', '258 Spruce Street, Boston, MA 02101', 'gym@fitnessfirst.com', '555-0108', 'import', now()),
  ('Pet Grooming Plus', '369 Willow Way, Portland, OR 97201', '369 Willow Way, Portland, OR 97201', 'grooming@petplus.com', '555-0109', 'import', now()),
  ('Craft Beer Bar', '741 Ash Avenue, San Francisco, CA 94101', '741 Ash Avenue, San Francisco, CA 94101', 'bar@craftbeer.com', '555-0110', 'import', now())
ON CONFLICT (name) DO NOTHING;

-- Verify data was inserted
SELECT COUNT(*) as total_retailers FROM public.retailers;

-- Show sample of retailers
SELECT id, name, address, email FROM public.retailers LIMIT 10;

