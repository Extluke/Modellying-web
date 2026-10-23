-- ============================================================================
-- MODELLYNG WEB MIGRATION 005: Full-Text Search & Hybrid Search Support
-- ============================================================================

-- 1. Tambahkan kolom Full-Text Search (tsvector) pada tabel paper_blocks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'paper_blocks' AND column_name = 'fts_tokens'
    ) THEN
        ALTER TABLE public.paper_blocks 
        ADD COLUMN fts_tokens tsvector 
        GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_paper_blocks_fts 
    ON public.paper_blocks USING gin(fts_tokens);

-- 2. Pastikan tabel chat_messages memiliki kolom citation_meta dan status yang fleksibel
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND column_name = 'citations'
    ) THEN
        ALTER TABLE public.chat_messages ADD COLUMN citations JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
