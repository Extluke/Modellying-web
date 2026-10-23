-- ============================================================================
-- MODELLYNG WEB MIGRATION 003: Dynamic Extraction Registry & Paper Pipeline
-- Sesuai Pedoman Arsitektur:
-- 1. Skema Ekstraksi Dinamis (JSONB + Registry)
-- 2. Pemisahan Status ('status') & Tahap Pipeline ('stage')
-- 3. Deteksi Duplikat SHA-256 per Proyek
-- 4. Observabilitas: Coverage, Doc Type, Run Metadata, Checkpoints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PEMBARUAN TABEL PAPERS (Aditif & Kompatibel Mundur)
-- ----------------------------------------------------------------------------

-- Hapus check constraint lama pada status jika ada
DO $$
BEGIN
    ALTER TABLE public.papers DROP CONSTRAINT IF EXISTS papers_status_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Perbarui check constraint status untuk mendukung 'needs_confirmation'
ALTER TABLE public.papers
    ADD CONSTRAINT papers_status_check 
    CHECK (status IN ('uploaded', 'validating', 'processing', 'needs_review', 'ready', 'failed', 'needs_confirmation'));

-- Tambahkan kolom pipeline dan metadata observabilitas jika belum ada
ALTER TABLE public.papers
    ADD COLUMN IF NOT EXISTS sha256 VARCHAR(64),
    ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS stage_detail JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS error JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS coverage JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS doc_type JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS run JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS checkpoint JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Indeks unik untuk pencegahan duplikat SHA-256 per proyek
CREATE UNIQUE INDEX IF NOT EXISTS idx_papers_project_sha256 
    ON public.papers(project_id, sha256) 
    WHERE sha256 IS NOT NULL;

-- Indeks performa untuk pemantauan Celery dan polling TanStack Query
CREATE INDEX IF NOT EXISTS idx_papers_stage ON public.papers(stage);
CREATE INDEX IF NOT EXISTS idx_papers_sha256 ON public.papers(sha256);
CREATE INDEX IF NOT EXISTS idx_papers_updated_at ON public.papers(updated_at DESC);

-- Trigger auto-update updated_at pada papers
DROP TRIGGER IF EXISTS trg_papers_updated_at ON public.papers;
CREATE TRIGGER trg_papers_updated_at
    BEFORE UPDATE ON public.papers
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();


-- ----------------------------------------------------------------------------
-- 2. TABEL REGISTRI PARAMETER EKSTRAKSI (Dynamic Parameter Registry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.extraction_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    version INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
    group_name TEXT NOT NULL DEFAULT 'method', -- 'core', 'method', 'findings', 'contribution'
    label JSONB NOT NULL,                     -- e.g. {"id": "Rumusan Masalah", "en": "Problem Statement"}
    instruction TEXT NOT NULL,                -- Deskripsi instruksi prompt LLM
    value_type TEXT NOT NULL DEFAULT 'text' CHECK (value_type IN ('text', 'list', 'number', 'enum', 'table')),
    applies_to TEXT[] NOT NULL DEFAULT '{"empirical", "case_study", "review", "theoretical"}',
    section_hints TEXT[] NOT NULL DEFAULT '{}',
    requires_evidence BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ext_params_status ON public.extraction_parameters(status);
CREATE INDEX IF NOT EXISTS idx_ext_params_sort ON public.extraction_parameters(sort_order);

DROP TRIGGER IF EXISTS trg_ext_params_updated_at ON public.extraction_parameters;
CREATE TRIGGER trg_ext_params_updated_at
    BEFORE UPDATE ON public.extraction_parameters
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();


-- ----------------------------------------------------------------------------
-- 3. SEED 11 PARAMETER RESMI MODELLYNG (Fondasi Berversi & Dapat Ditambah)
-- ----------------------------------------------------------------------------
INSERT INTO public.extraction_parameters (key, version, status, group_name, label, instruction, value_type, applies_to, section_hints, requires_evidence, sort_order)
VALUES
(
    'problem_statement',
    1,
    'active',
    'core',
    '{"id": "Rumusan Masalah", "en": "Problem Statement"}'::jsonb,
    'Identifikasi masalah utama, tantangan riset, atau urgensi masalah empiris/teoretis yang ingin dipecahkan oleh penelitian.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"introduction", "background", "motivation"}',
    true,
    1
),
(
    'objective',
    1,
    'active',
    'core',
    '{"id": "Tujuan Penelitian", "en": "Research Objective"}'::jsonb,
    'Tujuan utama, hipotesis spesifik, atau sasaran eksperimental yang ingin dicapai melalui artikel ilmiah ini.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"introduction", "aims", "objective"}',
    true,
    2
),
(
    'methodology',
    1,
    'active',
    'method',
    '{"id": "Metodologi / Desain Riset", "en": "Methodology"}'::jsonb,
    'Desain penelitian, arsitektur model, pendekatan eksperimen, atau kerangka operasional kerja yang diterapkan.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"methodology", "methods", "materials_and_methods", "approach"}',
    true,
    3
),
(
    'sample_data',
    1,
    'active',
    'method',
    '{"id": "Sampel & Dataset", "en": "Sample & Dataset"}'::jsonb,
    'Ukuran sampel partisipan, karakteristik dataset benchmark, kriteria inklusi/eksklusi, atau sumber korpus data.',
    'text',
    '{"empirical", "case_study"}',
    '{"dataset", "participants", "sampling", "materials"}',
    true,
    4
),
(
    'theoretical_framework',
    1,
    'active',
    'core',
    '{"id": "Landasan Teori", "en": "Theoretical Framework"}'::jsonb,
    'Teori dasar, model konseptual, atau paradigma ilmiah yang menjadi rujukan utama logika penelitian.',
    'text',
    '{"empirical", "theoretical", "review"}',
    '{"literature_review", "theoretical_foundation", "background"}',
    true,
    5
),
(
    'analysis_technique',
    1,
    'active',
    'method',
    '{"id": "Teknik Analisis Data", "en": "Data Analysis Technique"}'::jsonb,
    'Metode analisis statistik kuantitatif, analisis tematik kualitatif, algoritma machine learning, atau metrik evaluasi yang digunakan.',
    'text',
    '{"empirical", "case_study"}',
    '{"data_analysis", "evaluation_metrics", "statistical_analysis"}',
    true,
    6
),
(
    'key_findings',
    1,
    'active',
    'findings',
    '{"id": "Temuan Utama / Hasil", "en": "Key Findings"}'::jsonb,
    'Hasil temuan paling signifikan, angka pembuktian statistik, performa model komputasi, atau jawaban atas rumusan masalah.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"results", "findings", "discussion"}',
    true,
    7
),
(
    'limitations',
    1,
    'active',
    'findings',
    '{"id": "Keterbatasan Penelitian", "en": "Research Limitations"}'::jsonb,
    'Batasan metodologis, bias data, kendala generalisasi sampel, atau asumsi komputasi yang tidak terpenuhi.',
    'text',
    '{"empirical", "case_study", "theoretical"}',
    '{"limitations", "threats_to_validity", "discussion"}',
    true,
    8
),
(
    'future_work',
    1,
    'active',
    'contribution',
    '{"id": "Peluang Riset Masa Depan", "en": "Future Work"}'::jsonb,
    'Saran investigasi lanjutan, perbaikan metode berikutnya, atau eksplorasi domain yang direkomendasikan oleh penulis.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"future_work", "future_directions", "conclusion"}',
    true,
    9
),
(
    'research_gap',
    1,
    'active',
    'contribution',
    '{"id": "Celah Riset yang Ditutup", "en": "Research Gap"}'::jsonb,
    'Kekosongan literatur, kelemahan studi terdahulu, atau celah empiris/teoretis yang secara nyata berhasil dijawab oleh paper ini.',
    'text',
    '{"empirical", "review", "theoretical"}',
    '{"introduction", "related_work", "discussion"}',
    true,
    10
),
(
    'novelty',
    1,
    'active',
    'contribution',
    '{"id": "Kebaruan & Kontribusi Ilmiah", "en": "Novelty & Scientific Contribution"}'::jsonb,
    'Kontribusi orisinal yang membedakan riset ini secara fundamental dari penelitian sebelumnya di bidang yang sama.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"introduction", "contributions", "conclusion"}',
    true,
    11
)
ON CONFLICT (key) DO UPDATE SET
    version = EXCLUDED.version,
    instruction = EXCLUDED.instruction,
    label = EXCLUDED.label,
    group_name = EXCLUDED.group_name,
    section_hints = EXCLUDED.section_hints,
    sort_order = EXCLUDED.sort_order;


-- ----------------------------------------------------------------------------
-- 4. TABEL KOMPONEN EKSTRAKSI DINAMIS (Generic JSONB extracted_components)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.extracted_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    parameter_key TEXT NOT NULL REFERENCES public.extraction_parameters(key) ON UPDATE CASCADE,
    parameter_version INT NOT NULL DEFAULT 1,
    state TEXT NOT NULL DEFAULT 'found' CHECK (state IN ('found', 'not_found', 'not_applicable')),
    value JSONB NOT NULL,                  -- Flexible JSONB: {"text": "...", "items": [...], "data": ...}
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of evidence: [{"block_id": "...", "page_index": 1, "page_label": "4", "quote": "..."}]
    confidence_score NUMERIC(4,3) CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('needs_review', 'accepted', 'edited', 'rejected')),
    reviewer_notes TEXT,
    is_stale BOOLEAN NOT NULL DEFAULT false, -- Ditandai true jika versi parameter di registry dinaikkan
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_paper_parameter UNIQUE (paper_id, parameter_key)
);

CREATE INDEX IF NOT EXISTS idx_extracted_paper_id ON public.extracted_components(paper_id);
CREATE INDEX IF NOT EXISTS idx_extracted_param_key ON public.extracted_components(parameter_key);
CREATE INDEX IF NOT EXISTS idx_extracted_status ON public.extracted_components(status);
CREATE INDEX IF NOT EXISTS idx_extracted_state ON public.extracted_components(state);

DROP TRIGGER IF EXISTS trg_extracted_components_updated_at ON public.extracted_components;
CREATE TRIGGER trg_extracted_components_updated_at
    BEFORE UPDATE ON public.extracted_components
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();


-- ----------------------------------------------------------------------------
-- 5. STORAGE BUCKET: modellying_web_papers (Akses Privat Terisolasi)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'modellying_web_papers',
            'modellying_web_papers',
            false,
            52428800, -- 50 MB
            ARRAY['application/pdf']
        )
        ON CONFLICT (id) DO UPDATE SET
            public = false,
            file_size_limit = 52428800,
            allowed_mime_types = ARRAY['application/pdf'];
    END IF;
END $$;
