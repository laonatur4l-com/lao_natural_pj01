-- Row Level Security (RLS) Policies for Lao Natural Essentials

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;

-- ─── Products & Public Data ───────────────────────────────────────
-- Products: Read public (non-deleted)
DROP POLICY IF EXISTS "Public products view" ON public.products;
CREATE POLICY "Public products view" ON public.products FOR SELECT USING (is_deleted = false);

-- Categories, Banners, Distributors, Exchange Rates, Promotions: Read public
DROP POLICY IF EXISTS "Public categories view" ON public.categories;
CREATE POLICY "Public categories view" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public banners view" ON public.hero_banners;
CREATE POLICY "Public banners view" ON public.hero_banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public distributors view" ON public.distributors;
CREATE POLICY "Public distributors view" ON public.distributors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public exchange_rates view" ON public.exchange_rates;
CREATE POLICY "Public exchange_rates view" ON public.exchange_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public promotions view" ON public.promotions;
CREATE POLICY "Public promotions view" ON public.promotions FOR SELECT USING (true);

-- ─── Full Access Policies (Service Role & Server Backend) ──────────────────────────
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;
CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access categories" ON public.categories;
CREATE POLICY "Service role full access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access products" ON public.products;
CREATE POLICY "Service role full access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access orders" ON public.orders;
CREATE POLICY "Service role full access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access order_items" ON public.order_items;
CREATE POLICY "Service role full access order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access promotions" ON public.promotions;
CREATE POLICY "Service role full access promotions" ON public.promotions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access exchange_rates" ON public.exchange_rates;
CREATE POLICY "Service role full access exchange_rates" ON public.exchange_rates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access activity_log" ON public.activity_log;
CREATE POLICY "Service role full access activity_log" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access product_imports" ON public.product_imports;
CREATE POLICY "Service role full access product_imports" ON public.product_imports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access hero_banners" ON public.hero_banners;
CREATE POLICY "Service role full access hero_banners" ON public.hero_banners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access distributors" ON public.distributors;
CREATE POLICY "Service role full access distributors" ON public.distributors FOR ALL USING (true) WITH CHECK (true);

