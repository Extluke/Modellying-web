-- ============================================================================
-- MODELLYNG WEB — DATABASE SCHEMA MIGRATION 010
-- Domain: Quota Hardening, Atomic Deduction & Refund Functions,
--         Token Usage Audit Ledger, and Timezone-Normalized Quota Reset (WIB).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. SEED / UPDATE DEVELOPER & STUDENT PLANS IN SUBSCRIPTION_PLANS
-- ----------------------------------------------------------------------------
-- Ensure 'developer' is an accepted tier category if checked
ALTER TABLE public.subscription_plans 
DROP CONSTRAINT IF EXISTS subscription_plans_tier_category_check;

ALTER TABLE public.subscription_plans 
ADD CONSTRAINT subscription_plans_tier_category_check 
CHECK (tier_category IN ('free', 'student', 'enterprise', 'developer'));

-- Update student_14 and student_30 with explicit daily_file_limit = 15
UPDATE public.subscription_plans 
SET daily_file_limit = 15, updated_at = NOW() 
WHERE code IN ('student_14', 'student_30');

-- Ensure Free plan has daily_file_limit = 3 and daily_token_limit = 3
UPDATE public.subscription_plans 
SET daily_file_limit = 3, daily_token_limit = 3, updated_at = NOW() 
WHERE code = 'free';

-- Insert or update Developer Plan (unlimited)
INSERT INTO public.subscription_plans (
    code, name, description, price, currency, billing_period, 
    duration_days, daily_file_limit, daily_token_limit, total_tokens_max, 
    tier_category, features, is_active, is_popular, sort_order
)
VALUES (
    'developer',
    'Developer Access',
    'Akses penuh tanpa batas kuota khusus untuk tim pengembang dan pengujian sistem.',
    0.00,
    'IDR',
    'lifetime',
    0,
    999999,
    999999,
    999999,
    'developer',
    '[
        {"text": "Akses tanpa batas kuota upload harian.", "is_available": true, "status_badge": "Unlimited"},
        {"text": "Bypass antrean Celery dan akses diagnostik sistem.", "is_available": true},
        {"text": "Seluruh fitur terbuka penuh (Matrix, Knowledge Graph, AI Synthesis).", "is_available": true}
    ]'::jsonb,
    true,
    false,
    0
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
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 2. CREATE TOKEN USAGE AUDIT LEDGER (public.token_usage_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.token_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'paper_upload', 'ai_synthesis', 'quota_refund'
    amount INT NOT NULL DEFAULT 1,
    reference_id UUID, -- paper_id atau project_id
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_token_usage_logs_user_date 
ON public.token_usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_usage_logs_action 
ON public.token_usage_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_token_usage_logs_reference 
ON public.token_usage_logs(reference_id);

-- ----------------------------------------------------------------------------
-- 3. UPGRADE v_user_active_subscription VIEW
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_user_active_subscription AS
SELECT 
    u.id AS user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    CASE 
        WHEN u.subscription_tier = 'developer' OR u.role = 'admin' THEN 'active'
        ELSE COALESCE(us.status, 'active')
    END AS subscription_status,
    CASE 
        WHEN u.subscription_tier = 'developer' OR u.role = 'admin' THEN 'developer'
        ELSE COALESCE(active_plan.code, 'free')
    END AS plan_code,
    CASE 
        WHEN u.subscription_tier = 'developer' OR u.role = 'admin' THEN 'Developer Access'
        ELSE COALESCE(active_plan.name, 'Free Plan')
    END AS plan_name,
    CASE 
        WHEN u.subscription_tier = 'developer' OR u.role = 'admin' THEN 'developer'
        ELSE COALESCE(active_plan.tier_category, 'free')
    END AS tier_category,
    CASE 
        WHEN u.subscription_tier = 'developer' OR u.role = 'admin' THEN 999999
        ELSE COALESCE(active_plan.daily_file_limit, 3)
    END AS daily_file_limit,
    CASE 
        WHEN u.subscription_tier = 'developer' OR u.role = 'admin' THEN 999999
        ELSE COALESCE(active_plan.daily_token_limit, 0)
    END AS daily_token_limit,
    CASE 
        WHEN u.subscription_tier = 'developer' OR u.role = 'admin' THEN 999999
        ELSE COALESCE(active_plan.total_tokens_max, 0)
    END AS total_tokens_max,
    us.started_at,
    us.expires_at,
    CASE 
        WHEN u.subscription_tier = 'developer' OR u.role = 'admin' THEN NULL
        WHEN us.expires_at IS NULL THEN NULL
        WHEN us.expires_at > NOW() THEN GREATEST(0, EXTRACT(DAY FROM (us.expires_at - NOW()))::INT)
        ELSE 0
    END AS days_remaining,
    true AS is_currently_valid
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

-- ----------------------------------------------------------------------------
-- 4. ATOMIC FUNCTION: fn_consume_daily_quota
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_consume_daily_quota(
    p_user_id UUID,
    p_quota_type TEXT DEFAULT 'file_upload',
    p_amount INT DEFAULT 1,
    p_reference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    current_used INT,
    daily_limit INT,
    remaining INT,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_code TEXT;
    v_tier_category TEXT;
    v_daily_limit INT;
    v_today DATE;
    v_current_used INT := 0;
    v_remaining INT := 0;
BEGIN
    -- 1. Tentukan tanggal hari ini di zona waktu Asia/Jakarta (WIB)
    v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::DATE;

    -- 2. Ambil paket aktif pengguna dari view
    SELECT plan_code, tier_category, daily_file_limit 
    INTO v_plan_code, v_tier_category, v_daily_limit
    FROM public.v_user_active_subscription
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        v_plan_code := 'free';
        v_tier_category := 'free';
        v_daily_limit := 3;
    END IF;

    -- 3. Akun Developer mendapat akses unlimited tanpa pemotongan kuota
    IF v_tier_category = 'developer' OR v_plan_code = 'developer' THEN
        -- Catat jejak audit
        INSERT INTO public.token_usage_logs (user_id, action_type, amount, reference_id, notes)
        VALUES (p_user_id, p_quota_type, p_amount, p_reference_id, COALESCE(p_notes, 'Developer bypass'));

        RETURN QUERY SELECT TRUE, 0, 999999, 999999, 'Akses Developer: Kuota tidak terbatas'::TEXT;
        RETURN;
    END IF;

    -- 4. Pastikan baris rekaman hari ini ada di user_daily_usage
    INSERT INTO public.user_daily_usage (user_id, usage_date, files_uploaded_count, tokens_used_count, last_activity_at, updated_at)
    VALUES (p_user_id, v_today, 0, 0, NOW(), NOW())
    ON CONFLICT (user_id, usage_date) DO NOTHING;

    -- 5. Kunci baris untuk mencegah race condition (Atomic Lock)
    SELECT files_uploaded_count INTO v_current_used
    FROM public.user_daily_usage
    WHERE user_id = p_user_id AND usage_date = v_today
    FOR UPDATE;

    -- 6. Evaluasi apakah kuota mencukupi
    IF (v_current_used + p_amount) > v_daily_limit THEN
        v_remaining := GREATEST(0, v_daily_limit - v_current_used);
        RETURN QUERY SELECT 
            FALSE, 
            v_current_used, 
            v_daily_limit, 
            v_remaining, 
            format('Batas kuota harian (%s dokumen) telah tercapai. Kuota akan direset pukul 00:00 WIB.', v_daily_limit)::TEXT;
        RETURN;
    END IF;

    -- 7. Tambahkan kuota terpakai
    UPDATE public.user_daily_usage
    SET 
        files_uploaded_count = files_uploaded_count + p_amount,
        tokens_used_count = tokens_used_count + p_amount,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id AND usage_date = v_today;

    v_current_used := v_current_used + p_amount;
    v_remaining := GREATEST(0, v_daily_limit - v_current_used);

    -- 8. Tulis transaksi ke audit ledger
    INSERT INTO public.token_usage_logs (user_id, action_type, amount, reference_id, notes)
    VALUES (p_user_id, p_quota_type, p_amount, p_reference_id, p_notes);

    RETURN QUERY SELECT TRUE, v_current_used, v_daily_limit, v_remaining, 'Kuota berhasil dikonsumsi'::TEXT;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. ATOMIC FUNCTION: fn_refund_daily_quota
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_refund_daily_quota(
    p_user_id UUID,
    p_quota_type TEXT DEFAULT 'file_upload',
    p_amount INT DEFAULT 1,
    p_reference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    current_used INT,
    daily_limit INT,
    remaining INT,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_daily_limit INT;
    v_today DATE;
    v_current_used INT := 0;
    v_remaining INT := 0;
BEGIN
    v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::DATE;

    SELECT daily_file_limit INTO v_daily_limit
    FROM public.v_user_active_subscription
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        v_daily_limit := 3;
    END IF;

    -- Kurangi files_uploaded_count dengan batas minimal 0
    UPDATE public.user_daily_usage
    SET 
        files_uploaded_count = GREATEST(0, files_uploaded_count - p_amount),
        tokens_used_count = GREATEST(0, tokens_used_count - p_amount),
        updated_at = NOW()
    WHERE user_id = p_user_id AND usage_date = v_today
    RETURNING files_uploaded_count INTO v_current_used;

    IF NOT FOUND THEN
        v_current_used := 0;
    END IF;

    v_remaining := GREATEST(0, v_daily_limit - v_current_used);

    -- Catat pengembalian ke log
    INSERT INTO public.token_usage_logs (user_id, action_type, amount, reference_id, notes)
    VALUES (p_user_id, 'quota_refund', p_amount, p_reference_id, COALESCE(p_notes, 'Pengembalian kuota karena kegagalan proses'));

    RETURN QUERY SELECT TRUE, v_current_used, v_daily_limit, v_remaining, 'Kuota berhasil dikembalikan'::TEXT;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. GRANT EXECUTE TO PUBLIC & POSTGRES ROLES
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT ON public.token_usage_logs TO public;
GRANT EXECUTE ON FUNCTION public.fn_consume_daily_quota TO public;
GRANT EXECUTE ON FUNCTION public.fn_refund_daily_quota TO public;

COMMIT;
