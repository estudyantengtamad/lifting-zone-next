-- =============================================================================
-- 002_auth_roles_qr_receipts.sql
-- Lifting Zone Obrero: Google Auth Profiles, Admin Roles, PayMongo QR Ph & Gmail Receipts
-- Safe to re-run (idempotent DDL)
-- =============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ADMIN EMAILS ALLOWLIST
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_emails (
    email TEXT PRIMARY KEY,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Default system admin seed (placeholder - user will insert their real Gmail)
INSERT INTO public.admin_emails (email, note)
VALUES ('admin@liftingzone.ph', 'Initial system owner allowlist entry')
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. USER PROFILES TABLE (linked to auth.users)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3. HELPER FUNCTION: is_admin(user_uid)
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

    -- Check if user role is explicitly set to admin in profiles
    SELECT role INTO profile_role FROM public.profiles WHERE id = user_uid;
    IF profile_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- Check if email matches admin_emails allowlist directly
    SELECT email INTO user_email FROM auth.users WHERE id = user_uid;
    IF user_email IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admin_emails WHERE LOWER(email) = LOWER(user_email)
        ) INTO is_in_allowlist;
        
        IF is_in_allowlist THEN
            -- Self-heal profile role if in allowlist
            UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = user_uid AND role <> 'admin';
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. TRIGGER: handle_new_user()
-- Automatically assigns 'admin' if email is in admin_emails, else 'customer'.
-- -----------------------------------------------------------------------------
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
-- 5. ORDERS TABLE ENHANCEMENTS
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid' NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) DEFAULT 'paymongo';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_error TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_payment_status_check
            CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'expired', 'failed', 'review'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON public.orders(payment_intent_id);

-- -----------------------------------------------------------------------------
-- 6. PAYMENT EVENTS AUDIT TABLE
-- -----------------------------------------------------------------------------
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
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;
CREATE POLICY "Public can view basic profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile fields" ON public.profiles;
CREATE POLICY "Users can update own profile fields" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- User cannot escalate their own role
        AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    );

-- ADMIN EMAILS
DROP POLICY IF EXISTS "Admins can view admin_emails" ON public.admin_emails;
CREATE POLICY "Admins can view admin_emails" ON public.admin_emails
    FOR ALL USING (public.is_admin(auth.uid()));

-- ORDERS
DROP POLICY IF EXISTS "Users can read own orders or admins read all" ON public.orders;
CREATE POLICY "Users can read own orders or admins read all" ON public.orders
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR public.is_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- ORDER ITEMS
DROP POLICY IF EXISTS "Users can read own order items or admins" ON public.order_items;
CREATE POLICY "Users can read own order items or admins" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND ((auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR public.is_admin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Users can insert order items for own order" ON public.order_items;
CREATE POLICY "Users can insert order items for own order" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND o.user_id = auth.uid()
        )
    );

-- PRODUCTS: Admin-only writes, public reads
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
    FOR UPDATE USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
    FOR DELETE USING (public.is_admin(auth.uid()));

-- PAYMENT EVENTS: Admins only
DROP POLICY IF EXISTS "Admins can view payment events" ON public.payment_events;
CREATE POLICY "Admins can view payment events" ON public.payment_events
    FOR SELECT USING (public.is_admin(auth.uid()));
