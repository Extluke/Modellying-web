# Petunjuk Utama Agen AI (Workspace Rules) — Modellyng Web

Dokumen ini adalah aturan tetap (*always-active rules*) yang wajib dipatuhi oleh setiap Agen AI saat menganalisis, merancang, menginisialisasi, dan menulis kode pada repositori ini.

---

## 1. Protokol Wajib: Konsultasi Skill Sebelum Eksekusi

Sebelum menulis atau merefaktor kode, Agen **WAJIB** membaca dan menerapkan pedoman dari skill yang relevan di folder `.agents/skills/`:

### A. Komponen UI, Tata Letak, & Desain Sistem
* **Skill Path:** `.agents/skills/shadcn/SKILL.md`
* **Kewajiban:**
  * Gunakan prinsip dan komponen dari Shadcn UI (berbasis Tailwind CSS & Radix UI primitives).
  * Patuhi aturan CLI Shadcn, struktur folder komponen (`components/ui/`), dan token tema resmi Modellyng (Primary Indigo `#5147E5`, Background `#F6F7FB`, Ink Text `#172033`, Font Inter).
  * Hindari pembuatan komponen UI primitif dari nol secara manual jika sudah disediakan oleh Shadcn.

### B. Performa React, Code Splitting, & Build Tooling (Vite)
* **Skill Paths:** 
  * `.agents/skills/react-vite-best-practices/SKILL.md`
  * `.agents/skills/vite/SKILL.md`
* **Kewajiban:**
  * Terapkan arsitektur **Single Page Application (SPA) Native Web** berbasis **React 19 + TypeScript + Vite**.
  * **Code Splitting & Lazy Loading:** Wajib gunakan `React.lazy()` dan boundary `Suspense` pada rute halaman serta modul berat (seperti engine penampil dokumen PDF `pdfjs-dist`, kanvas alur grafis `React Flow` / `@xyflow/react`, dan diagram Mermaid).
  * **Build Optimization:** Konfigurasi `manualChunks` di `vite.config.ts` untuk memisahkan vendor libraries (React, TanStack, React Flow, PDF.js) demi menjaga bundle awal tetap ringan (< 500 KB gzipped).
  * **Vite Conventions:** Utamakan `vite.config.ts`, gunakan ESM murni, manfaatkan `import.meta.env` untuk variabel lingkungan, dan jaga kecepatan Hot Module Replacement (HMR).

### C. Server State, Caching, & Sinkronisasi API (TanStack Query)
* **Skill Path:** `.agents/skills/tanstack-query-best-practices/SKILL.md`
* **Kewajiban:**
  * Gunakan `TanStack Query v5` (`@tanstack/react-query`) untuk seluruh pemanggilan 47 REST endpoint FastAPI dan Supabase.
  * **Query Keys Konsisten:** Terapkan format array hierarkis (misal: `['projects', projectId, 'papers']`) dan gunakan Query Key Factory pattern.
  * **Polling Tugas Asinkron:** Terapkan polling berkala terukur (`refetchInterval`) dengan penghentian otomatis saat memantau status worker Celery (`validating` -> `processing` -> `needs_review` / `ready`).
  * **Mutations & Invalidation:** Selalu lakukan targeted invalidation (`queryClient.invalidateQueries`) setelah mutasi data untuk menjamin konsistensi tampilan tanpa reload manual.

### D. Type Safety & TypeScript Lanjutan
* **Skill Path:** `.agents/skills/typescript-advanced-types/SKILL.md`
* **Kewajiban:**
  * Terapkan *strict typing*. **DILARANG KERAS** menggunakan tipe `any` (gunakan generics, discriminated unions, atau type guards).
  * Manfaatkan interface TypeScript otomatis dari skema OpenAPI FastAPI (`openapi-typescript`).
  * Gunakan discriminated unions untuk pemodelan state (misal status paper: `uploading` | `processing` | `needs_review` | `ready` | `failed`).

---

## 2. Kepatuhan Domain & Dokumen Arsitektur Proyek

Proyek ini adalah pivot aplikasi **Modellyng** (Evidence-Centered Academic PDF Analysis) dari Flutter ke Web Application (Pilihan 2: Modern SPA Native Web). Seluruh logika bisnis, state management, dan alur aplikasi wajib merujuk pada dokumen spesifikasi yang ada di folder `modellyng/`:

1. **`modellyng/audit_fitur_dan_state_modellyng.md`**:
   * Referensi tunggal (*single source of truth*) mengenai seluruh 23 layar, alur ekstraksi 11 komponen PDF, dual RAG chat, kanvas alur riset, knowledge graph, dan ketertelusuran bukti (*evidence quote -> PDF block*).
2. **`modellyng/rekomendasi_arsitektur_web_dan_transisi.md`**:
   * Panduan target web (Pilihan 2: React 19 + TypeScript + Vite + TanStack Query + Zustand + Tailwind/Shadcn + PDF.js + React Flow).
3. **`modellyng/rencana_kerja_dan_pembagian_tugas_tim.md`**:
   * Roadmap bertahap 5 minggu (Sprint 0 s.d. Sprint 4) dan aturan kolaborasi anti-konflik tim (Arby, Faqih, Cahayu, Fatih).

---

## 3. Standar Penulisan Kode (Coding Guidelines)

* **Stack Utama Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, TanStack Query v5, Zustand, Lucide React Icons.
* **Stack Backend & Data:** FastAPI Python 3.10+, Celery, Redis, Supabase (PostgreSQL, Storage, Auth, RLS).
* **Kebersihan Kode:** Tulis kode yang modular, bersih, terdokumentasi dengan baik, dan bebas dari file placeholder/dead code.
* **Komunikasi:** Berikan penjelasan dan diskusi kepada pengguna dalam Bahasa Indonesia yang profesional dan jelas. Kode, nama variabel, dan komentar kode tetap menggunakan Bahasa Inggris standar.
