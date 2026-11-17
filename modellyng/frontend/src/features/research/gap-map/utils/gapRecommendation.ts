import type { GapTypology } from "@/features/research/knowledge-graph/types/knowledgeGraphTypes"

/** Follow-up advice for one research gap: what is missing, what to do and how to continue. */
export interface GapRecommendation {
  coreIssue: string
  whatUserCanDo: string
  concreteSolution: string
  /** Always four stages (audit -> build -> experiment -> publish). */
  roadmapSteps: [string, string, string, string]
  proposedTitles: string[]
  noveltyContribution: string
}

/** Text a recommendation is chosen from: gap label, gap statement and evidence quotes. */
export interface GapRecommendationInput {
  label: string
  statement: string
  quotes: string[]
  typology?: GapTypology
}

interface KeywordRule {
  /** Matched against the lower-cased combined text. Short tokens use word boundaries on purpose. */
  pattern: RegExp
  recommendation: GapRecommendation
}

const IOT_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Keterbatasan komputasi, memori, dan konsumsi daya pada perangkat keras / IoT mikrokontroler konvensional.",
  concreteSolution:
    "Beralih dari mikrokontroler IoT standar (misal ESP32/Arduino) ke Single-Board Computer / Edge AI seperti Raspberry Pi 4/5 atau NVIDIA Jetson Nano, serta terapkan model quantization (TFLite int8).",
  whatUserCanDo:
    "Untuk mengatasi keterbatasan komputasi dan memori pada device IoT, Anda dapat melakukan migrasi arsitektur dari mikrokontroler berdaya rendah menjadi Single-Board Computer (seperti Raspberry Pi 4/5 atau NVIDIA Jetson). Selain itu, Anda dapat menerapkan teknik Edge AI Optimization (seperti model pruning dan integer-8 quantization) atau arsitektur hybrid (edge-to-cloud offloading) agar pemrosesan data lokal tetap cepat, akurat, dan andal tanpa membebani jaringan.",
  roadmapSteps: [
    "Tahap 1 (Audit Baseline): Ukur profil memori, latensi inferensi, dan konsumsi daya sistem IoT saat ini sebagai baseline acuan.",
    "Tahap 2 (Migrasi Arsitektur): Siapkan perangkat edge (Raspberry Pi/Jetson) dengan runtime inferensi lokal teroptimasi (TFLite/ONNX/TensorRT).",
    "Tahap 3 (Eksperimen Komparatif): Uji coba head-to-head perbandingan frame rate/throughput, latensi pengolahan data, dan konsumsi energi.",
    "Tahap 4 (Dokumentasi & Novelty): Analisis trade-off efisiensi biaya dan performa, lalu publikasikan sebagai kontribusi implementasi edge computing mandiri.",
  ],
  proposedTitles: [
    "Implementasi Edge Computing Berbasis Raspberry Pi untuk Optimasi Latensi dan Pemrosesan Real-Time pada Sistem Cerdas",
    "Analisis Komparatif Efisiensi Energi dan Throughput pada Perangkat Edge Device vs Mikrokontroler IoT",
  ],
  noveltyContribution:
    "Membuktikan peningkatan throughput dan pengurangan latency transmisi tanpa ketergantungan koneksi server kontinu.",
}

const JAVASCRIPT_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Minimnya teknik pemulihan mandiri (self-healing) khusus untuk galat JavaScript di browser sisi klien dibandingkan sistem server/Unix.",
  concreteSolution:
    "Membangun arsitektur Client-Side Self-Healing Agent berbasis Service Worker / WebAssembly interceptor dengan dynamic state rollback dan patch DOM otomatis.",
  whatUserCanDo:
    "Anda dapat mengembangkan runtime error interceptor di browser yang secara otomatis menangkap unhandled error (window.onerror & unhandledrejection), menganalisis konteks eksekusi, lalu mengaplikasikan automated repair patch (misal: wrapping virtual try-catch, me-reset state komponen terisolasi, atau fallback UI dinamis) sehingga aplikasi web tetap berjalan mulus tanpa merusak sesi pengguna.",
  roadmapSteps: [
    "Tahap 1 (Taksonomi Galat): Kumpulkan dan kelompokkan jenis galat runtime JavaScript produksi (TypeError, ReferenceError, Async Promise failure).",
    "Tahap 2 (Rancang Agen Interceptor): Implementasikan middleware Service Worker atau runtime interceptor WebAssembly untuk mendeteksi anomali real-time.",
    "Tahap 3 (Fault Injection Benchmark): Suntikkan berbagai skenario galat buatan (chaos testing) untuk menguji tingkat keberhasilan self-healing.",
    "Tahap 4 (Evaluasi Zero-Downtime): Evaluasi user experience tanpa gangguan reload halaman dan ukur overhead memori browser.",
  ],
  proposedTitles: [
    "Rancang Bangun Framework Self-Healing Mandiri Berbasis Service Worker untuk Mitigasi Galat JavaScript pada Aplikasi Web Modern",
    "Penerapan Runtime Interception Berbasis WebAssembly dalam Menjaga Keutuhan State Aplikasi Web di Sisi Klien",
  ],
  noveltyContribution:
    "Mewujudkan toleransi kesalahan (fault tolerance) otomatis di lingkungan browser runtime tanpa membutuhkan reload halaman.",
}

const HTML_RETRIEVAL_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Model temu kembali informasi (IR) hanya memperlakukan dokumen sebagai teks datar generik dan mengabaikan struktur tag HTML/DOM.",
  concreteSolution:
    "Mengganti model teks flat (seperti BM25 standar) menjadi arsitektur DOM-Aware Hierarchical Transformer (seperti MarkupLM atau Graph Neural Network berbasis pohon DOM).",
  whatUserCanDo:
    "Anda dapat memanfaatkan representasi hierarkis dokumen web (tag semantik seperti <title>, <h1>, <nav>, serta kedalaman node DOM) sebagai bobot fitur embedding multimodal (teks + graf hierarki). Dengan pendekatan ini, mesin pencari dapat membedakan konteks konten utama dari boilerplate/iklan/sidebar secara presisi.",
  roadmapSteps: [
    "Tahap 1 (Ekstraksi Pohon DOM): Buat modul parser untuk mengekstrak struktur pohon DOM lengkap dengan path dan atribut semantik dokumen.",
    "Tahap 2 (Pemodelan Sadar-Struktur): Gabungkan embedding teks dengan embedding posisi hierarki DOM menggunakan arsitektur Transformer terstruktur.",
    "Tahap 3 (Benchmarking IR): Lakukan evaluasi akurasi temu kembali (Mean Reciprocal Rank / MRR dan NDCG@10) terhadap baseline BM25 generik.",
    "Tahap 4 (Optimasi Efisiensi & Publikasi): Analisis kecepatan indexing dan publikasikan temuan sebagai kontribusi sistem temu kembali dokumen web teroptimasi.",
  ],
  proposedTitles: [
    "Model Temu Kembali Informasi Sadar-Struktur (DOM-Aware) Berbasis Graph Neural Network untuk Dokumen Web HTML",
    "Pengaruh Integrasi Bobot Hierarki Tag Semantik terhadap Akurasi Penelusuran Dokumen Web Kompleks",
  ],
  noveltyContribution:
    "Mengeksploitasi relasi struktural dan semantik tag dokumen web untuk meningkatkan relevansi pencarian secara signifikan.",
}

const COMPRESSION_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Kurangnya data empiris mengenai efisiensi ruang dan rasio kompresi format web berbasis XML untuk optimalisasi performa dan biaya.",
  concreteSolution:
    "Melakukan studi benchmarking empiris komparatif antara kompresi standar (Gzip/Brotli) dengan format biner modern (Efficient XML Interchange / EXI, CBOR, Protocol Buffers) pada korpus riil institusi.",
  whatUserCanDo:
    "Anda dapat membangun testbed pengujian performa komparatif yang mengukur rasio reduksi ukuran data, throughput proses dekompresi, dan proyeksi penghematan bandwidth server. Hasilnya dapat menjadi dasar standarisasi format pertukaran data yang jauh lebih hemat biaya untuk portal web skala besar.",
  roadmapSteps: [
    "Tahap 1 (Koleksi Korpus Data): Ambil sampel representatif dataset dokumen XML dari portal resmi pemerintahan atau lembaga publik.",
    "Tahap 2 (Implementasi Testbed Kompresi): Bangun pipeline otomatis untuk menguji kompresi teks (Gzip, Brotli, Zstandard) vs format biner (EXI, CBOR).",
    "Tahap 3 (Pengukuran Empiris & Biaya): Ukur latensi parsing, rasio ruang tersimpan, dan hitung simulasi cost reduction pada arsitektur cloud.",
    "Tahap 4 (Penyusunan Panduan Arsitektur): Rangkum rekomendasi format penyimpanan dan sajikan dalam laporan komprehensif atau artikel ilmiah.",
  ],
  proposedTitles: [
    "Studi Empiris Efisiensi Ruang dan Biaya Bandwidth pada Situs Berbasis XML Menggunakan Format Kompresi Biner EXI",
    "Analisis Komparatif Performa Algoritma Kompresi Modern terhadap Penghematan Biaya Infrastruktur Data Web Publik",
  ],
  noveltyContribution:
    "Menyediakan data empiris riil pertama tentang rasio trade-off efisiensi ruang dan kecepatan parsing pada dokumen XML skala enterprise.",
}

const BENCHMARK_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Ketiadaan dataset benchmark publik yang memuat kasus riil dan dapat direproduksi secara konsisten untuk keperluan eksperimen.",
  concreteSolution:
    "Membangun dan merilis repositori dataset benchmark open-source terstandarisasi dengan lingkungan reproduksi containerized (Docker & Headless Browser).",
  whatUserCanDo:
    "Anda dapat memelopori pengumpulan kasus galat dunia nyata dari repositori open-source, mengotomatiskan proses replikasi lingkungan bug menggunakan container (Docker), memberi label ground-truth yang divalidasi, dan menerbitkannya secara terbuka (misal di Zenodo atau Hugging Face) sebagai benchmark rujukan bersama.",
  roadmapSteps: [
    "Tahap 1 (Mining Kasus Riil): Ekstraksi laporan bug dan commit perbaikan dari ribuan repositori open source populer.",
    "Tahap 2 (Containerisasi Lingkungan): Bungkus setiap kasus ke dalam skrip isolasi teruji (Docker/Playwright) agar 100% dapat direproduksi.",
    "Tahap 3 (Pengujian Baseline Model): Uji alat pengujian dan algoritma perbaikan otomatis yang ada di atas benchmark baru tersebut.",
    "Tahap 4 (Publikasi Benchmark Paper): Terbitkan paper peluncuran benchmark dataset dan sediakan leaderboard terbuka bagi komunitas periset.",
  ],
  proposedTitles: [
    "Penyusunan Dataset Benchmark Publik Terstandar untuk Evaluasi Reproducible Sistem Perangkat Lunak Modern",
    "Kerangka Kerja Pengujian Otomatis Terkontainerisasi untuk Validasi Galat Aplikasi Web Skala Nyata",
  ],
  noveltyContribution:
    "Menjadi dataset rujukan terbuka pertama yang terverifikasi dan reproducible untuk mengevaluasi efektivitas teknik debugging modern.",
}

const DATASET_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Kelangkaan atau keterbatasan volume, anotasi, dan variasi dataset yang digunakan dalam penelitian rujukan.",
  concreteSolution:
    "Menerapkan teknik Synthetic Data Generation (via Generative AI / Diffusion Models), Self-Supervised Learning (SSL), atau Cross-Domain Transfer Learning.",
  whatUserCanDo:
    "Anda dapat mengatasi minimnya data dengan membangun pipeline sintesis data terarah, melakukan augmentasi tingkat lanjut, atau memanfaatkan model pondasi (Foundation Model) yang di-fine tune secara adaptif pada dataset target berskala kecil.",
  roadmapSteps: [
    "Tahap 1 (Eksplorasi Sumber Data): Petakan kebutuhan fitur dan identifikasi repositori publik pendukung untuk augmentasi.",
    "Tahap 2 (Generasi Data Sintetis): Kembangkan skrip sintesis data untuk memperkaya variasi sampel langka.",
    "Tahap 3 (Validasi Silang & Uji Ketahanan): Lakukan k-fold cross-validation untuk memastikan model tidak mengalami overfitting pada data sintetis.",
    "Tahap 4 (Benchmarking Generalisasi): Uji coba model pada data dunia nyata di luar set pelatihan dan dokumentasikan generalisasinya.",
  ],
  proposedTitles: [
    "Penerapan Data Sintetis Terarah untuk Mengatasi Kelangkaan Sampel Pelatihan pada Pemodelan Prediktif",
    "Pengaruh Transfer Learning dan Self-Supervised Pretraining dalam Memitigasi Keterbatasan Dataset Domain Spesifik",
  ],
  noveltyContribution:
    "Membuktikan bahwa kombinasi data sintetis dan transfer learning mampu menyamai akurasi model data besar konvensional.",
}

const POPULATION_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Cakupan populasi atau demografi subjek penelitian sebelumnya terlalu sempit dan kurang representatif.",
  concreteSolution:
    "Memperluas cakupan sampel ke multi-center lintas demografi (usia, institusi, wilayah) dan menerapkan pendekatan Mixed-Methods terintegrasi.",
  whatUserCanDo:
    "Anda dapat memperluas instrumen riset ke segmen populasi baru yang belum tersentuh, mengkombinasikan instrumen kuantitatif terstandar dengan studi kualitatif mendalam untuk mengungkap faktor kontekstual.",
  roadmapSteps: [
    "Tahap 1 (Perancangan Instrumen): Susun instrumen kuesioner dengan uji validitas konstruk dan reliabilitas Cronbach Alpha.",
    "Tahap 2 (Pengumpulan Data Multi-Pusat): Sebarkan survei ke klaster demografi yang lebih heterogen di berbagai wilayah/institusi.",
    "Tahap 3 (Analisis Statistik Inferensial): Terapkan pemodelan SEM-PLS atau ANOVA multi-faktor untuk mengevaluasi signifikansi perbedaan antar kelompok.",
    "Tahap 4 (Sintesis Implikasi Praktis): Publikasikan rekomendasi implementasi yang telah divalidasi pada populasi berskala luas.",
  ],
  proposedTitles: [
    "Studi Komparatif Lintas Demografi terhadap Efektivitas Adopsi Teknologi pada Ekosistem Terdistribusi",
    "Analisis Pendekatan Mixed-Methods untuk Mengevaluasi Generalisasi Sistem pada Kelompok Pengguna Heterogen",
  ],
  noveltyContribution:
    "Mengonfirmasi validitas eksternal dan generalisasi teori pada spektrum populasi yang jauh lebih luas.",
}

const METHODOLOGICAL_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Metodologi atau arsitektur algoritma yang digunakan dalam literatur terdahulu memiliki keterbatasan fleksibilitas atau akurasi.",
  concreteSolution:
    "Mengganti atau menggabungkan model baseline dengan arsitektur Hybrid State-of-the-Art (Transformer adaptif / Ensemble Learning) dan melakukan uji ablasi sistematis.",
  whatUserCanDo:
    "Anda dapat merekayasa ulang algoritma rujukan dengan mengganti modul bottleneck, menambahkan modul attention mechanism, atau menerapkan optimasi hiperparameter berbasis Bayesian untuk mencapai konvergensi yang lebih cepat dan presisi tinggi.",
  roadmapSteps: [
    "Tahap 1 (Replikasi Baseline): Bangun implementasi baseline dari paper rujukan untuk menetapkan titik tolak performa awal.",
    "Tahap 2 (Rekayasa Modul Pengganti): Kembangkan modul algoritma baru dan integrasikan ke dalam pipeline pemrosesan.",
    "Tahap 3 (Ablation Study): Uji kontribusi masing-masing komponen baru secara terpisah untuk membuktikan sumber peningkatan kinerja.",
    "Tahap 4 (Evaluasi Signifikansi Statistik): Lakukan uji t-test atau Wilcoxon signed-rank test untuk membuktikan keunggulan signifikan model baru.",
  ],
  proposedTitles: [
    "Pengembangan Algoritma Hibrida Berbasis Attention Mechanism untuk Peningkatan Akurasi dan Efisiensi Komputasi",
    "Studi Ablasi terhadap Modifikasi Arsitektur Model Prediktif pada Kasus Non-Linier Kompleks",
  ],
  noveltyContribution:
    "Menghadirkan arsitektur hibrida baru dengan performa terbukti melampaui metode baseline rujukan.",
}

const EMPIRICAL_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Kurangnya pengujian empiris jangka panjang (longitudinal) di lingkungan produksi atau dunia nyata.",
  concreteSolution:
    "Melakukan pilot deployment in-the-wild secara bertahap selama minimal 4-8 minggu dengan continuous telemetry logging dan analisis time-series.",
  whatUserCanDo:
    "Anda dapat memindahkan pengujian dari simulasi lab murni ke lingkungan operasional pengguna nyata, mengumpulkan data telemetri penggunaan harian, dan mengevaluasi dampak jangka panjang terhadap stabilitas sistem.",
  roadmapSteps: [
    "Tahap 1 (Setup Testbed Nyata): Siapkan infrastruktur pengujian terisolasi di lingkungan pengguna operasional.",
    "Tahap 2 (Pilot Deployment): Luncurkan sistem ke kelompok pengguna terbatas dengan telemetri otomatis.",
    "Tahap 3 (Analisis Longitudinal): Lacak perubahan metrik efektivitas dan kepuasan pengguna dari minggu ke minggu.",
    "Tahap 4 (Formulasi Temuan Empiris): Dokumentasikan anomali dan insight lapangan nyata sebagai panduan adopsi praktis.",
  ],
  proposedTitles: [
    "Evaluasi Empiris Longitudinal Kinerja Sistem Cerdas pada Lingkungan Operasional Dunia Nyata",
    "Studi Lapangan In-The-Wild terhadap Ketahanan dan Akseptabilitas Pengguna dalam Periode Implementasi Bertahap",
  ],
  noveltyContribution:
    "Menyajikan data empiris pertama dari uji coba operasional riil yang menjembatani jurang antara teori dan praktik.",
}

const GENERAL_RECOMMENDATION: GapRecommendation = {
  coreIssue:
    "Belum adanya integrasi komprehensif atau pembuktian relasi konseptual antara entitas penelitian ini.",
  concreteSolution:
    "Mengembangkan kerangka integratif baru (Unified Conceptual Framework) yang menghubungkan variabel-variabel tersebut ke dalam arsitektur terpadu dan teruji.",
  whatUserCanDo:
    "Anda dapat merumuskan model konseptual baru yang menjembatani celah teori tersebut, membuat prototipe sistem yang menggabungkan kedua domain, dan menguji korelasinya melalui serangkaian eksperimen terukur.",
  roadmapSteps: [
    "Tahap 1 (Sintesis Teori): Petakan hubungan kausalitas antar variabel dari literatur multidisiplin terkait.",
    "Tahap 2 (Prototipe Integrasi): Bangun prototipe sistem atau model simulasi yang mengoperasionalkan hubungan baru tersebut.",
    "Tahap 3 (Uji Eksperimen Terkontrol): Lakukan eksperimen perbandingan untuk menguji hipotesis hubungan antar variabel.",
    "Tahap 4 (Klaim Kebaruan & Publikasi): Publikasikan temuan sebagai model teoritis atau metodologis baru di jurnal bidang terkait.",
  ],
  proposedTitles: [
    "Pengembangan Kerangka Integratif Baru untuk Menjembatani Celah Teori pada Domain Terkait",
    "Model Hubungan Konseptual Multidisiplin untuk Optimasi Solusi pada Kasus Kompleks",
  ],
  noveltyContribution:
    "Menjadi pionir yang menyatukan variabel yang sebelumnya diteliti secara terpisah menjadi satu kesatuan model utuh.",
}

/**
 * Keyword rules, checked in order (same order as the mobile app).
 * Short tokens such as "iot", "dom" or "xml" are anchored to word boundaries so that
 * "domain" or "biotope" do not trigger them by accident.
 */
const KEYWORD_RULES: readonly KeywordRule[] = [
  {
    pattern:
      /\b(iot|device|perangkat|rusbery|raspberry|sensor|hardware|embedded|microcontroller|mikrokontroler|daya|baterai|latency|latensi|resource-constrained|komputasi terbatas)\b/,
    recommendation: IOT_RECOMMENDATION,
  },
  {
    pattern: /\b(javascript|browser|client|peramban|self-healing|pemulihan mandiri|runtime)\b/,
    recommendation: JAVASCRIPT_RECOMMENDATION,
  },
  {
    pattern: /\b(html|temu kembali|retrieval|dom|dokumen web|struktur spesifik)\b/,
    recommendation: HTML_RETRIEVAL_RECOMMENDATION,
  },
  {
    pattern: /\b(efisiensi ruang|kompresi|xml|ctg|biaya|penghematan)\b/,
    recommendation: COMPRESSION_RECOMMENDATION,
  },
  {
    pattern: /\b(benchmark|dataset publik|direproduksi|reproduksi|pengujian)\b/,
    recommendation: BENCHMARK_RECOMMENDATION,
  },
]

/** Typology fallbacks (cases 6-9): the typology wins over the plain keyword when both are present. */
const TYPOLOGY_RULES: ReadonlyArray<{
  typology: GapTypology
  pattern: RegExp
  recommendation: GapRecommendation
}> = [
  { typology: "dataset", pattern: /\b(dataset|data)\b/, recommendation: DATASET_RECOMMENDATION },
  { typology: "population", pattern: /\b(populasi|responden)\b/, recommendation: POPULATION_RECOMMENDATION },
  { typology: "methodological", pattern: /\b(metode|algoritma)\b/, recommendation: METHODOLOGICAL_RECOMMENDATION },
  { typology: "empirical", pattern: /\b(empiris|evaluasi)\b/, recommendation: EMPIRICAL_RECOMMENDATION },
]

/** Picks the recommendation for a gap: ten cases, the first matching one wins. */
export function getGapRecommendation(input: GapRecommendationInput): GapRecommendation {
  const text = [input.label, input.statement, ...input.quotes].join(" ").toLowerCase()

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text)) return rule.recommendation
  }
  for (const rule of TYPOLOGY_RULES) {
    if (input.typology === rule.typology || rule.pattern.test(text)) return rule.recommendation
  }
  return GENERAL_RECOMMENDATION
}

/** Plain-text version of a recommendation, used by "Salin Rekomendasi Lengkap". */
export function formatRecommendationForCopy(gapLabel: string, rec: GapRecommendation): string {
  return [
    `REKOMENDASI RISET UNTUK GAP: ${gapLabel}`,
    "",
    "Keterbatasan Utama:",
    rec.coreIssue,
    "",
    "Apa yang Bisa Dilakukan (Solusi Konkret):",
    rec.concreteSolution,
    "",
    "Detail Aksi:",
    rec.whatUserCanDo,
    "",
    "Langkah Kelanjutan Riset (Roadmap):",
    ...rec.roadmapSteps,
    "",
    "Usulan Judul Penelitian:",
    ...rec.proposedTitles.map((title) => `- ${title}`),
    "",
    "Nilai Novelty:",
    rec.noveltyContribution,
  ].join("\n")
}
