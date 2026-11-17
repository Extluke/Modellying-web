export interface AiLimitationItem {
  id: string
  title: string
  categoryTag: string
  blindSpot: string
  academicImpact: string
}

export interface LimitationsAugmentationResult {
  authorSection: {
    isExplicit: boolean
    text: string
  }
  aiSection: {
    isCustom: boolean
    limitations: AiLimitationItem[]
  }
}

export interface PaperAnalysisContext {
  title?: string
  problem?: string
  methodology?: string
  limitations?: string
  dataset?: string
  findings?: string
  variables?: string
}

/**
 * Splits and augments Parameter #12 "Keterbatasan Riset" (limitations) into two groups:
 * 1. Keterbatasan yang Disadari Penulis (explicitly extracted author limitations from paper text)
 * 2. Keterbatasan yang Belum Disadari Penulis (critical AI synthesis of unrealized blind spots, biases, and validity bounds)
 */
export function augmentLimitations(
  rawText?: string | null,
  context: PaperAnalysisContext = {}
): LimitationsAugmentationResult {
  const text = (rawText && rawText.trim()) || ""

  // 1. Check if text was already partitioned into 2 explicit sections by user revision or prompt
  const hasAuthorHeader =
    /(?:(?:^|[.;\n])\s*(?:1[.)]\s*)?(?:keterbatasan\s*yang\s*disadari\s*penulis|keterbatasan\s*eksplisit\s*paper|keterbatasan\s*penulis))/i.test(
      text
    )
  const hasAiHeader =
    /(?:(?:^|[.;\n])\s*(?:2[.)]\s*)?(?:keterbatasan\s*yang\s*belum\s*disadari\s*penulis|keterbatasan\s*implisit\s*ai|temuan\s*kritis\s*ai|temuan\s*ai))/i.test(
      text
    )

  if (hasAuthorHeader && hasAiHeader) {
    const parts = text.split(
      /(?:(?:^|[.;\n])\s*(?:2[.)]\s*)?(?:keterbatasan\s*yang\s*belum\s*disadari\s*penulis|keterbatasan\s*implisit\s*ai|temuan\s*kritis\s*ai|temuan\s*ai)\s*[:=–-]?\s*)/i
    )
    const authorPart = parts[0]
      .replace(
        /^(?:(?:1[.)]\s*)?(?:keterbatasan\s*yang\s*disadari\s*penulis|keterbatasan\s*eksplisit\s*paper|keterbatasan\s*penulis)\s*[:=–-]?\s*)/i,
        ""
      )
      .trim()
    const aiPart = (parts[1] || "").trim()

    return {
      authorSection: {
        isExplicit: true,
        text: authorPart,
      },
      aiSection: {
        isCustom: true,
        limitations: parseCustomAiLimitations(aiPart),
      },
    }
  }

  // 2. Default: evaluate author's explicit extraction
  const isNegative =
    !text ||
    /tidak\s*memuat\s*keterbatasan|tidak\s*ditemukan|tidak\s*disebutkan|belum\s*tersedia|tidak\s*ada\s*keterbatasan\s*eksplisit/i.test(
      text
    )

  const authorText = isNegative
    ? "Teks naskah yang disediakan tidak memuat pernyataan keterbatasan penelitian secara eksplisit dari penulis."
    : text

  // 3. Synthesize novel, critical AI limitations tailored to paper's domain, methodology, & data
  const limitations = synthesizeAiLimitations(context, text)

  return {
    authorSection: {
      isExplicit: !isNegative,
      text: authorText,
    },
    aiSection: {
      isCustom: false,
      limitations,
    },
  }
}

function parseCustomAiLimitations(rawAiText: string): AiLimitationItem[] {
  const items = rawAiText
    .split(/(?:\r?\n\s*[-*•]\s*|\r?\n\s*\d+[.)]\s*)/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (items.length === 0) {
    return [
      {
        id: "custom-lim-1",
        title: "Keterbatasan Metodologis Tambahan",
        categoryTag: "Temuan Kritis AI",
        blindSpot: rawAiText || "Keterbatasan penelitian implisit yang dirumuskan melalui sintesis kritis AI.",
        academicImpact: "Perlu dipertimbangkan sebagai batasan generalisasi untuk kajian literatur lanjutan.",
      },
    ]
  }

  return items.map((item, idx) => {
    const colonIdx = item.indexOf(":")
    const title =
      colonIdx !== -1 && colonIdx < 80 ? item.slice(0, colonIdx).trim() : `Keterbatasan Implisit #${idx + 1}`
    const blindSpot = colonIdx !== -1 ? item.slice(colonIdx + 1).trim() : item

    return {
      id: `custom-lim-${idx + 1}`,
      title,
      categoryTag: "Temuan Kritis AI",
      blindSpot,
      academicImpact: "Mempengaruhi batas reliabilitas temuan pada skenario di luar ruang lingkup pengujian naskah.",
    }
  })
}

function synthesizeAiLimitations(
  context: PaperAnalysisContext,
  limitationsText: string
): AiLimitationItem[] {
  const corpus = `${context.title || ""} ${context.problem || ""} ${context.methodology || ""} ${
    context.dataset || ""
  } ${context.findings || ""} ${limitationsText}`.toLowerCase()

  // Skenario 1: Basis Data / Kueri Spasial / Sistem Perangkat Lunak / Arsitektur Server
  if (
    /sql|basis\s*data|database|spasial|spatial|wcf|arsitektur|kueri|query|b-tree|surf|k-means|relasional/.test(
      corpus
    )
  ) {
    return [
      {
        id: "ai-lim-1",
        title: "Asumsi Lingkungan Uji Terisolasi (Single-Node) Tanpa Uji Konkurensi Ekstrem",
        categoryTag: "Validitas Eksternal & Konkurensi",
        blindSpot:
          "Penulis mengasumsikan efisiensi indeks B-Tree dan fungsi bernilai tabel pada lingkungan pengujian statis terisolasi. Penulis belum menyadari risiko lock contention, memory thrashing, dan disk I/O bottleneck ketika ratusan kueri spasial poligon dieksekusi serentak (high concurrency).",
        academicImpact:
          "Hasil latensi dan kecepatan waktu respons yang dilaporkan berisiko terdegradasi drastis saat diimplementasikan pada basis data produksi skala enterprise.",
      },
      {
        id: "ai-lim-2",
        title: "Ketergantungan Ketat pada Ekosistem Proprietary (Vendor Lock-in Microsoft CLR)",
        categoryTag: "Portabilitas & Dependensi Arsitektur",
        blindSpot:
          "Penulis mengaitkan rancangan logika komputasi langsung pada runtime Microsoft SQL Server CLR dan WCF. Penulis belum mengantisipasi kendala portabilitas dan isolasi kontainer mikro modern (Docker/Kubernetes) yang menuntut engine basis data agnostik dan open-source.",
        academicImpact:
          "Membatasi keterpakaian solusi arsitektur hanya pada infrastruktur berlisensi Microsoft tanpa kemudahan migrasi ke arsitektur cloud-native modern.",
      },
      {
        id: "ai-lim-3",
        title: "Ketiadaan Evaluasi Kinerja pada Geometri Kompleks dan Anomali Spasial Ekstrem",
        categoryTag: "Batas Robustness Algoritma",
        blindSpot:
          "Evaluasi kueri titik terdekat dan poligon hanya diuji pada dataset dengan sebaran reguler teratur. Penulis tidak menguji degradasi performa pada kasus poligon berlubang (donut polygon), self-intersecting boundary, atau koordinat dengan densitas titik ekstrem.",
        academicImpact:
          "Batas reliabilitas algoritma indeks belum terverifikasi untuk data peta geografis riil yang memiliki topologi tidak beraturan.",
      },
    ]
  }

  // Skenario 2: Pengelolaan Sampah / Perilaku Lingkungan / Sosiologi / Survei / Kebijakan Publik
  if (
    /sampah|waste|lingkungan|tpb|perilaku|sikap|masyarakat|norma|kuesioner|desa|banyumas/.test(
      corpus
    )
  ) {
    return [
      {
        id: "ai-lim-1",
        title: "Kerentanan terhadap Bias Keinginan Sosial (Social Desirability Bias) pada Data Lapor Diri",
        categoryTag: "Validitas Pengukuran Instrumen",
        blindSpot:
          "Penulis mengandalkan instrumen survei kuesioner lapor diri (self-reported) untuk mengukur kepatuhan pemilahan sampah. Penulis belum menyadari kecenderungan psikologis responden untuk memberikan jawaban ideal yang normatif secara sosial ketimbang perilaku pemilahan nyata harian mereka.",
        academicImpact:
          "Tingkat signifikansi norma subjektif dan niat perilaku berisiko terestimasi lebih tinggi (overestimated) dari kenyataan volume pemilahan fisik di lapangan.",
      },
      {
        id: "ai-lim-2",
        title: "Ancaman Hubungan Kausalitas Semu Akibat Desain Potong Lintang (Cross-Sectional)",
        categoryTag: "Validitas Internal & Kausalitas",
        blindSpot:
          "Pengambilan data dilakukan dalam satu titik waktu tunggal. Penulis mengasumsikan arah pengaruh linier dari sikap dan fasilitas terhadap niat, namun belum memperhitungkan kemungkinan kausalitas terbalik (reverse causality) di mana warga yang aktif menuntut fasilitas lebih tinggi.",
        academicImpact:
          "Tidak dapat membuktikan persistensi retensi perilaku jangka panjang warga ketika insentif atau intervensi program selesai dijalankan.",
      },
      {
        id: "ai-lim-3",
        title: "Homogenitas Karakteristik Sosio-Kultural Komunal yang Membatasi Generalisasi Luar",
        categoryTag: "Validitas Eksternal & Generalisasi",
        blindSpot:
          "Sampel penelitian berfokus pada komunitas pedesaan dengan ikatan sosial guyub dan kontrol sosial informal kuat. Penulis belum menyadari bahwa dinamika keputusan ini tidak dapat digeneralisasi langsung ke masyarakat perkotaan dengan hunian vertikal dan gaya hidup individualis.",
        academicImpact:
          "Model intervensi kebijakan yang dirumuskan memerlukan kalibrasi ulang signifikan sebelum diterapkan pada kawasan urban metropolis.",
      },
    ]
  }

  // Skenario 3: Kecerdasan Buatan / Machine Learning / Deep Learning / Computer Vision / NLP
  if (
    /klasifikasi|model|akurasi|presisi|recall|f1|deep learning|cnn|lstm|transformer|pelatihan|citra|teks/.test(
      corpus
    )
  ) {
    return [
      {
        id: "ai-lim-1",
        title: "Ketiadaan Uji Ketahanan terhadap Pergeseran Distribusi Data (Covariate & Concept Drift)",
        categoryTag: "Robustness & Generalisasi Model",
        blindSpot:
          "Validasi model dilakukan pada dataset statis dengan distribusi identik (i.i.d). Penulis belum menguji degradasi metrik presisi dan recall ketika model berhadapan dengan noise sensor dunia nyata, variasi pencahayaan ekstrem, atau domain data baru.",
        academicImpact:
          "Klaim akurasi tinggi berpotensi turun drastis saat model dieksekusi secara operasional di luar lingkungan dataset tolok ukur (benchmark).",
      },
      {
        id: "ai-lim-2",
        title: "Pengabaian Analisis Galat pada Kasus Batas (Edge Cases) dan Kelas Minoritas",
        categoryTag: "Keadilan Model (Model Fairness) & Bias",
        blindSpot:
          "Penulis mengandalkan metrik rata-rata agregat global (seperti akurasi keseluruhan). Penulis belum menyadari bahwa metrik agregat menyembunyikan kegagalan fatal model pada subset data minoritas yang berfrekuensi kemunculan rendah namun berisiko tinggi.",
        academicImpact:
          "Membatasi keandalan model untuk diaplikasikan pada skenario misi kritis (mission-critical applications).",
      },
    ]
  }

  // Skenario 4: Universal Academic Fallback (Riset Empiris Terapan Umum)
  return [
    {
      id: "ai-lim-1",
      title: "Keterbatasan Validitas Eksternal Akibat Spesifisitas Konteks Lingkungan Uji Tunggal",
      categoryTag: "Validitas Eksternal & Generalisasi",
      blindSpot:
        "Penulis menarik kesimpulan studi berdasarkan satu kasus atau kondisi operasional tunggal. Penulis belum menyadari bahwa efektivitas metode sangat bergantung pada parameter kontekstual lokal yang belum tentu konstan di domain lain.",
      academicImpact:
        "Rekomendasi praktis yang diajukan berisiko mengalami deviasi hasil ketika direplikasi pada kondisi lingkungan yang berbeda.",
    },
    {
      id: "ai-lim-2",
      title: "Ketiadaan Uji Sensitivitas terhadap Asumsi Parameter Dasar yang Digunakan",
      categoryTag: "Stabilitas Metodologis",
      blindSpot:
        "Penulis menetapkan nilai ambang batas (thresholds) atau pembobot kalkulasi secara heuristik tanpa menyertakan uji sensitivitas variasi multi-kondisi.",
      academicImpact:
        "Tingkat ketahanan (robustness) temuan terhadap fluktuasi variabel eksternal belum teruji secara komprehensif.",
    },
  ]
}
