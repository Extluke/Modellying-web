--
-- PostgreSQL database dump
--

\restrict NL8WxayaNWpPNTdNTsLliM4buH5IPKHDtcN6yRvuH6rqWGMaAv02W87KPpHf5OS

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP PUBLICATION IF EXISTS supabase_realtime;
DROP POLICY IF EXISTS "Users can view evidence quotes in their papers" ON public.evidence_spans;
DROP POLICY IF EXISTS "Users can view blocks in their papers" ON public.paper_blocks;
DROP POLICY IF EXISTS "Users can view and update matrix cells in their projects" ON public.comparative_matrix_cells;
DROP POLICY IF EXISTS "Users can view and send their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view and review components in their papers" ON public.paper_components;
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can query embeddings within their own papers" ON public.paper_embeddings;
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage papers within their own projects" ON public.papers;
DROP POLICY IF EXISTS "Users can manage canvas nodes in their projects" ON public.research_canvas_nodes;
DROP POLICY IF EXISTS "Users can manage canvas edges in their projects" ON public.research_canvas_edges;
DROP POLICY IF EXISTS "Users can access synthesis records in their projects" ON public.research_syntheses;
DROP POLICY IF EXISTS "Users can access knowledge graph concepts in their projects" ON public.knowledge_graph_concepts;
ALTER TABLE IF EXISTS ONLY public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_notifications DROP CONSTRAINT IF EXISTS user_notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_notifications DROP CONSTRAINT IF EXISTS user_notifications_announcement_id_fkey;
ALTER TABLE IF EXISTS ONLY public.research_syntheses DROP CONSTRAINT IF EXISTS research_syntheses_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.research_canvas_nodes DROP CONSTRAINT IF EXISTS research_canvas_nodes_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.research_canvas_edges DROP CONSTRAINT IF EXISTS research_canvas_edges_target_node_id_fkey;
ALTER TABLE IF EXISTS ONLY public.research_canvas_edges DROP CONSTRAINT IF EXISTS research_canvas_edges_source_node_id_fkey;
ALTER TABLE IF EXISTS ONLY public.research_canvas_edges DROP CONSTRAINT IF EXISTS research_canvas_edges_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.papers DROP CONSTRAINT IF EXISTS papers_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.paper_embeddings DROP CONSTRAINT IF EXISTS paper_embeddings_paper_id_fkey;
ALTER TABLE IF EXISTS ONLY public.paper_components DROP CONSTRAINT IF EXISTS paper_components_paper_id_fkey;
ALTER TABLE IF EXISTS ONLY public.paper_blocks DROP CONSTRAINT IF EXISTS paper_blocks_paper_id_fkey;
ALTER TABLE IF EXISTS ONLY public.knowledge_graph_concepts DROP CONSTRAINT IF EXISTS knowledge_graph_concepts_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.extracted_components DROP CONSTRAINT IF EXISTS extracted_components_parameter_key_fkey;
ALTER TABLE IF EXISTS ONLY public.extracted_components DROP CONSTRAINT IF EXISTS extracted_components_paper_id_fkey;
ALTER TABLE IF EXISTS ONLY public.evidence_spans DROP CONSTRAINT IF EXISTS evidence_spans_paper_id_fkey;
ALTER TABLE IF EXISTS ONLY public.evidence_spans DROP CONSTRAINT IF EXISTS evidence_spans_component_id_fkey;
ALTER TABLE IF EXISTS ONLY public.comparative_matrix_cells DROP CONSTRAINT IF EXISTS comparative_matrix_cells_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.comparative_matrix_cells DROP CONSTRAINT IF EXISTS comparative_matrix_cells_paper_id_fkey;
ALTER TABLE IF EXISTS ONLY public.comparative_matrix_cells DROP CONSTRAINT IF EXISTS comparative_matrix_cells_evidence_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bug_reports DROP CONSTRAINT IF EXISTS bug_reports_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bug_reports DROP CONSTRAINT IF EXISTS bug_reports_resolved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.api_configurations DROP CONSTRAINT IF EXISTS api_configurations_updated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.announcements DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_admin_id_fkey;
DROP TRIGGER IF EXISTS trg_papers_updated_at ON public.papers;
DROP TRIGGER IF EXISTS trg_extracted_components_updated_at ON public.extracted_components;
DROP TRIGGER IF EXISTS trg_ext_params_updated_at ON public.extraction_parameters;
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
DROP INDEX IF EXISTS public.idx_users_subscription_tier;
DROP INDEX IF EXISTS public.idx_users_status;
DROP INDEX IF EXISTS public.idx_user_subscriptions_user;
DROP INDEX IF EXISTS public.idx_user_subscriptions_status;
DROP INDEX IF EXISTS public.idx_user_notifications_user;
DROP INDEX IF EXISTS public.idx_subscription_plans_active;
DROP INDEX IF EXISTS public.idx_reset_tokens_user;
DROP INDEX IF EXISTS public.idx_reset_tokens_expires;
DROP INDEX IF EXISTS public.idx_projects_user_id;
DROP INDEX IF EXISTS public.idx_papers_updated_at;
DROP INDEX IF EXISTS public.idx_papers_status;
DROP INDEX IF EXISTS public.idx_papers_stage;
DROP INDEX IF EXISTS public.idx_papers_source_verification;
DROP INDEX IF EXISTS public.idx_papers_sha256;
DROP INDEX IF EXISTS public.idx_papers_project_sha256;
DROP INDEX IF EXISTS public.idx_papers_project_id;
DROP INDEX IF EXISTS public.idx_paper_embeddings_hnsw;
DROP INDEX IF EXISTS public.idx_paper_blocks_paper_id;
DROP INDEX IF EXISTS public.idx_paper_blocks_page;
DROP INDEX IF EXISTS public.idx_paper_blocks_fts;
DROP INDEX IF EXISTS public.idx_matrix_project;
DROP INDEX IF EXISTS public.idx_extracted_status;
DROP INDEX IF EXISTS public.idx_extracted_state;
DROP INDEX IF EXISTS public.idx_extracted_param_key;
DROP INDEX IF EXISTS public.idx_extracted_paper_id;
DROP INDEX IF EXISTS public.idx_ext_params_tab_group;
DROP INDEX IF EXISTS public.idx_ext_params_status;
DROP INDEX IF EXISTS public.idx_ext_params_sort;
DROP INDEX IF EXISTS public.idx_evidence_paper_page;
DROP INDEX IF EXISTS public.idx_evidence_component_id;
DROP INDEX IF EXISTS public.idx_embeddings_paper_id;
DROP INDEX IF EXISTS public.idx_components_type;
DROP INDEX IF EXISTS public.idx_components_status;
DROP INDEX IF EXISTS public.idx_components_paper_id;
DROP INDEX IF EXISTS public.idx_chat_user_id;
DROP INDEX IF EXISTS public.idx_chat_project_id;
DROP INDEX IF EXISTS public.idx_bug_reports_user;
DROP INDEX IF EXISTS public.idx_bug_reports_status;
DROP INDEX IF EXISTS public.idx_announcements_status;
DROP INDEX IF EXISTS public.idx_announcements_scheduled;
DROP INDEX IF EXISTS public.idx_admin_audit_logs_time;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.user_notifications DROP CONSTRAINT IF EXISTS user_notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.extracted_components DROP CONSTRAINT IF EXISTS uq_paper_parameter;
ALTER TABLE IF EXISTS ONLY public.paper_blocks DROP CONSTRAINT IF EXISTS uq_paper_block;
ALTER TABLE IF EXISTS ONLY public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_code_key;
ALTER TABLE IF EXISTS ONLY public.research_syntheses DROP CONSTRAINT IF EXISTS research_syntheses_pkey;
ALTER TABLE IF EXISTS ONLY public.research_canvas_nodes DROP CONSTRAINT IF EXISTS research_canvas_nodes_pkey;
ALTER TABLE IF EXISTS ONLY public.research_canvas_edges DROP CONSTRAINT IF EXISTS research_canvas_edges_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.papers DROP CONSTRAINT IF EXISTS papers_pkey;
ALTER TABLE IF EXISTS ONLY public.paper_embeddings DROP CONSTRAINT IF EXISTS paper_embeddings_pkey;
ALTER TABLE IF EXISTS ONLY public.paper_components DROP CONSTRAINT IF EXISTS paper_components_pkey;
ALTER TABLE IF EXISTS ONLY public.paper_blocks DROP CONSTRAINT IF EXISTS paper_blocks_pkey;
ALTER TABLE IF EXISTS ONLY public.knowledge_graph_concepts DROP CONSTRAINT IF EXISTS knowledge_graph_concepts_project_id_concept_name_key;
ALTER TABLE IF EXISTS ONLY public.knowledge_graph_concepts DROP CONSTRAINT IF EXISTS knowledge_graph_concepts_pkey;
ALTER TABLE IF EXISTS ONLY public.extraction_parameters DROP CONSTRAINT IF EXISTS extraction_parameters_pkey;
ALTER TABLE IF EXISTS ONLY public.extraction_parameters DROP CONSTRAINT IF EXISTS extraction_parameters_key_key;
ALTER TABLE IF EXISTS ONLY public.extracted_components DROP CONSTRAINT IF EXISTS extracted_components_pkey;
ALTER TABLE IF EXISTS ONLY public.evidence_spans DROP CONSTRAINT IF EXISTS evidence_spans_pkey;
ALTER TABLE IF EXISTS ONLY public.comparative_matrix_cells DROP CONSTRAINT IF EXISTS comparative_matrix_cells_project_id_paper_id_parameter_key_key;
ALTER TABLE IF EXISTS ONLY public.comparative_matrix_cells DROP CONSTRAINT IF EXISTS comparative_matrix_cells_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.bug_reports DROP CONSTRAINT IF EXISTS bug_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.api_configurations DROP CONSTRAINT IF EXISTS api_configurations_provider_key;
ALTER TABLE IF EXISTS ONLY public.api_configurations DROP CONSTRAINT IF EXISTS api_configurations_pkey;
ALTER TABLE IF EXISTS ONLY public.announcements DROP CONSTRAINT IF EXISTS announcements_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_email_key;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_subscriptions;
DROP TABLE IF EXISTS public.user_notifications;
DROP TABLE IF EXISTS public.subscription_plans;
DROP TABLE IF EXISTS public.research_syntheses;
DROP TABLE IF EXISTS public.research_canvas_nodes;
DROP TABLE IF EXISTS public.research_canvas_edges;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP TABLE IF EXISTS public.papers;
DROP TABLE IF EXISTS public.paper_embeddings;
DROP TABLE IF EXISTS public.paper_components;
DROP TABLE IF EXISTS public.paper_blocks;
DROP TABLE IF EXISTS public.knowledge_graph_concepts;
DROP TABLE IF EXISTS public.extraction_parameters;
DROP TABLE IF EXISTS public.extracted_components;
DROP TABLE IF EXISTS public.evidence_spans;
DROP TABLE IF EXISTS public.comparative_matrix_cells;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.bug_reports;
DROP TABLE IF EXISTS public.api_configurations;
DROP TABLE IF EXISTS public.announcements;
DROP TABLE IF EXISTS public.admin_audit_logs;
DROP TABLE IF EXISTS auth.users;
DROP FUNCTION IF EXISTS public.update_timestamp_column();
DROP FUNCTION IF EXISTS pgbouncer.get_auth(p_usename text);
DROP FUNCTION IF EXISTS auth.uid();
DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS pg_trgm;
DROP SCHEMA IF EXISTS pgbouncer;
DROP SCHEMA IF EXISTS extensions;
DROP SCHEMA IF EXISTS auth;
--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO postgres;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: postgres
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$;


ALTER FUNCTION auth.uid() OWNER TO postgres;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: postgres
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO postgres;

--
-- Name: update_timestamp_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE auth.users OWNER TO postgres;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    admin_email text NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_audit_logs OWNER TO postgres;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    summary text,
    category text DEFAULT 'info'::text NOT NULL,
    badge_text text,
    banner_url text,
    target_role text DEFAULT 'all'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    scheduled_at timestamp with time zone,
    published_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT announcements_category_check CHECK ((category = ANY (ARRAY['promo'::text, 'info'::text, 'update'::text, 'terms'::text, 'program'::text]))),
    CONSTRAINT announcements_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'archived'::text]))),
    CONSTRAINT announcements_target_role_check CHECK ((target_role = ANY (ARRAY['all'::text, 'researcher'::text, 'subscribed_only'::text])))
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: api_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    display_name text NOT NULL,
    model_name text NOT NULL,
    api_key text,
    priority integer DEFAULT 1 NOT NULL,
    rpm_limit integer DEFAULT 15 NOT NULL,
    tpm_limit integer DEFAULT 1000000 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    status text DEFAULT 'operational'::text NOT NULL,
    last_tested_at timestamp with time zone,
    last_latency_ms integer,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT api_configurations_provider_check CHECK ((provider = ANY (ARRAY['gemini'::text, 'groq'::text, 'openai'::text, 'anthropic'::text]))),
    CONSTRAINT api_configurations_status_check CHECK ((status = ANY (ARRAY['operational'::text, 'rate_limited'::text, 'invalid_key'::text, 'unconfigured'::text])))
);


ALTER TABLE public.api_configurations OWNER TO postgres;

--
-- Name: bug_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bug_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    page_url text,
    severity text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    admin_notes text,
    resolved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    CONSTRAINT bug_reports_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT bug_reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved'::text, 'closed'::text])))
);


ALTER TABLE public.bug_reports OWNER TO postgres;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid,
    scope text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    citations jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text]))),
    CONSTRAINT chat_messages_scope_check CHECK ((scope = ANY (ARRAY['project_rag'::text, 'global_assistant'::text])))
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: comparative_matrix_cells; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comparative_matrix_cells (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    paper_id uuid NOT NULL,
    parameter_key text NOT NULL,
    parameter_value text NOT NULL,
    chapter_status_icon text,
    evidence_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comparative_matrix_cells OWNER TO postgres;

--
-- Name: evidence_spans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evidence_spans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    component_id uuid NOT NULL,
    paper_id uuid NOT NULL,
    page_number integer NOT NULL,
    quote_text text NOT NULL,
    char_start integer,
    char_end integer,
    bounding_box jsonb,
    fuzzy_match_score numeric(4,3) DEFAULT 1.000,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.evidence_spans OWNER TO postgres;

--
-- Name: extracted_components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extracted_components (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    paper_id uuid NOT NULL,
    parameter_key text NOT NULL,
    parameter_version integer DEFAULT 1 NOT NULL,
    state text DEFAULT 'found'::text NOT NULL,
    value jsonb NOT NULL,
    evidence jsonb DEFAULT '[]'::jsonb NOT NULL,
    confidence_score numeric(4,3),
    status text DEFAULT 'needs_review'::text NOT NULL,
    reviewer_notes text,
    is_stale boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT extracted_components_confidence_score_check CHECK (((confidence_score >= 0.0) AND (confidence_score <= 1.0))),
    CONSTRAINT extracted_components_state_check CHECK ((state = ANY (ARRAY['found'::text, 'not_found'::text, 'not_applicable'::text]))),
    CONSTRAINT extracted_components_status_check CHECK ((status = ANY (ARRAY['needs_review'::text, 'accepted'::text, 'edited'::text, 'rejected'::text])))
);


ALTER TABLE public.extracted_components OWNER TO postgres;

--
-- Name: extraction_parameters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extraction_parameters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    group_name text DEFAULT 'method'::text NOT NULL,
    label jsonb NOT NULL,
    instruction text NOT NULL,
    value_type text DEFAULT 'text'::text NOT NULL,
    applies_to text[] DEFAULT '{empirical,case_study,review,theoretical}'::text[] NOT NULL,
    section_hints text[] DEFAULT '{}'::text[] NOT NULL,
    requires_evidence boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tab_group text DEFAULT 'konteks_masalah'::text NOT NULL,
    CONSTRAINT extraction_parameters_status_check CHECK ((status = ANY (ARRAY['active'::text, 'deprecated'::text]))),
    CONSTRAINT extraction_parameters_value_type_check CHECK ((value_type = ANY (ARRAY['text'::text, 'list'::text, 'number'::text, 'enum'::text, 'table'::text])))
);


ALTER TABLE public.extraction_parameters OWNER TO postgres;

--
-- Name: knowledge_graph_concepts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_graph_concepts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    concept_name text NOT NULL,
    saturation_zone text NOT NULL,
    frequency_count integer DEFAULT 1 NOT NULL,
    position_x numeric DEFAULT 0 NOT NULL,
    position_y numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT knowledge_graph_concepts_saturation_zone_check CHECK ((saturation_zone = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


ALTER TABLE public.knowledge_graph_concepts OWNER TO postgres;

--
-- Name: paper_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paper_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    paper_id uuid NOT NULL,
    block_id text NOT NULL,
    page_number integer NOT NULL,
    bbox jsonb NOT NULL,
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    fts_tokens tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, text)) STORED
);


ALTER TABLE public.paper_blocks OWNER TO postgres;

--
-- Name: paper_components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paper_components (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    paper_id uuid NOT NULL,
    component_type text NOT NULL,
    extracted_text text NOT NULL,
    confidence_score numeric(4,3) NOT NULL,
    status text DEFAULT 'needs_review'::text NOT NULL,
    ai_model_tag text NOT NULL,
    reviewer_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    CONSTRAINT paper_components_component_type_check CHECK ((component_type = ANY (ARRAY['problem_statement'::text, 'objective'::text, 'methodology'::text, 'sample_data'::text, 'theoretical_framework'::text, 'analysis_technique'::text, 'key_findings'::text, 'limitations'::text, 'future_work'::text, 'research_gap'::text, 'novelty'::text]))),
    CONSTRAINT paper_components_confidence_score_check CHECK (((confidence_score >= 0.0) AND (confidence_score <= 1.0))),
    CONSTRAINT paper_components_status_check CHECK ((status = ANY (ARRAY['needs_review'::text, 'accepted'::text, 'edited'::text, 'rejected'::text])))
);


ALTER TABLE public.paper_components OWNER TO postgres;

--
-- Name: paper_embeddings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paper_embeddings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    paper_id uuid NOT NULL,
    chunk_index integer NOT NULL,
    page_number integer NOT NULL,
    content text NOT NULL,
    embedding public.vector(768) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.paper_embeddings OWNER TO postgres;

--
-- Name: papers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.papers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    authors text[] DEFAULT '{}'::text[] NOT NULL,
    year integer,
    journal text,
    doi text,
    storage_path text NOT NULL,
    file_name text NOT NULL,
    file_size_bytes bigint NOT NULL,
    total_pages integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'uploaded'::text NOT NULL,
    celery_task_id text,
    error_message text,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    sha256 character varying(64),
    stage text,
    stage_detail jsonb,
    error jsonb,
    warnings jsonb DEFAULT '[]'::jsonb NOT NULL,
    coverage jsonb,
    doc_type jsonb,
    run jsonb,
    checkpoint jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_verification jsonb,
    CONSTRAINT papers_status_check CHECK ((status = ANY (ARRAY['uploaded'::text, 'validating'::text, 'processing'::text, 'needs_review'::text, 'ready'::text, 'failed'::text, 'needs_confirmation'::text])))
);


ALTER TABLE public.papers OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    token text NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: research_canvas_edges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.research_canvas_edges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    source_node_id uuid NOT NULL,
    target_node_id uuid NOT NULL,
    label text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.research_canvas_edges OWNER TO postgres;

--
-- Name: research_canvas_nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.research_canvas_nodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    stage text NOT NULL,
    label text NOT NULL,
    description text,
    position_x numeric DEFAULT 0 NOT NULL,
    position_y numeric DEFAULT 0 NOT NULL,
    is_gap boolean DEFAULT false NOT NULL,
    connected_paper_ids uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT research_canvas_nodes_stage_check CHECK ((stage = ANY (ARRAY['topic'::text, 'theme'::text, 'problem'::text, 'solution'::text])))
);


ALTER TABLE public.research_canvas_nodes OWNER TO postgres;

--
-- Name: research_syntheses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.research_syntheses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    novelty_summary text NOT NULL,
    proposed_titles jsonb NOT NULL,
    problem_formulation text NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.research_syntheses OWNER TO postgres;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(12,2) DEFAULT 0.00 NOT NULL,
    currency text DEFAULT 'IDR'::text NOT NULL,
    billing_period text DEFAULT 'monthly'::text NOT NULL,
    paper_limit_per_month integer DEFAULT 5 NOT NULL,
    ai_query_limit_per_day integer DEFAULT 20 NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_popular boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscription_plans_billing_period_check CHECK ((billing_period = ANY (ARRAY['free'::text, 'monthly'::text, 'annual'::text, 'lifetime'::text])))
);


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    announcement_id uuid,
    title text NOT NULL,
    message text NOT NULL,
    category text DEFAULT 'announcement'::text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_notifications OWNER TO postgres;

--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    amount_paid numeric(12,2) DEFAULT 0.00 NOT NULL,
    payment_method text DEFAULT 'qris_manual'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'trial'::text])))
);


ALTER TABLE public.user_subscriptions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text,
    full_name text NOT NULL,
    institution text,
    role text DEFAULT 'researcher'::text NOT NULL,
    citation_format text DEFAULT 'APA'::text NOT NULL,
    ai_confidence_threshold numeric(3,2) DEFAULT 0.80 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    suspension_reason text,
    admin_role text DEFAULT 'admin'::text,
    admin_permissions jsonb DEFAULT '["all"]'::jsonb NOT NULL,
    subscription_tier text DEFAULT 'free'::text NOT NULL,
    CONSTRAINT users_admin_role_check CHECK ((admin_role = ANY (ARRAY['super_admin'::text, 'support_admin'::text, 'content_admin'::text, 'admin'::text]))),
    CONSTRAINT users_ai_confidence_threshold_check CHECK (((ai_confidence_threshold >= 0.0) AND (ai_confidence_threshold <= 1.0))),
    CONSTRAINT users_citation_format_check CHECK ((citation_format = ANY (ARRAY['APA'::text, 'IEEE'::text, 'Harvard'::text, 'Chicago'::text, 'MLA'::text]))),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['researcher'::text, 'admin'::text]))),
    CONSTRAINT users_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'deactivated'::text]))),
    CONSTRAINT users_subscription_tier_check CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.users (id, email, created_at) FROM stdin;
\.


--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit_logs (id, admin_id, admin_email, action, target_type, target_id, details, created_at) FROM stdin;
6c3e6809-7039-42ed-8f53-3c5c6e0cd9ef	\N	admin@modellyng.ac.id	system_init	system	\N	{"message": "Inisialisasi sistem tata kelola admin, subscription CMS, dan API config berhasil."}	2026-10-27 15:19:27.683114+00
9ec16a1c-3c67-4276-b9f7-05cbea2e9d79	5b8efa4d-4ea6-4c60-8c71-7a8569f24e22	admin@modellyng.ac.id	update_bug_report	bug_report	df6c5dc6-fd83-4c7b-a638-cb24adf24e51	{"notes": "", "status": "investigating"}	2026-11-16 04:11:48.284218+00
1f1ea632-2dfd-43c6-8707-17e794ce9c4f	5b8efa4d-4ea6-4c60-8c71-7a8569f24e22	admin@modellyng.ac.id	update_bug_report	bug_report	df6c5dc6-fd83-4c7b-a638-cb24adf24e51	{"notes": "", "status": "resolved"}	2026-11-16 04:11:48.997196+00
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, summary, category, badge_text, banner_url, target_role, status, scheduled_at, published_at, created_by, created_at, updated_at) FROM stdin;
54dec2f9-deba-4d88-955b-6e09d032cc07	Diskon 50% Paket Pro Scholar Khusus Dies Natalis Telkom	Dapatkan potongan harga spesial 50% untuk langganan Pro Scholar selama 3 bulan pertama. Nikmati ekstraksi 13 parameter tanpa batas dan ekspor matriks sintesis langsung ke format Word DOCX dan Excel!	Promo spesial diskon 50% untuk peneliti kampus Telkom University.	promo	PROMO 50%	\N	all	published	\N	2026-10-27 15:19:27.63557+00	5b8efa4d-4ea6-4c60-8c71-7a8569f24e22	2026-10-27 15:19:27.63557+00	2026-10-27 15:19:27.63557+00
637565f2-3651-481b-b046-c1c19e28035a	Pembaruan Algoritma Ekstraksi 13 Parameter Ilmiah v2.0	Modellyng Web kini telah meningkatkan akurasi pendeteksian novelty dan celah riset menggunakan arsitektur 4-Batch Divide & Conquer yang lebih tahan halusinasi.	Peningkatan akurasi pemrosesan dokumen akademik naskah jurnal.	update	NEW FEATURE	\N	all	published	\N	2026-10-25 15:19:27.63557+00	5b8efa4d-4ea6-4c60-8c71-7a8569f24e22	2026-10-27 15:19:27.63557+00	2026-10-27 15:19:27.63557+00
e59ea686-0f78-472f-b6f6-ad43f342c8f8	Jadwal Pemeliharaan Server Rutin Akhir Pekan	Sistem akan melakukan peningkatan kapasitas database Supabase PostgreSQL pada hari Sabtu pukul 02:00 - 03:00 WIB. Layanan tetap dapat diakses dengan mode read-only.	Pemberitahuan jadwal pemeliharaan rutin server.	info	MAINTENANCE	\N	all	scheduled	\N	2026-10-30 15:19:27.63557+00	5b8efa4d-4ea6-4c60-8c71-7a8569f24e22	2026-10-27 15:19:27.63557+00	2026-10-27 15:19:27.63557+00
\.


--
-- Data for Name: api_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_configurations (id, provider, display_name, model_name, api_key, priority, rpm_limit, tpm_limit, is_active, status, last_tested_at, last_latency_ms, updated_by, updated_at) FROM stdin;
7141b477-d78c-43fe-a6d8-906bbc02ad66	groq	Groq Cloud AI (Backup Provider)	qwen/qwen3.8-27b	gsk_masukkan_api_key_groq_anda_disini	2	30	6000	t	unconfigured	2026-11-18 03:35:07.258748+00	45	\N	2026-10-27 15:19:27.66546+00
d45f81db-1592-41c5-840d-fcc4c1484395	gemini	Google Gemini AI (Core Provider)	models/gemini-3.5-flash	AIzaSy_masukkan_api_key_gemini_anda_disini	1	15	1000000	t	unconfigured	2026-11-18 03:42:28.744647+00	45	\N	2026-10-27 15:19:27.66546+00
\.


--
-- Data for Name: bug_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bug_reports (id, user_id, title, description, page_url, severity, status, admin_notes, resolved_by, created_at, resolved_at) FROM stdin;
8616fd5d-90b7-41a2-a095-19a45b62be76	286cc61f-9902-454d-b100-e49fd18becb9	Penyorotan kutipan naskah lambat pada file PDF 40+ halaman	Saat membuka paper hasil ekstraksi dengan halaman lebih dari 40 lembar, penyorotan teks bukti di canvas PDF.js butuh waktu sekitar 4 detik.	/projects/sample-id/papers/paper-1	medium	investigating	Sedang dioptimalkan dengan penambahan cache in-memory pada pdfMatcher.	\N	2026-10-27 15:19:27.611244+00	\N
df6c5dc6-fd83-4c7b-a638-cb24adf24e51	047d7a23-ca40-44aa-8542-4921877745f2	Gagal parsing tabel IEEE dua kolom pada halaman pengantar	Paper dengan format 2 kolom rapat terkadang menggabungkan teks kolom kiri dan kanan pada PyMuPDF block extraction.	/projects/sample-id/overview	high	resolved		5b8efa4d-4ea6-4c60-8c71-7a8569f24e22	2026-10-27 15:19:27.611244+00	2026-11-16 04:11:48.991694+00
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, user_id, project_id, scope, role, content, citations, created_at) FROM stdin;
\.


--
-- Data for Name: comparative_matrix_cells; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comparative_matrix_cells (id, project_id, paper_id, parameter_key, parameter_value, chapter_status_icon, evidence_id, updated_at) FROM stdin;
\.


--
-- Data for Name: evidence_spans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evidence_spans (id, component_id, paper_id, page_number, quote_text, char_start, char_end, bounding_box, fuzzy_match_score, created_at) FROM stdin;
\.


--
-- Data for Name: extracted_components; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extracted_components (id, paper_id, parameter_key, parameter_version, state, value, evidence, confidence_score, status, reviewer_notes, is_stale, created_at, updated_at) FROM stdin;
f4f5bc7e-7cae-4368-87a0-6d65610557ee	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	research_problem	1	found	{"text": "Permasalahan utama yang menjadi latar belakang penelitian ini adalah kebutuhan rancangan arsitektur struktur data inventori permainan yang efisien untuk mengelola dua karakteristik data berbeda, yaitu item lepas di lantai (ground loot) yang membutuhkan penelusuran dua arah serta operasi penghapusan berkompleksitas O(1), dan item senjata beserta modifikasinya yang memerlukan pengorganisasian data berstruktur hirarkis satu-ke-banyak (1-to-N)."}	[{"quote": "• Karakteristik: Relasi 1-to-N, Parent-Child, alokasi memori proporsional per slot senjata.", "block_id": "p4_b16", "page_index": 4, "page_label": "4"}]	0.950	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:23.052132+00
77b79963-98a6-4d97-9ab1-c741ab731923	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	research_objective	1	found	{"text": "Tujuan dari penelitian ini adalah merancang dan mengimplementasikan sistem pengelola inventori permainan PUBG (PUBG Battleground Inventory Manager) berbasis C dengan menggabungkan tipe data terstruktur Doubly Linked List untuk ground loot/item tas dan Multi Linked List untuk pemodelan relasi parent-child antara senjata dan attachment."}	[{"quote": "ADT STRUKTUR DATA NONLINIER: MULTI LINKED LIST (Parent: Weapon, Child: Attachments terpasang)", "block_id": "p4_b16", "page_index": 4, "page_label": "4"}]	0.950	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:25.053893+00
0b286338-a8cf-4b51-970e-a8f2802f5a38	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	research_questions	1	found	{"text": "1. Bagaimana mengimplementasikan struktur data linier Doubly Linked List dan nonlinier Multi Linked List dalam membangun sistem manajemen inventori permainan PUBG Battleground?\\n2. Bagaimana efisiensi pengelolaan alokasi memori dan eksekusi fungsi manipulasi node (looting, equipping attachment, dan dropping item) pada arsitektur inventori tersebut?"}	[{"quote": "ADT STRUKTUR DATA LINIER: DOUBLY LINKED LIST (Digunakan untuk Ground Loot dan Item Umum di Tas)", "block_id": "p11_b20", "page_index": 11, "page_label": "11"}]	0.900	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:26.3241+00
44a4d518-2ebb-4e68-9054-41bebc2717fe	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	subject_demographics	1	found	{"text": "Domain dan artefak yang dievaluasi dalam studi ini berfokus pada entitas permainan PUBG Battleground yang meliputi objek pemain (Player), inventori tas (bagItems), barang di lantai (ground loot), serta atribut item yang mencakup kategori Weapon, Attachment, Medical, dan Ammo."}	[{"quote": "kategori[20];   // \\"Weapon\\", \\"Attachment\\", \\"Medical\\", \\"Ammo\\"", "block_id": "p3_b2", "page_index": 3, "page_label": "3"}]	0.950	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:27.436957+00
086965d1-89bd-4980-a7fe-a50a6999d464	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	dataset_sample	1	not_found	{"text": "Informasi mengenai dataset dan karakteristik sampel, seperti jumlah data mentah, data bersih setelah penyaringan, sumber dataset publik, kriteria sampel, maupun distribusi kelas tidak ditemukan di dalam naskah. Dokumen ini berfokus pada pendefinisian tipe data terstruktur, alokasi memori, pseudocode prosedur, dan simulasi antarmuka manajemen inventaris."}	[{"quote": "ADT STRUKTUR DATA NONLINIER: MULTI LINKED LIST", "block_id": "p11_b34", "page_index": 11, "page_label": "11"}]	0.000	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:32.791441+00
6a6d4d98-ee94-4834-89b8-d3ce23e4f887	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	variables_concepts	1	found	{"text": "Variabel masukan (independen) mencakup masukan item, tingkat tas, kategori modul, serta identitas entitas. Variabel terikat dan status keadaan mencakup beban total inventaris saat ini (currentWeight), ambang batas berat maksimum (maxWeight), tingkat kesehatan (currentHealth), serta variabel pengubah performa senjata seperti tingkat recoil dasar (currentRecoil) dan kapasitas magazin (currentMagSize)."}	[{"quote": "jika (P.currentWeight + nodeTarget->info.weight > P.maxWeight) maka", "block_id": "p4_b16", "page_index": 4, "page_label": "4"}]	0.950	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:34.267649+00
771d9659-e8a3-485d-a735-95bdf645884c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	evaluation_metrics	1	not_found	{"text": "Metrik evaluasi kuantitatif untuk performa komputasi atau pengujian statistik model (seperti akurasi, presisi, recall, F1-score, loss, maupun latensi) tidak ditemukan dalam naskah ini, sebab pembahasan berfokus pada implementasi struktur data dan logika pemrograman inventaris."}	[{"quote": "PUBG BATTLEGROUND: INVENTORY MANAGER", "block_id": "p18_b3", "page_index": 18, "page_label": "18"}]	0.900	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:35.162302+00
47a2fa4a-5637-4d4d-bbba-cf8115220ba4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	results_findings	1	found	{"text": "Pengujian eksekusi sistem inventori menunjukkan bahwa mekanisme pengambilan item (looting) berfungsi secara presisi dengan memperbarui akumulasi beban tas secara dinamis dari 135/200 menjadi 155/200 setelah menambahkan amunisi berbobot 20 unit tanpa melampaui batas kapasitas maksimum."}	[{"quote": ">> [SUKSES] Ammo 5.56 berhasil diambil! Beban tas sekarang: 155/200.", "block_id": "p18_b38", "page_index": 18, "page_label": "18"}]	0.950	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:39.617721+00
3ec6fed1-e09c-43cb-881b-5c389595950c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	novelty	1	found	{"text": "Kebaruan teknis dari arsitektur ini terletak pada penerapan struktur data hibrida yang memadukan Doubly Linked List untuk pengelolaan barang di area terbuka (Ground Loot) dan Multi Linked List bersistem hierarki Parent-Child (1-to-N) untuk mengalokasikan memori modul senjata secara proporsional per slot."}	[{"quote": "Karakteristik: Relasi 1-to-N, Parent-Child, alokasi memori proporsional per slot senjata.", "block_id": "p4_b16", "page_index": 4, "page_label": "4"}]	0.950	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:41.082802+00
8b7eb68a-2c21-4353-8269-e0f55b8de613	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	key_claims	1	found	{"text": "Penulis menegaskan klaim bahwa efisiensi pengelolaan item linier pada Ground Loot dicapai melalui struktur Doubly Linked List yang memungkinkan operasi penghapusan node pada sembarang posisi dengan kompleksitas waktu O(1)."}	[{"quote": "Karakteristik: Dua arah, penghapusan O(1) di sembarang posisi node.", "block_id": "p4_b13", "page_index": 4, "page_label": "4"}]	0.950	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:42.919001+00
88474149-4d7c-4b37-b564-acedac4f9ba7	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	limitations	1	found	{"text": "Keterbatasan rancangan sistem ini terletak pada pembatasan kapasitas inventori, di mana jumlah senjata primer yang dapat terpasang dibatasi secara ketat maksimal dua unit senjata."}	[{"quote": "int weaponCount; // Maksimal 2 senjata primer", "block_id": "p4_b16", "page_index": 4, "page_label": "4"}]	0.900	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:45.742966+00
a3010472-f038-4c66-a01a-e3a315e06bcc	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	future_work	1	not_found	{"text": "Naskah dokumen tidak memuat informasi atau rekomendasi eksplisit mengenai arah pengembangan dan peluang penelitian lanjutan di masa mendatang."}	[]	0.000	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:47.191362+00
a1258c03-8edb-4f2e-b252-3ba867e1ba9c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	methodology	1	found	{"text": "Metodologi yang diterapkan berfokus pada rancangan ADT (Abstract Data Type) struktur data nonlinier berbasis Multi Linked List untuk mengelola hierarki entitas induk senjata dan entitas anak modul pendukung (attachments), serta Doubly Linked List untuk mengelola item lantai dan tas inventaris. Desain alur teknis mencakup fungsi alokasi node dinamis, pencarian node berbasis pengenal unik, serta algoritma pemindahan item yang memverifikasi ambang batas beban maksimal sebelum manipulasi pointer eksekusi."}	[{"quote": "3. ADT STRUKTUR DATA NONLINIER: MULTI LINKED LIST (Parent: Weapon, Child: Attachments terpasang)", "block_id": "p4_b16", "page_index": 4, "page_label": "4"}]	0.950	accepted	\N	f	2026-11-16 10:17:56.92158+00	2026-11-16 10:18:31.536983+00
\.


--
-- Data for Name: extraction_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extraction_parameters (id, key, version, status, group_name, label, instruction, value_type, applies_to, section_hints, requires_evidence, sort_order, created_at, updated_at, tab_group) FROM stdin;
7a023dba-dad5-4d5f-8be8-a4b95aabe3b2	research_problem	2	active	konteks_masalah	{"en": "Research Problem", "id": "Rumusan Masalah"}	Identifikasi rumusan masalah utama, tantangan penelitian, latar belakang kesenjangan, atau urgensi empiris/teoretis yang ingin diselesaikan oleh penelitian ini secara presisi dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{introduction,background,motivation,problem_statement,problem}	t	1	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	konteks_masalah
9e4385c2-b640-43e1-8b39-2b1a39175e66	research_objective	2	active	konteks_masalah	{"en": "Research Objective", "id": "Tujuan Penelitian"}	Uraikan tujuan spesifik penelitian, hipotesis utama, sasaran eksperimental, atau target luaran riset yang dirancang oleh penulis dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{introduction,aims,objective,purpose,goal}	t	2	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	konteks_masalah
2ca79374-144b-45bf-948e-fc32f8b22944	research_questions	2	active	konteks_masalah	{"en": "Research Questions", "id": "Pertanyaan Penelitian"}	Ekstraksi pertanyaan-pertanyaan penelitian (research questions/RQ) eksplisit atau pertanyaan investigatif implisit yang menjadi panduan utama kajian ini dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{research_questions,questions,introduction,background}	t	3	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	konteks_masalah
567edf96-61ee-4f53-aa32-5b103f8d0226	subject_demographics	1	active	konteks_masalah	{"en": "Context & Subject Demographics", "id": "Konteks & Demografi Subjek"}	Identifikasi konteks lingkungan penelitian, karakteristik demografis subjek atau partisipan (rentang usia, gender, latar belakang sosial-ekonomi, lokasi geografis, domain institusi, atau kriteria inklusi populasi target) secara presisi menggunakan Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{participants,demographics,subjects,context,population,sample,setting}	t	4	2026-10-27 10:19:35.969085+00	2026-10-27 10:19:35.969085+00	konteks_masalah
ebe03afe-d9b5-4c71-acbf-f5ca10d9d75e	methodology	2	active	metode_data	{"en": "Methodology Approach", "id": "Pendekatan Metodologi"}	Jelaskan desain riset, arsitektur sistem/model, alur eksperimental, atau kerangka kerja operasional yang diterapkan oleh peneliti dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{methodology,methods,materials_and_methods,approach,framework,architecture}	t	5	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	metode_data
dee4b0bb-1c2b-47ca-bff4-15148fd73da6	dataset_sample	2	active	metode_data	{"en": "Dataset & Sample Characteristics", "id": "Dataset dan Karakteristik Sampel"}	Rincikan nama korpus atau dataset benchmark yang digunakan, volume/ukuran sampel, teknik penarikan sampel, sumber data, dan tahapan pra-pemrosesan data dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{dataset,data,corpus,materials,sampling,data_collection,benchmark}	t	6	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	metode_data
cba463c2-62e6-4bb9-a99e-f9b5280fec0a	variables_concepts	2	active	metode_data	{"en": "Variables & Concepts", "id": "Variabel dan Konsep"}	Identifikasi variabel bebas (independent), variabel terikat (dependent), variabel kontrol/moderator, atau konsep-konsep sentral yang diukur dan dimanipulasi dalam penelitian ini dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,theoretical}	{variables,concepts,measures,parameters,operationalization}	t	7	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	metode_data
d1599b22-c27f-4ba4-98ae-505d9b23a6a3	evaluation_metrics	1	active	metode_data	{"en": "Specific Evaluation Metrics", "id": "Metrik Evaluasi Spesifik"}	Ekstraksi seluruh metrik evaluasi spesifik yang digunakan untuk mengukur kinerja atau efektivitas (misalnya: akurasi, precision, recall, F1-score, BLEU, ROUGE, p-value, koefisien korelasi R2, RMSE, latency komputasi, dll.) beserta formula atau standarnya secara presisi dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,theoretical}	{evaluation,metrics,performance,measures,assessment,accuracy,benchmarks}	t	8	2026-10-27 10:19:35.969085+00	2026-10-27 10:19:35.969085+00	metode_data
0ba93029-271d-44f9-b81f-d0a2605e3b33	results_findings	2	active	hasil_gap	{"en": "Results & Findings", "id": "Temuan Utama"}	Paparkan temuan empiris utama, hasil komputasi, angka pembuktian statistik signifikansi, atau simpulan esensial dari pengujian hipotesis dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{results,findings,discussion,experimental_results,outcomes}	t	9	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	hasil_gap
883686c4-7521-44fd-92df-7686ddf62504	novelty	2	active	hasil_gap	{"en": "Novelty & Contribution", "id": "Kontribusi Kebaruan"}	Uraikan kontribusi kebaruan orisinal yang membedakan penelitian ini secara fundamental dari penelitian-penelitian sebelumnya di bidang yang sama dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{contributions,novelty,significance,introduction,conclusion}	t	10	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	hasil_gap
7c213318-2647-4efa-bdb3-785a9df49044	key_claims	2	active	hasil_gap	{"en": "Key Claims", "id": "Klaim Utama"}	Identifikasi klaim-klaim utama, argumen sentral, dalil ilmiah, atau penegasan teori yang dipertahankan oleh penulis berdasarkan bukti hasil penelitian dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{claims,arguments,discussion,conclusion,abstract}	t	11	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	hasil_gap
3f4caa40-3238-4132-86b8-067718560d13	limitations	2	active	hasil_gap	{"en": "Research Limitations", "id": "Keterbatasan Riset"}	Identifikasi kelemahan metodologis, ancaman validitas internal/eksternal, batasan generalisasi sampel, atau asumsi eksperimental yang diakui oleh penulis dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,theoretical}	{limitations,threats_to_validity,discussion,scope,delimitations}	t	12	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	hasil_gap
3c912e83-04aa-4a1f-a03c-e356aa39d175	future_work	2	active	hasil_gap	{"en": "Future Work", "id": "Peluang Riset Mendatang"}	Rangkum rekomendasi penelitian lanjutan, arah eksplorasi domain baru, atau saran penyempurnaan metodologis masa depan yang diusulkan oleh penulis dalam Bahasa Indonesia yang baku.	text	{empirical,case_study,review,theoretical}	{future_work,future_directions,conclusion,recommendations,future_research}	t	13	2026-10-27 10:19:34.754827+00	2026-10-27 10:19:35.969085+00	hasil_gap
\.


--
-- Data for Name: knowledge_graph_concepts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_graph_concepts (id, project_id, concept_name, saturation_zone, frequency_count, position_x, position_y, created_at) FROM stdin;
\.


--
-- Data for Name: paper_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_blocks (id, paper_id, block_id, page_number, bbox, text, created_at) FROM stdin;
b10c26c4-6180-44be-ae6d-55880a2a5fa6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p3_b1	3	[327.76, 240.77, 512.39, 251.51]	"Weapon"\n"Attachment"\n"Medical"	2026-11-16 10:17:06.645784+00
9b9715bf-43c0-41db-a6d0-3b1726751ee0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p3_b2	3	[86.83, 258.27, 120.18, 269.01]	"Ammo"	2026-11-16 10:17:06.645784+00
2c707114-7da9-4930-b63f-a916434ac0f0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p3_b3	3	[470.71, 489.41, 504.06, 500.16]	malloc	2026-11-16 10:17:06.645784+00
d0202a0f-6c93-4dee-9a06-5fcc43cab260	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p3_b4	3	[86.83, 506.91, 109.06, 517.66]	free	2026-11-16 10:17:06.645784+00
7018d1b3-76a6-481b-a721-027769788b4b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b1	4	[64.23, 88.37, 475.49, 99.12]	┌────────────────────────────────────────────────────────────────────────┐	2026-11-16 10:17:06.645784+00
f7c26f6e-91cc-4108-aea4-916fd4289326	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b2	4	[64.23, 102.95, 475.49, 113.7]	│                        ARSITEKTUR STRUKTUR DATA                        │	2026-11-16 10:17:06.645784+00
0d2583c1-5716-4c53-a6ad-2a8470b764d0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b3	4	[64.23, 118.27, 475.49, 129.01]	├───────────────────────────────────┬────────────────────────────────────┤	2026-11-16 10:17:06.645784+00
4d3e0c07-7a1f-4ac1-a1f1-37771f94cbcf	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b4	4	[64.23, 132.85, 475.49, 143.59]	│           BAGIAN LINIER           │         BAGIAN NONLINIER           │	2026-11-16 10:17:06.645784+00
c579d205-38d5-46c7-9756-686ae43f9dc9	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b5	4	[64.23, 147.43, 475.49, 158.18]	│      (DOUBLY LINKED LIST)         │       (MULTI LINKED LIST)          │	2026-11-16 10:17:06.645784+00
561c69a5-ea52-4741-8020-a74db0ab418b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b1	11	[64.23, 163.47, 69.79, 174.22]	c	2026-11-16 10:17:06.645784+00
3ed39190-6d3d-4611-86f9-974c0c14800f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b6	4	[64.23, 162.02, 475.49, 172.76]	├───────────────────────────────────┼────────────────────────────────────┤	2026-11-16 10:17:06.645784+00
b6e54102-cd7f-4568-bb5f-5d9f209a9ceb	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b7	4	[64.23, 177.33, 475.49, 188.07]	│ • Digunakan untuk: Ground Loot    │ • Digunakan untuk: Weapon & Mods   │	2026-11-16 10:17:06.645784+00
3ebc15d6-78b0-4149-b759-7b67bebd414b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b8	4	[64.23, 191.91, 475.49, 202.66]	│ • Karakteristik: Dua arah,        │ • Karakteristik: Relasi 1-to-N,    │	2026-11-16 10:17:06.645784+00
20cc53b2-1080-4a4e-8f45-2f08ba09cf95	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b9	4	[64.23, 206.49, 475.49, 217.24]	│   penghapusan O(1) di sembarang   │   Parent-Child, alokasi memori     │	2026-11-16 10:17:06.645784+00
0a3e09a0-e4e9-4a2f-8269-22c80d3103df	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b10	4	[64.23, 221.08, 475.49, 231.82]	│   posisi node.                    │   proporsional per slot senjata.   │	2026-11-16 10:17:06.645784+00
c0b7b457-b078-4dd5-999e-18a75fb81541	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b11	4	[64.23, 236.39, 475.49, 247.14]	└───────────────────────────────────┴────────────────────────────────────┘	2026-11-16 10:17:06.645784+00
87385a4a-f189-464f-9e42-e50415907f6a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b12	4	[294.63, 440.56, 417.38, 451.3]	next\nprev	2026-11-16 10:17:06.645784+00
f47827ad-1ba0-4f97-a4da-861a0ba57d2f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b13	4	[400.85, 479.02, 413.33, 489.71]	(1)	2026-11-16 10:17:06.645784+00
81bb3085-656b-473a-80c5-f0057650d07f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b14	4	[201.73, 530.24, 223.96, 540.99]	prev	2026-11-16 10:17:06.645784+00
72029dcb-a358-474a-a7ce-1297a2391f2f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b15	4	[151.55, 547.01, 225.82, 557.76]	prev\nnext	2026-11-16 10:17:06.645784+00
0b72fa83-b398-4708-8c0f-518f1c7f945a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b16	4	[122.56, 580.55, 128.12, 591.3]	c	2026-11-16 10:17:06.645784+00
346ea0a0-9a6c-4b23-9ee1-5dcadf2dc033	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b17	4	[122.56, 595.14, 256.0, 605.88]	P->prev->next = P->next;	2026-11-16 10:17:06.645784+00
eb44bdc4-6625-4b2f-82bb-69614f4264ca	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b18	4	[122.56, 610.45, 256.0, 621.2]	P->next->prev = P->prev;	2026-11-16 10:17:06.645784+00
8eda8594-3414-4cca-8324-6c62a85f263f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p4_b19	4	[369.02, 646.73, 381.5, 657.42]	(1)	2026-11-16 10:17:06.645784+00
6ed8b454-3de9-401a-99dc-8e195dca0496	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p6_b1	6	[382.64, 185.17, 396.08, 194.89]	( )	2026-11-16 10:17:06.645784+00
6be912e3-a28b-478d-8aaa-c24fe4f5fee1	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p6_b2	6	[463.8, 278.68, 486.03, 289.43]	prev	2026-11-16 10:17:06.645784+00
82709ced-0bd5-4013-894e-43dcb8e375e4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p6_b3	6	[488.51, 303.29, 501.94, 313.01]	( )	2026-11-16 10:17:06.645784+00
54122448-ccbc-4d90-984b-760585d45391	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b1	9	[119.5, 360.15, 225.57, 369.48]	+ first: addressGround	2026-11-16 10:17:06.645784+00
d3ca931f-90ac-472b-bd23-d81fd821759a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b2	9	[119.5, 374.74, 220.74, 384.07]	+ last: addressGround	2026-11-16 10:17:06.645784+00
4b5ca932-f416-4654-99a4-1d8291473303	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b3	9	[121.9, 526.64, 179.75, 535.97]	+ info: Item	2026-11-16 10:17:06.645784+00
c64fbcc0-4dae-4f32-98b5-4ccd102b7f1e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b4	9	[121.9, 541.22, 223.14, 550.55]	+ prev: addressGround	2026-11-16 10:17:06.645784+00
a0adb480-6220-4a40-8b66-180156cf3040	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b5	9	[121.9, 555.81, 223.14, 565.13]	+ next: addressGround	2026-11-16 10:17:06.645784+00
0c3040aa-b3cc-4cc2-ba62-7b4fb9f37c45	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b6	9	[127.86, 135.34, 185.71, 144.67]	+ name: char	2026-11-16 10:17:06.645784+00
046015d9-a2ad-4ea8-b1d1-a6e2484980a3	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b7	9	[127.86, 149.93, 205.0, 159.25]	+ currentHP: int	2026-11-16 10:17:06.645784+00
f18da942-d2c0-47d9-b028-22655cf62524	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b8	9	[127.86, 164.51, 224.27, 173.84]	+ currentWeight: int	2026-11-16 10:17:06.645784+00
a5fd529a-2eda-445a-bd4b-8e496005288d	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b9	9	[127.86, 179.09, 205.0, 188.42]	+ maxWeight: int	2026-11-16 10:17:06.645784+00
7a8be3e9-713b-48c6-b400-1842201748a4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b10	9	[127.86, 193.68, 253.2, 203.01]	+ inventoryBag: ListGround	2026-11-16 10:17:06.645784+00
975c0bc7-e019-41d7-95ef-61bb2ec96b51	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b11	9	[127.86, 208.25, 267.66, 217.58]	+ equippedWeapons: ListWeapon	2026-11-16 10:17:06.645784+00
c391a2ea-8d5d-4516-9300-fc9089b814cb	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b12	9	[297.34, 367.44, 403.41, 376.77]	+ first: addressWeapon	2026-11-16 10:17:06.645784+00
ad6b2f9f-b6a2-4083-ba87-c509a7254e24	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b13	9	[263.68, 526.64, 350.46, 535.97]	+ infoWeapon: Item	2026-11-16 10:17:06.645784+00
b9e5abea-235b-45b0-87ab-425782876010	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b14	9	[263.68, 541.22, 437.23, 550.55]	+ childAttachment: addressAttachment	2026-11-16 10:17:06.645784+00
838d1983-89f5-49f8-b667-237fd8462b9a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b15	9	[263.68, 555.81, 364.92, 565.13]	+ next: addressWeapon	2026-11-16 10:17:06.645784+00
d142ba33-c5a4-4631-9e90-fc4159f82e79	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b16	9	[290.13, 707.69, 362.45, 717.02]	+ infoMod: Item	2026-11-16 10:17:06.645784+00
090335ea-2fff-4c92-9f4c-abeb9d54d385	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b17	9	[290.13, 722.28, 367.26, 731.61]	+ slotType: char	2026-11-16 10:17:06.645784+00
55e1648f-f690-490f-8ceb-cdc2e213145b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p9_b18	9	[290.13, 736.86, 410.65, 746.19]	+ next: addressAttachment	2026-11-16 10:17:06.645784+00
cd9ffe79-4316-4311-bbff-403b1bc15cb1	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b2	11	[64.23, 178.79, 197.62, 189.53]	#ifndef PUBG_INVENTORY_H	2026-11-16 10:17:06.645784+00
535f7a08-a66c-470c-a3e3-6c6a8e25b8b2	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b3	11	[64.23, 193.37, 197.62, 204.12]	#define PUBG_INVENTORY_H	2026-11-16 10:17:06.645784+00
a5d07288-cd3d-4d7b-8fd7-c8f9b3e42cd4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b4	11	[64.23, 221.08, 164.27, 231.82]	#include <stdio.h>	2026-11-16 10:17:06.645784+00
b340f7f2-4973-4205-b273-fdc722cf6c80	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b5	11	[64.23, 235.66, 169.83, 246.41]	#include <stdlib.h>	2026-11-16 10:17:06.645784+00
cc0e26f3-e22b-41a3-b5e2-badb89ddfe67	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b6	11	[64.23, 250.24, 169.83, 260.99]	#include <string.h>	2026-11-16 10:17:06.645784+00
1355c9ff-a943-40d8-83e5-8b253b920b4f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b7	11	[64.23, 265.56, 175.39, 276.3]	#include <stdbool.h>	2026-11-16 10:17:06.645784+00
dae0fc31-13e3-43ff-92fa-b7d65a54d9c0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b8	11	[64.23, 292.54, 386.57, 303.28]	/* =======================================================	2026-11-16 10:17:06.645784+00
9a0b29c9-cbc2-4ad0-90f2-acd99a673f46	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b9	11	[64.23, 307.85, 208.73, 318.59]	1. TIPE DATA DASAR ITEM	2026-11-16 10:17:06.645784+00
270ee784-ff95-499f-9bff-e59b72bd8051	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b10	11	[64.23, 322.43, 403.25, 333.18]	======================================================= */	2026-11-16 10:17:06.645784+00
013c83a4-4d60-42e3-bb75-64b890639e52	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b11	11	[64.23, 337.01, 153.16, 347.76]	typedef struct {	2026-11-16 10:17:06.645784+00
bb15c530-898b-41dd-9ad3-f99eac2de821	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b12	11	[64.23, 351.6, 147.61, 362.34]	int idItem;	2026-11-16 10:17:06.645784+00
4e1df8fb-5e7a-4a36-a6be-69c9d3cc0d19	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b13	11	[64.23, 366.91, 186.53, 377.66]	char namaItem[50];	2026-11-16 10:17:06.645784+00
ede01c89-fbca-4c7d-b7e5-f28c50f1bb40	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b14	11	[64.23, 381.49, 447.75, 392.24]	char kategori[20];   // "Weapon", "Attachment", "Medical", "Ammo"	2026-11-16 10:17:06.645784+00
b01b2814-a27a-4793-a394-746babff08fe	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b15	11	[64.23, 396.08, 453.3, 406.82]	int weight;          // Bobot item untuk perhitungan kapasitas tas	2026-11-16 10:17:06.645784+00
7d591ec6-f83d-40b7-b609-35c65c82c5a0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b16	11	[64.23, 411.39, 442.17, 422.13]	int value;           // Damage (Weapon), Heal HP (Medical), dsb.	2026-11-16 10:17:06.645784+00
4ea922d7-ec8c-4378-af32-e0f826c57824	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b17	11	[64.23, 425.97, 103.15, 436.72]	} Item;	2026-11-16 10:17:06.645784+00
4285f9c6-05fd-48cf-b8c9-8cb618c91075	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b18	11	[64.23, 453.68, 386.57, 464.43]	/* =======================================================	2026-11-16 10:17:06.645784+00
7d2e585f-4055-4125-8b7e-e9cd4b2d30da	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b19	11	[64.23, 468.26, 342.12, 479.01]	2. ADT STRUKTUR DATA LINIER: DOUBLY LINKED LIST	2026-11-16 10:17:06.645784+00
6900ddc2-ff71-4f13-8646-7f44a2119914	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b20	11	[64.23, 482.85, 358.79, 493.59]	(Digunakan untuk Ground Loot dan Item Umum di Tas)	2026-11-16 10:17:06.645784+00
b1c2035e-0e75-4fb1-a733-489624684107	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b21	11	[64.23, 497.43, 403.25, 508.18]	======================================================= */	2026-11-16 10:17:06.645784+00
fb5bf39a-2317-439d-9bda-dce8a0e27998	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b22	11	[64.23, 512.74, 292.12, 523.49]	typedef struct NodeGround* addressGround;	2026-11-16 10:17:06.645784+00
317fb70b-8271-4a2d-a7f6-bb1cce4dbb97	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b23	11	[64.23, 527.33, 214.31, 538.07]	typedef struct NodeGround {	2026-11-16 10:17:06.645784+00
401ad4ef-b460-4ad3-bd8f-a6b458ef9936	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b24	11	[64.23, 541.91, 142.05, 552.65]	Item info;	2026-11-16 10:17:06.645784+00
3923f83a-5be3-4661-b089-aead6fe2c35e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b25	11	[64.23, 557.22, 192.07, 567.97]	addressGround prev;	2026-11-16 10:17:06.645784+00
61293121-53ba-41be-9321-549d211ba154	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b26	11	[64.23, 571.8, 192.07, 582.55]	addressGround next;	2026-11-16 10:17:06.645784+00
62cb18e0-c5a0-4288-873c-9a67e0a4d077	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b27	11	[64.23, 586.39, 136.48, 597.13]	} NodeGround;	2026-11-16 10:17:06.645784+00
7a9d6e2b-74a8-4c1b-b1d7-4d5038ec7f51	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b28	11	[64.23, 614.1, 153.16, 624.84]	typedef struct {	2026-11-16 10:17:06.645784+00
dc2172ac-32df-4b0b-9078-636c5454eca2	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b29	11	[64.23, 628.68, 197.63, 639.42]	addressGround first;	2026-11-16 10:17:06.645784+00
44eb3dd6-0558-416c-9b03-6971d080022c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b30	11	[64.23, 643.26, 192.07, 654.01]	addressGround last;	2026-11-16 10:17:06.645784+00
e6a5cd53-c36e-4520-b0aa-2594bb71adb8	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b31	11	[64.23, 658.58, 169.84, 669.32]	int totalCount;	2026-11-16 10:17:06.645784+00
011a39d9-af49-441b-a311-b0be9ad035cb	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b32	11	[64.23, 673.16, 136.48, 683.9]	} ListGround;	2026-11-16 10:17:06.645784+00
07453db5-f4ef-47f6-94db-e92f78480d6c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b33	11	[64.23, 700.87, 386.57, 711.61]	/* =======================================================	2026-11-16 10:17:06.645784+00
430e917d-6f47-4165-a0fb-ed868119ff47	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b34	11	[64.23, 715.45, 353.23, 726.19]	3. ADT STRUKTUR DATA NONLINIER: MULTI LINKED LIST	2026-11-16 10:17:06.645784+00
29b1b5a4-37c8-40ae-b636-39c3dd774c44	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b35	11	[64.23, 730.03, 336.56, 740.78]	(Parent: Weapon, Child: Attachments terpasang)	2026-11-16 10:17:06.645784+00
66a6d84c-ec0f-4967-b54c-65265059e4bd	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p11_b36	11	[64.23, 745.35, 403.25, 756.09]	======================================================= */	2026-11-16 10:17:06.645784+00
3e020105-720e-4a42-a529-a9fffb859da1	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b1	12	[64.23, 78.89, 336.58, 89.64]	typedef struct NodeAttachment* addressAttachment;	2026-11-16 10:17:06.645784+00
efa6427e-e5e0-4174-b9bf-56450131567b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b2	12	[64.23, 93.47, 236.54, 104.22]	typedef struct NodeAttachment {	2026-11-16 10:17:06.645784+00
c3e48496-97c3-45bd-ac76-cebed88d9968	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b3	12	[64.23, 108.79, 142.05, 119.53]	Item info;	2026-11-16 10:17:06.645784+00
6c7800a4-f0e1-46d4-a867-43b772f1bbbe	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b4	12	[64.23, 123.37, 475.54, 134.12]	char slotType[20];            // "Scope", "Muzzle", "Magazine", "Grip"	2026-11-16 10:17:06.645784+00
72f4889e-e4c0-4676-94fa-aa793708beee	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b5	12	[64.23, 137.95, 453.28, 148.7]	addressAttachment next;       // Menunjuk ke attachment berikutnya	2026-11-16 10:17:06.645784+00
41c96c6a-3d4e-4798-b79f-32b7bd41efcc	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b6	12	[64.23, 152.54, 158.72, 163.28]	} NodeAttachment;	2026-11-16 10:17:06.645784+00
c5354d76-e412-4f55-a157-6d95387f3df3	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b7	12	[64.23, 180.24, 292.12, 190.99]	typedef struct NodeWeapon* addressWeapon;	2026-11-16 10:17:06.645784+00
7d8d8f42-078a-4957-88f2-53bbc39d2db7	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b8	12	[64.23, 194.83, 214.31, 205.57]	typedef struct NodeWeapon {	2026-11-16 10:17:06.645784+00
f3a5e541-7db9-4bbf-a750-10859e876d2d	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b9	12	[64.23, 210.14, 142.05, 220.89]	Item info;	2026-11-16 10:17:06.645784+00
cf5d690d-03a7-40be-a2db-b25aa5e22e84	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b10	12	[64.23, 224.72, 369.93, 235.47]	int currentRecoil;            // Nilai recoil dasar	2026-11-16 10:17:06.645784+00
a62d01fe-7898-40a9-97ea-f4a483821397	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b11	12	[64.23, 239.31, 375.49, 250.05]	int currentMagSize;           // Kapasitas mag dasar	2026-11-16 10:17:06.645784+00
9151d155-d654-4839-8e3e-293dbb3e715d	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b12	12	[64.23, 254.62, 481.07, 265.36]	addressAttachment childMods;  // Pointer ke sub-list anak (Attachments)	2026-11-16 10:17:06.645784+00
74f1898d-fb7b-4815-8428-a412215c49e3	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b13	12	[64.23, 269.2, 431.05, 279.95]	addressWeapon next;           // Pointer ke senjata berikutnya	2026-11-16 10:17:06.645784+00
50c8e4c4-f03e-46dc-b8b8-383fb34608d9	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b14	12	[64.23, 283.79, 136.48, 294.53]	} NodeWeapon;	2026-11-16 10:17:06.645784+00
3b98c7d2-7684-4040-a32f-632f4f5308b4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b15	12	[64.23, 311.49, 153.16, 322.24]	typedef struct {	2026-11-16 10:17:06.645784+00
85d13495-06a5-411f-8125-4fbe0edcab34	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b16	12	[64.23, 326.08, 197.63, 336.82]	addressWeapon first;	2026-11-16 10:17:06.645784+00
09bb8aa1-5a8b-43f9-9c73-7a698630f1aa	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b17	12	[64.23, 340.66, 408.83, 351.41]	int weaponCount;              // Maksimal 2 senjata primer	2026-11-16 10:17:06.645784+00
afca932b-bb6e-46c9-a111-3023d5f770fb	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b18	12	[64.23, 355.97, 136.48, 366.72]	} ListWeapon;	2026-11-16 10:17:06.645784+00
e9eb4b73-900a-4a12-9e04-ffad9b697913	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b19	12	[64.23, 383.68, 386.57, 394.43]	/* =======================================================	2026-11-16 10:17:06.645784+00
0838a293-c2b2-419c-9b8e-625621658963	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b20	12	[64.23, 398.26, 292.1, 409.01]	4. TIPE DATA PEMAIN & STATUS INVENTORI	2026-11-16 10:17:06.645784+00
67279225-3dff-4a91-9f4b-bac558c89898	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b21	12	[64.23, 412.85, 403.25, 423.59]	======================================================= */	2026-11-16 10:17:06.645784+00
967e763a-3930-4899-be1e-2f3e4cc71879	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b22	12	[64.23, 427.43, 153.16, 438.18]	typedef struct {	2026-11-16 10:17:06.645784+00
b5ffdf02-a739-463f-ba88-e6affcdfb0cd	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b23	12	[64.23, 442.74, 197.64, 453.49]	char playerName[50];	2026-11-16 10:17:06.645784+00
5fa163c6-5eb3-4413-b507-9994da4b79f3	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b24	12	[64.23, 457.33, 336.58, 468.07]	int currentHealth;            // Maksimal 100	2026-11-16 10:17:06.645784+00
e98419bb-01c9-49a9-ba54-f71191b75751	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b25	12	[64.23, 471.91, 481.08, 482.65]	int backpackLevel;            // 0: Polos (100), 1: 150, 2: 200, 3: 250	2026-11-16 10:17:06.645784+00
ef01fe4a-f261-411d-ae54-eec82e4a29a3	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b26	12	[64.23, 486.49, 186.52, 497.24]	int currentWeight;	2026-11-16 10:17:06.645784+00
fa667db1-b818-4e65-967a-5077686ffde5	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b27	12	[64.23, 501.81, 164.29, 512.55]	int maxWeight;	2026-11-16 10:17:06.645784+00
cb71826b-f33a-4c21-a055-04e7054be9e5	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b28	12	[64.23, 516.39, 492.2, 527.13]	ListGround bagItems;          // Item umum dalam tas (Doubly Linked List)	2026-11-16 10:17:06.645784+00
62a1bef2-ac43-4529-b030-a129f8e34dc6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b29	12	[64.23, 530.97, 492.19, 541.72]	ListWeapon equippedWeapons;   // Senjata & modifikasi (Multi Linked List)	2026-11-16 10:17:06.645784+00
5cf7a6c7-5ebe-495a-831f-dad4c0842124	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b30	12	[64.23, 545.56, 114.25, 556.3]	} Player;	2026-11-16 10:17:06.645784+00
fe70d7c0-9e08-4793-8f49-09c40705f375	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b31	12	[64.23, 573.26, 97.58, 584.01]	#endif	2026-11-16 10:17:06.645784+00
1a6aad8b-3379-46c1-98da-bf8a4e726374	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b32	12	[86.83, 677.53, 538.11, 688.28]	void createListGround(ListGround *L)\nfirst = NULL\nlast	2026-11-16 10:17:06.645784+00
d738db46-509a-4880-a239-7ee470fb9ced	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b33	12	[83.92, 695.03, 117.26, 705.78]	= NULL	2026-11-16 10:17:06.645784+00
93be8941-ad3a-45b3-af39-97012870137d	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b34	12	[86.83, 715.45, 309.14, 726.2]	addressGround allocateGroundNode(Item X)	2026-11-16 10:17:06.645784+00
1ddf0888-8594-4768-bda0-0292f0fd0a21	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p12_b35	12	[86.83, 736.6, 320.25, 747.34]	void deallocateGroundNode(addressGround P)	2026-11-16 10:17:06.645784+00
a63dd001-e95b-4f8e-9004-7f751ee4daeb	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b1	13	[86.83, 81.08, 381.39, 91.82]	void insertGroundLast(ListGround *L, addressGround P)	2026-11-16 10:17:06.645784+00
14570828-1422-46df-b888-b50214e399f7	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b2	13	[86.83, 118.99, 381.39, 129.74]	void deleteGroundNode(ListGround *L, addressGround P)	2026-11-16 10:17:06.645784+00
394d2b05-e3bd-40a0-abc0-1cea1533e789	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b3	13	[211.29, 136.49, 318.91, 147.24]	P->prev\nP->next	2026-11-16 10:17:06.645784+00
f0bce6b7-46c7-4ddf-8ff4-ce9e20c1ca8d	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b4	13	[86.83, 156.91, 398.06, 167.66]	addressGround searchGroundItem(ListGround L, int idItem)	2026-11-16 10:17:06.645784+00
20a1360c-afe3-4b49-9d71-dacb11fb9e82	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b5	13	[86.83, 194.83, 275.79, 205.57]	void printGroundList(ListGround L)	2026-11-16 10:17:06.645784+00
abf75bbb-ea44-47cc-9649-a8c69a97a2f6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b6	13	[86.83, 250.24, 292.47, 260.99]	void createListWeapon(ListWeapon *LW)	2026-11-16 10:17:06.645784+00
6c9715eb-e0b6-4ec3-be9d-731ec2ace6e0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b7	13	[86.83, 271.39, 309.14, 282.13]	addressWeapon allocateWeaponNode(Item X)	2026-11-16 10:17:06.645784+00
85f74582-4982-4a1e-8dff-69146d8e4fca	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b8	13	[86.83, 292.54, 425.85, 303.28]	addressAttachment allocateAttachmentNode(Item X, char slot[])	2026-11-16 10:17:06.645784+00
8363579c-d78a-4cc1-859f-af23868681be	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b9	13	[86.83, 330.45, 386.94, 341.2]	void insertWeaponLast(ListWeapon *LW, addressWeapon W)	2026-11-16 10:17:06.645784+00
72f6ddb9-17e1-4e2c-a6bb-f68555c7445f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b10	13	[86.83, 368.37, 442.52, 379.11]	void insertAttachmentChild(addressWeapon W, addressAttachment A)	2026-11-16 10:17:06.645784+00
a155a343-ac29-4ccf-af25-272919a28399	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b11	13	[86.83, 406.28, 520.33, 417.03]	bool deleteAttachmentChild(addressWeapon W, char slot[], addressAttachment *A)	2026-11-16 10:17:06.645784+00
f1a328fb-fad8-4307-86d3-1e0abe1d98b4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b12	13	[86.83, 444.2, 392.5, 454.95]	addressWeapon searchWeapon(ListWeapon LW, int idWeapon)	2026-11-16 10:17:06.645784+00
4bd29cd0-80ed-48fa-b4cb-d2114fca6f73	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b13	13	[86.83, 549.2, 370.27, 559.95]	bool LootItem(Player *P, ListGround *G, int idItem)	2026-11-16 10:17:06.645784+00
01d79b58-4f0f-464d-9868-3315470b003a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b14	13	[262.7, 592.22, 518.35, 602.97]	P->currentWeight + item.weight <= P->maxWeight	2026-11-16 10:17:06.645784+00
6f35b7b5-4597-428e-af54-50ef8392d53b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b15	13	[334.38, 612.64, 423.98, 623.38]	G\nP->bagItems	2026-11-16 10:17:06.645784+00
8cb4cb6f-9cdf-43da-b435-0badcad3b8b1	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b16	13	[217.18, 630.14, 417.72, 640.88]	true\nfalse	2026-11-16 10:17:06.645784+00
a1e46d83-6fd8-4bc4-973d-a477b9aae70f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b17	13	[86.83, 654.93, 459.19, 665.67]	bool EquipAttachment(Player *P, int idWeapon, int idAttachmentItem)	2026-11-16 10:17:06.645784+00
44ac91e9-7ecf-4ed2-bd9c-87354dc5e8c7	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p13_b18	13	[320.15, 698.68, 403.52, 709.42]	equippedWeapons	2026-11-16 10:17:06.645784+00
ff895e23-336d-4e76-a425-5feb7dffe67f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p14_b1	14	[86.83, 123.37, 414.73, 134.12]	bool DropItemToGround(Player *P, ListGround *G, int idItem)	2026-11-16 10:17:06.645784+00
9f6a1b32-3b9f-479f-bc13-f7d4673941e1	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p14_b2	14	[338.96, 145.97, 427.89, 156.72]	P->currentWeight	2026-11-16 10:17:06.645784+00
974fa472-e4ec-4e64-9b9e-1cf1f7484274	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p14_b3	14	[201.62, 162.74, 257.2, 173.49]	ListGround	2026-11-16 10:17:06.645784+00
ca001aad-557b-4da9-aa67-4a14a7243541	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p14_b4	14	[86.83, 187.54, 320.25, 198.28]	bool UseMedicalItem(Player *P, int idItem)	2026-11-16 10:17:06.645784+00
d35e3bfb-71e8-443a-8cc8-d7412cfeae15	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p14_b5	14	[86.83, 252.43, 448.08, 263.18]	void UnequipWeaponCascade(Player *P, ListGround *G, int idWeapon)	2026-11-16 10:17:06.645784+00
e52bccfd-fc73-4f43-828b-f4403aee64d4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b1	15	[64.23, 151.08, 86.46, 161.83]	text	2026-11-16 10:17:06.645784+00
b045f553-809d-4d51-af59-0d0815850c79	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b15	16	[64.23, 321.71, 142.04, 332.45]	selain itu	2026-11-16 10:17:06.645784+00
0bef5dc7-96e2-4b2b-ae44-786008ae0480	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b2	15	[64.23, 165.67, 486.62, 176.41]	Prosedur LootItem(input/output P: Player, input/output G: ListGround, input	2026-11-16 10:17:06.645784+00
2339ebf8-d784-4788-b882-033fde144db5	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b3	15	[64.23, 180.25, 164.27, 190.99]	idTarget: integer)	2026-11-16 10:17:06.645784+00
039d66f9-ccbe-4742-9fbc-b58dc2a7f7df	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b4	15	[64.23, 195.56, 130.92, 206.31]	KAMUS LOKAL:	2026-11-16 10:17:06.645784+00
d8d0c563-7d77-41b1-85a1-2bf26dfdeb03	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b5	15	[64.23, 210.15, 225.41, 220.89]	nodeTarget: addressGround	2026-11-16 10:17:06.645784+00
15b04930-e7ca-4b50-8026-9a38dee455bb	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b6	15	[64.23, 224.73, 119.8, 235.47]	ALGORITMA:	2026-11-16 10:17:06.645784+00
20448535-364d-4646-8a89-e488cd5c2320	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b7	15	[64.23, 239.31, 325.45, 250.06]	nodeTarget <- searchGroundItem(G, idTarget)	2026-11-16 10:17:06.645784+00
e15ce0d2-f3ee-406a-a9b5-d9a633c245f8	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b8	15	[64.23, 254.62, 242.08, 265.37]	jika (nodeTarget = NIL) maka	2026-11-16 10:17:06.645784+00
0ae56e8f-9a4b-4853-8adc-414656c5642e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b9	15	[64.23, 269.21, 381.02, 279.95]	Tuliskan("Item tidak ditemukan di area sekitar!")	2026-11-16 10:17:06.645784+00
d902695b-df05-4942-89a3-da8369a8e32f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b10	15	[64.23, 283.79, 142.04, 294.54]	selain itu	2026-11-16 10:17:06.645784+00
3748113b-6f54-4b7a-b4aa-0a48ce1ae675	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b11	15	[64.23, 299.1, 481.06, 309.85]	jika (P.currentWeight + nodeTarget->info.weight > P.maxWeight) maka	2026-11-16 10:17:06.645784+00
940b49fa-1053-492b-b75d-5f5315b2f78b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b12	15	[64.23, 313.69, 475.5, 324.43]	Tuliskan("Kapasitas tas tidak mencukupi! Looting dibatalkan.")	2026-11-16 10:17:06.645784+00
ab84539f-283a-48ea-8401-ab31fb908b67	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b13	15	[64.23, 328.27, 164.27, 339.01]	selain itu	2026-11-16 10:17:06.645784+00
0af45e9c-80a0-42c7-91d3-aa00d38f7e8a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b14	15	[64.23, 342.85, 303.21, 353.6]	deleteGroundNode(G, nodeTarget)	2026-11-16 10:17:06.645784+00
26298120-e9e7-42c0-9644-92cc9f80a629	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b15	15	[64.23, 358.16, 353.23, 368.91]	insertGroundLast(P.bagItems, nodeTarget)	2026-11-16 10:17:06.645784+00
e66dcdff-211c-4c05-b195-f54a1c1681c5	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b16	15	[64.23, 372.75, 464.38, 383.49]	P.currentWeight <- P.currentWeight + nodeTarget->info.weight	2026-11-16 10:17:06.645784+00
01a565b5-4c53-44b1-805c-2ae2d5985a77	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b17	15	[64.23, 387.33, 458.82, 398.08]	Tuliskan("Berhasil mengambil: ", nodeTarget->info.namaItem)	2026-11-16 10:17:06.645784+00
3891c6ee-7a80-4289-b9c4-f8215fbb5c28	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b18	15	[64.23, 401.91, 164.27, 412.66]	akhir jika	2026-11-16 10:17:06.645784+00
2592a7fa-f466-4356-84e7-2bdccf0734f5	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b19	15	[64.23, 417.23, 142.04, 427.97]	akhir jika	2026-11-16 10:17:06.645784+00
ec43ba23-5084-4b31-a3f6-a448ada8c031	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p15_b20	15	[64.23, 431.81, 142.04, 442.56]	akhir prosedur	2026-11-16 10:17:06.645784+00
9b33d50b-165b-4828-ac97-7023ad56bc28	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b1	16	[64.23, 114.62, 86.46, 125.37]	text	2026-11-16 10:17:06.645784+00
2bb58c29-b6fa-4ddf-932e-a4941874a222	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b2	16	[64.23, 129.21, 503.28, 139.95]	Prosedur AttachModToWeapon(input/output P: Player, input idWep: integer, input	2026-11-16 10:17:06.645784+00
9327d408-aa2e-47c5-8ec7-e771933edcf0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b3	16	[64.23, 144.52, 147.59, 155.26]	idMod: integer)	2026-11-16 10:17:06.645784+00
1e4dbbd8-bbd7-49de-9f1e-76f93de2bcde	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b4	16	[64.23, 159.1, 130.92, 169.85]	KAMUS LOKAL:	2026-11-16 10:17:06.645784+00
9f18f87d-ccdb-46f8-9588-bbb7e1d0d52d	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b5	16	[64.23, 173.69, 208.74, 184.43]	wepNode: addressWeapon	2026-11-16 10:17:06.645784+00
3c6d5381-4859-47e9-9ae5-ce3dc9849741	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b6	16	[64.23, 188.27, 230.97, 199.01]	itemModNode: addressGround	2026-11-16 10:17:06.645784+00
93993bb4-69d7-4454-9bc4-81ae1686aa61	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b7	16	[64.23, 203.58, 242.08, 214.33]	childIter: addressAttachment	2026-11-16 10:17:06.645784+00
498fd6a1-9f80-4d18-ae7e-bd4eab95fc5a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b8	16	[64.23, 218.16, 203.18, 228.91]	slotSudahAda: boolean	2026-11-16 10:17:06.645784+00
8375ffb8-558f-4717-9798-84363b226bf6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b9	16	[64.23, 232.75, 119.8, 243.49]	ALGORITMA:	2026-11-16 10:17:06.645784+00
3862d11e-e4d0-4467-bf24-fa343cba0795	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b10	16	[64.23, 248.06, 358.79, 258.81]	wepNode <- searchWeapon(P.equippedWeapons, idWep)	2026-11-16 10:17:06.645784+00
181f801a-8f04-49f7-be00-031d8005fa1a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b11	16	[64.23, 262.64, 364.35, 273.39]	itemModNode <- searchGroundItem(P.bagItems, idMod)	2026-11-16 10:17:06.645784+00
35c330f8-d2ff-4637-ad3f-9df26567db9e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b13	16	[64.23, 291.81, 353.23, 302.56]	jika (wepNode = NIL atau itemModNode = NIL) maka	2026-11-16 10:17:06.645784+00
f5443e1c-fc41-417c-b9a7-1d2614fafdaf	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b14	16	[64.23, 307.12, 375.46, 317.87]	Tuliskan("Senjata atau Attachment tidak valid!")	2026-11-16 10:17:06.645784+00
74f6a5a1-7eca-404e-a49a-d90ed54dc457	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b16	16	[64.23, 336.29, 369.9, 347.03]	// Cek apakah slot pada child list sudah terisi	2026-11-16 10:17:06.645784+00
c02433d4-0f72-4e0b-b87e-5e9d0f6ecf33	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b17	16	[64.23, 350.87, 280.98, 361.62]	childIter <- wepNode->childMods	2026-11-16 10:17:06.645784+00
7496e271-4a86-4a5b-a67d-716406037548	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b18	16	[64.23, 366.18, 225.41, 376.93]	slotSudahAda <- false	2026-11-16 10:17:06.645784+00
c0a0dc16-22f4-45a6-8b61-8ab9d8909fa6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b19	16	[64.23, 380.77, 419.92, 391.51]	selama (childIter != NIL dan tidak slotSudahAda) lakukan	2026-11-16 10:17:06.645784+00
45f026be-2451-47d5-99b6-8fa2f5fc75d9	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b20	16	[64.23, 395.35, 464.38, 406.1]	jika (childIter->slotType = itemModNode->info.kategori) maka	2026-11-16 10:17:06.645784+00
8f92ef56-f96a-48fb-b4f2-d5be3cfd738c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b21	16	[64.23, 409.93, 264.3, 420.68]	slotSudahAda <- true	2026-11-16 10:17:06.645784+00
ea04ce14-393c-4149-a533-b4f65bbf8dcf	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b22	16	[64.23, 425.25, 186.5, 435.99]	akhir jika	2026-11-16 10:17:06.645784+00
31ddf6bc-0c7e-435a-bd18-613a64794ef6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b23	16	[64.23, 439.83, 286.54, 450.58]	childIter <- childIter->next	2026-11-16 10:17:06.645784+00
45bed8d8-6d79-474e-a6a7-7c563e7362a6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b24	16	[64.23, 454.41, 175.39, 465.16]	akhir selama	2026-11-16 10:17:06.645784+00
21f20d79-3c44-4d5c-944d-82d6bec3f452	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b26	16	[64.23, 484.31, 242.08, 495.05]	jika (slotSudahAda) maka	2026-11-16 10:17:06.645784+00
4091ffda-ed4f-456b-8cc2-1f44603c2593	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b27	16	[64.23, 498.89, 442.15, 509.64]	Tuliskan("Slot tersebut sudah terisi pada senjata ini!")	2026-11-16 10:17:06.645784+00
492facd1-2f33-455f-bd60-008fb54ea83c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b28	16	[64.23, 513.48, 164.27, 524.22]	selain itu	2026-11-16 10:17:06.645784+00
0538a1ef-8945-413b-bb2f-bede4497b2c0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b29	16	[64.23, 528.79, 392.13, 539.53]	// Pindahkan dari tas ke sub-list child senjata	2026-11-16 10:17:06.645784+00
e7d4c6cd-739d-4f82-805a-0e2c5e4cdb16	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b30	16	[64.23, 543.37, 358.79, 554.12]	deleteGroundNode(P.bagItems, itemModNode)	2026-11-16 10:17:06.645784+00
c93aa39a-9803-428c-b470-6b1c2f08974f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b31	16	[64.23, 557.95, 469.94, 568.7]	P.currentWeight <- P.currentWeight - itemModNode->info.weight	2026-11-16 10:17:06.645784+00
2028b6af-e3bd-4a33-b399-f9b0691db4c6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b33	16	[64.23, 587.85, 519.96, 598.6]	nodeAnakBaru <- allocateAttachmentNode(itemModNode->info, itemModNode-	2026-11-16 10:17:06.645784+00
1abd07d3-6bab-4a9c-9124-b012c15954fe	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b34	16	[64.23, 602.43, 147.59, 613.18]	>info.kategori)	2026-11-16 10:17:06.645784+00
3bb64fb9-b804-4b39-a257-9bbeca9c5051	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b35	16	[64.23, 617.02, 375.46, 627.76]	insertAttachmentChild(wepNode, nodeAnakBaru)	2026-11-16 10:17:06.645784+00
b78f4a53-f018-404a-bbd4-6f9af9248730	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b36	16	[64.23, 631.6, 253.19, 642.34]	dealokasi(itemModNode)	2026-11-16 10:17:06.645784+00
790a41ed-2b7e-4a5f-af76-a2820c5c4c83	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b37	16	[64.23, 646.91, 519.96, 657.66]	Tuliskan("Attachment berhasil dipasang pada ", wepNode->info.namaItem)	2026-11-16 10:17:06.645784+00
8183f8d0-9e2f-4379-8fb5-dc2c3fe0f1b2	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b38	16	[64.23, 661.49, 164.27, 672.24]	akhir jika	2026-11-16 10:17:06.645784+00
ef16e410-954a-4046-8462-38112bc1d67b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b39	16	[64.23, 676.08, 142.04, 686.82]	akhir jika	2026-11-16 10:17:06.645784+00
ecefa569-3e99-4728-aed3-c89b89836736	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p16_b40	16	[64.23, 690.66, 142.04, 701.41]	akhir prosedur	2026-11-16 10:17:06.645784+00
768ccfa2-527c-4093-8cbd-e9b68156bca5	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p17_b1	17	[148.32, 195.56, 270.59, 206.31]	[████████░░] 80/100 HP	2026-11-16 10:17:06.645784+00
8841a9b0-e91b-4bd1-ae14-1b9b78f817d5	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p17_b2	17	[150.62, 216.71, 278.45, 227.45]	[██████████] 145/150 WT	2026-11-16 10:17:06.645784+00
6389bcc9-5817-46a8-b6c1-bedb688336a6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p17_b3	17	[333.95, 313.69, 361.74, 324.43]	0x...	2026-11-16 10:17:06.645784+00
b7d7b412-325f-4ee6-be30-7ca3d91aea8e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p17_b4	17	[248.46, 338.48, 322.73, 349.22]	prev\nnext	2026-11-16 10:17:06.645784+00
e56763b8-9e65-4d1e-a8e1-8e595a934785	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p17_b5	17	[248.46, 359.62, 298.47, 370.37]	childMods	2026-11-16 10:17:06.645784+00
fa74089b-952f-4f4c-b5c0-e89eb7a353d0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b1	18	[64.23, 117.54, 86.46, 128.29]	text	2026-11-16 10:17:06.645784+00
d2431cd4-0366-45f6-a6cd-cdd6caec948b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b2	18	[64.23, 132.85, 508.84, 143.6]	================================================================================	2026-11-16 10:17:06.645784+00
7bd38f9e-fc09-4261-b39f-a0b30e8f20d4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b3	18	[64.23, 147.44, 508.85, 158.18]	PUBG BATTLEGROUND: INVENTORY MANAGER	2026-11-16 10:17:06.645784+00
2d6089ff-d1df-4459-8acc-9d0d5e6a4399	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b4	18	[64.23, 162.02, 508.84, 172.76]	================================================================================	2026-11-16 10:17:06.645784+00
fe4919d2-73a8-4e4c-b0ae-75e07b73e998	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b5	18	[64.23, 176.6, 369.9, 187.35]	PLAYER: Survivor_01         | HP : [████████░░]  80/100	2026-11-16 10:17:06.645784+00
1208ceec-f683-445d-a44f-b36166dd273f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b6	18	[64.23, 191.91, 431.03, 202.66]	BAG   : Level 2 Military    | WT : [███████░░░] 135/200 (Sisa: 65)	2026-11-16 10:17:06.645784+00
780bb8af-9d24-4888-95e2-2baac5804136	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b7	18	[64.23, 206.5, 508.84, 217.24]	--------------------------------------------------------------------------------	2026-11-16 10:17:06.645784+00
4f89991e-2d1d-4aa0-ae72-a3632cfbaa46	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b8	18	[64.23, 221.08, 292.09, 231.83]	[ SENJATA TERPASANG - MULTI LINKED LIST ]	2026-11-16 10:17:06.645784+00
452b9df2-4d9c-464f-b812-f22bedbf403e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b9	18	[64.23, 236.39, 314.32, 247.14]	[Slot 1] M416 [Assault Rifle] (Base Dmg: 41)	2026-11-16 10:17:06.645784+00
15a56623-6dc4-4094-b3f0-999bb4d7d1a4	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b10	18	[64.23, 250.98, 325.44, 261.72]	├── [Muzzle]   : Compensator AR (Recoil -15%)	2026-11-16 10:17:06.645784+00
8f09491d-af78-4c98-9914-82a1563aa7e6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b11	18	[64.23, 265.56, 297.65, 276.3]	├── [Scope]    : 4x ACOG Scope (Zoom 4x)	2026-11-16 10:17:06.645784+00
686f3540-143c-4963-a26c-22930e85b1dc	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b12	18	[64.23, 280.14, 342.11, 290.89]	└── [Magazine] : Ext. Quickdraw Mag (+10 Peluru)	2026-11-16 10:17:06.645784+00
b37e38c8-7f4e-4cda-9dd7-70f9d13573ca	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b13	18	[64.23, 295.45, 319.88, 306.2]	[Slot 2] Kar98k [Sniper Rifle] (Base Dmg: 79)	2026-11-16 10:17:06.645784+00
53c78aa1-16f9-4c7d-ac06-d57f0d6872f5	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b14	18	[64.23, 310.04, 275.42, 320.78]	└── (Belum ada attachment terpasang)	2026-11-16 10:17:06.645784+00
eafe4497-f3a3-49b0-bdc0-555bccdf728a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b15	18	[64.23, 337.75, 508.84, 348.49]	=========================== LIVE MEMORY TRACER =================================	2026-11-16 10:17:06.645784+00
ea2f4d38-cc1c-43a4-a903-99e71779185a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b16	18	[64.23, 352.33, 164.27, 363.08]	[DLL Ground Loot]	2026-11-16 10:17:06.645784+00
2f648ff2-7f34-487d-a3f7-bafb1db8d565	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b17	18	[64.23, 366.91, 497.74, 377.66]	NULL <== [0x7ffe01: Medkit] <===> [0x7ffe20: Ammo 5.56] <===> [0x7ffe40: 8x	2026-11-16 10:17:06.645784+00
d0b6f312-898a-4bfc-84f2-c6f54e3f7e8a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b18	18	[64.23, 381.5, 147.59, 392.24]	Scope] ==> NULL	2026-11-16 10:17:06.645784+00
b024fdd5-43b5-4ce5-b2d6-3d5e1469d7ca	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b19	18	[64.23, 409.2, 192.06, 419.95]	[MLL Weapon Hierarchy]	2026-11-16 10:17:06.645784+00
1223e6af-905c-463e-8d80-dcf08464a125	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b20	18	[64.23, 424.52, 519.96, 435.26]	[Parent: 0x6001 (M416)] ──► [Child: 0x6080 (Comp)] ──► [Child: 0x6090 (4x)] ──►	2026-11-16 10:17:06.645784+00
0c722c05-531e-4a8b-8573-1008f5757589	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b21	18	[64.23, 439.1, 86.46, 449.85]	NULL	2026-11-16 10:17:06.645784+00
54ccb3e1-65e2-4f44-8f0d-07da6b942cb2	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b22	18	[64.23, 453.68, 119.81, 464.43]	│	2026-11-16 10:17:06.645784+00
1e3b6c07-761d-443d-b927-360d08a25e41	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b23	18	[64.23, 468.27, 119.81, 479.01]	▼	2026-11-16 10:17:06.645784+00
bd0d8bb2-2595-477e-9664-e3b846705ae3	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b24	18	[64.23, 483.58, 264.31, 494.32]	[Parent: 0x6002 (Kar98k)] ──► NULL	2026-11-16 10:17:06.645784+00
4fe44146-4b62-4beb-ae42-e2ddb95e489a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b25	18	[64.23, 498.16, 508.84, 508.91]	================================================================================	2026-11-16 10:17:06.645784+00
067928d0-bcaf-4821-8777-09d45e3984da	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b26	18	[64.23, 512.74, 136.48, 523.49]	PILIHAN AKSI:	2026-11-16 10:17:06.645784+00
bff649e5-d1b2-4858-a88c-ed48ea731b37	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b27	18	[64.23, 527.33, 325.44, 538.07]	1. Jelajahi & Lihat Item Sekitar (Ground Loot)	2026-11-16 10:17:06.645784+00
1d9771c5-4e15-4c3c-97b0-491bc5cdcd8e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b28	18	[64.23, 542.64, 286.54, 553.39]	2. Ambil Barang dari Lantai (Loot Item)	2026-11-16 10:17:06.645784+00
f58fdba8-5332-4df9-a4d5-9ada97d61a23	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b29	18	[64.23, 557.22, 308.77, 567.97]	3. Pasang Attachment ke Senjata (Equip Mod)	2026-11-16 10:17:06.645784+00
e6c70619-bfdf-43aa-a767-0acd3a99c16e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b30	18	[64.23, 571.81, 325.44, 582.55]	4. Lepas Attachment dari Senjata (Unequip Mod)	2026-11-16 10:17:06.645784+00
ae7337aa-f356-481c-9f3b-18ab882b42ff	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b31	18	[64.23, 587.12, 242.08, 597.87]	5. Gunakan Item Medis (Heal HP)	2026-11-16 10:17:06.645784+00
bd2620a0-bfac-4270-8a82-f80118f5a188	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b32	18	[64.23, 601.7, 275.42, 612.45]	6. Buang Barang ke Lantai (Drop Item)	2026-11-16 10:17:06.645784+00
9f1fd511-70c3-423d-a919-fd500b062e0a	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b33	18	[64.23, 616.29, 175.38, 627.03]	0. Keluar Permainan	2026-11-16 10:17:06.645784+00
404dfe84-ba05-4171-aa8d-1fa1ca4fd12e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b34	18	[64.23, 630.87, 508.84, 641.62]	--------------------------------------------------------------------------------	2026-11-16 10:17:06.645784+00
d3fdbc8e-0f05-4e5e-8730-dac88dbcf685	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b35	18	[64.23, 646.18, 147.59, 656.93]	Pilihan Anda: 2	2026-11-16 10:17:06.645784+00
dc91c712-032f-4b49-9a33-7910f946dbac	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b36	18	[64.23, 660.77, 286.53, 671.51]	Masukkan ID Item yang ingin di-loot: 102	2026-11-16 10:17:06.645784+00
37a2a528-aa98-4093-84d9-38637946bccc	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b37	18	[64.23, 675.35, 447.71, 686.09]	>> Memeriksa kapasitas beban tas... (Bobot item: 20 | Sisa ruang: 65)	2026-11-16 10:17:06.645784+00
35af19a6-41c9-48de-8536-566dd0a66723	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b38	18	[64.23, 689.93, 442.15, 700.68]	>> [SUKSES] Ammo 5.56 berhasil diambil! Beban tas sekarang: 155/200.	2026-11-16 10:17:06.645784+00
ef2cdebc-0588-4fa7-8f50-a04de6e211c6	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p18_b39	18	[64.23, 705.24, 508.84, 715.99]	================================================================================	2026-11-16 10:17:06.645784+00
66fd9728-448d-41ed-ad06-69101bc2396e	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b1	19	[86.83, 178.79, 136.85, 189.53]	boolean.h	2026-11-16 10:17:06.645784+00
d7df434f-5de2-4802-a942-5ab87f8fd74f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b2	19	[86.83, 199.21, 120.18, 209.95]	item.h	2026-11-16 10:17:06.645784+00
9df2a222-3d12-4af4-882d-be2663535a2c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b3	19	[86.83, 220.35, 250.34, 231.1]	ground_list.h\nground_list.c	2026-11-16 10:17:06.645784+00
89da5b50-7f9c-4bfc-ab1f-202b07f1aab7	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b4	19	[86.83, 241.5, 239.22, 252.24]	weapon_mll.h\nweapon_mll.c	2026-11-16 10:17:06.645784+00
ba1c8f7a-7053-475a-93de-8df76b175d7c	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b5	19	[86.83, 261.91, 228.11, 272.66]	inventory.h\ninventory.c	2026-11-16 10:17:06.645784+00
84fe652a-f2fc-47fa-8d40-8944a0164ef0	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b6	19	[86.83, 283.06, 150.31, 293.8]	ui.h\nui.c	2026-11-16 10:17:06.645784+00
7fd2e48d-0d6d-4555-bfc0-d7d5cc266719	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b7	19	[86.83, 303.48, 120.18, 314.22]	main.c	2026-11-16 10:17:06.645784+00
f3770d91-5c5e-471e-a4b3-cf94f5fa949f	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b8	19	[333.18, 419.41, 425.27, 430.16]	ground_list.h\n.c	2026-11-16 10:17:06.645784+00
89729ea2-9dca-40d9-9353-e556e52cafef	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b9	19	[333.18, 466.81, 433.73, 489.22]	weapon_mll.h\n.c\ninventory.c	2026-11-16 10:17:06.645784+00
5935da66-65d8-4bf9-ad6b-bad856763410	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	p19_b10	19	[316.38, 514.2, 441.37, 536.62]	ui.c\nmain.c	2026-11-16 10:17:06.645784+00
\.


--
-- Data for Name: paper_components; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_components (id, paper_id, component_type, extracted_text, confidence_score, status, ai_model_tag, reviewer_notes, created_at, reviewed_at) FROM stdin;
\.


--
-- Data for Name: paper_embeddings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_embeddings (id, paper_id, chunk_index, page_number, content, embedding, created_at) FROM stdin;
ea9a3d94-9280-4a4b-bea8-db7ef7b24bb3	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	0	3	"Weapon"\n"Attachment"\n"Medical" "Ammo" malloc free ┌────────────────────────────────────────────────────────────────────────┐ │   posisi node.                    │   proporsional per slot senjata.   │ └───────────────────────────────────┴────────────────────────────────────┘ next\nprev (1) prev prev\nnext c P->prev->next = P->next; P->next->prev = P->prev; (1) │                        ARSITEKTUR STRUKTUR DATA                        │ ├───────────────────────────────────┬────────────────────────────────────┤ │           BAGIAN LINIER           │         BAGIAN NONLINIER           │ │      (DOUBLY LINKED LIST)         │       (MULTI LINKED LIST)          │ ├───────────────────────────────────┼────────────────────────────────────┤ │ • Digunakan untuk: Ground Loot    │ • Digunakan untuk: Weapon & Mods   │ │ • Karakteristik: Dua arah,        │ • Karakteristik: Relasi 1-to-N,    │ │   penghapusan O(1) di sembarang   │   Parent-Child, alokasi memori     │ ( ) prev ( ) + first: addressGround + inventoryBag: ListGround + equippedWeapons: ListWeapon + first: addressWeapon + infoWeapon: Item + childAttachment: addressAttachment + next: addressWeapon + infoMod: Item + slotType: char + next: addressAttachment + last: addressGround + info: Item + prev: addressGround + next: addressGround + name: char + currentHP: int + currentWeight: int + maxWeight: int c ======================================================= */	[0.043273,-0.03056,0.003667,0.046696,0.003178,-0.051586,-0.052564,-0.008068,0.055987,0.060876,0.045718,-0.038873,-0.045229,0.004645,-0.048163,-0.008068,-0.000733,-0.052564,0.060387,0.013936,0.036428,-0.011002,0.016869,0.033005,-0.050608,0.018336,-0.038873,0.026649,-0.008557,0.050608,0.037895,0.057453,-0.039362,0.047185,0.027138,-0.024693,0.017847,0.032516,0.019314,-0.039851,0.015891,-0.020292,0.053542,0.055987,-0.041807,0.059898,-0.023226,0.025671,0.028604,-0.030071,0.051586,-0.012469,0.020781,-0.000244,-0.030071,-0.034472,-0.019803,-0.022737,0.061365,0.025671,0.008557,0.052075,0.054031,0.049141,-0.050608,0.000733,-0.027627,0.015402,0.034472,0.042296,0.041318,-0.039362,0.024693,-0.033005,-0.048163,-0.007579,-0.013936,-0.026649,0.045718,-0.039362,-0.032027,0.041318,-0.033494,0.045229,0.005134,0.020292,-0.014424,0.001711,-0.019314,-0.012958,0.055009,0.057942,-0.039851,-0.043273,-0.055987,0.02616,-0.008068,0.015891,-0.004156,0.006601,0.049141,0.001222,-0.01198,0.054031,0.047185,-0.051586,-0.04034,-0.037895,-0.010513,0.028604,0.008068,-0.005623,0.059898,-0.061365,-0.042296,0.018825,0.052075,-0.031538,0.001222,0.059409,-0.051097,-0.054031,-0.032516,-0.005623,0.039851,0.020781,-0.039851,-0.04474,-0.019314,0.032027,-0.05892,-0.015891,-0.059409,0.011002,0.010024,0.05452,-0.006601,-0.001711,-0.016869,0.023715,0.017358,-0.057942,0.014424,0.05452,0.061854,0.010024,-0.0022,-0.048652,-0.02616,0.051586,-0.045718,-0.029582,0.01198,-0.044251,0.023715,-0.035939,0.054031,-0.01198,-0.024693,-0.005134,0.023226,-0.015402,-0.03545,0.037895,-0.04474,-0.030071,-0.043273,0.022737,-0.046696,0.042296,-0.009046,-0.006601,0.020781,-0.002689,0.039362,-0.036917,-0.033983,0.032516,-0.011002,0.050119,-0.041807,0.062343,0.032516,0.028116,0.042784,0.039851,-0.001222,-0.036917,-0.054031,-0.010513,-0.008557,-0.013447,0.01198,-0.061854,0.034961,-0.047185,-0.028116,-0.020292,-0.02127,0.023226,-0.037895,0.029582,0.014424,0.055009,0.048652,0.035939,-0.016869,0.023226,0.03056,-0.02127,0.029093,-0.017358,-0.057453,-0.042296,0.048163,-0.060876,0.043273,0.04963,-0.007579,-0.004645,0.022737,0.019314,0.006601,-0.036428,0.05452,-0.046696,0.058431,-0.055987,-0.013447,-0.061365,0.050608,-0.008557,-0.015402,0.011002,0.022248,0.024693,0.052075,-0.033983,-0.05452,0.056964,-0.002689,0.001222,0.020292,-0.043762,-0.010513,0.031049,-0.061365,-0.003178,0.011491,0.008557,0.030071,0.056964,-0.022737,-0.041807,0.022737,0.017847,0.043273,-0.03056,0.003667,0.046696,0.003178,-0.051586,-0.052564,-0.008068,0.055987,0.060876,0.045718,-0.038873,-0.045229,0.004645,-0.048163,-0.008068,-0.000733,-0.052564,0.060387,0.013936,0.036428,-0.011002,0.016869,0.033005,-0.050608,0.018336,-0.038873,0.026649,-0.008557,0.050608,0.037895,0.057453,-0.039362,0.047185,0.027138,-0.024693,0.017847,0.032516,0.019314,-0.039851,0.015891,-0.020292,0.053542,0.055987,-0.041807,0.059898,-0.023226,0.025671,0.028604,-0.030071,0.051586,-0.012469,0.020781,-0.000244,-0.030071,-0.034472,-0.019803,-0.022737,0.061365,0.025671,0.008557,0.052075,0.054031,0.049141,-0.050608,0.000733,-0.027627,0.015402,0.034472,0.042296,0.041318,-0.039362,0.024693,-0.033005,-0.048163,-0.007579,-0.013936,-0.026649,0.045718,-0.039362,-0.032027,0.041318,-0.033494,0.045229,0.005134,0.020292,-0.014424,0.001711,-0.019314,-0.012958,0.055009,0.057942,-0.039851,-0.043273,-0.055987,0.02616,-0.008068,0.015891,-0.004156,0.006601,0.049141,0.001222,-0.01198,0.054031,0.047185,-0.051586,-0.04034,-0.037895,-0.010513,0.028604,0.008068,-0.005623,0.059898,-0.061365,-0.042296,0.018825,0.052075,-0.031538,0.001222,0.059409,-0.051097,-0.054031,-0.032516,-0.005623,0.039851,0.020781,-0.039851,-0.04474,-0.019314,0.032027,-0.05892,-0.015891,-0.059409,0.011002,0.010024,0.05452,-0.006601,-0.001711,-0.016869,0.023715,0.017358,-0.057942,0.014424,0.05452,0.061854,0.010024,-0.0022,-0.048652,-0.02616,0.051586,-0.045718,-0.029582,0.01198,-0.044251,0.023715,-0.035939,0.054031,-0.01198,-0.024693,-0.005134,0.023226,-0.015402,-0.03545,0.037895,-0.04474,-0.030071,-0.043273,0.022737,-0.046696,0.042296,-0.009046,-0.006601,0.020781,-0.002689,0.039362,-0.036917,-0.033983,0.032516,-0.011002,0.050119,-0.041807,0.062343,0.032516,0.028116,0.042784,0.039851,-0.001222,-0.036917,-0.054031,-0.010513,-0.008557,-0.013447,0.01198,-0.061854,0.034961,-0.047185,-0.028116,-0.020292,-0.02127,0.023226,-0.037895,0.029582,0.014424,0.055009,0.048652,0.035939,-0.016869,0.023226,0.03056,-0.02127,0.029093,-0.017358,-0.057453,-0.042296,0.048163,-0.060876,0.043273,0.04963,-0.007579,-0.004645,0.022737,0.019314,0.006601,-0.036428,0.05452,-0.046696,0.058431,-0.055987,-0.013447,-0.061365,0.050608,-0.008557,-0.015402,0.011002,0.022248,0.024693,0.052075,-0.033983,-0.05452,0.056964,-0.002689,0.001222,0.020292,-0.043762,-0.010513,0.031049,-0.061365,-0.003178,0.011491,0.008557,0.030071,0.056964,-0.022737,-0.041807,0.022737,0.017847,0.043273,-0.03056,0.003667,0.046696,0.003178,-0.051586,-0.052564,-0.008068,0.055987,0.060876,0.045718,-0.038873,-0.045229,0.004645,-0.048163,-0.008068,-0.000733,-0.052564,0.060387,0.013936,0.036428,-0.011002,0.016869,0.033005,-0.050608,0.018336,-0.038873,0.026649,-0.008557,0.050608,0.037895,0.057453,-0.039362,0.047185,0.027138,-0.024693,0.017847,0.032516,0.019314,-0.039851,0.015891,-0.020292,0.053542,0.055987,-0.041807,0.059898,-0.023226,0.025671,0.028604,-0.030071,0.051586,-0.012469,0.020781,-0.000244,-0.030071,-0.034472,-0.019803,-0.022737,0.061365,0.025671,0.008557,0.052075,0.054031,0.049141,-0.050608,0.000733,-0.027627,0.015402,0.034472,0.042296,0.041318,-0.039362,0.024693,-0.033005,-0.048163,-0.007579,-0.013936,-0.026649,0.045718,-0.039362,-0.032027,0.041318,-0.033494,0.045229,0.005134,0.020292,-0.014424,0.001711,-0.019314,-0.012958,0.055009,0.057942,-0.039851,-0.043273,-0.055987,0.02616,-0.008068,0.015891,-0.004156,0.006601,0.049141,0.001222,-0.01198,0.054031,0.047185,-0.051586,-0.04034,-0.037895,-0.010513,0.028604,0.008068,-0.005623,0.059898,-0.061365,-0.042296,0.018825,0.052075,-0.031538,0.001222,0.059409,-0.051097,-0.054031,-0.032516,-0.005623,0.039851,0.020781,-0.039851,-0.04474,-0.019314,0.032027,-0.05892,-0.015891,-0.059409,0.011002,0.010024,0.05452,-0.006601,-0.001711,-0.016869,0.023715,0.017358,-0.057942,0.014424,0.05452,0.061854,0.010024,-0.0022,-0.048652,-0.02616,0.051586,-0.045718,-0.029582,0.01198,-0.044251,0.023715,-0.035939,0.054031,-0.01198,-0.024693,-0.005134,0.023226,-0.015402,-0.03545,0.037895,-0.04474,-0.030071,-0.043273,0.022737,-0.046696,0.042296,-0.009046,-0.006601,0.020781,-0.002689,0.039362,-0.036917,-0.033983,0.032516,-0.011002,0.050119,-0.041807,0.062343,0.032516,0.028116,0.042784,0.039851,-0.001222,-0.036917,-0.054031,-0.010513,-0.008557,-0.013447,0.01198,-0.061854,0.034961,-0.047185,-0.028116,-0.020292,-0.02127,0.023226,-0.037895,0.029582,0.014424,0.055009,0.048652,0.035939,-0.016869,0.023226,0.03056,-0.02127,0.029093,-0.017358,-0.057453,-0.042296,0.048163,-0.060876,0.043273,0.04963,-0.007579,-0.004645,0.022737,0.019314,0.006601,-0.036428,0.05452,-0.046696,0.058431,-0.055987,-0.013447,-0.061365,0.050608,-0.008557,-0.015402,0.011002,0.022248,0.024693,0.052075,-0.033983,-0.05452,0.056964,-0.002689,0.001222,0.020292,-0.043762,-0.010513,0.031049,-0.061365,-0.003178,0.011491,0.008557,0.030071,0.056964,-0.022737,-0.041807,0.022737,0.017847]	2026-11-16 10:18:47.373507+00
911f8ba6-a236-419a-959b-46ddee9c0fb8	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	1	11	typedef struct { int idItem; char namaItem[50]; char kategori[20];   // "Weapon", "Attachment", "Medical", "Ammo" int weight;          // Bobot item untuk perhitungan kapasitas tas int value;           // Damage (Weapon), Heal HP (Medical), dsb. } Item; /* ======================================================= 2. ADT STRUKTUR DATA LINIER: DOUBLY LINKED LIST #ifndef PUBG_INVENTORY_H (Digunakan untuk Ground Loot dan Item Umum di Tas) ======================================================= */ typedef struct NodeGround* addressGround; typedef struct NodeGround { Item info; addressGround prev; addressGround next; } NodeGround; typedef struct { addressGround first; #define PUBG_INVENTORY_H addressGround last; int totalCount; } ListGround; /* ======================================================= 3. ADT STRUKTUR DATA NONLINIER: MULTI LINKED LIST (Parent: Weapon, Child: Attachments terpasang) ======================================================= */ #include <stdio.h> #include <stdlib.h> #include <string.h> #include <stdbool.h> /* ======================================================= 1. TIPE DATA DASAR ITEM typedef struct NodeAttachment* addressAttachment; int currentRecoil;            // Nilai recoil dasar int currentMagSize;           // Kapasitas mag dasar addressAttachment childMods;  // Pointer ke sub-list anak (Attachments) addressWeapon next;           // Pointer ke senjata berikutnya } NodeWeapon;	[-0.023219,0.004155,-0.016375,-0.057925,0.058413,-0.015398,0.004155,-0.026152,0.041305,-0.005133,-0.001711,0.013931,0.029573,0.048148,0.015398,0.037883,0.011976,0.039838,-0.016864,-0.045704,-0.014909,-0.029085,-0.019308,-0.028107,-0.051081,0.040816,-0.003177,0.058413,-0.056947,-0.012954,0.042283,-0.012465,0.045215,-0.016864,-0.047171,-0.060858,0.02664,0.005133,-0.035439,-0.030062,0.059391,0.027618,-0.048637,0.03935,-0.036417,-0.044238,-0.011976,-0.021752,-0.035928,0.032506,-0.002688,-0.051081,-0.05157,0.012465,-0.02273,-0.045704,0.0022,-0.055969,0.029573,-0.018819,-0.03495,0.00611,-0.062324,0.049126,0.008065,-0.027129,0.014909,-0.02664,0.027129,0.015886,-0.027129,-0.057436,0.010021,0.026152,0.029573,0.045215,0.060858,-0.045704,-0.015886,0.006599,0.04326,-0.054014,0.01442,-0.01442,-0.046193,0.0022,0.011976,-0.059391,-0.019797,-0.053036,0.028107,0.027129,-0.025663,0.018331,-0.05157,-0.043749,0.013931,-0.048148,0.046682,0.032995,0.057925,0.036417,0.058413,0.001222,0.028107,0.058902,0.045215,-0.054503,-0.005133,-0.012954,0.019308,0.009532,-0.004644,0.001222,0.028596,0.042771,-0.020286,0.043749,0.008554,0.048148,0.033484,-0.024685,-0.001711,0.012465,-0.003666,0.037394,0.031529,-0.044727,0.03935,-0.058413,0.046193,0.004644,-0.004155,0.047171,-0.058413,0.036417,-0.021263,0.057436,0.060858,-0.048637,-0.032995,-0.01442,-0.047171,-0.024685,-0.050592,-0.02273,0.045704,0.016864,0.047659,0.033484,0.04326,0.034461,0.011487,-0.021752,0.059391,-0.004155,0.005621,0.049615,-0.020286,0.050104,-0.017353,0.045704,0.015398,0.001711,-0.035928,-0.057436,0.027129,0.032506,-0.003177,-0.03495,0.013931,-0.023219,0.026152,0.018331,0.050592,0.040816,0.02664,-0.030062,0.05988,0.011487,0.010998,-0.050104,0.039838,0.016864,-0.060369,0.006599,-0.032995,0.043749,0.027618,-0.056458,0.000244,-0.013442,-0.054503,0.035439,-0.047659,0.035928,-0.035439,-0.046682,0.035439,0.005133,-0.052548,-0.036417,-0.032995,-0.017353,-0.001711,0.016864,0.046682,-0.055969,-0.019308,0.008554,-0.048148,0.048148,0.016375,-0.060369,-0.050592,0.003177,0.042771,0.009532,-0.034461,-0.035439,0.036906,-0.044238,0.010998,0.018819,-0.048637,0.01442,-0.015886,-0.029573,-0.004644,-0.026152,-0.004155,-0.061346,-0.034461,-0.003666,-0.017353,0.008065,0.057436,0.049615,-0.04326,-0.053036,0.057925,-0.061346,-0.033973,-0.019797,0.042283,-0.018819,-0.054014,-0.01442,-0.029085,0.037883,0.060858,-0.050104,0.058902,-0.025174,-0.03104,0.017842,-0.023219,0.004155,-0.016375,-0.057925,0.058413,-0.015398,0.004155,-0.026152,0.041305,-0.005133,-0.001711,0.013931,0.029573,0.048148,0.015398,0.037883,0.011976,0.039838,-0.016864,-0.045704,-0.014909,-0.029085,-0.019308,-0.028107,-0.051081,0.040816,-0.003177,0.058413,-0.056947,-0.012954,0.042283,-0.012465,0.045215,-0.016864,-0.047171,-0.060858,0.02664,0.005133,-0.035439,-0.030062,0.059391,0.027618,-0.048637,0.03935,-0.036417,-0.044238,-0.011976,-0.021752,-0.035928,0.032506,-0.002688,-0.051081,-0.05157,0.012465,-0.02273,-0.045704,0.0022,-0.055969,0.029573,-0.018819,-0.03495,0.00611,-0.062324,0.049126,0.008065,-0.027129,0.014909,-0.02664,0.027129,0.015886,-0.027129,-0.057436,0.010021,0.026152,0.029573,0.045215,0.060858,-0.045704,-0.015886,0.006599,0.04326,-0.054014,0.01442,-0.01442,-0.046193,0.0022,0.011976,-0.059391,-0.019797,-0.053036,0.028107,0.027129,-0.025663,0.018331,-0.05157,-0.043749,0.013931,-0.048148,0.046682,0.032995,0.057925,0.036417,0.058413,0.001222,0.028107,0.058902,0.045215,-0.054503,-0.005133,-0.012954,0.019308,0.009532,-0.004644,0.001222,0.028596,0.042771,-0.020286,0.043749,0.008554,0.048148,0.033484,-0.024685,-0.001711,0.012465,-0.003666,0.037394,0.031529,-0.044727,0.03935,-0.058413,0.046193,0.004644,-0.004155,0.047171,-0.058413,0.036417,-0.021263,0.057436,0.060858,-0.048637,-0.032995,-0.01442,-0.047171,-0.024685,-0.050592,-0.02273,0.045704,0.016864,0.047659,0.033484,0.04326,0.034461,0.011487,-0.021752,0.059391,-0.004155,0.005621,0.049615,-0.020286,0.050104,-0.017353,0.045704,0.015398,0.001711,-0.035928,-0.057436,0.027129,0.032506,-0.003177,-0.03495,0.013931,-0.023219,0.026152,0.018331,0.050592,0.040816,0.02664,-0.030062,0.05988,0.011487,0.010998,-0.050104,0.039838,0.016864,-0.060369,0.006599,-0.032995,0.043749,0.027618,-0.056458,0.000244,-0.013442,-0.054503,0.035439,-0.047659,0.035928,-0.035439,-0.046682,0.035439,0.005133,-0.052548,-0.036417,-0.032995,-0.017353,-0.001711,0.016864,0.046682,-0.055969,-0.019308,0.008554,-0.048148,0.048148,0.016375,-0.060369,-0.050592,0.003177,0.042771,0.009532,-0.034461,-0.035439,0.036906,-0.044238,0.010998,0.018819,-0.048637,0.01442,-0.015886,-0.029573,-0.004644,-0.026152,-0.004155,-0.061346,-0.034461,-0.003666,-0.017353,0.008065,0.057436,0.049615,-0.04326,-0.053036,0.057925,-0.061346,-0.033973,-0.019797,0.042283,-0.018819,-0.054014,-0.01442,-0.029085,0.037883,0.060858,-0.050104,0.058902,-0.025174,-0.03104,0.017842,-0.023219,0.004155,-0.016375,-0.057925,0.058413,-0.015398,0.004155,-0.026152,0.041305,-0.005133,-0.001711,0.013931,0.029573,0.048148,0.015398,0.037883,0.011976,0.039838,-0.016864,-0.045704,-0.014909,-0.029085,-0.019308,-0.028107,-0.051081,0.040816,-0.003177,0.058413,-0.056947,-0.012954,0.042283,-0.012465,0.045215,-0.016864,-0.047171,-0.060858,0.02664,0.005133,-0.035439,-0.030062,0.059391,0.027618,-0.048637,0.03935,-0.036417,-0.044238,-0.011976,-0.021752,-0.035928,0.032506,-0.002688,-0.051081,-0.05157,0.012465,-0.02273,-0.045704,0.0022,-0.055969,0.029573,-0.018819,-0.03495,0.00611,-0.062324,0.049126,0.008065,-0.027129,0.014909,-0.02664,0.027129,0.015886,-0.027129,-0.057436,0.010021,0.026152,0.029573,0.045215,0.060858,-0.045704,-0.015886,0.006599,0.04326,-0.054014,0.01442,-0.01442,-0.046193,0.0022,0.011976,-0.059391,-0.019797,-0.053036,0.028107,0.027129,-0.025663,0.018331,-0.05157,-0.043749,0.013931,-0.048148,0.046682,0.032995,0.057925,0.036417,0.058413,0.001222,0.028107,0.058902,0.045215,-0.054503,-0.005133,-0.012954,0.019308,0.009532,-0.004644,0.001222,0.028596,0.042771,-0.020286,0.043749,0.008554,0.048148,0.033484,-0.024685,-0.001711,0.012465,-0.003666,0.037394,0.031529,-0.044727,0.03935,-0.058413,0.046193,0.004644,-0.004155,0.047171,-0.058413,0.036417,-0.021263,0.057436,0.060858,-0.048637,-0.032995,-0.01442,-0.047171,-0.024685,-0.050592,-0.02273,0.045704,0.016864,0.047659,0.033484,0.04326,0.034461,0.011487,-0.021752,0.059391,-0.004155,0.005621,0.049615,-0.020286,0.050104,-0.017353,0.045704,0.015398,0.001711,-0.035928,-0.057436,0.027129,0.032506,-0.003177,-0.03495,0.013931,-0.023219,0.026152,0.018331,0.050592,0.040816,0.02664,-0.030062,0.05988,0.011487,0.010998,-0.050104,0.039838,0.016864,-0.060369,0.006599,-0.032995,0.043749,0.027618,-0.056458,0.000244,-0.013442,-0.054503,0.035439,-0.047659,0.035928,-0.035439,-0.046682,0.035439,0.005133,-0.052548,-0.036417,-0.032995,-0.017353,-0.001711,0.016864,0.046682,-0.055969,-0.019308,0.008554,-0.048148,0.048148,0.016375,-0.060369,-0.050592,0.003177,0.042771,0.009532,-0.034461,-0.035439,0.036906,-0.044238,0.010998,0.018819,-0.048637,0.01442,-0.015886,-0.029573,-0.004644,-0.026152,-0.004155,-0.061346,-0.034461,-0.003666,-0.017353,0.008065,0.057436,0.049615,-0.04326,-0.053036,0.057925,-0.061346,-0.033973,-0.019797,0.042283,-0.018819,-0.054014,-0.01442,-0.029085,0.037883,0.060858,-0.050104,0.058902,-0.025174,-0.03104,0.017842]	2026-11-16 10:18:47.390329+00
1aa27d2a-44fd-46d4-9c97-865078b230df	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	2	12	typedef struct { addressWeapon first; int weaponCount;              // Maksimal 2 senjata primer } ListWeapon; /* ======================================================= typedef struct NodeAttachment { 4. TIPE DATA PEMAIN & STATUS INVENTORI ======================================================= */ typedef struct { char playerName[50]; int currentHealth;            // Maksimal 100 int backpackLevel;            // 0: Polos (100), 1: 150, 2: 200, 3: 250 int currentWeight; int maxWeight; ListGround bagItems;          // Item umum dalam tas (Doubly Linked List) ListWeapon equippedWeapons;   // Senjata & modifikasi (Multi Linked List) Item info; } Player; #endif void createListGround(ListGround *L)\nfirst = NULL\nlast = NULL addressGround allocateGroundNode(Item X) void deallocateGroundNode(addressGround P) char slotType[20];            // "Scope", "Muzzle", "Magazine", "Grip" addressAttachment next;       // Menunjuk ke attachment berikutnya } NodeAttachment; typedef struct NodeWeapon* addressWeapon; typedef struct NodeWeapon { Item info; void insertGroundLast(ListGround *L, addressGround P) void insertAttachmentChild(addressWeapon W, addressAttachment A) bool deleteAttachmentChild(addressWeapon W, char slot[], addressAttachment *A) addressWeapon searchWeapon(ListWeapon LW, int idWeapon) bool LootItem(Player *P, ListGround *G, int idItem) P->currentWeight + item.weight <= P->maxWeight	[-0.060731,0.002213,-0.050896,-0.021391,0.019916,0.048437,0.016473,-0.025817,0.056797,0.014998,-0.043028,0.058764,0.020407,-0.030734,0.003688,0.062698,-0.029259,-0.008606,-0.044011,0.019424,-0.033685,-0.055813,0.037619,-0.003688,0.029751,0.00713,0.045978,-0.009097,0.042044,-0.047945,0.036143,-0.055321,-0.000246,0.048437,-0.062206,-0.019916,0.052863,0.048437,-0.019916,0.014015,0.041552,-0.056797,0.022374,0.01549,-0.052863,0.01254,-0.018932,-0.014998,0.017457,-0.014998,0.054338,0.01549,0.021391,-0.014506,0.041552,-0.047945,0.049912,0.041061,-0.026308,-0.035652,-0.008606,-0.037619,0.052371,-0.007622,0.033685,-0.029259,0.043519,-0.052863,0.051387,-0.045978,-0.014998,-0.057288,0.025325,-0.016473,0.051387,0.027292,0.051879,0.000738,-0.027784,0.031226,-0.060731,0.022866,0.050404,0.050896,-0.002213,0.038602,-0.056797,-0.03516,0.061222,-0.024341,-0.048437,-0.040569,0.010573,0.04647,-0.058272,-0.02385,-0.031718,0.016965,0.032209,0.011556,0.021391,0.016965,0.011556,-0.017457,0.010081,-0.025325,-0.009097,-0.015982,-0.021391,0.044011,0.01254,0.016473,0.048929,-0.04647,-0.040077,-0.015982,0.052863,-0.045978,-0.052863,0.04647,0.01844,0.009589,0.005163,0.058764,-0.040077,-0.006147,-0.042044,0.02385,0.002213,-0.060731,0.012048,0.041552,-0.043028,-0.014506,-0.04647,0.037127,-0.006147,-0.047945,0.019916,-0.00418,-0.042536,0.032209,-0.059255,-0.000246,0.033685,0.054338,0.018932,-0.043519,0.029259,0.00713,-0.025325,0.059255,-0.033193,-0.055813,-0.016965,0.053846,-0.020899,0.014998,-0.0268,0.007622,0.062698,-0.014506,0.000738,0.043028,-0.010081,-0.014506,0.043028,-0.048929,-0.021391,0.006147,-0.040569,-0.047453,0.010081,-0.050404,0.044011,0.047945,-0.045486,0.047945,-0.008606,-0.047453,-0.041552,0.048437,-0.021391,0.014998,-0.013031,-0.021883,0.036635,0.027292,0.054338,0.025325,-0.010573,0.055321,-0.029259,0.033685,-0.019424,0.010081,-0.011556,0.016965,0.047945,0.005655,-0.037619,0.04647,-0.011556,-0.035652,-0.011064,-0.062206,0.03516,-0.031718,0.002213,-0.040077,-0.01254,-0.012048,0.060731,-0.024341,0.006147,0.027784,-0.001721,0.038602,0.014506,0.022374,-0.052371,-0.016473,0.004672,0.039094,0.031226,-0.045978,-0.030734,-0.051387,-0.041552,-0.045978,-0.051387,0.045486,-0.052863,0.037619,0.053846,0.046962,0.041552,-0.018932,-0.050404,-0.04647,-0.014015,0.016473,0.022866,0.046962,-0.010081,0.016965,0.010081,-0.016473,-0.044503,-0.053354,-0.05778,-0.00418,0.022866,0.056797,0.020899,-0.039094,-0.060731,0.002213,-0.050896,-0.021391,0.019916,0.048437,0.016473,-0.025817,0.056797,0.014998,-0.043028,0.058764,0.020407,-0.030734,0.003688,0.062698,-0.029259,-0.008606,-0.044011,0.019424,-0.033685,-0.055813,0.037619,-0.003688,0.029751,0.00713,0.045978,-0.009097,0.042044,-0.047945,0.036143,-0.055321,-0.000246,0.048437,-0.062206,-0.019916,0.052863,0.048437,-0.019916,0.014015,0.041552,-0.056797,0.022374,0.01549,-0.052863,0.01254,-0.018932,-0.014998,0.017457,-0.014998,0.054338,0.01549,0.021391,-0.014506,0.041552,-0.047945,0.049912,0.041061,-0.026308,-0.035652,-0.008606,-0.037619,0.052371,-0.007622,0.033685,-0.029259,0.043519,-0.052863,0.051387,-0.045978,-0.014998,-0.057288,0.025325,-0.016473,0.051387,0.027292,0.051879,0.000738,-0.027784,0.031226,-0.060731,0.022866,0.050404,0.050896,-0.002213,0.038602,-0.056797,-0.03516,0.061222,-0.024341,-0.048437,-0.040569,0.010573,0.04647,-0.058272,-0.02385,-0.031718,0.016965,0.032209,0.011556,0.021391,0.016965,0.011556,-0.017457,0.010081,-0.025325,-0.009097,-0.015982,-0.021391,0.044011,0.01254,0.016473,0.048929,-0.04647,-0.040077,-0.015982,0.052863,-0.045978,-0.052863,0.04647,0.01844,0.009589,0.005163,0.058764,-0.040077,-0.006147,-0.042044,0.02385,0.002213,-0.060731,0.012048,0.041552,-0.043028,-0.014506,-0.04647,0.037127,-0.006147,-0.047945,0.019916,-0.00418,-0.042536,0.032209,-0.059255,-0.000246,0.033685,0.054338,0.018932,-0.043519,0.029259,0.00713,-0.025325,0.059255,-0.033193,-0.055813,-0.016965,0.053846,-0.020899,0.014998,-0.0268,0.007622,0.062698,-0.014506,0.000738,0.043028,-0.010081,-0.014506,0.043028,-0.048929,-0.021391,0.006147,-0.040569,-0.047453,0.010081,-0.050404,0.044011,0.047945,-0.045486,0.047945,-0.008606,-0.047453,-0.041552,0.048437,-0.021391,0.014998,-0.013031,-0.021883,0.036635,0.027292,0.054338,0.025325,-0.010573,0.055321,-0.029259,0.033685,-0.019424,0.010081,-0.011556,0.016965,0.047945,0.005655,-0.037619,0.04647,-0.011556,-0.035652,-0.011064,-0.062206,0.03516,-0.031718,0.002213,-0.040077,-0.01254,-0.012048,0.060731,-0.024341,0.006147,0.027784,-0.001721,0.038602,0.014506,0.022374,-0.052371,-0.016473,0.004672,0.039094,0.031226,-0.045978,-0.030734,-0.051387,-0.041552,-0.045978,-0.051387,0.045486,-0.052863,0.037619,0.053846,0.046962,0.041552,-0.018932,-0.050404,-0.04647,-0.014015,0.016473,0.022866,0.046962,-0.010081,0.016965,0.010081,-0.016473,-0.044503,-0.053354,-0.05778,-0.00418,0.022866,0.056797,0.020899,-0.039094,-0.060731,0.002213,-0.050896,-0.021391,0.019916,0.048437,0.016473,-0.025817,0.056797,0.014998,-0.043028,0.058764,0.020407,-0.030734,0.003688,0.062698,-0.029259,-0.008606,-0.044011,0.019424,-0.033685,-0.055813,0.037619,-0.003688,0.029751,0.00713,0.045978,-0.009097,0.042044,-0.047945,0.036143,-0.055321,-0.000246,0.048437,-0.062206,-0.019916,0.052863,0.048437,-0.019916,0.014015,0.041552,-0.056797,0.022374,0.01549,-0.052863,0.01254,-0.018932,-0.014998,0.017457,-0.014998,0.054338,0.01549,0.021391,-0.014506,0.041552,-0.047945,0.049912,0.041061,-0.026308,-0.035652,-0.008606,-0.037619,0.052371,-0.007622,0.033685,-0.029259,0.043519,-0.052863,0.051387,-0.045978,-0.014998,-0.057288,0.025325,-0.016473,0.051387,0.027292,0.051879,0.000738,-0.027784,0.031226,-0.060731,0.022866,0.050404,0.050896,-0.002213,0.038602,-0.056797,-0.03516,0.061222,-0.024341,-0.048437,-0.040569,0.010573,0.04647,-0.058272,-0.02385,-0.031718,0.016965,0.032209,0.011556,0.021391,0.016965,0.011556,-0.017457,0.010081,-0.025325,-0.009097,-0.015982,-0.021391,0.044011,0.01254,0.016473,0.048929,-0.04647,-0.040077,-0.015982,0.052863,-0.045978,-0.052863,0.04647,0.01844,0.009589,0.005163,0.058764,-0.040077,-0.006147,-0.042044,0.02385,0.002213,-0.060731,0.012048,0.041552,-0.043028,-0.014506,-0.04647,0.037127,-0.006147,-0.047945,0.019916,-0.00418,-0.042536,0.032209,-0.059255,-0.000246,0.033685,0.054338,0.018932,-0.043519,0.029259,0.00713,-0.025325,0.059255,-0.033193,-0.055813,-0.016965,0.053846,-0.020899,0.014998,-0.0268,0.007622,0.062698,-0.014506,0.000738,0.043028,-0.010081,-0.014506,0.043028,-0.048929,-0.021391,0.006147,-0.040569,-0.047453,0.010081,-0.050404,0.044011,0.047945,-0.045486,0.047945,-0.008606,-0.047453,-0.041552,0.048437,-0.021391,0.014998,-0.013031,-0.021883,0.036635,0.027292,0.054338,0.025325,-0.010573,0.055321,-0.029259,0.033685,-0.019424,0.010081,-0.011556,0.016965,0.047945,0.005655,-0.037619,0.04647,-0.011556,-0.035652,-0.011064,-0.062206,0.03516,-0.031718,0.002213,-0.040077,-0.01254,-0.012048,0.060731,-0.024341,0.006147,0.027784,-0.001721,0.038602,0.014506,0.022374,-0.052371,-0.016473,0.004672,0.039094,0.031226,-0.045978,-0.030734,-0.051387,-0.041552,-0.045978,-0.051387,0.045486,-0.052863,0.037619,0.053846,0.046962,0.041552,-0.018932,-0.050404,-0.04647,-0.014015,0.016473,0.022866,0.046962,-0.010081,0.016965,0.010081,-0.016473,-0.044503,-0.053354,-0.05778,-0.00418,0.022866,0.056797,0.020899,-0.039094]	2026-11-16 10:18:47.413196+00
9da345cf-43a7-4bfd-9f00-f6c4f2e027cf	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	3	13	G\nP->bagItems true\nfalse bool EquipAttachment(Player *P, int idWeapon, int idAttachmentItem) equippedWeapons void deleteGroundNode(ListGround *L, addressGround P) P->prev\nP->next addressGround searchGroundItem(ListGround L, int idItem) void printGroundList(ListGround L) void createListWeapon(ListWeapon *LW) addressWeapon allocateWeaponNode(Item X) addressAttachment allocateAttachmentNode(Item X, char slot[]) void insertWeaponLast(ListWeapon *LW, addressWeapon W) bool DropItemToGround(Player *P, ListGround *G, int idItem) P->currentWeight ListGround bool UseMedicalItem(Player *P, int idItem) void UnequipWeaponCascade(Player *P, ListGround *G, int idWeapon) text selain itu jika (P.currentWeight + nodeTarget->info.weight > P.maxWeight) maka Tuliskan("Kapasitas tas tidak mencukupi! Looting dibatalkan.") selain itu deleteGroundNode(G, nodeTarget) insertGroundLast(P.bagItems, nodeTarget) P.currentWeight <- P.currentWeight + nodeTarget->info.weight Tuliskan("Berhasil mengambil: ", nodeTarget->info.namaItem) akhir jika akhir jika Prosedur LootItem(input/output P: Player, input/output G: ListGround, input akhir prosedur idTarget: integer) KAMUS LOKAL: nodeTarget: addressGround ALGORITMA: nodeTarget <- searchGroundItem(G, idTarget) jika (nodeTarget = NIL) maka Tuliskan("Item tidak ditemukan di area sekitar!") text wepNode <- searchWeapon(P.equippedWeapons, idWep) itemModNode <- searchGroundItem(P.bagItems, idMod) jika (wepNode = NIL atau itemModNode = NIL) maka Tuliskan("Senjata atau Attachment tidak valid!")	[-0.032339,0.054223,0.019695,0.046929,0.003647,0.008024,0.032826,-0.053251,-0.044011,0.020182,-0.0586,0.059573,0.010942,-0.028935,-0.034771,0.018723,-0.000729,0.045956,-0.019695,0.053737,0.009969,-0.031367,-0.030394,-0.002675,-0.033312,0.000243,0.008997,-0.049847,0.035257,-0.0231,-0.0231,0.032826,-0.015805,0.048388,0.043038,0.00851,-0.053737,-0.006079,-0.034771,0.022613,-0.024072,-0.008997,-0.0586,-0.048388,-0.024072,0.014832,-0.059086,-0.040607,0.042552,0.015319,-0.002675,0.031367,0.056169,-0.003161,0.057627,-0.037689,-0.006565,-0.005593,0.019209,-0.060059,-0.001216,0.026017,-0.057141,-0.019209,0.061032,-0.039148,-0.011428,0.015805,0.034771,-0.0231,-0.060545,-0.022127,-0.012887,-0.010942,0.034771,0.028449,0.042066,0.002188,0.0586,0.049847,-0.031853,-0.047415,0.011428,0.022613,0.041093,0.062004,0.000729,-0.033798,-0.002188,-0.030881,-0.022127,-0.018723,0.004134,0.008024,0.008024,0.001702,-0.046929,0.017264,-0.050333,-0.022613,-0.022613,-0.037203,0.0586,-0.00851,-0.055196,-0.04012,0.034771,0.044983,-0.055196,0.045956,0.034285,0.052764,0.011428,0.046442,0.028449,-0.062004,0.025045,-0.034285,-0.035744,0.055682,-0.037689,-0.036716,-0.011915,0.033312,-0.032339,0.057141,0.03623,0.011915,0.029908,-0.008024,-0.042552,-0.015319,-0.0586,-0.054223,-0.029422,0.008997,0.018237,-0.042066,0.003647,-0.002675,-0.051305,0.033312,0.027476,-0.043525,0.061518,-0.016291,0.042552,-0.00851,-0.052278,0.030881,0.031853,0.059573,0.028935,-0.062004,-0.053251,0.012401,-0.02699,0.039148,0.039148,-0.029422,0.046442,-0.01386,-0.019209,-0.053737,0.00851,0.056169,0.027476,-0.039634,0.038175,0.053251,0.003647,0.01386,0.038175,-0.047415,0.003161,0.021641,-0.019695,-0.046929,0.059573,-0.030881,-0.006079,0.059086,-0.00462,0.024559,0.055682,0.056655,-0.043038,0.002188,0.061032,-0.03623,0.005106,0.043038,-0.001216,0.0231,0.050819,-0.046442,-0.027476,0.039148,0.001702,0.04012,0.04936,0.051305,-0.027476,-0.033798,-0.020182,-0.060059,-0.003647,-0.012401,0.030394,0.014832,-0.050819,-0.039634,-0.021154,-0.000243,-0.061518,0.028449,0.060059,0.031367,0.04012,0.043525,-0.058114,-0.054223,-0.054223,-0.060545,0.015319,-0.044983,0.011915,0.039634,0.039634,0.025045,-0.003647,0.053737,0.007051,0.022127,-0.027476,-0.017264,0.007051,-0.016291,-0.027963,-0.009483,-0.050819,-0.015805,-0.033798,0.000243,-0.037203,0.027963,0.026504,-0.006565,0.024559,0.025531,0.050333,-0.028935,0.029908,-0.005106,-0.026017,-0.050333,-0.032339,0.054223,0.019695,0.046929,0.003647,0.008024,0.032826,-0.053251,-0.044011,0.020182,-0.0586,0.059573,0.010942,-0.028935,-0.034771,0.018723,-0.000729,0.045956,-0.019695,0.053737,0.009969,-0.031367,-0.030394,-0.002675,-0.033312,0.000243,0.008997,-0.049847,0.035257,-0.0231,-0.0231,0.032826,-0.015805,0.048388,0.043038,0.00851,-0.053737,-0.006079,-0.034771,0.022613,-0.024072,-0.008997,-0.0586,-0.048388,-0.024072,0.014832,-0.059086,-0.040607,0.042552,0.015319,-0.002675,0.031367,0.056169,-0.003161,0.057627,-0.037689,-0.006565,-0.005593,0.019209,-0.060059,-0.001216,0.026017,-0.057141,-0.019209,0.061032,-0.039148,-0.011428,0.015805,0.034771,-0.0231,-0.060545,-0.022127,-0.012887,-0.010942,0.034771,0.028449,0.042066,0.002188,0.0586,0.049847,-0.031853,-0.047415,0.011428,0.022613,0.041093,0.062004,0.000729,-0.033798,-0.002188,-0.030881,-0.022127,-0.018723,0.004134,0.008024,0.008024,0.001702,-0.046929,0.017264,-0.050333,-0.022613,-0.022613,-0.037203,0.0586,-0.00851,-0.055196,-0.04012,0.034771,0.044983,-0.055196,0.045956,0.034285,0.052764,0.011428,0.046442,0.028449,-0.062004,0.025045,-0.034285,-0.035744,0.055682,-0.037689,-0.036716,-0.011915,0.033312,-0.032339,0.057141,0.03623,0.011915,0.029908,-0.008024,-0.042552,-0.015319,-0.0586,-0.054223,-0.029422,0.008997,0.018237,-0.042066,0.003647,-0.002675,-0.051305,0.033312,0.027476,-0.043525,0.061518,-0.016291,0.042552,-0.00851,-0.052278,0.030881,0.031853,0.059573,0.028935,-0.062004,-0.053251,0.012401,-0.02699,0.039148,0.039148,-0.029422,0.046442,-0.01386,-0.019209,-0.053737,0.00851,0.056169,0.027476,-0.039634,0.038175,0.053251,0.003647,0.01386,0.038175,-0.047415,0.003161,0.021641,-0.019695,-0.046929,0.059573,-0.030881,-0.006079,0.059086,-0.00462,0.024559,0.055682,0.056655,-0.043038,0.002188,0.061032,-0.03623,0.005106,0.043038,-0.001216,0.0231,0.050819,-0.046442,-0.027476,0.039148,0.001702,0.04012,0.04936,0.051305,-0.027476,-0.033798,-0.020182,-0.060059,-0.003647,-0.012401,0.030394,0.014832,-0.050819,-0.039634,-0.021154,-0.000243,-0.061518,0.028449,0.060059,0.031367,0.04012,0.043525,-0.058114,-0.054223,-0.054223,-0.060545,0.015319,-0.044983,0.011915,0.039634,0.039634,0.025045,-0.003647,0.053737,0.007051,0.022127,-0.027476,-0.017264,0.007051,-0.016291,-0.027963,-0.009483,-0.050819,-0.015805,-0.033798,0.000243,-0.037203,0.027963,0.026504,-0.006565,0.024559,0.025531,0.050333,-0.028935,0.029908,-0.005106,-0.026017,-0.050333,-0.032339,0.054223,0.019695,0.046929,0.003647,0.008024,0.032826,-0.053251,-0.044011,0.020182,-0.0586,0.059573,0.010942,-0.028935,-0.034771,0.018723,-0.000729,0.045956,-0.019695,0.053737,0.009969,-0.031367,-0.030394,-0.002675,-0.033312,0.000243,0.008997,-0.049847,0.035257,-0.0231,-0.0231,0.032826,-0.015805,0.048388,0.043038,0.00851,-0.053737,-0.006079,-0.034771,0.022613,-0.024072,-0.008997,-0.0586,-0.048388,-0.024072,0.014832,-0.059086,-0.040607,0.042552,0.015319,-0.002675,0.031367,0.056169,-0.003161,0.057627,-0.037689,-0.006565,-0.005593,0.019209,-0.060059,-0.001216,0.026017,-0.057141,-0.019209,0.061032,-0.039148,-0.011428,0.015805,0.034771,-0.0231,-0.060545,-0.022127,-0.012887,-0.010942,0.034771,0.028449,0.042066,0.002188,0.0586,0.049847,-0.031853,-0.047415,0.011428,0.022613,0.041093,0.062004,0.000729,-0.033798,-0.002188,-0.030881,-0.022127,-0.018723,0.004134,0.008024,0.008024,0.001702,-0.046929,0.017264,-0.050333,-0.022613,-0.022613,-0.037203,0.0586,-0.00851,-0.055196,-0.04012,0.034771,0.044983,-0.055196,0.045956,0.034285,0.052764,0.011428,0.046442,0.028449,-0.062004,0.025045,-0.034285,-0.035744,0.055682,-0.037689,-0.036716,-0.011915,0.033312,-0.032339,0.057141,0.03623,0.011915,0.029908,-0.008024,-0.042552,-0.015319,-0.0586,-0.054223,-0.029422,0.008997,0.018237,-0.042066,0.003647,-0.002675,-0.051305,0.033312,0.027476,-0.043525,0.061518,-0.016291,0.042552,-0.00851,-0.052278,0.030881,0.031853,0.059573,0.028935,-0.062004,-0.053251,0.012401,-0.02699,0.039148,0.039148,-0.029422,0.046442,-0.01386,-0.019209,-0.053737,0.00851,0.056169,0.027476,-0.039634,0.038175,0.053251,0.003647,0.01386,0.038175,-0.047415,0.003161,0.021641,-0.019695,-0.046929,0.059573,-0.030881,-0.006079,0.059086,-0.00462,0.024559,0.055682,0.056655,-0.043038,0.002188,0.061032,-0.03623,0.005106,0.043038,-0.001216,0.0231,0.050819,-0.046442,-0.027476,0.039148,0.001702,0.04012,0.04936,0.051305,-0.027476,-0.033798,-0.020182,-0.060059,-0.003647,-0.012401,0.030394,0.014832,-0.050819,-0.039634,-0.021154,-0.000243,-0.061518,0.028449,0.060059,0.031367,0.04012,0.043525,-0.058114,-0.054223,-0.054223,-0.060545,0.015319,-0.044983,0.011915,0.039634,0.039634,0.025045,-0.003647,0.053737,0.007051,0.022127,-0.027476,-0.017264,0.007051,-0.016291,-0.027963,-0.009483,-0.050819,-0.015805,-0.033798,0.000243,-0.037203,0.027963,0.026504,-0.006565,0.024559,0.025531,0.050333,-0.028935,0.029908,-0.005106,-0.026017,-0.050333]	2026-11-16 10:18:47.429653+00
9a17a9d1-5872-4a46-91bd-973c3f85331b	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	4	16	selain itu // Cek apakah slot pada child list sudah terisi childIter <- wepNode->childMods slotSudahAda <- false selama (childIter != NIL dan tidak slotSudahAda) lakukan Prosedur AttachModToWeapon(input/output P: Player, input idWep: integer, input jika (childIter->slotType = itemModNode->info.kategori) maka slotSudahAda <- true akhir jika childIter <- childIter->next akhir selama jika (slotSudahAda) maka Tuliskan("Slot tersebut sudah terisi pada senjata ini!") selain itu // Pindahkan dari tas ke sub-list child senjata idMod: integer) deleteGroundNode(P.bagItems, itemModNode) P.currentWeight <- P.currentWeight - itemModNode->info.weight nodeAnakBaru <- allocateAttachmentNode(itemModNode->info, itemModNode- >info.kategori) insertAttachmentChild(wepNode, nodeAnakBaru) dealokasi(itemModNode) Tuliskan("Attachment berhasil dipasang pada ", wepNode->info.namaItem) akhir jika akhir jika KAMUS LOKAL: akhir prosedur wepNode: addressWeapon itemModNode: addressGround childIter: addressAttachment slotSudahAda: boolean ALGORITMA: [████████░░] 80/100 HP [██████████] 145/150 WT 0x... prev\nnext childMods text ├── [Muzzle]   : Compensator AR (Recoil -15%) ├── [Scope]    : 4x ACOG Scope (Zoom 4x) └── [Magazine] : Ext. Quickdraw Mag (+10 Peluru) [Slot 2] Kar98k [Sniper Rifle] (Base Dmg: 79)	[0.032199,0.034136,0.007505,-0.032199,0.021547,0.036557,0.050114,0.050114,0.021547,-0.036557,-0.026389,-0.057862,-0.04043,0.032199,0.059314,-0.02881,-0.038978,0.047693,0.046241,0.003147,-0.006052,-0.025905,0.000242,-0.035104,-0.032683,-0.013315,-0.002663,-0.046241,-0.039946,0.017673,0.04382,0.006537,-0.023484,0.055441,-0.03801,0.004116,0.036557,0.056893,0.00121,-0.038978,0.032199,-0.032199,0.011379,-0.027841,-0.013315,-0.04382,-0.037525,-0.033652,-0.023484,-0.012347,0.000726,0.002663,-0.037041,-0.031715,0.02881,-0.01961,0.039462,-0.000726,-0.032199,-0.036557,-0.017189,0.053504,-0.002179,-0.037041,-0.060767,-0.05883,-0.023484,-0.00121,0.052535,-0.056409,-0.042851,0.019126,0.052535,0.056409,0.0046,-0.026873,-0.009442,-0.060767,-0.033652,-0.059798,-0.007989,-0.045272,-0.046725,0.034136,-0.037041,0.005084,-0.030747,-0.004116,-0.001695,0.017673,0.028326,-0.015252,-0.008958,-0.013315,-0.049146,0.037525,-0.054472,0.024452,0.054956,-0.026873,0.005568,0.025905,-0.029778,0.053988,0.00121,-0.00121,-0.01961,0.003147,-0.044304,-0.012831,0.055441,0.059314,-0.054472,-0.043336,-0.030262,-0.028326,-0.006052,-0.000726,-0.002179,0.011379,0.008473,-0.031715,0.060767,0.056409,-0.048178,0.022515,0.02881,0.055925,-0.029778,-0.027841,-0.054472,0.029778,-0.04043,-0.02542,-0.011863,-0.011863,-0.04043,0.02542,0.035589,0.004116,0.021547,-0.029778,-0.002663,0.033168,0.022999,-0.014284,-0.015736,-0.05883,0.055925,0.036073,-0.061735,0.026873,0.029294,0.048662,0.059314,0.015736,0.022031,-0.044304,-0.018157,-0.055441,0.038494,-0.006537,0.023968,-0.057862,-0.02542,-0.005084,-0.060767,0.022999,-0.029778,0.029778,-0.050599,0.034136,0.048662,0.018157,0.024452,0.028326,0.038494,0.04963,-0.061251,-0.059314,0.024936,0.030262,-0.033168,0.042367,-0.022515,0.061251,0.029778,0.02542,0.044788,-0.008473,0.059798,0.024936,0.00121,0.003147,0.038494,0.060767,-0.009442,0.005568,0.019126,-0.042851,-0.009442,-0.005568,-0.057377,0.035104,0.052535,0.00121,0.028326,0.002179,0.053988,0.016705,0.015252,-0.027841,0.024936,-0.056893,0.031231,0.057862,0.060283,-0.044304,-0.033652,0.046725,0.05302,0.048662,0.012831,-0.024452,0.007505,-0.037525,-0.007021,0.035104,-0.056409,-0.036073,0.032199,-0.007989,-0.060767,0.060767,0.042367,-0.05883,0.017673,0.049146,-0.006537,-0.002663,0.007505,0.018642,0.031715,0.033652,0.055925,0.061251,0.059798,-0.050599,-0.053504,0.030262,-0.00121,-0.005568,0.0138,-0.039462,-0.033168,-0.006052,0.032199,0.034136,0.007505,-0.032199,0.021547,0.036557,0.050114,0.050114,0.021547,-0.036557,-0.026389,-0.057862,-0.04043,0.032199,0.059314,-0.02881,-0.038978,0.047693,0.046241,0.003147,-0.006052,-0.025905,0.000242,-0.035104,-0.032683,-0.013315,-0.002663,-0.046241,-0.039946,0.017673,0.04382,0.006537,-0.023484,0.055441,-0.03801,0.004116,0.036557,0.056893,0.00121,-0.038978,0.032199,-0.032199,0.011379,-0.027841,-0.013315,-0.04382,-0.037525,-0.033652,-0.023484,-0.012347,0.000726,0.002663,-0.037041,-0.031715,0.02881,-0.01961,0.039462,-0.000726,-0.032199,-0.036557,-0.017189,0.053504,-0.002179,-0.037041,-0.060767,-0.05883,-0.023484,-0.00121,0.052535,-0.056409,-0.042851,0.019126,0.052535,0.056409,0.0046,-0.026873,-0.009442,-0.060767,-0.033652,-0.059798,-0.007989,-0.045272,-0.046725,0.034136,-0.037041,0.005084,-0.030747,-0.004116,-0.001695,0.017673,0.028326,-0.015252,-0.008958,-0.013315,-0.049146,0.037525,-0.054472,0.024452,0.054956,-0.026873,0.005568,0.025905,-0.029778,0.053988,0.00121,-0.00121,-0.01961,0.003147,-0.044304,-0.012831,0.055441,0.059314,-0.054472,-0.043336,-0.030262,-0.028326,-0.006052,-0.000726,-0.002179,0.011379,0.008473,-0.031715,0.060767,0.056409,-0.048178,0.022515,0.02881,0.055925,-0.029778,-0.027841,-0.054472,0.029778,-0.04043,-0.02542,-0.011863,-0.011863,-0.04043,0.02542,0.035589,0.004116,0.021547,-0.029778,-0.002663,0.033168,0.022999,-0.014284,-0.015736,-0.05883,0.055925,0.036073,-0.061735,0.026873,0.029294,0.048662,0.059314,0.015736,0.022031,-0.044304,-0.018157,-0.055441,0.038494,-0.006537,0.023968,-0.057862,-0.02542,-0.005084,-0.060767,0.022999,-0.029778,0.029778,-0.050599,0.034136,0.048662,0.018157,0.024452,0.028326,0.038494,0.04963,-0.061251,-0.059314,0.024936,0.030262,-0.033168,0.042367,-0.022515,0.061251,0.029778,0.02542,0.044788,-0.008473,0.059798,0.024936,0.00121,0.003147,0.038494,0.060767,-0.009442,0.005568,0.019126,-0.042851,-0.009442,-0.005568,-0.057377,0.035104,0.052535,0.00121,0.028326,0.002179,0.053988,0.016705,0.015252,-0.027841,0.024936,-0.056893,0.031231,0.057862,0.060283,-0.044304,-0.033652,0.046725,0.05302,0.048662,0.012831,-0.024452,0.007505,-0.037525,-0.007021,0.035104,-0.056409,-0.036073,0.032199,-0.007989,-0.060767,0.060767,0.042367,-0.05883,0.017673,0.049146,-0.006537,-0.002663,0.007505,0.018642,0.031715,0.033652,0.055925,0.061251,0.059798,-0.050599,-0.053504,0.030262,-0.00121,-0.005568,0.0138,-0.039462,-0.033168,-0.006052,0.032199,0.034136,0.007505,-0.032199,0.021547,0.036557,0.050114,0.050114,0.021547,-0.036557,-0.026389,-0.057862,-0.04043,0.032199,0.059314,-0.02881,-0.038978,0.047693,0.046241,0.003147,-0.006052,-0.025905,0.000242,-0.035104,-0.032683,-0.013315,-0.002663,-0.046241,-0.039946,0.017673,0.04382,0.006537,-0.023484,0.055441,-0.03801,0.004116,0.036557,0.056893,0.00121,-0.038978,0.032199,-0.032199,0.011379,-0.027841,-0.013315,-0.04382,-0.037525,-0.033652,-0.023484,-0.012347,0.000726,0.002663,-0.037041,-0.031715,0.02881,-0.01961,0.039462,-0.000726,-0.032199,-0.036557,-0.017189,0.053504,-0.002179,-0.037041,-0.060767,-0.05883,-0.023484,-0.00121,0.052535,-0.056409,-0.042851,0.019126,0.052535,0.056409,0.0046,-0.026873,-0.009442,-0.060767,-0.033652,-0.059798,-0.007989,-0.045272,-0.046725,0.034136,-0.037041,0.005084,-0.030747,-0.004116,-0.001695,0.017673,0.028326,-0.015252,-0.008958,-0.013315,-0.049146,0.037525,-0.054472,0.024452,0.054956,-0.026873,0.005568,0.025905,-0.029778,0.053988,0.00121,-0.00121,-0.01961,0.003147,-0.044304,-0.012831,0.055441,0.059314,-0.054472,-0.043336,-0.030262,-0.028326,-0.006052,-0.000726,-0.002179,0.011379,0.008473,-0.031715,0.060767,0.056409,-0.048178,0.022515,0.02881,0.055925,-0.029778,-0.027841,-0.054472,0.029778,-0.04043,-0.02542,-0.011863,-0.011863,-0.04043,0.02542,0.035589,0.004116,0.021547,-0.029778,-0.002663,0.033168,0.022999,-0.014284,-0.015736,-0.05883,0.055925,0.036073,-0.061735,0.026873,0.029294,0.048662,0.059314,0.015736,0.022031,-0.044304,-0.018157,-0.055441,0.038494,-0.006537,0.023968,-0.057862,-0.02542,-0.005084,-0.060767,0.022999,-0.029778,0.029778,-0.050599,0.034136,0.048662,0.018157,0.024452,0.028326,0.038494,0.04963,-0.061251,-0.059314,0.024936,0.030262,-0.033168,0.042367,-0.022515,0.061251,0.029778,0.02542,0.044788,-0.008473,0.059798,0.024936,0.00121,0.003147,0.038494,0.060767,-0.009442,0.005568,0.019126,-0.042851,-0.009442,-0.005568,-0.057377,0.035104,0.052535,0.00121,0.028326,0.002179,0.053988,0.016705,0.015252,-0.027841,0.024936,-0.056893,0.031231,0.057862,0.060283,-0.044304,-0.033652,0.046725,0.05302,0.048662,0.012831,-0.024452,0.007505,-0.037525,-0.007021,0.035104,-0.056409,-0.036073,0.032199,-0.007989,-0.060767,0.060767,0.042367,-0.05883,0.017673,0.049146,-0.006537,-0.002663,0.007505,0.018642,0.031715,0.033652,0.055925,0.061251,0.059798,-0.050599,-0.053504,0.030262,-0.00121,-0.005568,0.0138,-0.039462,-0.033168,-0.006052]	2026-11-16 10:18:47.453599+00
b7421dfd-287a-48a5-a57e-386962950837	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	5	18	└── (Belum ada attachment terpasang) =========================== LIVE MEMORY TRACER ================================= [DLL Ground Loot] NULL <== [0x7ffe01: Medkit] <===> [0x7ffe20: Ammo 5.56] <===> [0x7ffe40: 8x Scope] ==> NULL [MLL Weapon Hierarchy] ================================================================================ [Parent: 0x6001 (M416)] ──► [Child: 0x6080 (Comp)] ──► [Child: 0x6090 (4x)] ──► NULL │ ▼ [Parent: 0x6002 (Kar98k)] ──► NULL ================================================================================ PILIHAN AKSI: 1. Jelajahi & Lihat Item Sekitar (Ground Loot) 2. Ambil Barang dari Lantai (Loot Item) 3. Pasang Attachment ke Senjata (Equip Mod) PUBG BATTLEGROUND: INVENTORY MANAGER 4. Lepas Attachment dari Senjata (Unequip Mod) 5. Gunakan Item Medis (Heal HP) 6. Buang Barang ke Lantai (Drop Item) 0. Keluar Permainan -------------------------------------------------------------------------------- Pilihan Anda: 2 Masukkan ID Item yang ingin di-loot: 102 >> Memeriksa kapasitas beban tas... (Bobot item: 20 | Sisa ruang: 65) >> [SUKSES] Ammo 5.56 berhasil diambil! Beban tas sekarang: 155/200. ================================================================================ ================================================================================ PLAYER: Survivor_01         | HP : [████████░░]  80/100 BAG   : Level 2 Military    | WT : [███████░░░] 135/200 (Sisa: 65)	[-0.021741,-0.01197,0.032001,-0.030046,-0.051543,0.058872,0.060826,0.034444,-0.05252,-0.019787,-0.017832,-0.052032,-0.020275,0.030535,-0.043726,-0.016367,0.029069,0.053009,0.034932,-0.020275,0.009527,-0.008061,-0.023695,0.010504,-0.014901,-0.060826,-0.037375,-0.026627,-0.032489,0.062291,-0.01539,-0.011481,0.018321,-0.013924,0.04226,0.052032,0.054474,-0.010015,-0.029069,-0.022718,0.023695,0.024184,-0.044215,-0.009038,-0.00513,0.041283,-0.004153,-0.044215,0.023207,-0.058383,0.034444,-0.058872,0.025161,0.028092,0.026138,0.038352,-0.04226,-0.007573,0.029558,0.053009,0.017832,-0.038841,0.020275,0.060337,0.009527,0.019298,-0.061803,-0.061314,-0.020275,-0.034932,-0.032978,0.003176,-0.021252,0.011481,0.013435,-0.020764,-0.051543,-0.000733,0.050077,-0.047635,0.060337,-0.040795,-0.058872,-0.051543,0.040795,0.023207,0.007573,0.041772,-0.046169,0.032978,0.056429,-0.057894,-0.001221,-0.031512,0.015878,-0.042749,0.049589,-0.045192,-0.051543,-0.041772,0.023207,-0.041283,0.002199,0.00855,0.054963,0.055452,0.049589,0.022229,-0.036398,0.010015,0.027115,0.049589,0.054474,-0.027115,-0.05936,0.034932,0.056429,0.05936,-0.00513,-0.055452,-0.010993,-0.038841,-0.00171,-0.040795,0.0491,-0.007573,-0.010993,-0.033466,0.040795,0.050566,-0.030535,0.032489,0.010993,-0.003664,-0.00171,-0.028092,0.010015,0.042749,0.044703,0.010504,0.04226,-0.032001,0.01881,0.046169,-0.033466,-0.009527,-0.027604,0.04226,-0.053009,0.054474,0.038841,-0.052032,0.047635,0.00171,0.025161,0.035909,0.030046,-0.000244,0.047146,0.051055,-0.044215,0.048612,-0.020275,-0.010504,-0.008061,0.05252,0.033466,0.039818,-0.038841,-0.038352,0.018321,0.053497,0.057406,-0.021252,0.058383,0.018321,-0.039329,0.004153,-0.028092,0.003664,-0.037375,-0.034444,-0.036398,-0.024184,0.020275,0.054963,-0.032978,-0.009527,-0.044703,0.023695,-0.04226,-0.002199,-0.053009,-0.043238,0.000733,0.001221,0.04226,0.027604,0.029558,-0.05936,0.041283,-0.051055,-0.0491,0.041772,0.010993,0.061803,-0.012458,0.014901,-0.002199,0.021741,0.003664,0.010993,-0.021741,-0.039329,-0.054963,-0.020764,0.016367,-0.029558,-0.006107,0.004641,0.061314,0.031024,-0.046658,0.019787,-0.012947,0.017344,0.010993,0.020764,-0.039329,0.021252,-0.060337,-0.053986,-0.007573,-0.007084,-0.012947,-0.040306,0.026138,-0.05252,-0.035421,-0.012947,-0.008061,0.035421,0.003176,-0.027604,-0.006107,-0.003176,0.057406,0.007084,0.051543,0.023695,0.060826,0.021741,-0.013435,0.054963,0.051543,0.029069,-0.021741,-0.01197,0.032001,-0.030046,-0.051543,0.058872,0.060826,0.034444,-0.05252,-0.019787,-0.017832,-0.052032,-0.020275,0.030535,-0.043726,-0.016367,0.029069,0.053009,0.034932,-0.020275,0.009527,-0.008061,-0.023695,0.010504,-0.014901,-0.060826,-0.037375,-0.026627,-0.032489,0.062291,-0.01539,-0.011481,0.018321,-0.013924,0.04226,0.052032,0.054474,-0.010015,-0.029069,-0.022718,0.023695,0.024184,-0.044215,-0.009038,-0.00513,0.041283,-0.004153,-0.044215,0.023207,-0.058383,0.034444,-0.058872,0.025161,0.028092,0.026138,0.038352,-0.04226,-0.007573,0.029558,0.053009,0.017832,-0.038841,0.020275,0.060337,0.009527,0.019298,-0.061803,-0.061314,-0.020275,-0.034932,-0.032978,0.003176,-0.021252,0.011481,0.013435,-0.020764,-0.051543,-0.000733,0.050077,-0.047635,0.060337,-0.040795,-0.058872,-0.051543,0.040795,0.023207,0.007573,0.041772,-0.046169,0.032978,0.056429,-0.057894,-0.001221,-0.031512,0.015878,-0.042749,0.049589,-0.045192,-0.051543,-0.041772,0.023207,-0.041283,0.002199,0.00855,0.054963,0.055452,0.049589,0.022229,-0.036398,0.010015,0.027115,0.049589,0.054474,-0.027115,-0.05936,0.034932,0.056429,0.05936,-0.00513,-0.055452,-0.010993,-0.038841,-0.00171,-0.040795,0.0491,-0.007573,-0.010993,-0.033466,0.040795,0.050566,-0.030535,0.032489,0.010993,-0.003664,-0.00171,-0.028092,0.010015,0.042749,0.044703,0.010504,0.04226,-0.032001,0.01881,0.046169,-0.033466,-0.009527,-0.027604,0.04226,-0.053009,0.054474,0.038841,-0.052032,0.047635,0.00171,0.025161,0.035909,0.030046,-0.000244,0.047146,0.051055,-0.044215,0.048612,-0.020275,-0.010504,-0.008061,0.05252,0.033466,0.039818,-0.038841,-0.038352,0.018321,0.053497,0.057406,-0.021252,0.058383,0.018321,-0.039329,0.004153,-0.028092,0.003664,-0.037375,-0.034444,-0.036398,-0.024184,0.020275,0.054963,-0.032978,-0.009527,-0.044703,0.023695,-0.04226,-0.002199,-0.053009,-0.043238,0.000733,0.001221,0.04226,0.027604,0.029558,-0.05936,0.041283,-0.051055,-0.0491,0.041772,0.010993,0.061803,-0.012458,0.014901,-0.002199,0.021741,0.003664,0.010993,-0.021741,-0.039329,-0.054963,-0.020764,0.016367,-0.029558,-0.006107,0.004641,0.061314,0.031024,-0.046658,0.019787,-0.012947,0.017344,0.010993,0.020764,-0.039329,0.021252,-0.060337,-0.053986,-0.007573,-0.007084,-0.012947,-0.040306,0.026138,-0.05252,-0.035421,-0.012947,-0.008061,0.035421,0.003176,-0.027604,-0.006107,-0.003176,0.057406,0.007084,0.051543,0.023695,0.060826,0.021741,-0.013435,0.054963,0.051543,0.029069,-0.021741,-0.01197,0.032001,-0.030046,-0.051543,0.058872,0.060826,0.034444,-0.05252,-0.019787,-0.017832,-0.052032,-0.020275,0.030535,-0.043726,-0.016367,0.029069,0.053009,0.034932,-0.020275,0.009527,-0.008061,-0.023695,0.010504,-0.014901,-0.060826,-0.037375,-0.026627,-0.032489,0.062291,-0.01539,-0.011481,0.018321,-0.013924,0.04226,0.052032,0.054474,-0.010015,-0.029069,-0.022718,0.023695,0.024184,-0.044215,-0.009038,-0.00513,0.041283,-0.004153,-0.044215,0.023207,-0.058383,0.034444,-0.058872,0.025161,0.028092,0.026138,0.038352,-0.04226,-0.007573,0.029558,0.053009,0.017832,-0.038841,0.020275,0.060337,0.009527,0.019298,-0.061803,-0.061314,-0.020275,-0.034932,-0.032978,0.003176,-0.021252,0.011481,0.013435,-0.020764,-0.051543,-0.000733,0.050077,-0.047635,0.060337,-0.040795,-0.058872,-0.051543,0.040795,0.023207,0.007573,0.041772,-0.046169,0.032978,0.056429,-0.057894,-0.001221,-0.031512,0.015878,-0.042749,0.049589,-0.045192,-0.051543,-0.041772,0.023207,-0.041283,0.002199,0.00855,0.054963,0.055452,0.049589,0.022229,-0.036398,0.010015,0.027115,0.049589,0.054474,-0.027115,-0.05936,0.034932,0.056429,0.05936,-0.00513,-0.055452,-0.010993,-0.038841,-0.00171,-0.040795,0.0491,-0.007573,-0.010993,-0.033466,0.040795,0.050566,-0.030535,0.032489,0.010993,-0.003664,-0.00171,-0.028092,0.010015,0.042749,0.044703,0.010504,0.04226,-0.032001,0.01881,0.046169,-0.033466,-0.009527,-0.027604,0.04226,-0.053009,0.054474,0.038841,-0.052032,0.047635,0.00171,0.025161,0.035909,0.030046,-0.000244,0.047146,0.051055,-0.044215,0.048612,-0.020275,-0.010504,-0.008061,0.05252,0.033466,0.039818,-0.038841,-0.038352,0.018321,0.053497,0.057406,-0.021252,0.058383,0.018321,-0.039329,0.004153,-0.028092,0.003664,-0.037375,-0.034444,-0.036398,-0.024184,0.020275,0.054963,-0.032978,-0.009527,-0.044703,0.023695,-0.04226,-0.002199,-0.053009,-0.043238,0.000733,0.001221,0.04226,0.027604,0.029558,-0.05936,0.041283,-0.051055,-0.0491,0.041772,0.010993,0.061803,-0.012458,0.014901,-0.002199,0.021741,0.003664,0.010993,-0.021741,-0.039329,-0.054963,-0.020764,0.016367,-0.029558,-0.006107,0.004641,0.061314,0.031024,-0.046658,0.019787,-0.012947,0.017344,0.010993,0.020764,-0.039329,0.021252,-0.060337,-0.053986,-0.007573,-0.007084,-0.012947,-0.040306,0.026138,-0.05252,-0.035421,-0.012947,-0.008061,0.035421,0.003176,-0.027604,-0.006107,-0.003176,0.057406,0.007084,0.051543,0.023695,0.060826,0.021741,-0.013435,0.054963,0.051543,0.029069]	2026-11-16 10:18:47.468787+00
b0325bfc-fce8-49eb-84b9-b75d6e545997	fd851cf8-e3b8-4162-8ed3-45f36c4fe976	6	18	-------------------------------------------------------------------------------- [ SENJATA TERPASANG - MULTI LINKED LIST ] [Slot 1] M416 [Assault Rifle] (Base Dmg: 41) boolean.h ui.c\nmain.c item.h ground_list.h\nground_list.c weapon_mll.h\nweapon_mll.c inventory.h\ninventory.c ui.h\nui.c main.c ground_list.h\n.c weapon_mll.h\n.c\ninventory.c	[-0.058437,-0.038387,0.051101,-0.04181,-0.051101,-0.043277,-0.05159,-0.039854,-0.060393,-0.046211,-0.031052,0.059415,0.021272,-0.05697,0.038876,0.00758,0.019805,0.030563,0.004157,0.016382,0.029585,0.013937,-0.024695,-0.021272,-0.047189,-0.00758,-0.040343,-0.026162,0.038387,-0.024695,0.043277,-0.055503,0.000734,0.01247,0.040832,-0.031541,-0.023228,0.00758,-0.061371,-0.001223,-0.009047,0.007091,-0.011981,-0.05697,-0.011981,-0.050612,0.051101,-0.050612,0.038876,-0.033008,-0.000734,-0.013448,-0.026651,-0.038876,-0.020783,0.047189,-0.038387,-0.055013,0.019805,-0.037898,-0.019805,0.019805,-0.062349,-0.025673,0.035453,0.055503,-0.042788,-0.010514,-0.019805,0.050612,0.042299,-0.008558,-0.029096,0.047678,0.000245,0.028118,0.052568,0.03692,-0.055013,0.038876,0.051101,-0.000734,-0.02714,0.047678,0.060882,-0.01736,0.006602,-0.052568,-0.015893,0.023717,0.053546,-0.057459,0.007091,0.006602,-0.050612,-0.024206,0.03203,0.043766,-0.053057,0.062349,-0.054524,0.038876,0.032519,0.030074,-0.040343,0.038387,0.019316,0.03692,-0.043277,-0.019316,-0.042788,0.043277,0.00758,-0.001712,0.030563,0.017849,-0.057948,-0.00758,0.010514,-0.0467,-0.007091,-0.023717,-0.011492,0.055992,-0.051101,0.051101,0.031541,0.005624,0.004157,0.024206,-0.011492,0.020783,0.011492,0.019316,0.011003,0.022739,0.002201,0.016382,0.031541,-0.003179,-0.041321,0.005624,-0.023717,-0.055013,-0.042788,-0.03203,-0.058437,-0.046211,-0.033008,-0.048656,0.037898,0.041321,0.015404,0.055013,0.02225,0.036431,-0.024206,0.037898,-0.019316,0.007091,-0.06186,-0.050123,-0.021761,0.031052,0.039365,-0.055013,0.001223,0.061371,0.053546,-0.055503,0.050612,0.005624,0.050612,0.011981,-0.011492,0.011981,-0.023717,0.029585,0.06186,0.049145,0.035942,0.023717,0.04181,-0.015404,0.024206,0.00758,-0.042788,0.024695,0.042788,-0.042788,0.000245,0.03692,-0.02714,-0.007091,0.019805,0.052079,0.042788,-0.011981,-0.020294,0.054035,0.033497,-0.014915,-0.062349,-0.034475,-0.010025,-0.025673,0.00758,-0.023717,-0.011492,0.06186,0.035453,-0.014915,-0.001712,0.045233,-0.055992,0.010025,0.0467,-0.038876,-0.009047,0.005135,-0.055503,-0.055992,0.011981,0.038387,-0.030563,-0.018827,0.009536,-0.000245,0.008069,-0.023717,-0.030074,-0.032519,0.02225,-0.024206,-0.043277,-0.025673,0.019316,0.043277,0.019805,-0.019316,-0.055013,0.060882,-0.03203,-0.044744,0.004646,0.055013,-0.052079,0.015893,0.055503,0.038876,0.051101,-0.006602,0.011492,-0.011492,-0.031052,-0.05697,-0.058437,-0.038387,0.051101,-0.04181,-0.051101,-0.043277,-0.05159,-0.039854,-0.060393,-0.046211,-0.031052,0.059415,0.021272,-0.05697,0.038876,0.00758,0.019805,0.030563,0.004157,0.016382,0.029585,0.013937,-0.024695,-0.021272,-0.047189,-0.00758,-0.040343,-0.026162,0.038387,-0.024695,0.043277,-0.055503,0.000734,0.01247,0.040832,-0.031541,-0.023228,0.00758,-0.061371,-0.001223,-0.009047,0.007091,-0.011981,-0.05697,-0.011981,-0.050612,0.051101,-0.050612,0.038876,-0.033008,-0.000734,-0.013448,-0.026651,-0.038876,-0.020783,0.047189,-0.038387,-0.055013,0.019805,-0.037898,-0.019805,0.019805,-0.062349,-0.025673,0.035453,0.055503,-0.042788,-0.010514,-0.019805,0.050612,0.042299,-0.008558,-0.029096,0.047678,0.000245,0.028118,0.052568,0.03692,-0.055013,0.038876,0.051101,-0.000734,-0.02714,0.047678,0.060882,-0.01736,0.006602,-0.052568,-0.015893,0.023717,0.053546,-0.057459,0.007091,0.006602,-0.050612,-0.024206,0.03203,0.043766,-0.053057,0.062349,-0.054524,0.038876,0.032519,0.030074,-0.040343,0.038387,0.019316,0.03692,-0.043277,-0.019316,-0.042788,0.043277,0.00758,-0.001712,0.030563,0.017849,-0.057948,-0.00758,0.010514,-0.0467,-0.007091,-0.023717,-0.011492,0.055992,-0.051101,0.051101,0.031541,0.005624,0.004157,0.024206,-0.011492,0.020783,0.011492,0.019316,0.011003,0.022739,0.002201,0.016382,0.031541,-0.003179,-0.041321,0.005624,-0.023717,-0.055013,-0.042788,-0.03203,-0.058437,-0.046211,-0.033008,-0.048656,0.037898,0.041321,0.015404,0.055013,0.02225,0.036431,-0.024206,0.037898,-0.019316,0.007091,-0.06186,-0.050123,-0.021761,0.031052,0.039365,-0.055013,0.001223,0.061371,0.053546,-0.055503,0.050612,0.005624,0.050612,0.011981,-0.011492,0.011981,-0.023717,0.029585,0.06186,0.049145,0.035942,0.023717,0.04181,-0.015404,0.024206,0.00758,-0.042788,0.024695,0.042788,-0.042788,0.000245,0.03692,-0.02714,-0.007091,0.019805,0.052079,0.042788,-0.011981,-0.020294,0.054035,0.033497,-0.014915,-0.062349,-0.034475,-0.010025,-0.025673,0.00758,-0.023717,-0.011492,0.06186,0.035453,-0.014915,-0.001712,0.045233,-0.055992,0.010025,0.0467,-0.038876,-0.009047,0.005135,-0.055503,-0.055992,0.011981,0.038387,-0.030563,-0.018827,0.009536,-0.000245,0.008069,-0.023717,-0.030074,-0.032519,0.02225,-0.024206,-0.043277,-0.025673,0.019316,0.043277,0.019805,-0.019316,-0.055013,0.060882,-0.03203,-0.044744,0.004646,0.055013,-0.052079,0.015893,0.055503,0.038876,0.051101,-0.006602,0.011492,-0.011492,-0.031052,-0.05697,-0.058437,-0.038387,0.051101,-0.04181,-0.051101,-0.043277,-0.05159,-0.039854,-0.060393,-0.046211,-0.031052,0.059415,0.021272,-0.05697,0.038876,0.00758,0.019805,0.030563,0.004157,0.016382,0.029585,0.013937,-0.024695,-0.021272,-0.047189,-0.00758,-0.040343,-0.026162,0.038387,-0.024695,0.043277,-0.055503,0.000734,0.01247,0.040832,-0.031541,-0.023228,0.00758,-0.061371,-0.001223,-0.009047,0.007091,-0.011981,-0.05697,-0.011981,-0.050612,0.051101,-0.050612,0.038876,-0.033008,-0.000734,-0.013448,-0.026651,-0.038876,-0.020783,0.047189,-0.038387,-0.055013,0.019805,-0.037898,-0.019805,0.019805,-0.062349,-0.025673,0.035453,0.055503,-0.042788,-0.010514,-0.019805,0.050612,0.042299,-0.008558,-0.029096,0.047678,0.000245,0.028118,0.052568,0.03692,-0.055013,0.038876,0.051101,-0.000734,-0.02714,0.047678,0.060882,-0.01736,0.006602,-0.052568,-0.015893,0.023717,0.053546,-0.057459,0.007091,0.006602,-0.050612,-0.024206,0.03203,0.043766,-0.053057,0.062349,-0.054524,0.038876,0.032519,0.030074,-0.040343,0.038387,0.019316,0.03692,-0.043277,-0.019316,-0.042788,0.043277,0.00758,-0.001712,0.030563,0.017849,-0.057948,-0.00758,0.010514,-0.0467,-0.007091,-0.023717,-0.011492,0.055992,-0.051101,0.051101,0.031541,0.005624,0.004157,0.024206,-0.011492,0.020783,0.011492,0.019316,0.011003,0.022739,0.002201,0.016382,0.031541,-0.003179,-0.041321,0.005624,-0.023717,-0.055013,-0.042788,-0.03203,-0.058437,-0.046211,-0.033008,-0.048656,0.037898,0.041321,0.015404,0.055013,0.02225,0.036431,-0.024206,0.037898,-0.019316,0.007091,-0.06186,-0.050123,-0.021761,0.031052,0.039365,-0.055013,0.001223,0.061371,0.053546,-0.055503,0.050612,0.005624,0.050612,0.011981,-0.011492,0.011981,-0.023717,0.029585,0.06186,0.049145,0.035942,0.023717,0.04181,-0.015404,0.024206,0.00758,-0.042788,0.024695,0.042788,-0.042788,0.000245,0.03692,-0.02714,-0.007091,0.019805,0.052079,0.042788,-0.011981,-0.020294,0.054035,0.033497,-0.014915,-0.062349,-0.034475,-0.010025,-0.025673,0.00758,-0.023717,-0.011492,0.06186,0.035453,-0.014915,-0.001712,0.045233,-0.055992,0.010025,0.0467,-0.038876,-0.009047,0.005135,-0.055503,-0.055992,0.011981,0.038387,-0.030563,-0.018827,0.009536,-0.000245,0.008069,-0.023717,-0.030074,-0.032519,0.02225,-0.024206,-0.043277,-0.025673,0.019316,0.043277,0.019805,-0.019316,-0.055013,0.060882,-0.03203,-0.044744,0.004646,0.055013,-0.052079,0.015893,0.055503,0.038876,0.051101,-0.006602,0.011492,-0.011492,-0.031052,-0.05697]	2026-11-16 10:18:47.480446+00
\.


--
-- Data for Name: papers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.papers (id, project_id, title, authors, year, journal, doi, storage_path, file_name, file_size_bytes, total_pages, status, celery_task_id, error_message, uploaded_at, processed_at, sha256, stage, stage_detail, error, warnings, coverage, doc_type, run, checkpoint, updated_at, source_verification) FROM stdin;
fd851cf8-e3b8-4162-8ed3-45f36c4fe976	eb56a8bb-b90d-4108-a8b1-7a2b8128af97	Untitled Research Paper	{}	\N	\N	\N	5b8efa4d-4ea6-4c60-8c71-7a8569f24e22/eb56a8bb-b90d-4108-a8b1-7a2b8128af97/fd851cf8-e3b8-4162-8ed3-45f36c4fe976.pdf	laporan_perancangan_tubes....pdf	5457737	20	ready	ff35a867-e8cc-49fe-a7d3-54cdd6cfcdeb	\N	2026-11-16 10:17:01.715784+00	2026-11-16 10:17:56.950942+00	4cfe924040c7f1d34975c60a418f6abbe83af48374e289b4cd919fbc9facb332	ai_extraction_complete	{"batch_name": "Hasil Temuan, Inovasi & Celah Riset", "current_batch": 4, "total_batches": 4}	\N	["partial_scan", "maybe_not_paper"]	{"language": "en", "pages_total": 20, "pages_readable": 12, "unreadable_pages": [1, 2, 5, 6, 7, 8, 10, 20]}	{"label": "other", "reason": "Dokumen tidak berisi teks pada halaman pertama maupun terakhir sehingga tidak dapat diklasifikasikan.", "paper_confidence": 0.0}	{"model_used": "gemini-3.5-flash (core) + groq (backup)", "parser_version": "pymupdf_v2", "prompt_version": "v2.0", "schema_version": "v2.0", "pipeline_architecture": "4-batch-divide-and-conquer"}	{"last_stage": "ai_extraction_complete", "finished_at": "2026-11-16T10:17:56.957994+00:00"}	2026-11-16 10:18:47.191362+00	\N
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (token, user_id, email, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, user_id, name, description, status, created_at, updated_at) FROM stdin;
eb56a8bb-b90d-4108-a8b1-7a2b8128af97	5b8efa4d-4ea6-4c60-8c71-7a8569f24e22	Analasia Web	aku ingin menganalisa web ini	active	2026-11-15 06:52:47.579204+00	2026-11-15 06:52:47.579204+00
\.


--
-- Data for Name: research_canvas_edges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.research_canvas_edges (id, project_id, source_node_id, target_node_id, label, created_at) FROM stdin;
\.


--
-- Data for Name: research_canvas_nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.research_canvas_nodes (id, project_id, stage, label, description, position_x, position_y, is_gap, connected_paper_ids, created_at) FROM stdin;
\.


--
-- Data for Name: research_syntheses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.research_syntheses (id, project_id, novelty_summary, proposed_titles, problem_formulation, generated_at) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_plans (id, code, name, description, price, currency, billing_period, paper_limit_per_month, ai_query_limit_per_day, features, is_active, is_popular, sort_order, created_at, updated_at) FROM stdin;
b8f6de57-afb7-4960-a95f-53ea9fc27574	free_explorer	Paket Peneliti Pemula (Free)	Ideal untuk mahasiswa yang baru mulai menyusun literatur dasar.	0.00	IDR	free	5	20	["Maksimal 5 dokumen paper per bulan", "Ekstraksi 13 parameter ilmiah kanonik", "Tanya AI standar (20 query/hari)", "Akses Matriks Komparasi dasar"]	t	f	1	2026-10-27 15:19:27.50659+00	2026-10-27 15:19:27.50659+00
93b16304-a358-4f7a-b6de-d3d04d46e1e1	pro_scholar	Pro Scholar (Rekomendasi)	Pilihan terbaik untuk peneliti tesis, disertasi, dan publikasi jurnal Scopus.	99000.00	IDR	monthly	50	250	["Maksimal 50 dokumen paper per bulan", "Ekstraksi prioritas kecepatan tinggi", "Tanya AI RAG tanpa batas (250 query/hari)", "Ekspor Word, Excel & PDF Komparasi", "Kanvas Graf Pengetahuan & Celah Riset 2D"]	t	t	2	2026-10-27 15:19:27.50659+00	2026-10-27 15:19:27.50659+00
52018e18-0de6-4236-b5b0-851dcad53bca	lab_enterprise	Lab & Campus Enterprise	Dirancang khusus untuk tim laboratorium riset atau fakultas perguruan tinggi.	499000.00	IDR	monthly	500	1500	["Maksimal 500 dokumen paper per bulan", "Dedicated API Key & kuota AI prioritas", "Dukungan multi-user kolaboratif", "Verifikasi DOI penerbit Tier-1 otomatis", "SLA & Konsultasi Teknis Prioritas"]	t	f	3	2026-10-27 15:19:27.50659+00	2026-10-27 15:19:27.50659+00
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_notifications (id, user_id, announcement_id, title, message, category, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_subscriptions (id, user_id, plan_id, status, started_at, expires_at, amount_paid, payment_method, created_at) FROM stdin;
7590cd5f-1e10-40d5-acd7-f095aa73c009	98260a24-31c0-4399-ac0c-aff68a7939f8	93b16304-a358-4f7a-b6de-d3d04d46e1e1	active	2026-10-17 15:19:27.586316+00	2026-11-16 15:19:27.586316+00	99000.00	qris_manual	2026-10-27 15:19:27.586316+00
9c421009-e149-4972-a86c-538791874ca6	1da54011-cdb7-4a6b-a947-3e0ed723c9a8	93b16304-a358-4f7a-b6de-d3d04d46e1e1	active	2026-10-22 15:19:27.586316+00	2026-11-21 15:19:27.586316+00	99000.00	qris_manual	2026-10-27 15:19:27.586316+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, full_name, institution, role, citation_format, ai_confidence_threshold, created_at, updated_at, status, suspension_reason, admin_role, admin_permissions, subscription_tier) FROM stdin;
286cc61f-9902-454d-b100-e49fd18becb9	faqih@modellyng.ac.id	$argon2id$v=19$m=65536,t=3,p=4$fhlrvrfPHNV0ggXfKyThsw$TJnKYcPpQ+sVPvDvcr1Tw4mS/w64wjlrzeShxbatiZ0	Faqih Core Developer	\N	researcher	APA	0.80	2026-10-27 10:23:14.973863+00	2026-10-27 10:23:14.973863+00	active	\N	admin	["all"]	free
047d7a23-ca40-44aa-8542-4921877745f2	fatih@modellyng.ac.id	$argon2id$v=19$m=65536,t=3,p=4$DxhZ/ppZF9X9WaLCJuEfFw$JIk2vn/8JXq64+f16exR6u2vtsGZii/98y2zCFQ1noI	Fatih AI Specialist	\N	researcher	APA	0.80	2026-10-27 10:23:14.973863+00	2026-10-27 10:23:14.973863+00	active	\N	admin	["all"]	free
564cdfc4-e02a-4419-82c9-beeb5e7401b6	demo@modellyng.ac.id	$argon2id$v=19$m=65536,t=3,p=4$qu96eYtPIGaHZJXb2/sNiA$0kcGunrH/0RY3pkTWpIlHd+MYFbdbgN7bKab3LiACEM	Demo Researcher	\N	researcher	APA	0.80	2026-10-27 10:23:14.973863+00	2026-10-27 10:37:19.800545+00	active	\N	admin	["all"]	free
98260a24-31c0-4399-ac0c-aff68a7939f8	cahayu@modellyng.ac.id	$argon2id$v=19$m=65536,t=3,p=4$DVjWhgcjqQoC0TI9KWhTTg$9+aZ/psOTKoyKka8q2syw8dcukh+zBGNMhDlSnzHzvA	Cahayu UI Specialist	\N	researcher	APA	0.80	2026-10-27 10:23:14.973863+00	2026-10-27 15:19:27.586316+00	active	\N	admin	["all"]	pro
1da54011-cdb7-4a6b-a947-3e0ed723c9a8	arby@modellyng.ac.id	$argon2id$v=19$m=65536,t=3,p=4$z/JUpQtYNh0kF1WR+522yg$sIZoZiUJGnCBXfITQaVzT/L8Z5hcukP1oFT8d2nPQ98	Arby Tech Lead	\N	researcher	APA	0.80	2026-10-27 10:23:14.973863+00	2026-10-27 15:19:27.586316+00	active	\N	admin	["all"]	pro
5b8efa4d-4ea6-4c60-8c71-7a8569f24e22	admin@modellyng.ac.id	$argon2id$v=19$m=65536,t=3,p=4$tIf6scwrDiDJ/z0DVbFe0Q$4FDP/d+vEmuNoHW0hjRvynX8KrmWfdftp9Gm98XTO6U	Super Administrator	\N	admin	APA	0.80	2026-10-27 10:33:43.084568+00	2026-10-27 15:24:31.151141+00	active	\N	super_admin	["all"]	free
771ab279-bbf2-4040-b4b3-6621150af32a	lawren@modellyng.ac.id	$argon2id$v=19$m=65536,t=3,p=4$B1kQ6jU+zl3IWJPg3VcMqQ$k1xCLQ/PPK0UrmXW14yQkUVAMYQ9fVVw/S2f+2I07o4	Lawren Researcher	\N	researcher	APA	0.80	2026-11-18 03:24:51.641901+00	2026-11-18 03:24:51.641901+00	active	\N	admin	["all"]	free
\.


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: api_configurations api_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_configurations
    ADD CONSTRAINT api_configurations_pkey PRIMARY KEY (id);


--
-- Name: api_configurations api_configurations_provider_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_configurations
    ADD CONSTRAINT api_configurations_provider_key UNIQUE (provider);


--
-- Name: bug_reports bug_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: comparative_matrix_cells comparative_matrix_cells_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comparative_matrix_cells
    ADD CONSTRAINT comparative_matrix_cells_pkey PRIMARY KEY (id);


--
-- Name: comparative_matrix_cells comparative_matrix_cells_project_id_paper_id_parameter_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comparative_matrix_cells
    ADD CONSTRAINT comparative_matrix_cells_project_id_paper_id_parameter_key_key UNIQUE (project_id, paper_id, parameter_key);


--
-- Name: evidence_spans evidence_spans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidence_spans
    ADD CONSTRAINT evidence_spans_pkey PRIMARY KEY (id);


--
-- Name: extracted_components extracted_components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracted_components
    ADD CONSTRAINT extracted_components_pkey PRIMARY KEY (id);


--
-- Name: extraction_parameters extraction_parameters_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extraction_parameters
    ADD CONSTRAINT extraction_parameters_key_key UNIQUE (key);


--
-- Name: extraction_parameters extraction_parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extraction_parameters
    ADD CONSTRAINT extraction_parameters_pkey PRIMARY KEY (id);


--
-- Name: knowledge_graph_concepts knowledge_graph_concepts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_graph_concepts
    ADD CONSTRAINT knowledge_graph_concepts_pkey PRIMARY KEY (id);


--
-- Name: knowledge_graph_concepts knowledge_graph_concepts_project_id_concept_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_graph_concepts
    ADD CONSTRAINT knowledge_graph_concepts_project_id_concept_name_key UNIQUE (project_id, concept_name);


--
-- Name: paper_blocks paper_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_blocks
    ADD CONSTRAINT paper_blocks_pkey PRIMARY KEY (id);


--
-- Name: paper_components paper_components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_components
    ADD CONSTRAINT paper_components_pkey PRIMARY KEY (id);


--
-- Name: paper_embeddings paper_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_embeddings
    ADD CONSTRAINT paper_embeddings_pkey PRIMARY KEY (id);


--
-- Name: papers papers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.papers
    ADD CONSTRAINT papers_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: research_canvas_edges research_canvas_edges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_canvas_edges
    ADD CONSTRAINT research_canvas_edges_pkey PRIMARY KEY (id);


--
-- Name: research_canvas_nodes research_canvas_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_canvas_nodes
    ADD CONSTRAINT research_canvas_nodes_pkey PRIMARY KEY (id);


--
-- Name: research_syntheses research_syntheses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_syntheses
    ADD CONSTRAINT research_syntheses_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_code_key UNIQUE (code);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: paper_blocks uq_paper_block; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_blocks
    ADD CONSTRAINT uq_paper_block UNIQUE (paper_id, block_id);


--
-- Name: extracted_components uq_paper_parameter; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracted_components
    ADD CONSTRAINT uq_paper_parameter UNIQUE (paper_id, parameter_key);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_audit_logs_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_audit_logs_time ON public.admin_audit_logs USING btree (created_at DESC);


--
-- Name: idx_announcements_scheduled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_announcements_scheduled ON public.announcements USING btree (scheduled_at);


--
-- Name: idx_announcements_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_announcements_status ON public.announcements USING btree (status);


--
-- Name: idx_bug_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bug_reports_status ON public.bug_reports USING btree (status);


--
-- Name: idx_bug_reports_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bug_reports_user ON public.bug_reports USING btree (user_id);


--
-- Name: idx_chat_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_project_id ON public.chat_messages USING btree (project_id);


--
-- Name: idx_chat_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_user_id ON public.chat_messages USING btree (user_id);


--
-- Name: idx_components_paper_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_components_paper_id ON public.paper_components USING btree (paper_id);


--
-- Name: idx_components_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_components_status ON public.paper_components USING btree (status);


--
-- Name: idx_components_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_components_type ON public.paper_components USING btree (component_type);


--
-- Name: idx_embeddings_paper_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_embeddings_paper_id ON public.paper_embeddings USING btree (paper_id);


--
-- Name: idx_evidence_component_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidence_component_id ON public.evidence_spans USING btree (component_id);


--
-- Name: idx_evidence_paper_page; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidence_paper_page ON public.evidence_spans USING btree (paper_id, page_number);


--
-- Name: idx_ext_params_sort; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ext_params_sort ON public.extraction_parameters USING btree (sort_order);


--
-- Name: idx_ext_params_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ext_params_status ON public.extraction_parameters USING btree (status);


--
-- Name: idx_ext_params_tab_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ext_params_tab_group ON public.extraction_parameters USING btree (tab_group);


--
-- Name: idx_extracted_paper_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extracted_paper_id ON public.extracted_components USING btree (paper_id);


--
-- Name: idx_extracted_param_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extracted_param_key ON public.extracted_components USING btree (parameter_key);


--
-- Name: idx_extracted_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extracted_state ON public.extracted_components USING btree (state);


--
-- Name: idx_extracted_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extracted_status ON public.extracted_components USING btree (status);


--
-- Name: idx_matrix_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matrix_project ON public.comparative_matrix_cells USING btree (project_id);


--
-- Name: idx_paper_blocks_fts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paper_blocks_fts ON public.paper_blocks USING gin (fts_tokens);


--
-- Name: idx_paper_blocks_page; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paper_blocks_page ON public.paper_blocks USING btree (paper_id, page_number);


--
-- Name: idx_paper_blocks_paper_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paper_blocks_paper_id ON public.paper_blocks USING btree (paper_id);


--
-- Name: idx_paper_embeddings_hnsw; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paper_embeddings_hnsw ON public.paper_embeddings USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: idx_papers_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_papers_project_id ON public.papers USING btree (project_id);


--
-- Name: idx_papers_project_sha256; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_papers_project_sha256 ON public.papers USING btree (project_id, sha256) WHERE (sha256 IS NOT NULL);


--
-- Name: idx_papers_sha256; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_papers_sha256 ON public.papers USING btree (sha256);


--
-- Name: idx_papers_source_verification; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_papers_source_verification ON public.papers USING gin (source_verification);


--
-- Name: idx_papers_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_papers_stage ON public.papers USING btree (stage);


--
-- Name: idx_papers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_papers_status ON public.papers USING btree (status);


--
-- Name: idx_papers_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_papers_updated_at ON public.papers USING btree (updated_at DESC);


--
-- Name: idx_projects_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);


--
-- Name: idx_reset_tokens_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_tokens_expires ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_reset_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_subscription_plans_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscription_plans_active ON public.subscription_plans USING btree (is_active);


--
-- Name: idx_user_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_user ON public.user_notifications USING btree (user_id, is_read);


--
-- Name: idx_user_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);


--
-- Name: idx_user_subscriptions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions USING btree (user_id);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_users_subscription_tier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_subscription_tier ON public.users USING btree (subscription_tier);


--
-- Name: projects set_projects_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: users set_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: extraction_parameters trg_ext_params_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ext_params_updated_at BEFORE UPDATE ON public.extraction_parameters FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: extracted_components trg_extracted_components_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_extracted_components_updated_at BEFORE UPDATE ON public.extracted_components FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: papers trg_papers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_papers_updated_at BEFORE UPDATE ON public.papers FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: admin_audit_logs admin_audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: api_configurations api_configurations_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_configurations
    ADD CONSTRAINT api_configurations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bug_reports bug_reports_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bug_reports bug_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bug_reports
    ADD CONSTRAINT bug_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comparative_matrix_cells comparative_matrix_cells_evidence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comparative_matrix_cells
    ADD CONSTRAINT comparative_matrix_cells_evidence_id_fkey FOREIGN KEY (evidence_id) REFERENCES public.evidence_spans(id) ON DELETE SET NULL;


--
-- Name: comparative_matrix_cells comparative_matrix_cells_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comparative_matrix_cells
    ADD CONSTRAINT comparative_matrix_cells_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id) ON DELETE CASCADE;


--
-- Name: comparative_matrix_cells comparative_matrix_cells_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comparative_matrix_cells
    ADD CONSTRAINT comparative_matrix_cells_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: evidence_spans evidence_spans_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidence_spans
    ADD CONSTRAINT evidence_spans_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.paper_components(id) ON DELETE CASCADE;


--
-- Name: evidence_spans evidence_spans_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidence_spans
    ADD CONSTRAINT evidence_spans_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id) ON DELETE CASCADE;


--
-- Name: extracted_components extracted_components_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracted_components
    ADD CONSTRAINT extracted_components_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id) ON DELETE CASCADE;


--
-- Name: extracted_components extracted_components_parameter_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extracted_components
    ADD CONSTRAINT extracted_components_parameter_key_fkey FOREIGN KEY (parameter_key) REFERENCES public.extraction_parameters(key) ON UPDATE CASCADE;


--
-- Name: knowledge_graph_concepts knowledge_graph_concepts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_graph_concepts
    ADD CONSTRAINT knowledge_graph_concepts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: paper_blocks paper_blocks_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_blocks
    ADD CONSTRAINT paper_blocks_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id) ON DELETE CASCADE;


--
-- Name: paper_components paper_components_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_components
    ADD CONSTRAINT paper_components_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id) ON DELETE CASCADE;


--
-- Name: paper_embeddings paper_embeddings_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_embeddings
    ADD CONSTRAINT paper_embeddings_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(id) ON DELETE CASCADE;


--
-- Name: papers papers_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.papers
    ADD CONSTRAINT papers_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: research_canvas_edges research_canvas_edges_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_canvas_edges
    ADD CONSTRAINT research_canvas_edges_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: research_canvas_edges research_canvas_edges_source_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_canvas_edges
    ADD CONSTRAINT research_canvas_edges_source_node_id_fkey FOREIGN KEY (source_node_id) REFERENCES public.research_canvas_nodes(id) ON DELETE CASCADE;


--
-- Name: research_canvas_edges research_canvas_edges_target_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_canvas_edges
    ADD CONSTRAINT research_canvas_edges_target_node_id_fkey FOREIGN KEY (target_node_id) REFERENCES public.research_canvas_nodes(id) ON DELETE CASCADE;


--
-- Name: research_canvas_nodes research_canvas_nodes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_canvas_nodes
    ADD CONSTRAINT research_canvas_nodes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: research_syntheses research_syntheses_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_syntheses
    ADD CONSTRAINT research_syntheses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE RESTRICT;


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: knowledge_graph_concepts Users can access knowledge graph concepts in their projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can access knowledge graph concepts in their projects" ON public.knowledge_graph_concepts USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = knowledge_graph_concepts.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: research_syntheses Users can access synthesis records in their projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can access synthesis records in their projects" ON public.research_syntheses USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = research_syntheses.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: research_canvas_edges Users can manage canvas edges in their projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage canvas edges in their projects" ON public.research_canvas_edges USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = research_canvas_edges.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: research_canvas_nodes Users can manage canvas nodes in their projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage canvas nodes in their projects" ON public.research_canvas_nodes USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = research_canvas_nodes.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: papers Users can manage papers within their own projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage papers within their own projects" ON public.papers USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = papers.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: projects Users can manage their own projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own projects" ON public.projects USING ((auth.uid() = user_id));


--
-- Name: paper_embeddings Users can query embeddings within their own papers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can query embeddings within their own papers" ON public.paper_embeddings USING ((EXISTS ( SELECT 1
   FROM (public.papers
     JOIN public.projects ON ((projects.id = papers.project_id)))
  WHERE ((papers.id = paper_embeddings.paper_id) AND (projects.user_id = auth.uid())))));


--
-- Name: users Users can view and edit their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view and edit their own profile" ON public.users USING ((auth.uid() = id));


--
-- Name: paper_components Users can view and review components in their papers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view and review components in their papers" ON public.paper_components USING ((EXISTS ( SELECT 1
   FROM (public.papers
     JOIN public.projects ON ((projects.id = papers.project_id)))
  WHERE ((papers.id = paper_components.paper_id) AND (projects.user_id = auth.uid())))));


--
-- Name: chat_messages Users can view and send their own chat messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view and send their own chat messages" ON public.chat_messages USING ((auth.uid() = user_id));


--
-- Name: comparative_matrix_cells Users can view and update matrix cells in their projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view and update matrix cells in their projects" ON public.comparative_matrix_cells USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = comparative_matrix_cells.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: paper_blocks Users can view blocks in their papers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view blocks in their papers" ON public.paper_blocks USING ((EXISTS ( SELECT 1
   FROM (public.papers
     JOIN public.projects ON ((projects.id = papers.project_id)))
  WHERE ((papers.id = paper_blocks.paper_id) AND (projects.user_id = auth.uid())))));


--
-- Name: evidence_spans Users can view evidence quotes in their papers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view evidence quotes in their papers" ON public.evidence_spans USING ((EXISTS ( SELECT 1
   FROM (public.papers
     JOIN public.projects ON ((projects.id = papers.project_id)))
  WHERE ((papers.id = evidence_spans.paper_id) AND (projects.user_id = auth.uid())))));


--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: comparative_matrix_cells; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.comparative_matrix_cells ENABLE ROW LEVEL SECURITY;

--
-- Name: evidence_spans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.evidence_spans ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_graph_concepts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.knowledge_graph_concepts ENABLE ROW LEVEL SECURITY;

--
-- Name: paper_blocks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.paper_blocks ENABLE ROW LEVEL SECURITY;

--
-- Name: paper_components; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.paper_components ENABLE ROW LEVEL SECURITY;

--
-- Name: paper_embeddings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.paper_embeddings ENABLE ROW LEVEL SECURITY;

--
-- Name: papers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: research_canvas_edges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.research_canvas_edges ENABLE ROW LEVEL SECURITY;

--
-- Name: research_canvas_nodes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.research_canvas_nodes ENABLE ROW LEVEL SECURITY;

--
-- Name: research_syntheses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.research_syntheses ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: postgres
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: TABLE admin_audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_audit_logs TO anon;
GRANT ALL ON TABLE public.admin_audit_logs TO authenticated;
GRANT ALL ON TABLE public.admin_audit_logs TO service_role;


--
-- Name: TABLE announcements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.announcements TO anon;
GRANT ALL ON TABLE public.announcements TO authenticated;
GRANT ALL ON TABLE public.announcements TO service_role;


--
-- Name: TABLE api_configurations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.api_configurations TO anon;
GRANT ALL ON TABLE public.api_configurations TO authenticated;
GRANT ALL ON TABLE public.api_configurations TO service_role;


--
-- Name: TABLE bug_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bug_reports TO anon;
GRANT ALL ON TABLE public.bug_reports TO authenticated;
GRANT ALL ON TABLE public.bug_reports TO service_role;


--
-- Name: TABLE extracted_components; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.extracted_components TO anon;
GRANT ALL ON TABLE public.extracted_components TO authenticated;
GRANT ALL ON TABLE public.extracted_components TO service_role;


--
-- Name: TABLE extraction_parameters; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.extraction_parameters TO anon;
GRANT ALL ON TABLE public.extraction_parameters TO authenticated;
GRANT ALL ON TABLE public.extraction_parameters TO service_role;


--
-- Name: TABLE paper_blocks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.paper_blocks TO anon;
GRANT ALL ON TABLE public.paper_blocks TO authenticated;
GRANT ALL ON TABLE public.paper_blocks TO service_role;


--
-- Name: TABLE password_reset_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.password_reset_tokens TO anon;
GRANT ALL ON TABLE public.password_reset_tokens TO authenticated;
GRANT ALL ON TABLE public.password_reset_tokens TO service_role;


--
-- Name: TABLE subscription_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.subscription_plans TO anon;
GRANT ALL ON TABLE public.subscription_plans TO authenticated;
GRANT ALL ON TABLE public.subscription_plans TO service_role;


--
-- Name: TABLE user_notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_notifications TO anon;
GRANT ALL ON TABLE public.user_notifications TO authenticated;
GRANT ALL ON TABLE public.user_notifications TO service_role;


--
-- Name: TABLE user_subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_subscriptions TO anon;
GRANT ALL ON TABLE public.user_subscriptions TO authenticated;
GRANT ALL ON TABLE public.user_subscriptions TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict NL8WxayaNWpPNTdNTsLliM4buH5IPKHDtcN6yRvuH6rqWGMaAv02W87KPpHf5OS

