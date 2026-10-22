-- =============================================================================
-- LIFTING ZONE OBRERO — COMPLETE ALL-IN-ONE SUPABASE SETUP SCRIPT
-- Paste and run this once in Supabase Dashboard > SQL Editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. BASE TABLES
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
    type VARCHAR(2) NOT NULL CHECK (type IN ('S', 'E')),
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

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_batch_code ON public.products(batch_code);

CREATE TABLE IF NOT EXISTS public.coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    description TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email VARCHAR(255),
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT NOT NULL,
    delivery_method VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid' NOT NULL,
    payment_provider VARCHAR(50) DEFAULT 'paymongo',
    payment_intent_id VARCHAR(100),
    payment_ref VARCHAR(100),
    qr_code_url TEXT,
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    receipt_sent_at TIMESTAMP WITH TIME ZONE,
    receipt_error TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    shipping_fee NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    coupon_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Confirmed & Queued for Packing' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

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

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_session ON public.wishlists(session_id);

-- -----------------------------------------------------------------------------
-- 2. AUTH & RBAC TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_emails (
    email TEXT PRIMARY KEY,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.admin_emails (email, note)
VALUES 
    ('kv.alegrado@gmail.com', 'Store Owner / System Administrator'),
    ('admin@liftingzone.ph', 'System Administrator')
ON CONFLICT (email) DO NOTHING;


CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) UNIQUE,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_id ON public.payment_events(event_id);

-- -----------------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    user_email TEXT;
    is_in_allowlist BOOLEAN;
    profile_role TEXT;
BEGIN
    IF user_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT role INTO profile_role FROM public.profiles WHERE id = user_uid;
    IF profile_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    SELECT email INTO user_email FROM auth.users WHERE id = user_uid;
    IF user_email IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admin_emails WHERE LOWER(email) = LOWER(user_email)
        ) INTO is_in_allowlist;
        
        IF is_in_allowlist THEN
            UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = user_uid AND role <> 'admin';
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_admin_user BOOLEAN := FALSE;
    raw_email TEXT;
BEGIN
    raw_email := NEW.email;

    IF raw_email IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admin_emails WHERE LOWER(email) = LOWER(raw_email)
        ) INTO is_admin_user;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(raw_email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        CASE WHEN is_admin_user THEN 'admin' ELSE 'customer' END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
        avatar_url = CASE WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url ELSE public.profiles.avatar_url END,
        role = CASE WHEN is_admin_user THEN 'admin' ELSE public.profiles.role END,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Products
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.is_admin(auth.uid()));

-- Coupons
DROP POLICY IF EXISTS "Allow public read access to active coupons" ON public.coupons;
CREATE POLICY "Allow public read access to active coupons" ON public.coupons FOR SELECT USING (active = true);

-- Batch Verifications
DROP POLICY IF EXISTS "Allow public read access to batch verifications" ON public.batch_verifications;
CREATE POLICY "Allow public read access to batch verifications" ON public.batch_verifications FOR SELECT USING (true);

-- Wishlists
DROP POLICY IF EXISTS "Allow public access to wishlists" ON public.wishlists;
CREATE POLICY "Allow public access to wishlists" ON public.wishlists FOR ALL USING (true);

-- Profiles
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;
CREATE POLICY "Public can view basic profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile fields" ON public.profiles;
CREATE POLICY "Users can update own profile fields" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admin Emails
DROP POLICY IF EXISTS "Admins can view admin_emails" ON public.admin_emails;
CREATE POLICY "Admins can view admin_emails" ON public.admin_emails FOR ALL USING (public.is_admin(auth.uid()));

-- Orders
DROP POLICY IF EXISTS "Users can read own orders or admins read all" ON public.orders;
CREATE POLICY "Users can read own orders or admins read all" ON public.orders FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
);
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.is_admin(auth.uid()));

-- Order Items
DROP POLICY IF EXISTS "Users can read own order items or admins" ON public.order_items;
CREATE POLICY "Users can read own order items or admins" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND ((auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR public.is_admin(auth.uid()))
    )
);
DROP POLICY IF EXISTS "Users can insert order items for own order" ON public.order_items;
CREATE POLICY "Users can insert order items for own order" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
);

-- Payment Events
DROP POLICY IF EXISTS "Admins can view payment events" ON public.payment_events;
CREATE POLICY "Admins can view payment events" ON public.payment_events FOR SELECT USING (public.is_admin(auth.uid()));
