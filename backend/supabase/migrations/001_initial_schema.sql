-- Lao Natural Essentials PostgreSQL Schema for Supabase
-- Replaces old MySQL schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked with Supabase Auth users via auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
    id SERIAL PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'employee', 'user')),
    address TEXT,
    phone VARCHAR(20),
    express_company VARCHAR(255),
    profile_picture VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(100) PRIMARY KEY, -- Supports custom string product SKU IDs
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    size VARCHAR(50),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    price_lak DECIMAL(12, 2) DEFAULT 0.00,
    price_thb DECIMAL(12, 2) DEFAULT 0.00,
    price_usd DECIMAL(12, 2) DEFAULT 0.00,
    import_price DECIMAL(12, 2) DEFAULT 0.00,
    import_price_lak DECIMAL(12, 2) DEFAULT 0.00,
    import_price_thb DECIMAL(12, 2) DEFAULT 0.00,
    import_price_usd DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'LAK',
    import_currency VARCHAR(10) DEFAULT 'LAK',
    stock INT DEFAULT 0 CHECK (stock >= 0),
    image_url VARCHAR(500),
    ingredients TEXT,
    imported_by INT REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_payment' 
        CHECK (status IN ('pending_payment', 'prepare', 'sending', 'received', 'payment_rejected')),
    total_price DECIMAL(12, 2) NOT NULL CHECK (total_price >= 0),
    express_tracking VARCHAR(255),
    express_company VARCHAR(255),
    shipping_name VARCHAR(255),
    shipping_phone VARCHAR(20),
    shipping_address TEXT,
    payment_screenshot VARCHAR(500),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    size VARCHAR(50)
);

-- 6. Promotions Table
CREATE TABLE IF NOT EXISTS public.promotions (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('discount', 'b1g1')),
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    promo_price_lak DECIMAL(12, 2) DEFAULT 0.00,
    promo_price_thb DECIMAL(12, 2) DEFAULT 0.00,
    promo_price_usd DECIMAL(12, 2) DEFAULT 0.00,
    promo_stock INT DEFAULT 0 CHECK (promo_stock >= 0),
    promo_sold INT DEFAULT 0 CHECK (promo_sold >= 0),
    buy_qty INT DEFAULT 1 CHECK (buy_qty >= 1),
    get_qty INT DEFAULT 1 CHECK (get_qty >= 1),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Exchange Rates Table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    currency VARCHAR(10) PRIMARY KEY,
    rate DECIMAL(12, 4) NOT NULL CHECK (rate > 0),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed default exchange rates
INSERT INTO public.exchange_rates (currency, rate)
VALUES ('THB', 700.0000), ('USD', 22000.0000)
ON CONFLICT (currency) DO NOTHING;

-- 8. Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Product Imports Log Table
CREATE TABLE IF NOT EXISTS public.product_imports (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    import_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    supplier_name VARCHAR(255),
    quantity INT NOT NULL CHECK (quantity > 0),
    import_price DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Hero Banners Table
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    link_url VARCHAR(255),
    type VARCHAR(20) DEFAULT 'hero' CHECK (type IN ('hero', 'client')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Distributors Table
CREATE TABLE IF NOT EXISTS public.distributors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    image_url VARCHAR(500),
    map_url TEXT,
    facebook_url TEXT,
    website_url TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON public.promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
