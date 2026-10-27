-- ============================================================================
-- MODELLYNG WEB — DATABASE SCHEMA MIGRATION 008
-- Domain: Admin Operations, Subscriptions CMS, Bug Reports, Announcements CMS,
--         Dynamic API Key Configurations, and Multi-Admin Governance.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND USERS TABLE (Job 2 & Job 6)
-- ----------------------------------------------------------------------------
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT 'admin' CHECK (admin_role IN ('super_admin', 'support_admin', 'content_admin', 'admin')),
ADD COLUMN IF NOT EXISTS admin_permissions JSONB NOT NULL DEFAULT '["all"]'::jsonb,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);

-- Update existing super administrator role
UPDATE public.users SET admin_role = 'super_admin' WHERE email = 'admin@modellyng.ac.id';


-- ----------------------------------------------------------------------------
-- 2. SUBSCRIPTION PLANS & USER SUBSCRIPTIONS (Job 1 & Job 3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'IDR',
    billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('free', 'monthly', 'annual', 'lifetime')),
    paper_limit_per_month INT NOT NULL DEFAULT 5,
    ai_query_limit_per_day INT NOT NULL DEFAULT 20,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- Seed Canonical Pricing Plans
INSERT INTO public.subscription_plans (code, name, description, price, billing_period, paper_limit_per_month, ai_query_limit_per_day, features, is_active, is_popular, sort_order)
VALUES 
    (
        'free_explorer',
        'Paket Peneliti Pemula (Free)',
        'Ideal untuk mahasiswa yang baru mulai menyusun literatur dasar.',
        0.00,
        'free',
        5,
        20,
        '["Maksimal 5 dokumen paper per bulan", "Ekstraksi 13 parameter ilmiah kanonik", "Tanya AI standar (20 query/hari)", "Akses Matriks Komparasi dasar"]'::jsonb,
        true,
        false,
        1
    ),
    (
        'pro_scholar',
        'Pro Scholar (Rekomendasi)',
        'Pilihan terbaik untuk peneliti tesis, disertasi, dan publikasi jurnal Scopus.',
        99000.00,
        'monthly',
        50,
        250,
        '["Maksimal 50 dokumen paper per bulan", "Ekstraksi prioritas kecepatan tinggi", "Tanya AI RAG tanpa batas (250 query/hari)", "Ekspor Word, Excel & PDF Komparasi", "Kanvas Graf Pengetahuan & Celah Riset 2D"]'::jsonb,
        true,
        true,
        2
    ),
    (
        'lab_enterprise',
        'Lab & Campus Enterprise',
        'Dirancang khusus untuk tim laboratorium riset atau fakultas perguruan tinggi.',
        499000.00,
        'monthly',
        500,
        1500,
        '["Maksimal 500 dokumen paper per bulan", "Dedicated API Key & kuota AI prioritas", "Dukungan multi-user kolaboratif", "Verifikasi DOI penerbit Tier-1 otomatis", "SLA & Konsultasi Teknis Prioritas"]'::jsonb,
        true,
        false,
        3
    )
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    features = EXCLUDED.features;

-- Tabel Relasi User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT DEFAULT 'qris_manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Seed sample active subscription for demo researchers
DO $$
DECLARE
    pro_plan_id UUID;
    cahayu_id UUID;
    arby_id UUID;
BEGIN
    SELECT id INTO pro_plan_id FROM public.subscription_plans WHERE code = 'pro_scholar' LIMIT 1;
    SELECT id INTO cahayu_id FROM public.users WHERE email = 'cahayu@modellyng.ac.id' LIMIT 1;
    SELECT id INTO arby_id FROM public.users WHERE email = 'arby@modellyng.ac.id' LIMIT 1;

    IF pro_plan_id IS NOT NULL AND cahayu_id IS NOT NULL THEN
        UPDATE public.users SET subscription_tier = 'pro' WHERE id = cahayu_id;
        INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at, amount_paid)
        VALUES (cahayu_id, pro_plan_id, 'active', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 99000.00)
        ON CONFLICT DO NOTHING;
    END IF;

    IF pro_plan_id IS NOT NULL AND arby_id IS NOT NULL THEN
        UPDATE public.users SET subscription_tier = 'pro' WHERE id = arby_id;
        INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at, amount_paid)
        VALUES (arby_id, pro_plan_id, 'active', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 99000.00)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 3. BUG REPORTS & TECHNICAL TICKETS (Job 2)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    page_url TEXT,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON public.bug_reports(user_id);

-- Seed Sample Realistic Bug Reports
DO $$
DECLARE
    faqih_id UUID;
    fatih_id UUID;
BEGIN
    SELECT id INTO faqih_id FROM public.users WHERE email = 'faqih@modellyng.ac.id' LIMIT 1;
    SELECT id INTO fatih_id FROM public.users WHERE email = 'fatih@modellyng.ac.id' LIMIT 1;

    IF NOT EXISTS (SELECT 1 FROM public.bug_reports LIMIT 1) THEN
        INSERT INTO public.bug_reports (user_id, title, description, page_url, severity, status, admin_notes)
        VALUES 
            (
                faqih_id,
                'Penyorotan kutipan naskah lambat pada file PDF 40+ halaman',
                'Saat membuka paper hasil ekstraksi dengan halaman lebih dari 40 lembar, penyorotan teks bukti di canvas PDF.js butuh waktu sekitar 4 detik.',
                '/projects/sample-id/papers/paper-1',
                'medium',
                'investigating',
                'Sedang dioptimalkan dengan penambahan cache in-memory pada pdfMatcher.'
            ),
            (
                fatih_id,
                'Gagal parsing tabel IEEE dua kolom pada halaman pengantar',
                'Paper dengan format 2 kolom rapat terkadang menggabungkan teks kolom kiri dan kanan pada PyMuPDF block extraction.',
                '/projects/sample-id/overview',
                'high',
                'open',
                NULL
            );
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 4. ANNOUNCEMENTS & PROMO CMS (Job 4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL DEFAULT 'info' CHECK (category IN ('promo', 'info', 'update', 'terms', 'program')),
    badge_text TEXT,
    banner_url TEXT,
    target_role TEXT NOT NULL DEFAULT 'all' CHECK (target_role IN ('all', 'researcher', 'subscribed_only')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_scheduled ON public.announcements(scheduled_at);

-- Seed Sample Announcements
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM public.users WHERE email = 'admin@modellyng.ac.id' LIMIT 1;

    IF NOT EXISTS (SELECT 1 FROM public.announcements LIMIT 1) THEN
        INSERT INTO public.announcements (title, content, summary, category, badge_text, status, published_at, created_by)
        VALUES 
            (
                'Diskon 50% Paket Pro Scholar Khusus Dies Natalis Telkom',
                'Dapatkan potongan harga spesial 50% untuk langganan Pro Scholar selama 3 bulan pertama. Nikmati ekstraksi 13 parameter tanpa batas dan ekspor matriks sintesis langsung ke format Word DOCX dan Excel!',
                'Promo spesial diskon 50% untuk peneliti kampus Telkom University.',
                'promo',
                'PROMO 50%',
                'published',
                NOW(),
                admin_id
            ),
            (
                'Pembaruan Algoritma Ekstraksi 13 Parameter Ilmiah v2.0',
                'Modellyng Web kini telah meningkatkan akurasi pendeteksian novelty dan celah riset menggunakan arsitektur 4-Batch Divide & Conquer yang lebih tahan halusinasi.',
                'Peningkatan akurasi pemrosesan dokumen akademik naskah jurnal.',
                'update',
                'NEW FEATURE',
                'published',
                NOW() - INTERVAL '2 days',
                admin_id
            ),
            (
                'Jadwal Pemeliharaan Server Rutin Akhir Pekan',
                'Sistem akan melakukan peningkatan kapasitas database Supabase PostgreSQL pada hari Sabtu pukul 02:00 - 03:00 WIB. Layanan tetap dapat diakses dengan mode read-only.',
                'Pemberitahuan jadwal pemeliharaan rutin server.',
                'info',
                'MAINTENANCE',
                'scheduled',
                NOW() + INTERVAL '3 days',
                admin_id
            );
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 5. USER NOTIFICATIONS TABLE (Job 4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'announcement',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id, is_read);


-- ----------------------------------------------------------------------------
-- 6. DYNAMIC API CONFIGURATIONS (Job 5)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT UNIQUE NOT NULL CHECK (provider IN ('gemini', 'groq', 'openai', 'anthropic')),
    display_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    api_key TEXT,
    priority INT NOT NULL DEFAULT 1,
    rpm_limit INT NOT NULL DEFAULT 15,
    tpm_limit INT NOT NULL DEFAULT 1000000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'rate_limited', 'invalid_key', 'unconfigured')),
    last_tested_at TIMESTAMPTZ,
    last_latency_ms INT,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed API Configurations for Gemini & Groq
INSERT INTO public.api_configurations (provider, display_name, model_name, api_key, priority, rpm_limit, tpm_limit, is_active, status)
VALUES 
    (
        'gemini',
        'Google Gemini AI (Core Provider)',
        'models/gemini-3.5-flash',
        'AIzaSy_masukkan_api_key_gemini_anda_disini',
        1,
        15,
        1000000,
        true,
        'operational'
    ),
    (
        'groq',
        'Groq Cloud AI (Backup Provider)',
        'qwen/qwen3.8-27b',
        'gsk_masukkan_api_key_groq_anda_disini',
        2,
        30,
        6000,
        true,
        'operational'
    )
ON CONFLICT (provider) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 7. ADMIN AUDIT LOGS (Job 6)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_time ON public.admin_audit_logs(created_at DESC);

-- Seed initial audit log
INSERT INTO public.admin_audit_logs (admin_email, action, target_type, details)
VALUES 
    ('admin@modellyng.ac.id', 'system_init', 'system', '{"message": "Inisialisasi sistem tata kelola admin, subscription CMS, dan API config berhasil."}'::jsonb);
