-- ============================================================================
-- MIGRATION 007: Add Source Verification Column to Papers
-- Modellyng Web - Evidence-Centered Academic PDF Analysis
-- ============================================================================

ALTER TABLE public.papers 
ADD COLUMN IF NOT EXISTS source_verification JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_papers_source_verification 
ON public.papers USING gin (source_verification);
