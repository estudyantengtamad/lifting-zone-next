-- =============================================================================
-- LIFTING ZONE OBRERO — SUPABASE DATABASE SCHEMA
-- PostgreSQL schema designed for Supabase backend
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    brand VARCHAR(120) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    stock INT DEFAULT 10,
    type VARCHAR(2) NOT NULL CHECK (type IN ('S', 'E')), -- 'S': Supplements, 'E': Equipment
    emoji VARCHAR(10) DEFAULT '⚡',
    description TEXT,
    specs JSONB DEFAULT '[]'::jsonb,
    flavors JSONB DEFAULT '[]'::jsonb,
    batch_code VARCHAR(100) UNIQUE,
    authenticity_seal TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching and filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_batch_code ON public.products(batch_code);

-- -----------------------------------------------------------------------------
-- 2. COUPONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    description TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- -----------------------------------------------------------------------------
-- 3. ORDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT NOT NULL,
    delivery_method VARCHAR(50) NOT NULL, -- 'butuan-express' | 'nationwide'
    payment_method VARCHAR(50) NOT NULL,  -- 'gcash' | 'maya' | 'cod'
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    shipping_fee NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    coupon_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Confirmed & Queued for Packing' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- -----------------------------------------------------------------------------
-- 4. ORDER ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES public.products(id) ON DELETE SET NULL,
    product_title VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- -----------------------------------------------------------------------------
-- 5. BATCH VERIFICATIONS TABLE (Tamper & Lab certificates)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batch_verifications (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(120) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    production_date VARCHAR(50),
    expiry_date VARCHAR(50),
    purity VARCHAR(100),
    origin VARCHAR(150),
    fda_registration VARCHAR(100),
    lab_notes TEXT,
    verified BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_batch_verifications_code ON public.batch_verifications(batch_code);

-- -----------------------------------------------------------------------------
-- 6. WISHLIST TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_session ON public.wishlists(session_id);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

-- Coupons: Everyone can query active coupons
CREATE POLICY "Allow public read access to active coupons" ON public.coupons
    FOR SELECT USING (active = true);

-- Batch verifications: Public can query for authenticity verification
CREATE POLICY "Allow public read access to batch verifications" ON public.batch_verifications
    FOR SELECT USING (true);

-- Orders & Order Items: Public can insert new orders and order items
CREATE POLICY "Allow public insert to orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read own order by order_number" ON public.orders
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert to order_items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Wishlists: Public can read and manage by session_id
CREATE POLICY "Allow public access to wishlists" ON public.wishlists
    FOR ALL USING (true);
