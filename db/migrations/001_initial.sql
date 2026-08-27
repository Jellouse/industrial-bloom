CREATE TABLE IF NOT EXISTS shop_products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'eur',
  image_url TEXT NOT NULL DEFAULT '',
  gallery_images TEXT[] NOT NULL DEFAULT '{}',
  inventory INTEGER NOT NULL DEFAULT 0 CHECK (inventory >= 0),
  available_serials INTEGER[],
  edition_size INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS available_serials INTEGER[];
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS edition_size INTEGER;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT '{}';

UPDATE shop_products
SET available_serials = ARRAY(SELECT generate_series(1, inventory))
WHERE available_serials IS NULL;

UPDATE shop_products
SET edition_size = GREATEST(
  inventory,
  COALESCE((SELECT MAX(serial) FROM unnest(available_serials) serial), 0)
)
WHERE edition_size IS NULL;

CREATE TABLE IF NOT EXISTS shop_checkouts (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL,
  items JSONB NOT NULL,
  amount_total INTEGER NOT NULL,
  currency TEXT NOT NULL,
  customer_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_cart_reservations (
  visitor_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  serial_numbers INTEGER[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (visitor_id, product_id)
);

CREATE INDEX IF NOT EXISTS shop_cart_reservations_expiry_idx
ON shop_cart_reservations (expires_at);

CREATE TABLE IF NOT EXISTS shop_orders (
  id TEXT PRIMARY KEY,
  checkout_id TEXT UNIQUE NOT NULL REFERENCES shop_checkouts(id),
  stripe_session_id TEXT UNIQUE,
  payment_status TEXT NOT NULL,
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
  items JSONB NOT NULL,
  amount_total INTEGER NOT NULL,
  currency TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
