import { useState, useEffect, useRef, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  AlertCircle,
  Minimize2,
  Maximize2,
  BookmarkCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TextBlock, EvidenceItem } from "../api/projectsApi"

// Configure PDF.js worker using standard Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

interface PdfViewerProps {
  projectId: string
  paperId: string
  blocks?: TextBlock[]
  activeEvidence?: EvidenceItem | null
  targetPage?: number
  onPageChange?: (page: number, total: number) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  isEvidencePanelOpen?: boolean
  onOpenEvidencePanel?: () => void
}

interface PageRenderInfo {
  pageNumber: number
  width: number
  height: number
}

export function PdfViewer({
  projectId,
  paperId,
  blocks = [],
  activeEvidence,
  targetPage = 1,
  onPageChange,
  isExpanded = false,
  onToggleExpand,
  isEvidencePanelOpen = false,
  onOpenEvidencePanel,
}: PdfViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(targetPage)
  const [scale, setScale] = useState<number>(1.15)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pageDimensions, setPageDimensions] = useState<Record<number, PageRenderInfo>>({})

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // 1. Fetch PDF binary stream with JWT authorization
  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    setLoadError(null)

    async function loadPdf() {
      try {
        const token = localStorage.getItem("modellyng_token")
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"

        const response = await fetch(
          `${API_BASE_URL}/projects/${projectId}/papers/${paperId}/pdf`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )

        if (!response.ok) {
          throw new Error(
            `Gagal memuat dokumen PDF (${response.status}: ${response.statusText})`
          )
        }

        const arrayBuffer = await response.arrayBuffer()
        if (isCancelled) return

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const doc = await loadingTask.promise
        if (isCancelled) return

        setPdfDoc(doc)
        setTotalPages(doc.numPages)
        if (onPageChange) {
          onPageChange(1, doc.numPages)
        }
        setIsLoading(false)
      } catch (err: unknown) {
        if (!isCancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Terjadi gangguan saat memuat file PDF."
          )
          setIsLoading(false)
        }
      }
    }

    loadPdf()
    return () => {
      isCancelled = true
    }
  }, [projectId, paperId])

  // 2. Render each visible page on its respective canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return
      const canvas = canvasRefs.current.get(pageNumber)
      if (!canvas) return

      try {
        const page = await pdfDoc.getPage(pageNumber)
        const viewport = page.getViewport({ scale })
        const context = canvas.getContext("2d")
        if (!context) return

        canvas.width = viewport.width
        canvas.height = viewport.height

        setPageDimensions((prev) => ({
          ...prev,
          [pageNumber]: {
            pageNumber,
            width: viewport.width,
            height: viewport.height,
          },
        }))

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }
        await page.render(renderContext).promise
      } catch (err) {
        console.error(`Error rendering page ${pageNumber}:`, err)
      }
    },
    [pdfDoc, scale]
  )

  // Re-render pages when doc or scale changes
  useEffect(() => {
    if (!pdfDoc) return
    for (let p = 1; p <= pdfDoc.numPages; p++) {
      renderPage(p)
    }
  }, [pdfDoc, scale, renderPage])

  // 3. Scroll to target page when clicked from Evidence Panel
  useEffect(() => {
    if (!targetPage) return
    setCurrentPage(targetPage)
    const targetEl = pageContainerRefs.current.get(targetPage)
    if (targetEl && containerRef.current) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [targetPage, activeEvidence])

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 2.2))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.7))
  const handleResetZoom = () => setScale(1.15)

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8 space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Memuat halaman PDF via pdfjs-dist...
        </span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-destructive/5 p-8 text-center space-y-3">
        <AlertCircle className="size-9 text-destructive" />
        <h4 className="text-sm font-semibold text-foreground">Gagal Menampilkan PDF</h4>
        <p className="text-xs text-muted-foreground max-w-sm">{loadError}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-xs gap-1.5"
        >
          <RotateCw className="size-3.5" />
          <span>Muat Ulang</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col border-b bg-card overflow-hidden">
      {/* Viewer Toolbar */}
      <div className="flex h-11 items-center justify-between border-b px-4 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-primary" />
            <span>
              Halaman {currentPage} / {totalPages || 1}
            </span>
          </span>
          {activeEvidence && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <span>Bukti Halaman {activeEvidence.page_index}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Reopen Evidence Panel if closed */}
          {activeEvidence && !isEvidencePanelOpen && onOpenEvidencePanel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenEvidencePanel}
              className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 mr-1 cursor-pointer"
            >
              <BookmarkCheck className="size-3.5" />
              <span>Buka Kutipan Bukti</span>
            </Button>
          )}

          {/* Zoom Out Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Perkecil Ukuran Dokumen (Zoom Out)"
          >
            <ZoomOut className="size-3.5" />
          </Button>

          {/* Reset Zoom Scale Pill */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Klik untuk Mereset Skala ke 100%"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Perbesar Ukuran Dokumen (Zoom In)"
          >
            <ZoomIn className="size-3.5" />
          </Button>

          {/* Full Width / Expand Toggle */}
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer ml-1"
              title={isExpanded ? "Kembalikan Tampilan Split Layar" : "Perbesar Tampilan PDF Sepenuh Layar"}
            >
              {isExpanded ? (
                <Minimize2 className="size-3.5 text-primary" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* PDF Viewport Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 bg-slate-100/70 dark:bg-slate-900/40 space-y-6 flex flex-col items-center"
      >
        {Array.from({ length: totalPages }, (_, idx) => {
          const pageNum = idx + 1
          const dim = pageDimensions[pageNum]
          const pageBlocks = blocks.filter((b) => b.page_number === pageNum)
          const isTargetPage = activeEvidence?.page_index === pageNum

          return (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageContainerRefs.current.set(pageNum, el)
                else pageContainerRefs.current.delete(pageNum)
              }}
              data-page-number={pageNum}
              className={`relative bg-white shadow-md rounded border transition-all ${
                isTargetPage
                  ? "ring-2 ring-primary ring-offset-2 shadow-lg"
                  : "hover:shadow-lg"
              }`}
            >
              {/* HTML5 Canvas rendered by pdfjs-dist */}
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el)
                  else canvasRefs.current.delete(pageNum)
                }}
                className="block"
              />

              {/* Absolute Overlay Layer for Bounding Boxes & Evidence Highlighting */}
              {dim && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: dim.width, height: dim.height }}
                >
                  {/* Highlight all matched blocks on this page */}
                  {pageBlocks.map((blk) => {
                    // Coordinates in PyMuPDF: [x0, y0, x1, y1] in PDF points (standard 72 dpi)
                    // Scaled to match rendered canvas
                    const [x0, y0, x1, y1] = blk.bbox
                    const left = x0 * scale
                    const top = y0 * scale
                    const width = (x1 - x0) * scale
                    const height = (y1 - y0) * scale

                    const isBlockActive =
                      activeEvidence &&
                      (activeEvidence.block_id === blk.block_id ||
                        activeEvidence.quote.toLowerCase().includes(blk.text.slice(0, 30).toLowerCase()))

                    if (!isBlockActive) return null

                    return (
                      <div
                        key={blk.block_id}
                        style={{
                          left: `${left}px`,
                          top: `${top}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                        }}
                        className="absolute rounded bg-primary/25 border-2 border-primary shadow-sm pointer-events-auto transition-all animate-pulse"
                        title={`Bukti Kanonik: ${blk.block_id}`}
                      >
                        <span className="absolute -top-5 left-0 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                          Bukti Ditemukan
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
