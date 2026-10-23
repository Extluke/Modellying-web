import { useState, useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { PdfViewer } from "@/features/projects/paper-analysis/PdfViewer"
import { EvidencePanel } from "@/features/projects/paper-analysis/EvidencePanel"
import { ComponentAiRevisionModal } from "./ComponentAiRevisionModal"
import { DoiVerificationDrawer } from "./DoiVerificationDrawer"
import {
  ArrowLeft,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  Compass,
  Database,
  TrendingUp,
  BookmarkCheck,
  HelpCircle,
  Users,
  Cpu,
  Sliders,
  BarChart3,
  Award,
  ShieldCheck,
  AlertTriangle,
  Rocket,
  Edit3,
  ExternalLink,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import {
  usePaperComponents,
  usePaperBlocks,
  useUpdateComponent,
  useProjectDetail,
  ExtractedComponent,
  EvidenceItem,
} from "../api/projectsApi"
import { toast } from "@/lib/store/useToastStore"

type TabGroupKey = "konteks_masalah" | "metode_data" | "hasil_gap"

export default function PaperResultScreen() {
  const { projectId, paperId } = useParams<{ projectId: string; paperId: string }>()

  // 1. Live server data fetching via TanStack Query
  const {
    data: components = [],
    isLoading: isLoadingComponents,
    isError: isErrorComponents,
  } = usePaperComponents(projectId, paperId)

  const { data: blocks = [] } = usePaperBlocks(projectId, paperId)
  const { data: project } = useProjectDetail(projectId)
  const updateComponentMutation = useUpdateComponent(projectId || "", paperId || "")

  // 2. Active paper lookup
  const paper = useMemo(() => {
    return project?.papers?.find((p) => p.id === paperId)
  }, [project, paperId])

  // 3. Selection & Evidence State for PDF highlighting synchronizer
  const [activeTab, setActiveTab] = useState<TabGroupKey>("konteks_masalah")
  const [activeEvidence, setActiveEvidence] = useState<EvidenceItem | null>(null)
  const [activeComponentLabel, setActiveComponentLabel] = useState<string>("")
  const [targetPage, setTargetPage] = useState<number>(1)
  const [editingComponent, setEditingComponent] = useState<ExtractedComponent | null>(null)
  const [isDoiDrawerOpen, setIsDoiDrawerOpen] = useState<boolean>(false)
  const isPaperVerified = Boolean(paper?.source_verification)

  // 4. Layout States: Resizable Split Pane & Resizable Evidence Panel
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(48)
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false)
  const [isPdfExpanded, setIsPdfExpanded] = useState<boolean>(false)
  const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState<boolean>(true)
  const [evidencePanelHeight, setEvidencePanelHeight] = useState<number>(220)

  // Split-Screen horizontal pointer drag handler
  const handleSplitDragStart = (e: React.PointerEvent) => {
    e.preventDefault()
    setIsDraggingSplit(true)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const onPointerMove = (ev: PointerEvent) => {
      const newPercent = (ev.clientX / window.innerWidth) * 100
      setLeftWidthPercent(Math.max(25, Math.min(75, newPercent)))
    }

    const onPointerUp = () => {
      setIsDraggingSplit(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  // Helper to reliably map any component to its tab_group
  const resolveTabGroup = (comp: ExtractedComponent): TabGroupKey => {
    if (
      comp.tab_group === "konteks_masalah" ||
      comp.tab_group === "metode_data" ||
      comp.tab_group === "hasil_gap"
    ) {
      return comp.tab_group
    }

    const key = comp.parameter_key
    if (
      [
        "research_problem",
        "problem_statement",
        "research_objective",
        "objective",
        "research_questions",
        "theoretical_framework",
        "subject_demographics",
      ].includes(key)
    ) {
      return "konteks_masalah"
    }

    if (
      [
        "methodology",
        "dataset_sample",
        "sample_data",
        "variables_concepts",
        "analysis_technique",
        "evaluation_metrics",
      ].includes(key)
    ) {
      return "metode_data"
    }

    return "hasil_gap"
  }

  // Grouped components by Tab
  const groupedComponents = useMemo(() => {
    const groups: Record<TabGroupKey, ExtractedComponent[]> = {
      konteks_masalah: [],
      metode_data: [],
      hasil_gap: [],
    }

    components.forEach((comp) => {
      const g = resolveTabGroup(comp)
      groups[g].push(comp)
    })

    // Sort by sort_order
    groups.konteks_masalah.sort((a, b) => a.sort_order - b.sort_order)
    groups.metode_data.sort((a, b) => a.sort_order - b.sort_order)
    groups.hasil_gap.sort((a, b) => a.sort_order - b.sort_order)

    return groups
  }, [components])

  // Scroll to Evidence block in PdfViewer
  const scrollToEvidence = (comp: ExtractedComponent, ev: EvidenceItem) => {
    setActiveEvidence(ev)
    setActiveComponentLabel(comp.label.id || comp.parameter_key)
    setTargetPage(ev.page_index || 1)
    setIsEvidencePanelOpen(true)
  }

  // Scroll to Evidence by blockId lookup
  const scrollToEvidenceByBlockId = (comp: ExtractedComponent, blockId?: string) => {
    if (!blockId && comp.evidence && comp.evidence.length > 0) {
      scrollToEvidence(comp, comp.evidence[0])
      return
    }

    const matchedEvidence = comp.evidence.find((e) => e.block_id === blockId)
    if (matchedEvidence) {
      scrollToEvidence(comp, matchedEvidence)
      return
    }

    // Lookup in blocks array
    const matchedBlock = blocks.find((b) => b.block_id === blockId)
    if (matchedBlock) {
      const generatedEv: EvidenceItem = {
        block_id: matchedBlock.block_id,
        page_index: matchedBlock.page_number,
        quote: matchedBlock.text.slice(0, 200),
        bbox: matchedBlock.bbox,
      }
      scrollToEvidence(comp, generatedEv)
    } else if (comp.evidence && comp.evidence.length > 0) {
      scrollToEvidence(comp, comp.evidence[0])
    }
  }

  // Handle approving a component
  const handleApproveComponent = async (componentKey: string) => {
    try {
      await updateComponentMutation.mutateAsync({
        componentKey,
        payload: { status: "accepted" },
      })
      toast.success("Komponen ilmiah berhasil disetujui.")
    } catch {
      toast.error("Gagal memperbarui status komponen.")
    }
  }

  if (isLoadingComponents) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Memuat 13 komponen hasil analisis ilmiah...
        </span>
      </div>
    )
  }

  if (isErrorComponents) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-8 text-center space-y-4">
        <AlertCircle className="size-10 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">Gagal Memuat Komponen Paper</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Terjadi kendala saat menghubungkan data komponen hasil ekstraksi dari server.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={`/projects/${projectId}/overview`}>Kembali ke Ruang Riset</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background overflow-hidden font-sans select-none">
      {/* Top Header Bar (No AppShell/Navbar/Sidebar) */}
      <header className="flex h-13 items-center justify-between border-b bg-card px-4 shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8.5 rounded-xl cursor-pointer"
            title="Kembali ke Ruang Riset"
          >
            <Link to={`/projects/${projectId}/overview`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div className="h-4 w-px bg-border shrink-0" />

          <div className="min-w-0">
            <h2 className="text-xs font-bold text-foreground truncate max-w-md sm:max-w-xl flex items-center gap-2">
              <span className="truncate">{paper?.title || "Hasil Ekstraksi Paper"}</span>
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[10px] font-mono font-bold shrink-0">
                {components.length} Komponen
              </span>
            </h2>
          </div>
        </div>

        {/* Top Right: Clean action controls (No model names, no antrean tinjauan button) */}
        <div className="flex items-center gap-2 shrink-0">
          {activeEvidence && !isEvidencePanelOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEvidencePanelOpen(true)}
              className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <BookmarkCheck className="size-3.5" />
              <span>Buka Panel Bukti</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPdfExpanded((prev) => !prev)}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            title={isPdfExpanded ? "Tampilkan parameter ekstraksi" : "Fokus pada dokumen PDF"}
          >
            {isPdfExpanded ? (
              <>
                <PanelLeftOpen className="size-3.5" />
                <span className="hidden sm:inline">Tampilkan Parameter</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="size-3.5" />
                <span className="hidden sm:inline">Fokus PDF</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Split-Screen: Left Parameter Tabs, Resizable Divider, Right PDF Viewer & Resizable Evidence Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: 3 Tabs Workspace */}
        {!isPdfExpanded && (
          <div
            style={{ width: `${leftWidthPercent}%` }}
            className="h-full overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-background/80 shrink-0 select-text"
          >
            {/* Panel Section Header (Clean, Academic) */}
            <div className="pb-2.5 border-b border-border/70 space-y-2">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 tracking-tight">
                  <Sparkles className="size-4 text-primary" />
                  <span>Parameter Hasil Ekstraksi Ilmiah</span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  13 parameter ilmiah diekstraksi dari naskah fisik dan ditautkan ke bukti kutipan dokumen kanonik.
                </p>
              </div>

              {/* Tombol Cek Keabsahan Sumber */}
              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDoiDrawerOpen(true)}
                  className={`gap-2 h-8 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs ${
                    isPaperVerified
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                  }`}
                  title="Buka panel Cek Keabsahan DOI dan reputasi sumber paper"
                >
                  <ShieldCheck className={`size-3.5 ${isPaperVerified ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`} />
                  <span>{isPaperVerified ? "Cek Keabsahan (Terverifikasi)" : "Cek Keabsahan"}</span>
                  {isPaperVerified && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-600/20 text-emerald-800 dark:text-emerald-200">
                      {paper?.source_verification?.trust_score || 96}/100
                    </span>
                  )}
                </Button>

                {!isPaperVerified && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="size-3" />
                    <span>Perlu verifikasi sumber</span>
                  </span>
                )}
              </div>
            </div>

            {/* High-Contrast Navigation Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as TabGroupKey)}
              className="w-full space-y-4"
            >
              {/* 3 Tab Navigation Header with High Contrast Active Styling */}
              <div className="p-1.5 bg-muted/60 dark:bg-slate-900/90 rounded-2xl border border-border/80 shadow-xs">
                <TabsList className="grid grid-cols-3 w-full h-auto p-0 bg-transparent gap-1.5">
                  <TabsTrigger
                    value="konteks_masalah"
                    className="rounded-xl py-2 px-2.5 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25 data-[state=active]:font-bold data-[state=active]:ring-2 data-[state=active]:ring-primary/20 hover:text-foreground hover:bg-muted/40"
                  >
                    <Compass className="size-3.5 shrink-0" />
                    <span className="truncate">Konteks</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-white/20 data-[state=active]:text-primary-foreground text-muted-foreground">
                      {groupedComponents.konteks_masalah.length}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="metode_data"
                    className="rounded-xl py-2 px-2.5 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25 data-[state=active]:font-bold data-[state=active]:ring-2 data-[state=active]:ring-primary/20 hover:text-foreground hover:bg-muted/40"
                  >
                    <Database className="size-3.5 shrink-0" />
                    <span className="truncate">Metode</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-white/20 data-[state=active]:text-primary-foreground text-muted-foreground">
                      {groupedComponents.metode_data.length}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="hasil_gap"
                    className="rounded-xl py-2 px-2.5 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25 data-[state=active]:font-bold data-[state=active]:ring-2 data-[state=active]:ring-primary/20 hover:text-foreground hover:bg-muted/40"
                  >
                    <TrendingUp className="size-3.5 shrink-0" />
                    <span className="truncate">Hasil & Gap</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-white/20 data-[state=active]:text-primary-foreground text-muted-foreground">
                      {groupedComponents.hasil_gap.length}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: Konteks dan Masalah */}
              <TabsContent value="konteks_masalah" className="space-y-4 mt-0">
                <div className="rounded-xl bg-card border border-border/70 p-3 shadow-2xs flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-medium text-foreground">
                      Konteks & Masalah: Fondasi, rumusan masalah, tujuan, dan subjek riset
                    </span>
                  </span>
                  <span className="font-mono font-bold text-primary text-[11px] shrink-0 ml-2">
                    {groupedComponents.konteks_masalah.length} Parameter
                  </span>
                </div>

                {groupedComponents.konteks_masalah.map((comp) => (
                  <ComponentCard
                    key={comp.parameter_key}
                    comp={comp}
                    activeEvidence={activeEvidence}
                    scrollToEvidence={scrollToEvidenceByBlockId}
                    openRevisionModal={(c) => setEditingComponent(c)}
                    approveComponent={handleApproveComponent}
                  />
                ))}
              </TabsContent>

              {/* TAB 2: Metode dan Data */}
              <TabsContent value="metode_data" className="space-y-4 mt-0">
                <div className="rounded-xl bg-card border border-border/70 p-3 shadow-2xs flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-medium text-foreground">
                      Metode & Data: Metodologi, dataset & sampel, variabel, dan metrik evaluasi
                    </span>
                  </span>
                  <span className="font-mono font-bold text-primary text-[11px] shrink-0 ml-2">
                    {groupedComponents.metode_data.length} Parameter
                  </span>
                </div>

                {groupedComponents.metode_data.map((comp) => (
                  <ComponentCard
                    key={comp.parameter_key}
                    comp={comp}
                    activeEvidence={activeEvidence}
                    scrollToEvidence={scrollToEvidenceByBlockId}
                    openRevisionModal={(c) => setEditingComponent(c)}
                    approveComponent={handleApproveComponent}
                  />
                ))}
              </TabsContent>

              {/* TAB 3: Hasil dan Gap */}
              <TabsContent value="hasil_gap" className="space-y-4 mt-0">
                <div className="rounded-xl bg-card border border-border/70 p-3 shadow-2xs flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-medium text-foreground">
                      Hasil & Gap: Temuan utama, kebaruan, klaim sentral, dan keterbatasan riset
                    </span>
                  </span>
                  <span className="font-mono font-bold text-primary text-[11px] shrink-0 ml-2">
                    {groupedComponents.hasil_gap.length} Parameter
                  </span>
                </div>

                {groupedComponents.hasil_gap.map((comp) => (
                  <ComponentCard
                    key={comp.parameter_key}
                    comp={comp}
                    activeEvidence={activeEvidence}
                    scrollToEvidence={scrollToEvidenceByBlockId}
                    openRevisionModal={(c) => setEditingComponent(c)}
                    approveComponent={handleApproveComponent}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Resizable Horizontal Divider (VS Code Split-Pane Style) */}
        {!isPdfExpanded && (
          <div
            onPointerDown={handleSplitDragStart}
            className={`hidden lg:flex w-2 hover:w-2.5 bg-border/60 hover:bg-primary/50 cursor-col-resize transition-all shrink-0 items-center justify-center relative group z-20 ${
              isDraggingSplit ? "bg-primary w-2.5 shadow-md" : ""
            }`}
            title="Tarik ke kiri atau ke kanan untuk mengatur lebar tampilan split"
          >
            <div className="h-10 w-0.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
          </div>
        )}

        {/* Right Panel: Interactive PDF.js Viewer & Vertically Resizable Evidence Panel */}
        <div
          style={{ width: isPdfExpanded ? "100%" : `${100 - leftWidthPercent}%` }}
          className="flex-1 flex flex-col bg-card h-full overflow-hidden shrink-0"
        >
          {projectId && paperId && (
            <PdfViewer
              projectId={projectId}
              paperId={paperId}
              blocks={blocks}
              activeEvidence={activeEvidence}
              targetPage={targetPage}
              onPageChange={(p) => setTargetPage(p)}
              isExpanded={isPdfExpanded}
              onToggleExpand={() => setIsPdfExpanded((prev) => !prev)}
              isEvidencePanelOpen={isEvidencePanelOpen}
              onOpenEvidencePanel={() => setIsEvidencePanelOpen(true)}
            />
          )}

          {/* Vertically Resizable Canonical Evidence Panel */}
          {isEvidencePanelOpen && (
            <EvidencePanel
              activeEvidence={activeEvidence}
              componentLabel={activeComponentLabel}
              onJumpToEvidence={(p) => setTargetPage(p)}
              onClose={() => setIsEvidencePanelOpen(false)}
              height={evidencePanelHeight}
              onHeightChange={setEvidencePanelHeight}
            />
          )}
        </div>
      </div>

      {/* Guided AI Component Revision Modal */}
      {editingComponent && (
        <ComponentAiRevisionModal
          isOpen={Boolean(editingComponent)}
          onClose={() => setEditingComponent(null)}
          projectId={projectId || ""}
          paperId={paperId || ""}
          component={editingComponent}
          paperTitle={paper?.title}
        />
      )}

      {/* Drawer Cek Keabsahan Sumber (Meluncur dari sebelah Kiri Layar) */}
      <DoiVerificationDrawer
        isOpen={isDoiDrawerOpen}
        onClose={() => setIsDoiDrawerOpen(false)}
        projectId={projectId || ""}
        paperId={paperId || ""}
        paperTitle={paper?.title || "Dokumen Paper Ilmiah"}
        initialDoi={paper?.doi || ""}
        existingVerification={paper?.source_verification || null}
      />
    </div>
  )
}

/**
 * Helper to retrieve tailored Lucide icon for each parameter
 */
function getParameterIcon(key: string) {
  switch (key) {
    case "research_problem":
    case "problem_statement":
      return <HelpCircle className="size-5 text-primary" />
    case "research_objective":
    case "objective":
      return <Compass className="size-5 text-primary" />
    case "research_questions":
    case "theoretical_framework":
      return <MessageSquareText className="size-5 text-primary" />
    case "subject_demographics":
      return <Users className="size-5 text-primary" />
    case "methodology":
      return <Cpu className="size-5 text-primary" />
    case "dataset_sample":
    case "sample_data":
      return <Database className="size-5 text-primary" />
    case "variables_concepts":
    case "analysis_technique":
      return <Sliders className="size-5 text-primary" />
    case "evaluation_metrics":
      return <BarChart3 className="size-5 text-primary" />
    case "results_findings":
    case "key_findings":
      return <Award className="size-5 text-primary" />
    case "novelty":
      return <Sparkles className="size-5 text-primary" />
    case "key_claims":
    case "research_gap":
      return <ShieldCheck className="size-5 text-primary" />
    case "limitations":
      return <AlertTriangle className="size-5 text-amber-500" />
    case "future_work":
      return <Rocket className="size-5 text-primary" />
    default:
      return <BookmarkCheck className="size-5 text-primary" />
  }
}

/**
 * Premium ComponentCard component:
 * - Rectangular silhouette with clean rounded-2xl geometry.
 * - Squircle icon badge at top-left.
 * - Bold crisp typography with optimal line spacing.
 * - Inset evidence container with verbatim quote and clickable jump to PDF.
 * - Clean right-aligned action buttons (Revisi & Setujui).
 */
interface ComponentCardProps {
  comp: ExtractedComponent
  activeEvidence: EvidenceItem | null
  scrollToEvidence: (comp: ExtractedComponent, blockId?: string) => void
  openRevisionModal: (comp: ExtractedComponent) => void
  approveComponent: (componentKey: string) => void
}

function ComponentCard({
  comp,
  activeEvidence,
  scrollToEvidence,
  openRevisionModal,
  approveComponent,
}: ComponentCardProps) {
  const confPercent =
    comp.confidence_score !== null ? Math.round(comp.confidence_score * 100) : 85
  const isAccepted = comp.status === "accepted"
  const isEdited = comp.status === "edited"

  const title = comp.label.id || comp.parameter_key
  const primaryEvidence = comp.evidence && comp.evidence.length > 0 ? comp.evidence[0] : null
  const evidenceQuote = primaryEvidence?.quote || ""
  const pageNumber = primaryEvidence?.page_index || 1
  const blockId = primaryEvidence?.block_id || ""

  const isEvidenceActive =
    activeEvidence &&
    ((primaryEvidence?.block_id && activeEvidence.block_id === primaryEvidence.block_id) ||
      (evidenceQuote && activeEvidence.quote === evidenceQuote))

  return (
    <Card className="mb-4 bg-card border border-border/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 rounded-2xl relative overflow-hidden group">
      {/* HEADER: Parameter Title with Squircle Icon & Badges */}
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {getParameterIcon(comp.parameter_key)}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Parameter #{comp.sort_order}
            </span>
            <CardTitle className="text-sm font-bold text-foreground tracking-tight leading-snug">
              {title}
            </CardTitle>
          </div>
        </div>

        {/* Right Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isAccepted ? (
            <Badge
              variant="success"
              className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full shadow-xs"
            >
              Disetujui
            </Badge>
          ) : isEdited ? (
            <Badge
              variant="primary"
              className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full shadow-xs"
            >
              Diedit
            </Badge>
          ) : (
            <Badge
              variant="warning"
              className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full shadow-xs"
            >
              Perlu ditinjau
            </Badge>
          )}
          <Badge
            variant="outline"
            className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-background/60 border-border"
          >
            Akurasi {confPercent}%
          </Badge>
        </div>
      </CardHeader>

      {/* BODY: Academic Indonesian Extracted Text */}
      <CardContent className="px-5 pt-0 pb-3">
        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-normal">
          {comp.value?.text || "Informasi tidak ditemukan dalam dokumen paper ini."}
        </p>
      </CardContent>

      {/* EVIDENCE: Blok Kutipan Kanonik Dokumen Asli */}
      {primaryEvidence ? (
        <div
          className={`mx-5 mb-4 rounded-xl p-3.5 bg-gradient-to-br from-indigo-50/70 via-slate-50/50 to-indigo-50/30 dark:from-slate-950/80 dark:to-slate-900/60 border transition-all duration-200 cursor-pointer group/ev relative overflow-hidden ${
            isEvidenceActive
              ? "border-primary ring-2 ring-primary/30 shadow-sm bg-indigo-50/90 dark:bg-indigo-950/40"
              : "border-indigo-100/90 dark:border-indigo-500/20 hover:border-primary/60 hover:shadow-xs"
          }`}
          onClick={() => scrollToEvidence(comp, blockId)}
          title="Klik untuk melompat ke halaman PDF dan menyorot teks bukti kanonik"
        >
          {/* Top Pill Row */}
          <div className="flex items-center justify-between pb-1.5 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-primary dark:text-indigo-400 uppercase tracking-wider">
              <BookmarkCheck className="size-3.5" />
              <span>Bukti Kutipan Dokumen Asli</span>
            </span>
            <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              HALAMAN {pageNumber}
            </span>
          </div>

          {/* Verbatim Quote Snippet */}
          <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed line-clamp-3 group-hover/ev:text-primary transition-colors">
            &ldquo;{evidenceQuote}&rdquo;
          </p>

          {/* Click Action Footer */}
          <div className="flex items-center justify-between pt-2 text-[10px] text-muted-foreground group-hover/ev:text-primary transition-colors border-t border-indigo-100/60 dark:border-indigo-900/40 mt-1.5">
            <span>Klik untuk menyorot teks fisik dokumen</span>
            <span className="inline-flex items-center gap-1 font-semibold text-primary">
              <span>Buka di PDF</span>
              <ExternalLink className="size-2.5" />
            </span>
          </div>
        </div>
      ) : (
        <div className="mx-5 mb-4 px-4 py-2.5 bg-muted/30 border border-muted/80 rounded-xl text-muted-foreground text-[11px] italic">
          Kutipan bukti teks tidak terdeteksi dalam dokumen ini.
        </div>
      )}

      {/* FOOTER: Action Buttons */}
      <CardFooter className="flex items-center justify-between px-5 pt-3 pb-4 border-t border-border/50 mt-0">
        <div className="text-[11px] text-muted-foreground">
          {comp.reviewer_notes && (
            <span className="italic text-muted-foreground">
              Catatan: {comp.reviewer_notes}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openRevisionModal(comp)}
            className="text-xs h-8 px-3 gap-1.5 rounded-xl border-border cursor-pointer"
          >
            <Edit3 className="size-3 text-muted-foreground" />
            <span>Revisi</span>
          </Button>

          {!isAccepted && (
            <Button
              size="sm"
              onClick={() => approveComponent(comp.parameter_key)}
              className="text-xs h-8 px-3.5 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs rounded-xl font-medium cursor-pointer"
            >
              <Check className="size-3" />
              <span>Setujui</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
