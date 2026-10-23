-- ============================================================================
-- MODELLYNG WEB MIGRATION 004: Paper Blocks & Vector HNSW Indexing
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Table for canonical text blocks with bounding box coordinates for PDF.js highlight
CREATE TABLE IF NOT EXISTS public.paper_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    block_id TEXT NOT NULL,
    page_number INT NOT NULL,
    bbox JSONB NOT NULL,                   -- [x0, y0, x1, y1] in points
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_paper_block UNIQUE (paper_id, block_id)
);

CREATE INDEX IF NOT EXISTS idx_paper_blocks_paper_id ON public.paper_blocks(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_blocks_page ON public.paper_blocks(paper_id, page_number);

-- 2. Ensure RLS on paper_blocks
ALTER TABLE public.paper_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'paper_blocks' AND policyname = 'Users can view blocks in their papers'
    ) THEN
        CREATE POLICY "Users can view blocks in their papers"
        ON public.paper_blocks FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.papers
                JOIN public.projects ON projects.id = papers.project_id
                WHERE papers.id = paper_blocks.paper_id
                AND projects.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 3. HNSW vector index for high-speed RAG semantic search on paper_embeddings
CREATE INDEX IF NOT EXISTS idx_paper_embeddings_hnsw 
    ON public.paper_embeddings 
    USING hnsw (embedding vector_cosine_ops);
