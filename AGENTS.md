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
4. **Isolasi Mutlak Environment Modellyng Web vs Flutter Legacy:**
   * **DILARANG KERAS** menggunakan, mengubah, atau menghubungkan layanan ke kontainer/port/database versi Flutter lama (port `18021-18027`, redis `6380`, kontainer `supabase_*_modellying`).
   * Seluruh layanan Modellyng Web (Supabase, PostgreSQL, Redis, Celery, Backend) wajib berjalan di domain fresh tersendiri dengan penamaan `modellying-web` (port Postgres `28022`, Studio `28023`, Kong `28021`, InBucket `28024`, Redis `6381`, dan volume terisolasi `modellying_web_*`).

---

## 3. Standar Penulisan Kode (Coding Guidelines)

* **Stack Utama Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, TanStack Query v5, Zustand, Lucide React Icons.
* **Stack Backend & Data:** FastAPI Python 3.10+, Celery, Redis, Supabase (PostgreSQL, Storage, Auth, RLS).
* **Kebersihan Kode:** Tulis kode yang modular, bersih, terdokumentasi dengan baik, dan bebas dari file placeholder/dead code.
* **Standar Notifikasi / Toast Seragam:** Seluruh pesan umpan balik (*toast / notification banner*) di semua halaman aplikasi WAJIB menggunakan durasi seragam tepat 5 detik (5000 ms), desain visual terpadu berkelas (glassmorphism/card elevated dengan ikon, progress timer countdown, dan tombol tutup), serta menggunakan teks Bahasa Indonesia baku yang jelas, sopan, dan bebas dari istilah teknis/AI yang membingungkan.
* **Komunikasi:** Berikan penjelasan dan diskusi kepada pengguna dalam Bahasa Indonesia yang profesional dan jelas. Kode, nama variabel, dan komentar kode tetap menggunakan Bahasa Inggris standar.

---

## 4. Protokol Wajib: Pembaruan Buku Panduan Operasional (`lihat_aku_plisss.txt`)

Berkas [`lihat_aku_plisss.txt`](file:///d:/Koding/Modellying%20Web%20By%20Github/lihat_aku_plisss.txt) adalah **buku panduan operasional (Run Guide & Architecture Map) resmi** repositori ini yang diperuntukkan bagi seluruh anggota tim.

* **Kewajiban Mutlak & Format Baku Permanen:**
  1. **Struktur 6 Bagian Utama Wajib Dipertahankan Permanen:**
     - **Bagian 1:** STRUKTUR DIREKTORI & ARSITEKTUR FOLDER (Global + `src/features/`)
     - **Bagian 2:** PANDUAN INSTALASI & MENJALANKAN PROYEK PERTAMA KALI (CLONE DARI GITHUB)
     - **Bagian 3:** PANDUAN MENJALANKAN KEMBALI PROYEK (WORKFLOW MEMBUKA KEMBALI PROYEK)
     - **Bagian 4:** CHEATSHEET DAFTAR PORT, URL AKSES, & KREDENSIAL UJI COBA
     - **Bagian 5:** DETAIL FITUR & INTEGRASI SISTEM
     - **Bagian 6:** CATATAN TEKNIS & PEMECAHAN MASALAH (TROUBLESHOOTING)
  2. **Aturan Ketat Penempatan Informasi Baru:**
     - Setiap ada penambahan fitur, dependensi, proses latar belakang, atau konfigurasi baru, Agen **WAJIB** menempatkannya pada bagian yang benar dan sesuai konteksnya.
     - **DILARANG KERAS** asal menempelkan informasi tanpa memperhatikan urutan logis (*flow*), kesesuaian topik, dan potensi membingungkan pembaca.
     - Setiap panduan baru wajib ditulis bertahap, runtut (*step-by-step*), mencakup direktori kerja eksekusi (`cd`), perintah terminal eksak, dan cara verifikasi.
     - **DILARANG KERAS** menggunakan frasa bernada merendahkan seperti *"untuk pemula"*, gunakan bahasa teknis yang jelas, sopan, objektif, dan mudah dipahami.

