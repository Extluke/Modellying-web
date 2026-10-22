-- ============================================================================
-- MODELLYNG WEB — MIGRATION 002: PASSWORD RESET TOKENS
-- Environment: Fresh Isolated Supabase for 'modellying-web'
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON public.password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON public.password_reset_tokens(user_id);
