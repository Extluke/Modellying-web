-- ============================================================================
-- MODELLYNG WEB — DEDICATED DATABASE SCHEMA MIGRATION 001
-- Environment: Fresh Isolated Supabase for 'modellying-web'
-- Strict isolation: Never shared with legacy Flutter database!
-- ============================================================================

-- 1. Ensure Superuser Role & Required Extensions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
        CREATE ROLE supabase_admin WITH SUPERUSER LOGIN PASSWORD 'modellying_web_password';
    ELSE
        ALTER ROLE supabase_admin WITH SUPERUSER LOGIN PASSWORD 'modellying_web_password';
    END IF;
END
$$;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For fuzzy text matching in PDF evidence
CREATE EXTENSION IF NOT EXISTS "vector";     -- pgvector for Academic PDF RAG Chunks

-- 2. Trigger function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure Auth Schema & Mock Table for local independence
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOMAIN 1: USERS & RESEARCHER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,                     -- Argon2id hashed password
    full_name TEXT NOT NULL,
    institution TEXT,
    role TEXT NOT NULL DEFAULT 'researcher' CHECK (role IN ('researcher', 'admin')),
    citation_format TEXT NOT NULL DEFAULT 'APA' CHECK (citation_format IN ('APA', 'IEEE', 'Harvard', 'Chicago', 'MLA')),
    ai_confidence_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.80 CHECK (ai_confidence_threshold BETWEEN 0.0 AND 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- DOMAIN 2: RESEARCH PROJECTS (Hub Proyek Riset)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

CREATE TRIGGER set_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- DOMAIN 3: ACADEMIC PAPERS (Dokumen PDF Ilmiah)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    year INT,
    journal TEXT,
    doi TEXT,
    storage_path TEXT NOT NULL,           -- Bucket: modellying_web_papers
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    total_pages INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validating', 'processing', 'needs_review', 'ready', 'failed')),
    celery_task_id TEXT,
    error_message TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_papers_project_id ON public.papers(project_id);
CREATE INDEX IF NOT EXISTS idx_papers_status ON public.papers(status);

-- ============================================================================
-- DOMAIN 4: 11 COMPONENT EXTRACTION (Ekstraksi 11 Komponen Ilmiah)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.paper_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    component_type TEXT NOT NULL CHECK (component_type IN (
        'problem_statement',      -- 1. Rumusan Masalah
        'objective',              -- 2. Tujuan Penelitian
        'methodology',            -- 3. Metodologi / Pendekatan
        'sample_data',            -- 4. Sampel & Dataset
        'theoretical_framework',  -- 5. Landasan Teori
        'analysis_technique',     -- 6. Teknik Analisis Data
        'key_findings',           -- 7. Temuan Utama / Hasil
        'limitations',            -- 8. Keterbatasan Penelitian
        'future_work',            -- 9. Peluang Riset Masa Depan
        'research_gap',           -- 10. Celah Riset yang Ditutup
        'novelty'                 -- 11. Kebaruan / Kontribusi Ilmiah
    )),
    extracted_text TEXT NOT NULL,
    confidence_score NUMERIC(4,3) NOT NULL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('needs_review', 'accepted', 'edited', 'rejected')),
    ai_model_tag TEXT NOT NULL,            -- e.g. 'gemini-1.5-pro', 'gemini-1.5-flash', 'human'
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_components_paper_id ON public.paper_components(paper_id);
CREATE INDEX IF NOT EXISTS idx_components_type ON public.paper_components(component_type);
CREATE INDEX IF NOT EXISTS idx_components_status ON public.paper_components(status);

-- ============================================================================
-- DOMAIN 5: EVIDENCE QUOTES & PDF SPANS (Ketertelusuran Bukti Mutlak)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.evidence_spans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL REFERENCES public.paper_components(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    quote_text TEXT NOT NULL,
    char_start INT,
    char_end INT,
    bounding_box JSONB,                    -- Coordinates: {x, y, width, height} for PDF.js highlight
    fuzzy_match_score NUMERIC(4,3) DEFAULT 1.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_component_id ON public.evidence_spans(component_id);
CREATE INDEX IF NOT EXISTS idx_evidence_paper_page ON public.evidence_spans(paper_id, page_number);

-- ============================================================================
-- DOMAIN 6: VECTOR EMBEDDINGS (Project RAG & Semantic Search)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.paper_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,        -- 768-dim text-embedding-004 Gemini
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_paper_id ON public.paper_embeddings(paper_id);

-- ============================================================================
-- DOMAIN 7: COMPARATIVE MATRIX (Matriks Komparasi 10 Parameter)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comparative_matrix_cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    parameter_key TEXT NOT NULL,
    parameter_value TEXT NOT NULL,
    chapter_status_icon TEXT,             -- RemixIcon identifier
    evidence_id UUID REFERENCES public.evidence_spans(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, paper_id, parameter_key)
);

CREATE INDEX IF NOT EXISTS idx_matrix_project ON public.comparative_matrix_cells(project_id);

-- ============================================================================
-- DOMAIN 8: RESEARCH FLOW CANVAS & KNOWLEDGE GRAPH (Kanvas Grafis 4 Tahap & 2D)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.research_canvas_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('topic', 'theme', 'problem', 'solution')),
    label TEXT NOT NULL,
    description TEXT,
    position_x NUMERIC NOT NULL DEFAULT 0,
    position_y NUMERIC NOT NULL DEFAULT 0,
    is_gap BOOLEAN NOT NULL DEFAULT FALSE, -- FALSE: Solusi umum (hijau), TRUE: Celah riset langka (merah)
    connected_paper_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_canvas_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES public.research_canvas_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES public.research_canvas_nodes(id) ON DELETE CASCADE,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.knowledge_graph_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    concept_name TEXT NOT NULL,
    saturation_zone TEXT NOT NULL CHECK (saturation_zone IN ('low', 'medium', 'high')),
    frequency_count INT NOT NULL DEFAULT 1,
    position_x NUMERIC NOT NULL DEFAULT 0,
    position_y NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, concept_name)
);

-- ============================================================================
-- DOMAIN 9: RESEARCH NOVELTY & SYNTHESIS (Sintesis Tesis & Kebaruan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.research_syntheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    novelty_summary TEXT NOT NULL,
    proposed_titles JSONB NOT NULL,       -- Array of 3 proposed thesis titles
    problem_formulation TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- DOMAIN 10: DUAL RAG CHAT (Project RAG & Global Assistant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('project_rag', 'global_assistant')),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',         -- Array of { source_id: "S1", paper_id, page, quote }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_project_id ON public.chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON public.chat_messages(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — Multi-Tenant Privacy Isolation
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparative_matrix_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_canvas_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_canvas_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_syntheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view and edit their own profile"
ON public.users FOR ALL
USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can manage their own projects"
ON public.projects FOR ALL
USING (auth.uid() = user_id);

-- Papers policies
CREATE POLICY "Users can manage papers within their own projects"
ON public.papers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = papers.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Paper Components policies
CREATE POLICY "Users can view and review components in their papers"
ON public.paper_components FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.papers
        JOIN public.projects ON projects.id = papers.project_id
        WHERE papers.id = paper_components.paper_id
        AND projects.user_id = auth.uid()
    )
);

-- Evidence Spans policies
CREATE POLICY "Users can view evidence quotes in their papers"
ON public.evidence_spans FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.papers
        JOIN public.projects ON projects.id = papers.project_id
        WHERE papers.id = evidence_spans.paper_id
        AND projects.user_id = auth.uid()
    )
);

-- Paper Embeddings policies
CREATE POLICY "Users can query embeddings within their own papers"
ON public.paper_embeddings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.papers
        JOIN public.projects ON projects.id = papers.project_id
        WHERE papers.id = paper_embeddings.paper_id
        AND projects.user_id = auth.uid()
    )
);

-- Comparative Matrix policies
CREATE POLICY "Users can view and update matrix cells in their projects"
ON public.comparative_matrix_cells FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = comparative_matrix_cells.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Canvas Nodes & Edges policies
CREATE POLICY "Users can manage canvas nodes in their projects"
ON public.research_canvas_nodes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = research_canvas_nodes.project_id
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage canvas edges in their projects"
ON public.research_canvas_edges FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = research_canvas_edges.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Knowledge Graph policies
CREATE POLICY "Users can access knowledge graph concepts in their projects"
ON public.knowledge_graph_concepts FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = knowledge_graph_concepts.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Research Syntheses policies
CREATE POLICY "Users can access synthesis records in their projects"
ON public.research_syntheses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = research_syntheses.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Chat Messages policies
CREATE POLICY "Users can view and send their own chat messages"
ON public.chat_messages FOR ALL
USING (auth.uid() = user_id);
