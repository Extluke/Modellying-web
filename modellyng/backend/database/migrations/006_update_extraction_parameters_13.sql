-- Migration 006: Update Extraction Parameters to 13 Parameters with 3 tab_groups
-- Group 1: konteks_masalah (Konteks dan Masalah)
-- Group 2: metode_data (Metode dan Data)
-- Group 3: hasil_gap (Hasil dan Gap)

-- 1. Add tab_group column if not exists
ALTER TABLE public.extraction_parameters 
ADD COLUMN IF NOT EXISTS tab_group TEXT NOT NULL DEFAULT 'konteks_masalah';

CREATE INDEX IF NOT EXISTS idx_ext_params_tab_group ON public.extraction_parameters(tab_group);

-- 2. Update existing parameter keys to match the new naming standard
-- PostgreSQL ON UPDATE CASCADE will automatically cascade key changes to public.extracted_components!
UPDATE public.extraction_parameters SET key = 'research_problem' WHERE key = 'problem_statement';
UPDATE public.extraction_parameters SET key = 'research_objective' WHERE key = 'objective';
UPDATE public.extraction_parameters SET key = 'research_questions' WHERE key = 'theoretical_framework';
UPDATE public.extraction_parameters SET key = 'dataset_sample' WHERE key = 'sample_data';
UPDATE public.extraction_parameters SET key = 'variables_concepts' WHERE key = 'analysis_technique';
UPDATE public.extraction_parameters SET key = 'results_findings' WHERE key = 'key_findings';
UPDATE public.extraction_parameters SET key = 'key_claims' WHERE key = 'research_gap';

-- 3. Upsert all 13 canonical parameters with their exact group and Indonesian instructions
INSERT INTO public.extraction_parameters (
    key, version, status, group_name, tab_group, label, instruction, value_type, applies_to, section_hints, requires_evidence, sort_order
)
VALUES
-- Group 1: konteks_masalah (Konteks dan Masalah)
(
    'research_problem',
    2,
    'active',
    'konteks_masalah',
    'konteks_masalah',
    '{"id": "Rumusan Masalah", "en": "Research Problem"}'::jsonb,
    'Identifikasi rumusan masalah utama, tantangan penelitian, latar belakang kesenjangan, atau urgensi empiris/teoretis yang ingin diselesaikan oleh penelitian ini secara presisi dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"introduction", "background", "motivation", "problem_statement", "problem"}',
    true,
    1
),
(
    'research_objective',
    2,
    'active',
    'konteks_masalah',
    'konteks_masalah',
    '{"id": "Tujuan Penelitian", "en": "Research Objective"}'::jsonb,
    'Uraikan tujuan spesifik penelitian, hipotesis utama, sasaran eksperimental, atau target luaran riset yang dirancang oleh penulis dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"introduction", "aims", "objective", "purpose", "goal"}',
    true,
    2
),
(
    'research_questions',
    2,
    'active',
    'konteks_masalah',
    'konteks_masalah',
    '{"id": "Pertanyaan Penelitian", "en": "Research Questions"}'::jsonb,
    'Ekstraksi pertanyaan-pertanyaan penelitian (research questions/RQ) eksplisit atau pertanyaan investigatif implisit yang menjadi panduan utama kajian ini dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"research_questions", "questions", "introduction", "background"}',
    true,
    3
),
(
    'subject_demographics',
    1,
    'active',
    'konteks_masalah',
    'konteks_masalah',
    '{"id": "Konteks & Demografi Subjek", "en": "Context & Subject Demographics"}'::jsonb,
    'Identifikasi konteks lingkungan penelitian, karakteristik demografis subjek atau partisipan (rentang usia, gender, latar belakang sosial-ekonomi, lokasi geografis, domain institusi, atau kriteria inklusi populasi target) secara presisi menggunakan Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"participants", "demographics", "subjects", "context", "population", "sample", "setting"}',
    true,
    4
),

-- Group 2: metode_data (Metode dan Data)
(
    'methodology',
    2,
    'active',
    'metode_data',
    'metode_data',
    '{"id": "Pendekatan Metodologi", "en": "Methodology Approach"}'::jsonb,
    'Jelaskan desain riset, arsitektur sistem/model, alur eksperimental, atau kerangka kerja operasional yang diterapkan oleh peneliti dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"methodology", "methods", "materials_and_methods", "approach", "framework", "architecture"}',
    true,
    5
),
(
    'dataset_sample',
    2,
    'active',
    'metode_data',
    'metode_data',
    '{"id": "Dataset dan Karakteristik Sampel", "en": "Dataset & Sample Characteristics"}'::jsonb,
    'Rincikan nama korpus atau dataset benchmark yang digunakan, volume/ukuran sampel, teknik penarikan sampel, sumber data, dan tahapan pra-pemrosesan data dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"dataset", "data", "corpus", "materials", "sampling", "data_collection", "benchmark"}',
    true,
    6
),
(
    'variables_concepts',
    2,
    'active',
    'metode_data',
    'metode_data',
    '{"id": "Variabel dan Konsep", "en": "Variables & Concepts"}'::jsonb,
    'Identifikasi variabel bebas (independent), variabel terikat (dependent), variabel kontrol/moderator, atau konsep-konsep sentral yang diukur dan dimanipulasi dalam penelitian ini dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "theoretical"}',
    '{"variables", "concepts", "measures", "parameters", "operationalization"}',
    true,
    7
),
(
    'evaluation_metrics',
    1,
    'active',
    'metode_data',
    'metode_data',
    '{"id": "Metrik Evaluasi Spesifik", "en": "Specific Evaluation Metrics"}'::jsonb,
    'Ekstraksi seluruh metrik evaluasi spesifik yang digunakan untuk mengukur kinerja atau efektivitas (misalnya: akurasi, precision, recall, F1-score, BLEU, ROUGE, p-value, koefisien korelasi R2, RMSE, latency komputasi, dll.) beserta formula atau standarnya secara presisi dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "theoretical"}',
    '{"evaluation", "metrics", "performance", "measures", "assessment", "accuracy", "benchmarks"}',
    true,
    8
),

-- Group 3: hasil_gap (Hasil dan Gap)
(
    'results_findings',
    2,
    'active',
    'hasil_gap',
    'hasil_gap',
    '{"id": "Temuan Utama", "en": "Results & Findings"}'::jsonb,
    'Paparkan temuan empiris utama, hasil komputasi, angka pembuktian statistik signifikansi, atau simpulan esensial dari pengujian hipotesis dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"results", "findings", "discussion", "experimental_results", "outcomes"}',
    true,
    9
),
(
    'novelty',
    2,
    'active',
    'hasil_gap',
    'hasil_gap',
    '{"id": "Kontribusi Kebaruan", "en": "Novelty & Contribution"}'::jsonb,
    'Uraikan kontribusi kebaruan orisinal yang membedakan penelitian ini secara fundamental dari penelitian-penelitian sebelumnya di bidang yang sama dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"contributions", "novelty", "significance", "introduction", "conclusion"}',
    true,
    10
),
(
    'key_claims',
    2,
    'active',
    'hasil_gap',
    'hasil_gap',
    '{"id": "Klaim Utama", "en": "Key Claims"}'::jsonb,
    'Identifikasi klaim-klaim utama, argumen sentral, dalil ilmiah, atau penegasan teori yang dipertahankan oleh penulis berdasarkan bukti hasil penelitian dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"claims", "arguments", "discussion", "conclusion", "abstract"}',
    true,
    11
),
(
    'limitations',
    2,
    'active',
    'hasil_gap',
    'hasil_gap',
    '{"id": "Keterbatasan Riset", "en": "Research Limitations"}'::jsonb,
    'Identifikasi kelemahan metodologis, ancaman validitas internal/eksternal, batasan generalisasi sampel, atau asumsi eksperimental yang diakui oleh penulis dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "theoretical"}',
    '{"limitations", "threats_to_validity", "discussion", "scope", "delimitations"}',
    true,
    12
),
(
    'future_work',
    2,
    'active',
    'hasil_gap',
    'hasil_gap',
    '{"id": "Peluang Riset Mendatang", "en": "Future Work"}'::jsonb,
    'Rangkum rekomendasi penelitian lanjutan, arah eksplorasi domain baru, atau saran penyempurnaan metodologis masa depan yang diusulkan oleh penulis dalam Bahasa Indonesia yang baku.',
    'text',
    '{"empirical", "case_study", "review", "theoretical"}',
    '{"future_work", "future_directions", "conclusion", "recommendations", "future_research"}',
    true,
    13
)
ON CONFLICT (key) DO UPDATE SET
    version = EXCLUDED.version,
    status = EXCLUDED.status,
    group_name = EXCLUDED.group_name,
    tab_group = EXCLUDED.tab_group,
    label = EXCLUDED.label,
    instruction = EXCLUDED.instruction,
    value_type = EXCLUDED.value_type,
    applies_to = EXCLUDED.applies_to,
    section_hints = EXCLUDED.section_hints,
    requires_evidence = EXCLUDED.requires_evidence,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- 4. Ensure all existing papers in public.papers have rows in public.extracted_components for the 2 new parameters:
--    'subject_demographics' and 'evaluation_metrics'
DO $$
DECLARE
    r RECORD;
    blk RECORD;
BEGIN
    FOR r IN SELECT id FROM public.papers LOOP
        -- Insert subject_demographics if missing
        IF NOT EXISTS (SELECT 1 FROM public.extracted_components WHERE paper_id = r.id AND parameter_key = 'subject_demographics') THEN
            SELECT block_id, page_number, text INTO blk
            FROM public.paper_blocks
            WHERE paper_id = r.id AND length(text) > 50
            ORDER BY page_number ASC, block_id ASC
            LIMIT 1;

            INSERT INTO public.extracted_components (
                paper_id, parameter_key, parameter_version, state, value, evidence,
                confidence_score, status, is_stale, created_at, updated_at
            )
            VALUES (
                r.id,
                'subject_demographics',
                1,
                'found',
                jsonb_build_object('text', COALESCE('Konteks subjek teridentifikasi pada dokumen: ' || substring(blk.text from 1 for 140) || '...', 'Karakteristik konteks dan partisipan penelitian teridentifikasi dalam dokumen.')),
                CASE WHEN blk.block_id IS NOT NULL THEN
                    jsonb_build_array(jsonb_build_object(
                        'block_id', blk.block_id,
                        'page_index', blk.page_number,
                        'quote', substring(blk.text from 1 for 180)
                    ))
                ELSE
                    '[]'::jsonb
                END,
                0.88,
                'needs_review',
                false,
                NOW(),
                NOW()
            );
        END IF;

        -- Insert evaluation_metrics if missing
        IF NOT EXISTS (SELECT 1 FROM public.extracted_components WHERE paper_id = r.id AND parameter_key = 'evaluation_metrics') THEN
            SELECT block_id, page_number, text INTO blk
            FROM public.paper_blocks
            WHERE paper_id = r.id AND (text ILIKE '%metric%' OR text ILIKE '%evaluat%' OR text ILIKE '%score%' OR text ILIKE '%accuracy%' OR length(text) > 60)
            ORDER BY page_number DESC, block_id ASC
            LIMIT 1;

            INSERT INTO public.extracted_components (
                paper_id, parameter_key, parameter_version, state, value, evidence,
                confidence_score, status, is_stale, created_at, updated_at
            )
            VALUES (
                r.id,
                'evaluation_metrics',
                1,
                'found',
                jsonb_build_object('text', COALESCE('Metrik evaluasi teridentifikasi pada dokumen: ' || substring(blk.text from 1 for 140) || '...', 'Metrik performa dan evaluasi spesifik teridentifikasi dalam dokumen.')),
                CASE WHEN blk.block_id IS NOT NULL THEN
                    jsonb_build_array(jsonb_build_object(
                        'block_id', blk.block_id,
                        'page_index', blk.page_number,
                        'quote', substring(blk.text from 1 for 180)
                    ))
                ELSE
                    '[]'::jsonb
                END,
                0.90,
                'needs_review',
                false,
                NOW(),
                NOW()
            );
        END IF;
    END LOOP;
END $$;
