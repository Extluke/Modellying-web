import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DisplayHeading,
  PageHeading,
  PaperHeading,
  SectionHeading,
  TitleMedium,
  BodyText,
  MutedCaption,
} from "@/components/ui/typography"
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ArrowRight,
  Layers,
  Palette,
  Type,
  MousePointerClick,
  SquareCheck,
  Send,
} from "lucide-react"

export default function StyleGuideScreen() {
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "buttons" | "badges" | "cards" | "inputs">("colors")

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 rounded-badge bg-primary-soft px-3 py-1 text-badge-mini text-primary">
          <Sparkles className="size-3.5" />
          <span>Single Source of Truth Design System</span>
        </div>
        <PageHeading>Modellyng Style Guide & Template Dasar</PageHeading>
        <BodyText className="text-muted-foreground max-w-2xl">
          Panduan visual terpadu berbasis token resmi Modellyng. Seluruh warna, sudut radius, tipografi, dan komponen
          diatur secara terpusat melalui CSS variables di <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">src/index.css</code>.
        </BodyText>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pt-4">
          {[
            { id: "colors", label: "Palet Warna", icon: Palette },
            { id: "typography", label: "Skala Tipografi", icon: Type },
            { id: "buttons", label: "Tombol (Button)", icon: MousePointerClick },
            { id: "badges", label: "Lencana (Badge)", icon: SquareCheck },
            { id: "inputs", label: "Form Input", icon: Send },
            { id: "cards", label: "Kartu & Panel", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Button
                key={tab.id}
                variant={isActive ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="gap-1.5"
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* 1. COLORS */}
      {activeTab === "colors" && (
        <section className="space-y-6">
          <div className="space-y-1">
            <SectionHeading>1. Brand & Primary (Indigo AI Identity)</SectionHeading>
            <MutedCaption>Identitas utama aplikasi Modellyng untuk aksi utama, link, dan sorotan.</MutedCaption>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-16 w-full rounded-button bg-primary flex items-center justify-center text-white font-bold text-xs">
                #5147E5
              </div>
              <div className="font-semibold text-xs">Primary (Utama)</div>
              <MutedCaption>Tombol utama, aksen aktif, link</MutedCaption>
            </div>
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-16 w-full rounded-button bg-primary-hover flex items-center justify-center text-white font-bold text-xs">
                #3730A3
              </div>
              <div className="font-semibold text-xs">Primary Hover</div>
              <MutedCaption>State hover/pressed tombol utama</MutedCaption>
            </div>
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-16 w-full rounded-button bg-primary-soft flex items-center justify-center text-primary-soft-foreground font-bold text-xs border border-primary/20">
                #EEECFF
              </div>
              <div className="font-semibold text-xs">Primary Soft</div>
              <MutedCaption>Background icon, active nav, badge</MutedCaption>
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <SectionHeading>2. Status & Semantik Akademis</SectionHeading>
            <MutedCaption>Warna penanda kondisi hasil analisis paper dan peninjauan manusia.</MutedCaption>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-12 w-full rounded-button bg-status-green flex items-center justify-center text-white font-bold text-xs">
                #158466
              </div>
              <div className="font-semibold text-xs text-status-green">Ready / Verified</div>
              <MutedCaption>Paper siap, hasil terverifikasi</MutedCaption>
            </div>
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-12 w-full rounded-button bg-status-orange flex items-center justify-center text-white font-bold text-xs">
                #E17A15
              </div>
              <div className="font-semibold text-xs text-status-orange">Needs Review</div>
              <MutedCaption>Perlu review manusia</MutedCaption>
            </div>
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-12 w-full rounded-button bg-status-red flex items-center justify-center text-white font-bold text-xs">
                #D64555
              </div>
              <div className="font-semibold text-xs text-status-red">Error / Rejected</div>
              <MutedCaption>Gagal ekstrak / klaim ditolak</MutedCaption>
            </div>
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-12 w-full rounded-button bg-status-blue flex items-center justify-center text-white font-bold text-xs">
                #2878F0
              </div>
              <div className="font-semibold text-xs text-status-blue">Paper / Ingest</div>
              <MutedCaption>Tab dokumen, berkas PDF</MutedCaption>
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <SectionHeading>3. Kanvas Alur Riset & Visualisasi Graf (React Flow)</SectionHeading>
            <MutedCaption>Warna klasifikasi solusi dan penanda celah riset bernilai novelty tinggi.</MutedCaption>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-10 w-full rounded-button bg-canvas-frequent flex items-center justify-center text-slate-900 font-bold text-xs">
                #6EDC7C
              </div>
              <div className="font-semibold text-xs">Frequent (Hijau)</div>
              <MutedCaption>Solusi bersama (≥ 2 paper)</MutedCaption>
            </div>
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-10 w-full rounded-button bg-canvas-rare flex items-center justify-center text-white font-bold text-xs">
                #FF6B6B
              </div>
              <div className="font-semibold text-xs">Rare (Merah Karang)</div>
              <MutedCaption>Solusi tunggal / Celah riset</MutedCaption>
            </div>
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-10 w-full rounded-button bg-canvas-neutral flex items-center justify-center text-slate-800 font-bold text-xs border">
                #DFE2E7
              </div>
              <div className="font-semibold text-xs">Neutral (Abu Lembut)</div>
              <MutedCaption>Node pengantar & tema</MutedCaption>
            </div>
            <div className="rounded-card border bg-card p-4 shadow-card space-y-2">
              <div className="h-10 w-full rounded-button bg-canvas-gap flex items-center justify-center text-white font-bold text-xs">
                #EA580C
              </div>
              <div className="font-semibold text-xs">Gap Highlight (Oranye Api)</div>
              <MutedCaption>Celah bernilai novelty tinggi</MutedCaption>
            </div>
          </div>
        </section>
      )}

      {/* 2. TYPOGRAPHY */}
      {activeTab === "typography" && (
        <section className="space-y-6">
          <div className="space-y-1">
            <SectionHeading>Skala Tipografi Inter (Tabel B Spesifikasi)</SectionHeading>
            <MutedCaption>Hierarki ukuran font, line-height, letter-spacing, dan font-weight.</MutedCaption>
          </div>

          <div className="divide-y rounded-card border bg-card shadow-card">
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <DisplayHeading>Display Small (38px)</DisplayHeading>
                <MutedCaption>Judul hero Welcome Screen</MutedCaption>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-display-sm (Bold 800)
              </code>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <PageHeading>Headline Medium (28px)</PageHeading>
                <MutedCaption>Judul utama halaman (PageHeading)</MutedCaption>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-headline-md (Bold 800)
              </code>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <PaperHeading>Headline Small (22px)</PaperHeading>
                <MutedCaption>Judul paper di Paper Result Screen</MutedCaption>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-headline-sm (Bold 800)
              </code>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <SectionHeading>Title Large (18px)</SectionHeading>
                <MutedCaption>Judul bagian (Section Title), Header Kartu</MutedCaption>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-title-lg (SemiBold 700)
              </code>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <TitleMedium>Title Medium (15px)</TitleMedium>
                <MutedCaption>Nama paper pada tabel matriks, Header modal</MutedCaption>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-title-md (SemiBold 700)
              </code>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <p className="text-body-lg text-foreground">
                  Body Large (16px) — Teks naratif konten, paragraf sintesis rekomendasi riset, dan analisis komparatif mendalam.
                </p>
                <MutedCaption>Teks narasi panjang</MutedCaption>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-body-lg (Regular 400)
              </code>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <BodyText>
                  Body Medium (14px) — Teks penjelasan, kutipan evidence quote, deskripsi form, dan teks default UI.
                </BodyText>
                <MutedCaption>Standar teks aplikasi</MutedCaption>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-body-md (Regular 400 / 500)
              </code>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <MutedCaption>Caption Muted (12px) — Metadata, nomor halaman PDF, Block ID, timestamp</MutedCaption>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-caption-muted (Medium 500)
              </code>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-badge-mini uppercase tracking-wider text-primary">Badge Mini (11px) — Status Chips</span>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded self-start">
                text-badge-mini (Bold 700)
              </code>
            </div>
          </div>
        </section>
      )}

      {/* 3. BUTTONS */}
      {activeTab === "buttons" && (
        <section className="space-y-6">
          <div className="space-y-1">
            <SectionHeading>Varian Tombol (Button Primitive)</SectionHeading>
            <MutedCaption>Sudut lengkung: 12px (rounded-button). Standar ukuran: Desktop (h-11) & Compact (h-9).</MutedCaption>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-card border bg-card p-6 shadow-card space-y-4">
              <TitleMedium>1. Primary Button (#5147E5)</TitleMedium>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Aksi Utama (Desktop)</Button>
                <Button variant="primary" size="sm">Aksi Compact</Button>
                <Button variant="primary" size="icon"><Sparkles className="size-4" /></Button>
              </div>
              <MutedCaption>Penggunaan: Simpan, Analisis AI, Upload, Submit form</MutedCaption>
            </div>

            <div className="rounded-card border bg-card p-6 shadow-card space-y-4">
              <TitleMedium>2. Outlined Button (#FFFFFF with #E5E8EF)</TitleMedium>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline">Aksi Sekunder</Button>
                <Button variant="outline" size="sm">Batal / Kembali</Button>
                <Button variant="outline" size="icon"><FileText className="size-4" /></Button>
              </div>
              <MutedCaption>Penggunaan: Filter, Ekspor, Batal, Kembali</MutedCaption>
            </div>

            <div className="rounded-card border bg-card p-6 shadow-card space-y-4">
              <TitleMedium>3. Tonal / Soft Action Button (#EEECFF)</TitleMedium>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="soft">Tonal Action</Button>
                <Button variant="soft" size="sm">Revisi Komponen</Button>
              </div>
              <MutedCaption>Penggunaan: Tombol revisi AI, sorot bukti, aksi kontekstual</MutedCaption>
            </div>

            <div className="rounded-card border bg-card p-6 shadow-card space-y-4">
              <TitleMedium>4. Destructive Action Button (#D64555)</TitleMedium>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="destructive">Hapus Proyek</Button>
                <Button variant="destructive" size="sm">Tolak Ekstraksi</Button>
              </div>
              <MutedCaption>Penggunaan: Hapus paper, tolak komponen, batalkan proses</MutedCaption>
            </div>
          </div>
        </section>
      )}

      {/* 4. BADGES */}
      {activeTab === "badges" && (
        <section className="space-y-6">
          <div className="space-y-1">
            <SectionHeading>Status Badges & Chips</SectionHeading>
            <MutedCaption>Tersedia dalam 2 bentuk: Pill (9999px) dan Square (8px).</MutedCaption>
          </div>

          <div className="rounded-card border bg-card p-6 shadow-card space-y-6">
            <div className="space-y-3">
              <TitleMedium>Pill Variant (rounded-badge: 9999px)</TitleMedium>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="ready"><CheckCircle2 className="size-3" /> Status Ready</Badge>
                <Badge variant="review"><Clock className="size-3" /> Needs Review</Badge>
                <Badge variant="error"><AlertTriangle className="size-3" /> Error / Rejected</Badge>
                <Badge variant="paper"><FileText className="size-3" /> 18 Papers</Badge>
                <Badge variant="primary"><Sparkles className="size-3" /> Gemini 1.5 Pro</Badge>
                <Badge variant="outline">Netral / Draft</Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <TitleMedium>Square Mini Variant (rounded-badge-sm: 8px)</TitleMedium>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="ready" shape="square">READY</Badge>
                <Badge variant="review" shape="square">REVIEW</Badge>
                <Badge variant="error" shape="square">FAILED</Badge>
                <Badge variant="paper" shape="square">PDF</Badge>
                <Badge variant="primary" shape="square">AI PRO</Badge>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. INPUTS */}
      {activeTab === "inputs" && (
        <section className="space-y-6">
          <div className="space-y-1">
            <SectionHeading>Spesifikasi Form Input</SectionHeading>
            <MutedCaption>Tinggi: 44px (h-11), Radius: 12px, Border: #E5E8EF, Focus: #5147E5.</MutedCaption>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-card border bg-card p-6 shadow-card space-y-3">
              <TitleMedium>Input Standar</TitleMedium>
              <Input placeholder="Ketik judul penelitian atau kata kunci..." />
              <MutedCaption>Placeholder warna #98A2B3 dengan focus ring 2px Indigo.</MutedCaption>
            </div>

            <div className="rounded-card border bg-card p-6 shadow-card space-y-3">
              <TitleMedium>Input dengan Status Error</TitleMedium>
              <Input error defaultValue="Format file bukan PDF resmi (%PDF-)" />
              <span className="text-[11px] font-semibold text-status-red">Wajib menyertakan dokumen berekstensi .pdf</span>
            </div>
          </div>
        </section>
      )}

      {/* 6. CARDS */}
      {activeTab === "cards" && (
        <section className="space-y-6">
          <div className="space-y-1">
            <SectionHeading>Spesifikasi Kontainer & Kartu (Card)</SectionHeading>
            <MutedCaption>Radius: 16px (rounded-card). Flat border dengan bayangan halus saat hover.</MutedCaption>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card hoverable>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="ready">Terverifikasi</Badge>
                  <MutedCaption>2 jam yang lalu</MutedCaption>
                </div>
                <CardTitle className="mt-2">Kartu Interaktif (Hoverable)</CardTitle>
                <CardDescription>
                  Arahkan kursor ke kartu ini untuk melihat elevasi bayangan halus (#5147E5 shadow).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BodyText className="text-muted-foreground text-xs">
                  Kartu ini menggunakan token sudut radius 16px dan transisi border saat di-hover.
                </BodyText>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs font-semibold text-primary">Detail Paper</span>
                <ArrowRight className="size-4 text-primary" />
              </CardFooter>
            </Card>

            <Card subtle>
              <CardHeader>
                <Badge variant="primary">Subtle Surface</Badge>
                <CardTitle className="mt-2">Kartu Tonal Lembut</CardTitle>
                <CardDescription>
                  Digunakan untuk area kutipan bukti, catatan penjelasan, atau container sekunder.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-button bg-card p-3 border border-border/80 text-xs italic text-muted-foreground">
                  "Modellyng Evidence Span: Tautan langsung ke layer teks PDF."
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  )
}
