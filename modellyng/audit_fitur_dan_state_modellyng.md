# Laporan Audit Arsitektur & Ekstraksi Fitur Lengkap: Modellyng

> **Dokumen Validasi Faktual (Tahap 1: Ekstraksi Tanpa Rekomendasi/Coding)**  
> **Peran:** Project Manager & Senior Software Architect  
> **Status Basis Kode:** ~80% Complete (Working End-to-End MVP / Supervised Beta)  
> **Tujuan:** Inventarisasi seluruh fitur, state management, alur logika, dan model data eksisting sebelum pivot total ke Web Application.

---

## 1. Ringkasan Arsitektur & Struktur Direktori Eksisting

Proyek **Modellyng** adalah aplikasi analisis literatur akademis berbasis bukti (*evidence-centered academic PDF analysis*) yang menerapkan prinsip ketertelusuran ketat (*strict traceability*):  
$$\text{AI Result} \longrightarrow \text{Evidence Quote} \longrightarrow \text{Source Paper Block} \longrightarrow \text{Page Number} \longrightarrow \text{Private PDF Document}$$

### A. Struktur Monorepo
Proyek ini terorganisasi dalam struktur monorepo dengan 3 pilar utama:
```text
├── frontend/                 # Client Flutter (Dart SDK ^3.12.2)
│   ├── lib/
│   │   ├── main.dart         # Inisialisasi Supabase, ProviderScope, Error Handling
│   │   └── src/
│   │       ├── config/       # AppConfig (Environment & API Base URL)
│   │       ├── data/         # 22 Repositori, HTTP API Client, Local Cache Services
│   │       ├── models/       # Model data domain, DTO, Enums, JSON Mappers
│   │       ├── platform/     # Abstraksi unduhan file (Web blob vs Native file)
│   │       ├── routing/      # AppRouter (go_router + Auth refresh stream)
│   │       ├── screens/      # 23 Layar aplikasi & antarmuka kerja pengguna
│   │       ├── theme/        # AppTheme, Color palette, Typography
│   │       └── widgets/      # 12 Komponen reusable, Custom Painters, Canvas Layouts
├── backend/                  # REST API & Worker Processing (FastAPI, Python 3.10+)
│   ├── app/
│   │   ├── main.py           # Endpoint REST API (FastAPI) & Middleware CORS
│   │   ├── repository.py     # Data Access Layer & Business Logic ke Supabase
│   │   ├── tasks.py          # Celery background tasks (PDF text & Gemini extraction)
│   │   ├── ai_extraction.py  # Ekstraksi komponen akademis dengan Google GenAI (Gemini)
│   │   ├── comparison_*      # Celery task & service perbandingan berpasangan terurut
│   │   ├── chat_service.py   # RAG Pipeline untuk Project Chat & Global Assistant
│   │   ├── layout.py         # Algoritma spring layout 2D untuk Knowledge Graph
│   │   ├── saturation.py     # Kalkulasi saturasi konsep (low, medium, high)
│   │   ├── clustering.py     # Pengelompokan topik/metode dengan LLM
│   │   ├── export_service.py # Generator dokumen DOCX, XLSX, CSV, PPTX
│   │   ├── structured_pdf.py # Generator PDF tabel metodologi & rumusan masalah
│   │   └── source_verification.py # Integrasi verifikasi DOI Crossref & DataCite
└── supabase/                 # Database, Storage, Auth, Migrations, dan RLS Policies
    └── migrations/           # 21 file migrasi SQL berurutan (RLS, Triggers, Views)
```

---

## 2. Peta State Management & Arsitektur Data Frontend

Aplikasi frontend dibangun menggunakan **Flutter Riverpod** (`flutter_riverpod: ^3.4.2`) yang terhubung ke **Supabase Auth** dan **Dio HTTP Client** (`dio: ^5.11.0`).

### A. Pola State Management Eksisting
| Tipe Provider | Nama Provider | Lingkup & Fungsi |
|---|---|---|
| `Provider<SupabaseClient>` | `supabaseClientProvider` | Instance tunggal klien Supabase lokal |
| `Provider<AuthRepository>` | `authRepositoryProvider` | Manajemen autentikasi pengguna (Login, Register, Logout, User Metadata) |
| `StreamProvider<Session?>` | `authSessionProvider` | Mengalirkan perubahan sesi login secara reaktif ke seluruh aplikasi |
| `Provider<Dio>` | `dioProvider` | Klien HTTP terpusat dengan *Interceptors*: injeksi token JWT Bearer otomatis dan auto-logout saat HTTP 401 |
| `Provider<GoRouter>` | `routerProvider` | Router global (`go_router: ^17.5.0`) dengan `AuthRefreshNotifier` yang mengalihkan rute saat sesi berubah (`/welcome`, `/auth`, `/app`) |
| `FutureProvider.family` | `projectsProvider(userId)` | Mengambil daftar proyek milik user (terisolasi per `user_id`) |
| `FutureProvider.family` | `projectPapersProvider(query)` | Mengambil daftar paper di dalam suatu proyek beserta status pemrosesan Celery |
| `FutureProvider.family` | `paperResultProvider(query)` | Mengambil 11 komponen ekstraksi akademis, tabel terstruktur, dan evidence |
| `FutureProvider.family` | `paperPdfProvider(query)` | Mengambil byte PDF privat dengan **in-memory cache 10 menit** (`ref.keepAlive()`) |
| `FutureProvider.family` | `evidencePreviewProvider(query)` | Mengambil gambar PNG hasil *server-side preview* halaman evidence yang disorot |
| `FutureProvider.family` | `reviewQueueProvider(userId)` | Mengambil antrean review manusia untuk komponen berstatus `needs_review` |
| `FutureProvider.family` | `reviewHistoryProvider(userId)` | Mengambil 100 riwayat keputusan review terakhir pengguna |
| `FutureProvider.family` | `comparativeMatrixProvider(projectId)` | Mengambil data matriks komparasi lintas-paper untuk paper yang sudah `ready` |
| `FutureProvider.family` | `paperComparisonsProvider(projectId)` | Mengambil status analisis pasangan paper (auto-refresh tiap 5 detik jika ada job berjalan) |
| `FutureProvider.family` | `projectSynthesisProvider(projectId)` | Mengambil hasil sintesis AI komparatif global (diambil dari database cache `project_syntheses`) |
| `FutureProvider.family` | `researchFlowProvider(projectId)` | Mengambil data kanvas alur riset (diambil dari cache `research_flow_maps`) |
| `FutureProvider.family` | `researchGapMapProvider(projectId)` | Mengambil graf relasi research gap berbasis limitasi dan future work |
| `FutureProvider.family` | `researchGapDecisionsProvider(projectId)` | Mengambil keputusan manusia terhadap kandidat research gap |
| `FutureProvider.family` | `intelligenceReportProvider(key)` | Mengambil laporan intelijen riset & bibliografi dengan opsi gaya sitasi dinamis |
| `FutureProvider.family` | `sourceVerificationsProvider(query)` | Mengambil riwayat verifikasi DOI eksternal per paper |
| `FutureProvider` | `accountSettingsProvider` | Mengambil pengaturan preferensi pengguna (sitasi, bahasa, visibilitas confidence) |
| `Provider<GlobalChatCacheService>` | `globalChatCacheServiceProvider` | Layanan penyimpanan lokal pesan asisten global dengan TTL 24 jam via `SharedPreferences` |

---

## 3. Ekstraksi Fitur Lengkap Berdasarkan Kategori

Berikut adalah inventarisasi faktual 100% dari source code eksisting tanpa ada logika atau fitur yang terlewat.

### Kategori 1: Autentikasi, Profil, dan Otorisasi (Authentication & Access Control)
1. **Supabase Local Authentication:**
   - Registrasi pengguna baru (`Sign Up`) dengan field: Nama Lengkap (`display_name`), Email, Password.
   - Masuk pengguna (`Sign In`) dengan Email dan Password.
   - Keluar sesi (`Sign Out`) dengan pembersihan token dan invalidasi seluruh cache state.
   - Deteksi kebutuhan konfirmasi email (notifikasi jika email konfirmasi diaktifkan).
   - Pengalihan rute otomatis (*Auth Guard*) via `go_router`: pengguna belum login diarahkan ke `/welcome` atau `/auth`; pengguna login diarahkan langsung ke `/app`.
2. **Keamanan & Isolasi Data Multi-Tenant (RLS Boundary):**
   - Penegakan isolasi data per akun melalui Supabase Row Level Security (RLS) pada seluruh tabel (`projects`, `papers`, `paper_blocks`, `extracted_components`, `evidence_spans`, `review_records`, `paper_comparisons`, `project_chat_messages`, `knowledge_graph_nodes`, dll).
   - Akun A tidak memiliki hak akses baca, ubah, atau hapus terhadap data, paper, maupun PDF milik Akun B (diverifikasi dengan SQL isolation test).
   - Backend FastAPI memvalidasi token JWT pengguna sebelum mengakses data dan meneruskannya ke Supabase.
3. **Manajemen Profil Pengguna:**
   - Ekstraksi inisial nama secara otomatis dari `display_name` atau email (misal: "Budi Santoso" $\rightarrow$ "BS").
   - Penampilan Avatar profil (mendukung URL gambar avatar dari metadata atau inisial bergaya kartu).
   - Dialog informasi privasi dokumen dan batas penggunaan (*free pilot quota modal*).
4. **Pengaturan Akun & Personalisasi (`/api/v1/account/settings`):**
   - Pemilihan gaya sitasi standar: **APA 7**, **IEEE**, **Harvard**, **Vancouver**, **Chicago**.
   - Pengaturan visibilitas indikator keyakinan AI (*AI Confidence Score toggle*).
   - Pengaturan preferensi bahasa (*locale*).
   - Penyimpanan preferensi pengguna ke tabel database `account_preferences`.

---

### Kategori 2: Manajemen Proyek (Project Management)
1. **Dasbor Ringkasan Utama (Dashboard Screen):**
   - Kartu metrik dinamis:
     - Total Paper terunggah.
     - Total Proyek riset aktif.
     - Total *Knowledge Nodes* terverifikasi.
     - Total komponen yang menunggu review (*needs review*) dengan tautan pintas langsung ke antrean review.
   - *Smart Action Banner* dinamis:
     - Mendeteksi paper yang sedang diekstrak oleh Gemini ("Sedang mengekstrak paper...").
     - Mendeteksi paper yang membutuhkan review pengguna dengan tombol "Mulai Review".
   - Daftar proyek terbaru yang terakhir dikerjakan beserta status, progres keterbacaan, dan waktu pembaruan relatif (misal: "Baru saja", "10 menit lalu", "Kemarin").
   - Umpan aktivitas terbaru (*Recent Activity Feed*) berbasis event pemrosesan dan review.
2. **Operasi Proyek (CRUD):**
   - Pembuatan proyek baru (`New Project`) dengan nama proyek dan deskripsi.
   - Pencarian proyek real-time (*search filter*) berdasarkan judul/nama proyek.
   - Pemfilteran proyek berdasarkan status (`Semua`, `Siap`, `Diproses`, `Perlu ditinjau`).
   - Penyuntingan nama dan deskripsi proyek yang sudah ada (*Edit Project Dialog*).
   - Penghapusan proyek (*Delete Project Dialog*) dengan konfirmasi keamanan berlapis, menghapus seluruh paper, block, hasil ekstraksi, dan file di storage secara kaskade.
3. **Status Konsistensi Proyek & Paper:**
   - Status Proyek: `processing`, `needs_review`, `ready`.
   - Status Paper: `validating`, `processing`, `needs_review`, `ready`, `failed`.
   - Transisi status otomatis: Proyek/Paper menjadi `needs_review` setelah ekstraksi AI selesai, dan otomatis berpindah ke `ready` ketika seluruh komponen telah selesai direview (tidak ada lagi yang pending).

---

### Kategori 3: Pengunggahan & Pemrosesan PDF (PDF Ingestion & Processing Pipeline)
1. **Pengunggahan File PDF (Upload Engine):**
   - Pengunggahan dokumen PDF tunggal maupun multipel (hingga maksimal 15 file PDF sekaligus).
   - Batas ukuran file ketat maksimal **50 MB** per PDF.
   - Validasi integritas header PDF berbasis *Magic Bytes signature* (`0x25 0x50 0x44 0x46 0x2D` / `%PDF-`).
   - Validasi pencegahan duplikasi nama file (*duplicate filename check*) terhadap paper yang sudah pernah diunggah dalam proyek.
   - Bar progress unggah interaktif (*Sticky AppBar progress* dan persentase kirim data Dio FormData).
   - Penyimpanan PDF ke Supabase Storage Bucket privat (`papers`) dengan path berbasis user/proyek (`{user_id}/{project_id}/{paper_id}.pdf`). Bucket bersifat strictly non-public.
2. **Pemrosesan Asinkronus (Celery + Redis Worker Pipeline):**
   - Job background task dijalankan di Celery dengan broker Redis lokal (`modellyng.process_pdf`).
   - Pelaporan status & tahapan pemrosesan bertahap (*multi-stage progress reporting*):
     1. `queued` (Menunggu worker)
     2. `downloading` (Mengambil PDF privat dari storage)
     3. `extracting_text` (Membaca teks per halaman dengan PyMuPDF)
     4. `saving_blocks` (Menyimpan blok teks ke tabel `paper_blocks`)
     5. `gemini_extraction` (Menganalisis komponen akademis dengan Gemini)
     6. `retrying_gemini` (Retry otomatis jika Gemini mengalami rate-limit/transient 503/504)
     7. `saving_ai_results` (Menyimpan hasil ekstraksi dan evidence)
     8. `ai_extraction_complete` (Selesai dan masuk ke antrean review)
   - Ekstraksi teks lokal menggunakan **PyMuPDF (fitz)**: menghitung jumlah halaman, mendeteksi bahasa (Indonesia/Inggris), memotong blok teks berindeks per halaman.
   - Penolakan PDF hasil scan gambar (memberitahukan secara jujur bahwa PDF non-searchable membutuhkan OCR).
   - Ekstraksi metadata bibliografi awal dari PDF: Judul, Penulis, Tahun, Jurnal, DOI, Penerbit, Volume, Nomor Issue, Halaman, Status Publikasi, dan SHA-256 File Hash.

---

### Kategori 4: Ekstraksi AI & Parameter Akademis (AI Extraction Engine)
1. **Pemartisian Rute Konteks Teks (*Route Partitioning*):**
   - Pemisahan blok teks dokumen ke dalam 3 rute analisis spesifik untuk menjaga akurasi konteks:
     - `intro` (Pendahuluan, Latar Belakang, Tinjauan Pustaka)
     - `method` (Metodologi, Dataset, Sampel, Variabel, Prosedur)
     - `discussion` (Hasil, Temuan, Diskusi, Limitasi, Kesimpulan, Future Work)
2. **11 Parameter Akademis Utama yang Diekstrak:**
   1. `research_problem` (Masalah penelitian)
   2. `research_objective` (Tujuan penelitian)
   3. `research_question` (Pertanyaan penelitian)
   4. `methodology` (Metodologi penelitian)
   5. `dataset_sample` (Dataset atau sampel penelitian)
   6. `variables_concepts` (Variabel dan konsep yang diteliti)
   7. `results_findings` (Hasil dan temuan penelitian)
   8. `contribution` (Kontribusi kebaruan penelitian)
   9. `limitations` (Keterbatasan penelitian)
   10. `future_work` (Rekomendasi penelitian mendatang)
   11. `key_claims` (Klaim-klaim utama penulis)
3. **Ekstraksi Tabel Terstruktur Khusus:**
   - **Tabel Pertanyaan Penelitian (*Research Questions Table*):**
     - Kolom: Nomor, Pertanyaan Penelitian, Objek/Konsep Terkait, Arah Pembahasan, Halaman Bukti, Kutipan Bukti.
   - **Tabel Metodologi 5 Kolom (*5-Column Methodology Table*):**
     - Kolom: Isi Metodologi (`isi`), Bentuk (`bentuk`), Kegiatan Utama (`kegiatan utama`), Arah Kegiatan (`arah kegiatan`), Tujuan Akhir (`tujuan akhir`).
   - **Ide Penelitian Lanjutan (*Future Research Ideas*):**
     - Peringkat/Rank, Judul Usulan, Rasional Ilmiah, Rekomendasi Metodologi, Potensi Dampak.
4. **Analisis Struktur Sistematika Penulisan Paper (*Writing Structure Detection*):**
   - Mendeteksi ada/tidaknya atau digabungnya bab-bab standar:
     - `Introduction`
     - `Literature Review`
     - `Method`
     - `Results`
     - `Discussion`
     - `Conclusion`
   - Pemetaan status ke 3 kemungkinan: Ada (`present`), Tidak Ada (`missing`), atau Digabung (`combined`).
5. **Verifikasi Bukti Server-Side Ketat (*Deterministic Quote Verification*):**
   - Setiap kutipan bukti (*evidence quote*) yang dihasilkan Gemini diverifikasi secara deterministik terhadap teks asli pada `paper_blocks` di halaman yang diklaim.
   - Kutipan yang tidak cocok atau halusinasi dibuang (*discarded*).
   - Klasifikasi tipe bukti (*evidence kinds*): `text`, `table`, `figure`, `equation`, `result`.
   - Penyimpanan informasi lokasi bukti terstruktur: halaman, section, subsection, dan source label.

---

### Kategori 5: Antrean Review & Audit Manusia (Human-in-the-Loop Review System)
1. **Antrean Review Terpusat (Review Queue Screen):**
   - Menampilkan seluruh komponen berstatus `needs_review` yang dikelompokkan per paper dan per proyek.
   - Filter antrean berdasarkan proyek dan berdasarkan parameter akademis.
   - Tampilan komparasi: Nilai usulan AI (*AI Value*), Skor Keyakinan (*Confidence Score*), Model AI yang digunakan (misal: Gemini), dan Kartu Bukti (*Evidence Quotes* dengan nomor halaman).
2. **Aksi Keputusan Review:**
   - **Terima (Accept):** Menjadikan nilai AI sebagai nilai final (`verified`), menyimpan log audit, dan memicu kalkulasi ulang kesiapan paper.
   - **Koreksi Manual (Edit):** Membuka dialog penyuntingan teks manual, menyimpan nilai hasil perbaikan manusia (`edited`) tanpa menghapus nilai asli usulan AI.
   - **Revisi Interaktif Berbasis AI (AI-Assisted Revision Screen):**
     - Antarmuka chat interaktif (`ComponentRevisionScreen`) khusus untuk satu komponen.
     - Pengguna memberikan instruksi perbaikan (misal: "Rangkum lebih ringkas dan fokuskan pada algoritma X").
     - AI merevisi berdasarkan bukti kutipan paper dan konteks histori chat.
     - Pengguna dapat menyetujui hasil revisi ("Setujui Hasil Revisi") yang langsung disimpan sebagai nilai `edited`.
   - **Tolak (Reject):** Menolak komponen dengan kewajiban mengisi catatan/alasan reviewer (`note`).
   - **Minta Analisis Ulang (Request Reanalysis):** Meminta Celery dan Gemini menganalisis ulang komponen tersebut dengan catatan instruksi, membuat job baru tanpa merusak histori audit sebelumnya.
3. **Aksi Terima Semua Transaksional (Bulk Accept Action):**
   - Tombol "Terima semua analisis" pada level proyek dan pada antrean review.
   - Eksekusi transaksional per batch (maksimal 200 komponen per request).
   - Mengabaikan paper yang masih dalam proses analisis (mencegah inkonsistensi).
   - Dialog konfirmasi eksplisit dengan rincian total komponen dan jumlah paper terdampak.
   - Mengubah status paper dan proyek menjadi `ready` secara atomik saat seluruh komponen diterima.
4. **Histori & Log Audit (Review History):**
   - Menampilkan 100 keputusan review terakhir.
   - Mencatat aksi (`accept`, `edit`, `reject`, `reanalysis`), judul paper, parameter, catatan reviewer, dan timestamp ISO.

---

### Kategori 6: Hasil Terstruktur & Penampil Dokumen PDF (Structured Result & PDF Viewer)
1. **Layar Hasil Paper (Paper Result Screen):**
   - Tampilan tata letak responsif:
     - **Layar Lebar ($\ge$ 1050px):** Tata letak berdampingan (*split view* dua panel) — Panel Kiri (Tab Hasil Ekstraksi & Tab Review Langsung), Panel Kanan (Penampil PDF Terotentikasi).
     - **Layar Mobile/Kecil:** Tampilan bertingkat dengan TabBar 3 tab: `Hasil`, `PDF evidence`, `Review`.
   - Kartu verifikasi bibliografi paper (*Source Verification Card*).
   - Penampil tabel pertanyaan penelitian dan tabel metodologi.
   - Kartu 11 komponen naratif akademis lengkap dengan status badge (`verified`, `edited`, `needs_review`, `rejected`, `unsupported`).
   - Tombol pintas "Review komponen ini" yang langsung mengarahkan fokus ke tab review parameter terkait.
2. **Penampil PDF Privat Terintegrasi (Evidence PDF Viewer):**
   - Membaca byte PDF privat langsung dari memori via endpoint terotentikasi (`/papers/{paper_id}/pdf`) tanpa pernah membuat bucket Supabase menjadi publik.
   - Integrasi penampil native berbasis `pdfrx`.
   - Navigasi halaman instan saat pengguna mengklik kutipan bukti (*evidence quote click*).
   - Penyorotan teks bukti (*text quote highlighting*) di atas kanvas PDF secara cerdas (toleran terhadap perbedaan spasi/karakter baris).
   - Penanganan *cold-start* dan inisialisasi konkruen PDFium saat startup aplikasi.
3. **Pratinjau Halaman Bukti Ringan (*Server-Side Evidence Preview*):**
   - Endpoint backend `/papers/{paper_id}/evidence/{block_id}/preview.png`:
     - Merender hanya satu halaman yang dikutip menjadi gambar PNG dengan highlight kotak kuning transparan tanpa harus mengunduh dan merender seluruh dokumen PDF di sisi klien.
4. **Unduh Dokumen Tabel Terstruktur:**
   - Tombol "Unduh tabel PDF" pada header layar paper.
   - Backend merender tabel pertanyaan penelitian dan tabel metodologi menjadi dokumen PDF formal siap cetak/unduh (`/structured-tables.pdf`).

---

### Kategori 7: Verifikasi Sumber & Bibliografi Eksternal (Source Traceability & Registry Verification)
1. **Verifikasi Bibliografi DOI:**
   - Panel verifikasi bibliografi pada layar paper result (`SourceVerificationCard`).
   - Pemeriksaan otomatis atau manual terhadap DOI paper ke registry publik: **Crossref API** dengan fallback ke **DataCite API**.
   - Perbandingan berdampingan (*side-by-side comparison*) antara metadata lokal paper vs data resmi registri:
     - Judul paper
     - Daftar penulis
     - Tahun publikasi
     - Nama jurnal / konferensi
     - DOI
     - Penerbit (*Publisher*)
     - Volume & Nomor Issue
     - Rentang halaman publikasi
     - Status publikasi
   - Label status kecocokan: Cocok (`matched`), Berbeda (`mismatch`), Belum ada di paper (`missing_local`), Registri tidak menyatakan (`missing_source`), DOI ditemukan, Tidak ditemukan, Layanan tidak tersedia.
2. **Review Keputusan Verifikasi Sumber:**
   - Reviewer dapat memberikan keputusan `Accept` atau `Reject` terhadap kecocokan metadata registri disertai catatan verifikasi.
   - Snapshot verifikasi disimpan permanen ke tabel database `source_verifications` dan `source_reviews`.

---

### Kategori 8: Matriks Komparasi & Sintesis Global (Comparative Matrix & Global Synthesis)
1. **Layar Pemilihan Proyek Matriks:**
   - Memilih proyek yang memiliki minimal 2 paper yang telah berstatus `ready`.
   - Menolak akses jika masih ada paper yang belum selesai direview dengan pesan informatif.
2. **Matriks Komparasi Lintas-Paper (Project Matrix Detail Screen):**
   - Tabel komparasi multi-paper scrollable horizontal dengan sinkronisasi scroll baris (*synchronized horizontal scrolling*).
   - Filter seleksi paper: pengguna dapat memilih subset paper yang ingin ditampilkan di kolom tabel.
   - **Bagian A (Konten Penelitian):** Membandingkan 10 parameter akademis antar paper berdampingan lengkap dengan kutipan bukti yang dapat diklik untuk melompat ke PDF.
   - **Bagian B (Susunan Sistematika Penulisan):** Membandingkan susunan bab paper menggunakan ikon RemixIcon interaktif:
     - Hijau (Centang): Bab Ada (`present`).
     - Merah (Silang): Bab Tidak Ada (`missing`).
     - Biru (Tautan): Bab Digabung (`combined`).
3. **Kartu Sintesis AI Global Komparatif (`ProjectSynthesisCard`):**
   - Sintesis komprehensif yang melibatkan seluruh paper yang telah direview dalam proyek (minimal 2 paper).
   - Menghasilkan ringkasan komparatif terstruktur:
     - Persamaan antar paper (*similarities*).
     - Perbedaan antar paper (*differences*).
     - Pola riset yang teridentifikasi (*research patterns*).
     - Perbedaan pendekatan metodologi (*approach differences*).
     - Kesenjangan dan peluang riset (*gaps and opportunities*).
     - Ide penelitian lanjutan (*follow-up research ideas*) lengkap dengan rasional ilmiah.
     - Posisi spesifik tiap paper dalam peta literatur (*each paper's position*).
     - Paragraf akademik formal dengan sitasi penulis-tahun (misal: "Al-Qaheri dkk., 2010") dan daftar pustaka lengkap.
   - Fitur tombol Salin Poin (*Copy as Points*) dan Salin Paragraf Akademik (*Copy Academic Text*).
   - Mekanisme Caching Cerdas: Hasil sintesis disimpan di tabel database `project_syntheses` dengan hash data review; Gemini hanya dipanggil ulang jika data review berubah atau jika pengguna memilih paksa regenerasi (*Force Regenerate*).

---

### Kategori 9: Perbandingan Berpasangan Terurut (Ordered Cross-Paper Comparison Engine)
1. **Analisis Pasangan Paper Terurut (*5-Step Ordered Comparison Pipeline*):**
   - Membandingkan seluruh pasangan kombinasi paper yang siap dalam proyek ($n \times (n-1) / 2$).
   - Menjalankan Celery task asinkronus `modellyng.analyze_paper_pair` dengan antrean teratur.
   - **Aturan Berhenti 5 Tahap Deterministic (*Deterministic Stopping Rule*):**
     1. **Konsep Utama (*Concept*):** Jika `No` $\rightarrow$ status berhenti sebagai *Unrelated* (tidak berhubungan, tidak dilanjutkan).
     2. **Variabel (*Variables*):** Jika `No` $\rightarrow$ berhenti dan menjadi *Candidate Gap* kategori variabel.
     3. **Data / Objek (*Data/Object*):** Jika `No` $\rightarrow$ berhenti dan menjadi *Candidate Gap* kategori populasi/konteks.
     4. **Metode (*Method*):** Jika `No` $\rightarrow$ berhenti dan menjadi *Candidate Gap* kategori metodologi.
     5. **Permasalahan (*Research Problem*):** Jika `No` $\rightarrow$ berhenti dan menjadi *Candidate Gap* kategori cakupan masalah.
     - Jika semua aspek bernilai `Yes` $\rightarrow$ hasil akhir adalah *No Gap* (kedua paper identik pada kelima aspek).
     - Jika bukti kutipan tidak valid/kurang $\rightarrow$ hasil adalah *Insufficient Evidence*.
2. **Visualisasi Diagram Alur Pasangan (Pair Comparison Flowchart):**
   - Visualisasi graf alur flowchart interaktif yang dirender menggunakan library native `flutter_mermaid`.
   - Node keputusan bercabang (`Yes`, `No`, `Belum cukup`) yang dapat di-pan, di-zoom, dan diklik untuk membuka bukti kutipan dari kedua paper secara simultan.
   - Reviewer dapat menyetujui atau menolak kandidat gap hasil perbandingan dengan catatan verifikasi manusia.

---

### Kategori 10: Pemetaan Celah Riset & Rekomendasi Tesis (Research Gap Maps & Action Roadmap)
1. **Layar Pemetaan Research Gap (Maps Screen & Project Maps Detail Screen):**
   - Statistik jumlah paper dan total gap yang teridentifikasi.
   - Segmentasi sumber gap: Dari perbandingan pasangan paper, atau dari keterbatasan (*limitations*) dan *future work* masing-masing paper.
   - Keputusan validasi gap: Peneliti dapat menandai gap sebagai `Accepted` (layak diteliti) atau `Rejected` disertai catatan.
2. **Rekomendasi Aksi & Solusi Konkret Gap (*Gap Action Recommendation*):**
   - Panel detail saat gap diklik yang menyajikan panduan tindak lanjut konkret bagi mahasiswa/peneliti:
     - **Isu Inti (*Core Issue*):** Akar masalah ilmiah yang belum terselesaikan.
     - **Solusi Konkret (*Concrete Solution*):** Teknologi, arsitektur, atau metode pengganti yang disarankan.
     - **Apa yang Bisa Dilakukan Pengguna (*What User Can Do*):** Panduan operasional praktis.
     - **Roadmap Riset 4 Tahap (*4-Stage Research Roadmap*):**
       - Tahap 1: Audit Baseline / Pengukuran Awal
       - Tahap 2: Migrasi Arsitektur / Implementasi
       - Tahap 3: Eksperimen Komparatif / Uji Coba
       - Tahap 4: Dokumentasi Kebaruan & Publikasi
     - **Usulan Judul Penelitian / Tesis (*Proposed Research Titles*):** 2–3 usulan judul konkret.
     - **Kontribusi Kebaruan (*Novelty Contribution*):** Pernyataan kebaruan ilmiah (*novelty statement*).
   - Tersedia generator berbasis aturan kontekstual instan dan generator AI berbasis Gemini (`/api/v1/projects/{project_id}/gaps/{gap_id}/recommendation`).
3. **Perumus Formulasi Riset AI (*Research Formulation Synthesizer Screen*):**
   - Tombol mengambang "Sintesis Riset" pada layar gap map.
   - Menghasilkan rumusan komprehensif: Pernyataan Novelty, 3 Rekomendasi Judul Tesis dengan indikator valid, Daftar Rumusan Masalah (*Research Questions*), dan Alasan Pemilihan Topik.

---

### Kategori 11: Kanvas Alur Riset (Peta Alur Riset / Research Flow Canvas)
1. **Kanvas Interaktif Alur Riset Visual:**
   - Panel visualisasi alur berpikir riset yang dibaca dari kiri ke kanan:  
     $$\text{Topik per Paper} \longrightarrow \text{Tema Bersama (Isi)} \longrightarrow \text{Masalah} \longrightarrow \text{Solusi} \longrightarrow \text{Fungsi \& Kesimpulan}$$
   - Algoritma tata letak berbasis aturan backend (`backend/app/research_flow.py`):
     - Sebuah tema bersama membutuhkan minimal 2 paper.
     - Solusi bersama (*shared solution*) yang dipakai minimal 2 paper diberi warna **Hijau** ("Sering diteliti") dan alurnya berlanjut.
     - Solusi tunggal atau topik tanpa tema bersama diberi warna **Merah** ("Jarang diteliti / Gap potensial") dan alurnya berhenti.
2. **Kontrol Kanvas & Interaktivitas:**
   - Fitur geser (*pan*), cubit/roda mouse (*zoom in / zoom out*), tombol penyesuaian layar (*fit to view*), dan mode layar penuh (*fullscreen modal*).
   - Penggambaran kurva konektor bezier dinamis antar node (*FlowEdgePainter*).
   - Klik pada setiap kotak node membuka bottom sheet detail: stage alur, status frekuensi penelitian, paper sumber, dan teks kutipan pendukung.

---

### Kategori 12: Knowledge Graph 2D Interaktif & Saturasi Konsep
1. **Kanvas Knowledge Graph Spasial (Knowledge Graph Screen):**
   - Kanvas 2D tak terbatas (5000 $\times$ 5000 px) dengan navigasi `InteractiveViewer`.
   - Node dibedakan secara visual berdasarkan tipe:
     - `paper` (Dokumen paper sumber)
     - `concept` (Konsep ilmiah)
     - `variable` (Variabel penelitian)
     - `method` (Metodologi yang digunakan)
     - `result` (Hasil & temuan utama)
     - `research_gap` (Celah riset potensial dengan aksen api menyala & glowing border)
   - Garis relasi kustom (*Custom Edge Painter*) dengan label relasi ilmiah antar konsep.
   - Auto-centering kamera ke titik tengah distribusi node saat pertama kali dimuat.
2. **Kalkulasi Saturasi & Klaster Spasial (Backend Layout & Saturation Engine):**
   - Perhitungan rasio saturasi konsep di `backend/app/saturation.py`:
     - $\le 20\%$: *Low Saturation*
     - $21\% - 50\%$: *Medium Saturation*
     - $> 50\%$: *High Saturation*
   - Pemisahan zona spasial otomatis pada sumbu X berdasarkan status saturasi (`backend/app/layout.py`):
     - Zona *None* ($X: 0 - 400$)
     - Zona *Low* ($X: 500 - 900$)
     - Zona *Medium* ($X: 1000 - 1400$)
     - Zona *High* ($X: 1500 - 1900$)
   - Pengelompokan klaster konsep dan metode ilmiah menggunakan LLM clustering (`backend/app/clustering.py`).

---

### Kategori 13: Asisten Percakapan AI / Dual RAG Chatbots
1. **Chatbot Proyek Khusus (*Project-Scoped RAG Chatbot*):**
   - Layar chat berbasis proyek (`ProjectChatScreen`).
   - Sistem RAG (*Retrieval-Augmented Generation*) murni berbasis blok teks paper privat proyek pengguna.
   - Menolak menjawab pertanyaan yang berada di luar konteks paper dalam proyek secara jujur.
   - Menghasilkan jawaban berdasar (*grounded*) yang dilengkapi kartu sumber sitasi: Judul Paper, Nomor Halaman, dan Kutipan Persis.
   - Mengklik kartu sitasi langsung membuka layar penampil PDF privat pada halaman yang tepat dengan quote highlighting.
   - Pemanasan awal cache PDF (*Cold-Start Pre-warming*): Mengunduh hingga 2 PDF yang dikutip ke dalam in-memory cache segera setelah jawaban AI muncul.
   - Riwayat percakapan disimpan permanen ke database Supabase (`project_chat_messages`) dan otomatis dimuat ulang saat proyek dibuka kembali.
2. **Asisten Cerdas Global (*Global Assistant Chat*):**
   - Layar chat asisten global di AppShell (`GlobalChatScreen`).
   - Autocomplete tagging konteks interaktif:
     - Mengetik `@` memunculkan popup daftar proyek pengguna untuk membatasi cakupan chat ke proyek tertentu (`@proyek`).
     - Mengetik `/` memunculkan popup daftar paper dalam proyek untuk fokus pada satu paper spesifik (`/paper`).
   - Tag konteks ditampilkan sebagai chip interaktif di atas kolom input yang bisa dihapus.
   - Riwayat percakapan disimpan di sisi klien (*client-side local cache*) via `SharedPreferences` dengan batas waktu kedaluwarsa **24 jam** per pengguna (otomatis memangkas pesan kedaluwarsa).
   - Format jawaban Markdown kaya (tabel, heading, bullet, code snippet) via `flutter_markdown`.
   - Pemangkasan riwayat otomatis: mengirim maksimal 6 pesan terakhir dengan batas maksimal 1500 karakter per pesan agar tidak melebihi token window backend.
   - Mekanisme retry otomatis 1 kali untuk error sementara Gemini (503/504) dalam budget 38 detik, dan pengembalian teks pertanyaan ke input bar bila terjadi kegagalan koneksi.

---

### Kategori 14: Laporan Intelijen & Ekspor Multi-Format (Intelligence Report & Export Engine)
1. **Laporan Intelijen Riset Terpadu (*Intelligence Report Card*):**
   - Laporan ringkasan menyeluruh di menu Matriks:
     - Sitasi daftar pustaka otomatis dalam 5 format: APA 7, IEEE, Harvard, Vancouver, Chicago.
     - Sitasi dalam teks otomatis (misal: "Menurut Doe et al. (2024)...").
     - Metrik total relasi, kandidat gap, dan pasangan teranalisis.
     - Daftar *Unsupported Claims* (klaim atau komponen yang belum didukung bukti kuat).
     - Pengelompokan klaster riset (*Research Clusters*) beserta istilah-istilah yang saling beririsan.
     - Kompresi struktural per paper (*Structural Compression*).
   - Ekspor laporan intelijen lengkap dalam format **JSON** terstruktur (`/intelligence-report.json`).
2. **Mesin Ekspor Dokumen Multi-Format (Export Results Screen):**
   - Mengekspor seluruh paper yang telah berstatus `ready` dalam satu proyek ke 4 format dokumen populer:
     1. **Microsoft Word (`.docx`):** Dokumen laporan terstruktur rapi per paper dan parameter lengkap dengan bukti kutipan untuk penyuntingan naskah lanjutan.
     2. **Microsoft Excel (`.xlsx`):** Lembar kerja spreadsheet dengan tabel siap filter (memuat nilai reviewed, nilai AI asli, status verifikasi, confidence, nomor halaman, dan kutipan).
     3. **Comma-Separated Values (`.csv`):** File CSV portabel dengan encoding UTF-8 untuk kebutuhan komputasi data science atau pengolahan statistik lanjutan.
     4. **PowerPoint Presentation (`.pptx`):** Slide presentasi ringkas siap pakai yang merangkum parameter penting dan bukti kutipan per paper.
   - Penanganan unduhan dokumen yang kompatibel di multi-platform (Web Blob Anchor download via `download_file_web.dart` vs Native File System Saver via `download_file_native.dart`).

---

## 4. Matriks Komponen UI Frontend & Backend Endpoints

### A. Daftar Seluruh File Layar & Widget Frontend
| File Path | Peran & Fungsionalitas Utama |
|---|---|
| `screens/app_shell.dart` | Shell navigasi adaptif (Sidebar di Desktop $\ge$ 760px, NavigationBar di Mobile) |
| `screens/welcome_screen.dart` | Landing page onboarding responsif, pengantar produk, tombol Get Started |
| `screens/auth_screen.dart` | Formulir Sign In / Sign Up Supabase, validasi input, toggle visibilitas password |
| `screens/dashboard_screen.dart` | Ringkasan metrik proyek, Smart Action Banner, grid proyek, feed aktivitas |
| `screens/projects_screen.dart` | Manajemen proyek (CRUD), pencarian real-time, filter status proyek |
| `screens/new_project_screen.dart` | Formulir pembuatan workspace riset baru |
| `screens/project_overview_screen.dart` | Ikhtisar paper dalam proyek, upload multi-PDF, polling job status, bulk accept |
| `screens/paper_result_screen.dart` | Split-view hasil 11 komponen, PDF viewer terotentikasi, lompat bukti, cetak PDF |
| `screens/review_queue_screen.dart` | Antrean review manusia, aksi accept/edit/reject/reanalyze, riwayat audit |
| `screens/component_revision_screen.dart` | Chat revisi interaktif per komponen dengan AI Gemini sebelum finalisasi review |
| `screens/comparative_matrix_screen.dart` | Pemilihan proyek untuk matriks komparasi (validasi minimal 2 paper siap) |
| `screens/project_matrix_detail_screen.dart` | Matriks komparasi 10 parameter, susunan bab (RemixIcons), filter paper, kartu sintesis |
| `screens/maps_screen.dart` | Pemilihan proyek untuk visualisasi graf & alur riset |
| `screens/project_maps_detail_screen.dart` | Kanvas Peta Alur Riset, daftar gap, kartu rekomendasi aksi 4 tahap, sintesis tesis |
| `screens/concept_evidence_map_screen.dart` | Graf relasi paper $\rightarrow$ konsep $\rightarrow$ evidence berbasis flowchart Mermaid |
| `screens/research_gap_map_screen.dart` | Peta keterbatasan & future work, perbandingan berpasangan, tombol sintesis riset |
| `screens/knowledge_graph_screen.dart` | Kanvas 2D spasial 5000px, InteractiveViewer, spring layout saturasi, custom edge painter |
| `screens/synthesis_screen.dart` | Halaman hasil formulasi riset AI: novelty, 3 usulan judul, rumusan masalah |
| `screens/global_chat_screen.dart` | Asisten chat global dengan autocomplete `@proyek` dan `/paper`, cache 24 jam |
| `screens/project_chat_screen.dart` | Chatbot RAG terisolasi per proyek, kartu sitasi [S#], auto-preview PDF |
| `screens/export_results_screen.dart` | Antarmuka pemilihan format ekspor (Word, Excel, CSV, PowerPoint) |
| `screens/account_screen.dart` | Layar akun pengguna, status paket pilot, preferensi sitasi, tautan audit log, logout |
| `widgets/research_flow_canvas.dart` | Kanvas interaktif alur riset (pan, zoom, fit, fullscreen, node bottom sheet) |
| `widgets/research_flow_layout.dart` | Algoritma penataan node alur riset (Topik $\rightarrow$ Tema $\rightarrow$ Masalah $\rightarrow$ Solusi) |
| `widgets/project_synthesis_card.dart` | Komponen sintesis AI global komparatif, salin poin & paragraf akademik |
| `widgets/source_verification_card.dart` | Kartu verifikasi DOI eksternal (Crossref / DataCite) & komparasi metadata |
| `widgets/paper_comparison_panel.dart` | Panel pemicu dan pemantau status perbandingan berpasangan terurut |
| `widgets/pair_comparison_flowchart.dart` | Flowchart Mermaid native untuk logika perbandingan 5 tahap |
| `widgets/structure_status_cell.dart` | Sel status susunan bab paper berbasis ikon RemixIcon (Ada/Tidak/Digabung) |
| `widgets/intelligence_report_card.dart` | Kartu laporan intelijen, klaster riset, sitasi otomatis, unsupported claims |
| `widgets/account_settings_card.dart` | Formulir pengaturan preferensi sitasi dan confidence score AI |
| `widgets/expandable_table_cell.dart` | Sel tabel yang dapat diperluas (*expandable*) untuk teks panjang |
| `widgets/common_widgets.dart` | Kumpulan widget dasar: BrandLockup, StatusBadge, PageHeading, EmptyState, MetricCard |

---

### B. Daftar Seluruh REST API Endpoints Backend
| Method | Endpoint | Fungsi & Peran |
|---|---|---|
| `GET` | `/health` | Pemeriksaan liveness API lokal |
| `GET` | `/health/dependencies` | Pemeriksaan kesiapan koneksi ke Redis & Supabase |
| `POST` | `/api/v1/projects` | Membuat proyek riset baru |
| `GET` | `/api/v1/projects` | Mengambil seluruh proyek milik pengguna |
| `GET` | `/api/v1/projects/{project_id}` | Mengambil detail satu proyek |
| `PATCH` | `/api/v1/projects/{project_id}` | Memperbarui judul atau deskripsi proyek |
| `DELETE`| `/api/v1/projects/{project_id}` | Menghapus proyek dan seluruh datanya secara kaskade |
| `POST` | `/api/v1/projects/{project_id}/papers` | Menambahkan rekaman paper secara manual |
| `POST` | `/api/v1/projects/{project_id}/papers/upload` | Menerima file upload PDF (max 50 MB) & menyimpan ke Storage |
| `GET` | `/api/v1/projects/{project_id}/papers` | Mengambil daftar paper dalam proyek beserta status job |
| `POST` | `/api/v1/projects/{project_id}/papers/{paper_id}/process` | Memulai antrean pemrosesan lokal & AI di Celery Worker |
| `GET` | `/api/v1/projects/{project_id}/papers/{paper_id}/result` | Mengambil 11 komponen ekstraksi, bukti, dan tabel terstruktur |
| `DELETE`| `/api/v1/projects/{project_id}/papers/{paper_id}` | Menghapus paper beserta file PDF dan seluruh hasil ekstraksinya |
| `GET` | `/api/v1/projects/{project_id}/papers/{paper_id}/pdf` | Mengalirkan stream byte PDF privat terotentikasi |
| `GET` | `/api/v1/projects/{project_id}/papers/{paper_id}/evidence/{block_id}/preview.png` | Merender 1 halaman bukti PDF menjadi gambar PNG dengan highlight |
| `GET` | `/api/v1/projects/{project_id}/papers/{paper_id}/structured-tables.pdf` | Menghasilkan unduhan PDF berisi tabel pertanyaan & metodologi |
| `GET` | `/api/v1/projects/{project_id}/comparative-matrix` | Mengambil data matriks komparasi lintas paper |
| `GET` | `/api/v1/projects/{project_id}/synthesis` | Mengambil sintesis AI global yang tersimpan |
| `POST` | `/api/v1/projects/{project_id}/synthesis` | Menyusun/memperbarui sintesis AI global lintas paper |
| `GET` | `/api/v1/projects/{project_id}/concept-evidence-map` | Mengambil graf relasi paper $\rightarrow$ konsep $\rightarrow$ bukti |
| `GET` | `/api/v1/projects/{project_id}/research-gap-map` | Mengambil graf relasi kandidat research gap |
| `GET` | `/api/v1/projects/{project_id}/research-flow` | Mengambil data alur riset kanvas (Topik $\rightarrow$ Masalah $\rightarrow$ Solusi) |
| `GET` | `/api/v1/projects/{project_id}/knowledge-graph` | Mengambil graf spasial 2D (nodes, edges, zones) |
| `GET` | `/api/v1/projects/{project_id}/gaps/{gap_id}/recommendation` | Mengambil rekomendasi aksi & roadmap tindak lanjut gap |
| `POST` | `/api/v1/projects/{project_id}/synthesize_gaps` | Merumuskan novelty, judul tesis, dan rumusan masalah dari gap |
| `POST` | `/api/v1/projects/{project_id}/synthesize-graph-nodes` | Menyusun sintesis dari subset node graph yang dipilih |
| `PATCH`| `/api/v1/projects/{project_id}/gaps/{gap_id}/validation` | Memperbarui status validasi gap oleh reviewer |
| `GET` | `/api/v1/projects/{project_id}/intelligence-report` | Mengambil laporan intelijen, klaster, dan sitasi otomatis |
| `GET` | `/api/v1/projects/{project_id}/intelligence-report.json` | Mengunduh laporan intelijen dalam format file JSON |
| `GET` | `/api/v1/projects/{project_id}/research-gap-decisions` | Mengambil daftar keputusan reviewer atas kandidat gap |
| `PUT` | `/api/v1/projects/{project_id}/research-gaps/{paper_id}/{parameter}/decision` | Menyimpan keputusan (accept/reject) atas kandidat gap |
| `POST` | `/api/v1/projects/{project_id}/chat` | RAG Chatbot: Menjawab pertanyaan berdasarkan blok teks paper proyek |
| `GET` | `/api/v1/projects/{project_id}/chat/messages` | Mengambil riwayat pertukaran pesan chat proyek |
| `POST` | `/api/v1/assistant/chat` | Asisten Global: Menjawab pertanyaan umum atau scoped (`@` / `/`) |
| `POST` | `/api/v1/projects/{project_id}/components/{component_id}/revise` | Revisi interaktif teks komponen oleh AI berdasarkan prompt pengguna |
| `GET` | `/api/v1/projects/{project_id}/export/{export_format}` | Membuat & mengunduh file ekspor proyek (`docx`, `xlsx`, `csv`, `pptx`) |
| `GET` | `/api/v1/reviews` | Mengambil antrean komponen paper yang membutuhkan review manusia |
| `GET` | `/api/v1/reviews/history` | Mengambil 100 riwayat keputusan review terakhir |
| `POST` | `/api/v1/reviews/accept-all` | Menerima seluruh komponen pending secara transaksional |
| `POST` | `/api/v1/reviews/{component_id}` | Memberikan keputusan review tunggal (`accept`, `edit`, `reject`, `reanalysis`) |
| `GET` | `/api/v1/account/settings` | Mengambil preferensi akun pengguna |
| `PUT` | `/api/v1/account/settings` | Menyimpan preferensi akun pengguna |
| `GET` | `/api/v1/projects/{project_id}/papers/{paper_id}/source-verifications` | Mengambil riwayat verifikasi DOI eksternal |
| `POST` | `/api/v1/projects/{project_id}/papers/{paper_id}/source-verifications` | Memicu verifikasi DOI ke Crossref/DataCite |
| `POST` | `/api/v1/projects/{project_id}/papers/{paper_id}/source-verifications/{v_id}/reviews` | Menyimpan keputusan review atas verifikasi bibliografi |
| `GET` | `/api/v1/projects/{project_id}/comparisons` | Mengambil ikhtisar perbandingan berpasangan terurut |
| `POST` | `/api/v1/projects/{project_id}/comparisons` | Memicu/mengantrekan job perbandingan berpasangan di Celery |
| `POST` | `/api/v1/projects/{project_id}/comparisons/{pair_id}/reviews` | Menyimpan review manusia atas hasil perbandingan pasangan |

---

## 5. Ringkasan Kunci untuk Validasi Pengguna

1. **Seluruh fungsionalitas bisnis berada pada 14 kategori komprehensif** yang mencakup: Auth & RLS, Manajemen Proyek, Pipeline Upload & Celery/PyMuPDF, Ekstraksi 11 Komponen AI & 3 Tabel Khusus, Antrean & Revisi Review Manusia, Split-Screen PDF Viewer & Evidence Highlighting, Verifikasi DOI Registri, Matriks Komparasi Multi-Paper, Perbandingan Berpasangan Terurut 5 Tahap, Pemetaan Gap & Roadmap Rekomendasi Aksi, Kanvas Alur Riset (Peta Alur Riset), Knowledge Graph Spasial 2D, Dual RAG Chatbots (Proyek & Global Assistant), serta Ekspor Multi-Format (DOCX, XLSX, CSV, PPTX, PDF, JSON).
2. **Tidak ada satupun logika pemrosesan yang terlewatkan**, termasuk hal detail seperti aturan penghentian deterministik pada pasangan paper, toleransi perbedaan baris/spasi saat menyorot kutipan PDF, batas batch 200 pada bulk-accept, caching 24 jam dengan auto-prune di global chat, pemanasan PDF pre-warming 2 dokumen, dan penataan koordinat spasial zona saturasi pada graf.
3. Dokumen ini disiapkan murni sebagai **inventarisasi faktual** untuk Anda validasi secara menyeluruh sebelum kita melangkah ke tahap perancangan arsitektur Web.
