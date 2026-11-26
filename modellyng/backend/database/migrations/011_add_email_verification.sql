-- ============================================================================
-- MODELLYNG WEB — DATABASE SCHEMA MIGRATION 011
-- Domain: Email Verification on Registration (OTP 6-Digit & Magic Link Tokens)
-- Zero-regression: Existing and admin-created accounts default to email_verified = TRUE.
-- ============================================================================

BEGIN;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

UPDATE public.users
SET email_verified_at = COALESCE(email_verified_at, created_at, NOW())
WHERE email_verified = TRUE AND email_verified_at IS NULL;

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    otp_code_hash TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verif_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_email ON public.email_verification_tokens(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_email_verif_expires ON public.email_verification_tokens(expires_at);

COMMIT;
