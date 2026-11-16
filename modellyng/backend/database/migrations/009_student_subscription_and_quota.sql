-- ============================================================================
-- MODELLYNG WEB — DATABASE SCHEMA MIGRATION 009
-- Domain: Student Subscription Models (Free, Student Pro 14 Days, Student Pro 30 Days),
--         Daily Quota Ledger (3 Files/Day, 15 Tokens/Day), Invoices & Transactions.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. UPDATE SUBSCRIPTION PLANS CHECK & ADD STUDENT COLUMNS
-- ----------------------------------------------------------------------------
-- Drop existing check on billing_period if exists
ALTER TABLE public.subscription_plans 
DROP CONSTRAINT IF EXISTS subscription_plans_billing_period_check;

ALTER TABLE public.subscription_plans 
ADD CONSTRAINT subscription_plans_billing_period_check 
CHECK (billing_period IN ('free', 'monthly', 'annual', 'lifetime', 'fixed_days'));

-- Add student-specific quota & duration attributes
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS duration_days INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_file_limit INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_token_limit INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens_max INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier_category TEXT NOT NULL DEFAULT 'student' CHECK (tier_category IN ('free', 'student', 'enterprise'));

CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier_category ON public.subscription_plans(tier_category);

-- ----------------------------------------------------------------------------
-- 2. UPDATE USERS SUBSCRIPTION TIER CONSTRAINT
-- ----------------------------------------------------------------------------
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_subscription_tier_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'pro', 'student_14', 'student_30', 'enterprise'));

-- ----------------------------------------------------------------------------
-- 3. CREATE DAILY USAGE LEDGER TABLE (public.user_daily_usage)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    files_uploaded_count INT NOT NULL DEFAULT 0 CHECK (files_uploaded_count >= 0),
    tokens_used_count INT NOT NULL DEFAULT 0 CHECK (tokens_used_count >= 0),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_daily_usage UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_usage_lookup ON public.user_daily_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_usage_date ON public.user_daily_usage(usage_date);

-- ----------------------------------------------------------------------------
-- 4. CREATE SUBSCRIPTION INVOICES & TRANSACTIONS TABLE (public.subscription_invoices)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    invoice_number TEXT UNIQUE NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'IDR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'failed', 'cancelled')),
    payment_method TEXT NOT NULL DEFAULT 'qris_manual' CHECK (payment_method IN ('qris_manual', 'qris_simulated', 'bank_transfer', 'va_bca', 'va_mandiri', 'free_activation')),
    payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_user ON public.subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON public.subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_created ON public.subscription_invoices(created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. UPDATE USER SUBSCRIPTIONS RELATIONS & ATTRIBUTES
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS invoice_id UUID,
ADD COLUMN IF NOT EXISTS tokens_accumulated_total INT NOT NULL DEFAULT 0;

ALTER TABLE public.user_subscriptions
DROP CONSTRAINT IF EXISTS fk_user_subscriptions_invoice;

ALTER TABLE public.user_subscriptions
ADD CONSTRAINT fk_user_subscriptions_invoice
FOREIGN KEY (invoice_id) REFERENCES public.subscription_invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_lookup 
ON public.user_subscriptions(user_id, status, expires_at);

-- ----------------------------------------------------------------------------
-- 6. DEACTIVATE LEGACY B2B PLANS & SEED CANONICAL STUDENT PLANS
-- ----------------------------------------------------------------------------
-- Deactivate older legacy plans without deleting them (preserves FK integrity)
UPDATE public.subscription_plans 
SET is_active = false 
WHERE code IN ('free_explorer', 'pro_scholar', 'lab_enterprise');

-- Insert or update Canonical Student Plans
INSERT INTO public.subscription_plans (
    code, name, description, price, currency, billing_period, 
    duration_days, daily_file_limit, daily_token_limit, total_tokens_max, 
    tier_category, features, is_active, is_popular, sort_order
)
VALUES 
    (
        'free',
        'Free Plan',
        'Cocok untuk pengguna yang ingin mencoba kemampuan dasar Modellyng.',
        0.00,
        'IDR',
        'free',
        0,
        3,
        0,
        0,
        'free',
        '[
            {"text": "Maksimal penggunaan 3 file per hari.", "is_available": true, "status_badge": "3 File / Hari"},
            {"text": "Reset kuota setiap 24 jam setelah batas harian tercapai.", "is_available": true},
            {"text": "Akses hasil analisis dan ringkasan dasar paper.", "is_available": true},
            {"text": "Akses terbatas pada Comparative Paper Matrix (tabel perbandingan dasar dapat dilihat, tetapi penjelasan mendalam dan perbandingan antar-paper dikunci).", "is_available": false, "is_limited": true, "status_badge": "Terbatas"},
            {"text": "Akses terbatas pada Research Gap Map (hanya dapat dilihat melalui preview terbatas, flow map dibuat blur, dan hubungan antar-penelitian tidak dapat dibaca).", "is_available": false, "is_limited": true, "status_badge": "Preview Blur"},
            {"text": "Fitur AI Editing dan penjelasan lanjutan terkunci penuh.", "is_available": false, "status_badge": "Terkunci"}
        ]'::jsonb,
        true,
        false,
        1
    ),
    (
        'student_14',
        'Student Pro – 14 Hari',
        'Cocok untuk mahasiswa yang membutuhkan akses dalam periode pengerjaan tugas atau kajian pustaka dengan komitmen pembayaran lebih rendah.',
        29000.00,
        'IDR',
        'fixed_days',
        14,
        NULL,
        15,
        210,
        'student',
        '[
            {"text": "Kuota 15 token setiap hari (diperbarui setiap hari selama masa aktif, total maksimal 210 token).", "is_available": true, "status_badge": "15 Token / Hari"},
            {"text": "Seluruh fitur terbuka dan tidak ada fitur yang terkunci selama masa aktif.", "is_available": true},
            {"text": "Akses penuh Comparative Paper Matrix (tabel perbandingan lengkap, penjelasan mendalam, keterbatasan penelitian, dan hubungan antar-paper dapat dibaca).", "is_available": true},
            {"text": "Akses penuh Research Gap Map (seluruh visualisasi flow map terlihat jelas dan interaktif, lengkap dengan analisis potensi research gap).", "is_available": true},
            {"text": "Fitur AI Editing terbuka untuk mengedit, mengembangkan, dan menyempurnakan hasil analisis.", "is_available": true},
            {"text": "Ekstraksi informasi dan ringkasan paper yang lebih lengkap dan terstruktur.", "is_available": true}
        ]'::jsonb,
        true,
        false,
        2
    ),
    (
        'student_30',
        'Student Pro – 30 Hari',
        'Cocok untuk mahasiswa yang sedang menyusun proposal, skripsi, atau kajian literatur secara berkelanjutan (pilihan paling ekonomis).',
        49000.00,
        'IDR',
        'fixed_days',
        30,
        NULL,
        15,
        450,
        'student',
        '[
            {"text": "Kuota 15 token setiap hari (diperbarui setiap hari selama masa aktif, total maksimal 450 token).", "is_available": true, "status_badge": "15 Token / Hari"},
            {"text": "Seluruh fitur terbuka dan tidak ada fitur yang terkunci selama masa aktif.", "is_available": true},
            {"text": "Akses penuh Comparative Paper Matrix (tabel perbandingan lengkap, penjelasan mendalam, keterbatasan penelitian, dan hubungan antar-paper dapat dibaca).", "is_available": true},
            {"text": "Akses penuh Research Gap Map (seluruh visualisasi flow map terlihat jelas dan interaktif, lengkap dengan analisis potensi research gap).", "is_available": true},
            {"text": "Fitur AI Editing terbuka untuk mengedit, mengembangkan, dan menyempurnakan hasil analisis.", "is_available": true},
            {"text": "Ekstraksi informasi dan ringkasan paper yang lebih lengkap dan terstruktur.", "is_available": true}
        ]'::jsonb,
        true,
        true,
        3
    )
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    billing_period = EXCLUDED.billing_period,
    duration_days = EXCLUDED.duration_days,
    daily_file_limit = EXCLUDED.daily_file_limit,
    daily_token_limit = EXCLUDED.daily_token_limit,
    total_tokens_max = EXCLUDED.total_tokens_max,
    tier_category = EXCLUDED.tier_category,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 7. CREATE DATABASE HELPER VIEW (public.v_user_active_subscription)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_user_active_subscription AS
SELECT 
    u.id AS user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    COALESCE(us.status, 'active') AS subscription_status,
    COALESCE(active_plan.code, 'free') AS plan_code,
    COALESCE(active_plan.name, 'Free Plan') AS plan_name,
    COALESCE(active_plan.tier_category, 'free') AS tier_category,
    COALESCE(active_plan.daily_file_limit, 3) AS daily_file_limit,
    COALESCE(active_plan.daily_token_limit, 0) AS daily_token_limit,
    COALESCE(active_plan.total_tokens_max, 0) AS total_tokens_max,
    us.started_at,
    us.expires_at,
    CASE 
        WHEN us.expires_at IS NULL THEN NULL
        WHEN us.expires_at > NOW() THEN GREATEST(0, EXTRACT(DAY FROM (us.expires_at - NOW()))::INT)
        ELSE 0
    END AS days_remaining,
    CASE 
        WHEN active_plan.code IS NULL OR active_plan.code = 'free' THEN true
        WHEN us.status = 'active' AND us.expires_at > NOW() THEN true
        ELSE false
    END AS is_currently_valid
FROM public.users u
LEFT JOIN LATERAL (
    SELECT * FROM public.user_subscriptions 
    WHERE user_id = u.id AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC 
    LIMIT 1
) us ON true
LEFT JOIN LATERAL (
    SELECT sp.* FROM public.subscription_plans sp
    WHERE sp.id = us.plan_id OR (us.plan_id IS NULL AND sp.code = 'free' AND sp.is_active = true)
    ORDER BY sp.sort_order ASC
    LIMIT 1
) active_plan ON true;

COMMIT;
