import { useState, useEffect, useRef, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  AlertCircle,
  Minimize2,
  Maximize2,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TextBlock, EvidenceItem, usePaperPdf } from "../api/projectsApi"
import {
  findMatchingBlocks,
  getScaledBboxCoordinates,
  MatchedEvidenceBlock,
} from "./pdfMatcher"

// Configure PDF.js worker using standard Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

export interface PdfViewerProps {
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
  componentLabel?: string
}

interface PageDimensions {
  rawWidth: number
  rawHeight: number
  scaledWidth: number
  scaledHeight: number
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
  componentLabel,
}: PdfViewerProps) {
  // 1. Server State: Fetch and cache private PDF binary via TanStack Query (10 minutes TTL)
  const {
    data: pdfBinary,
    isLoading: isLoadingPdf,
    isError: isPdfError,
    error: pdfErrorObj,
    refetch: refetchPdf,
  } = usePaperPdf(projectId, paperId)

  // 2. Local Document & Rendering State
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(targetPage)
  const [pageInputValue, setPageInputValue] = useState<string>(String(targetPage))
  const [scale, setScale] = useState<number>(1.15)
  const [docInitError, setDocInitError] = useState<string | null>(null)
  const [pageDimensions, setPageDimensions] = useState<Record<number, PageDimensions>>({})
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]))

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const activeRenderTasks = useRef<Map<number, pdfjsLib.RenderTask>>(new Map())
  const isJumpingProgrammatically = useRef<boolean>(false)

  // 3. Initialize PDF.js Document from TanStack Query's ArrayBuffer
  useEffect(() => {
    if (!pdfBinary) {
      setPdfDoc(null)
      return
    }

    let isCancelled = false
    setDocInitError(null)

    async function initDocument() {
      try {
        // Clone ArrayBuffer to protect the cached copy from worker detachment
        const bufferCopy = pdfBinary!.slice(0)
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(bufferCopy),
          cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
          cMapPacked: true,
        })

        const doc = await loadingTask.promise
        if (isCancelled) return

        setPdfDoc(doc)
        setTotalPages(doc.numPages)

        // Preload dimension metadata for all pages to ensure exact scroll height
        const dims: Record<number, PageDimensions> = {}
        for (let p = 1; p <= doc.numPages; p++) {
          const page = await doc.getPage(p)
          const unscaledViewport = page.getViewport({ scale: 1.0 })
          dims[p] = {
            rawWidth: unscaledViewport.width,
            rawHeight: unscaledViewport.height,
            scaledWidth: unscaledViewport.width * scale,
            scaledHeight: unscaledViewport.height * scale,
          }
        }

        if (isCancelled) return
        setPageDimensions(dims)

        if (onPageChange) {
          onPageChange(1, doc.numPages)
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error("Gagal menginisialisasi dokumen PDF:", err)
          setDocInitError(
            err instanceof Error
              ? err.message
              : "Format dokumen PDF tidak valid atau gagal dibaca oleh engine PDF.js."
          )
        }
      }
    }

    initDocument()

    return () => {
      isCancelled = true
    }
  }, [pdfBinary])

  // Update scaled dimensions whenever scale changes
  useEffect(() => {
    setPageDimensions((prev) => {
      const updated: Record<number, PageDimensions> = {}
      for (const [key, val] of Object.entries(prev)) {
        const pageNum = Number(key)
        updated[pageNum] = {
          ...val,
          scaledWidth: val.rawWidth * scale,
          scaledHeight: val.rawHeight * scale,
        }
      }
      return updated
    })
  }, [scale])

  // 4. Visible Pages Observer (Scroll-Spy & Canvas Virtualization)
  useEffect(() => {
    const container = containerRef.current
    if (!container || !pdfDoc) return

    const observer = new IntersectionObserver(
      (entries) => {
        const newVisible = new Set<number>()
        let maxIntersectionRatio = 0
        let mostVisiblePage = currentPage

        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute("data-page-number"))
          if (entry.isIntersecting) {
            newVisible.add(pageNum)
            if (entry.intersectionRatio > maxIntersectionRatio) {
              maxIntersectionRatio = entry.intersectionRatio
              mostVisiblePage = pageNum
            }
          }
        })

        if (newVisible.size > 0) {
          setVisiblePages((prev) => {
            const merged = new Set(prev)
            newVisible.forEach((p) => {
              merged.add(p)
              // Buffer 1 page above & below
              if (p > 1) merged.add(p - 1)
              if (p < totalPages) merged.add(p + 1)
            })
            return merged
          })
        }

        // Update current page indicator if not in the middle of a programmatic jump
        if (!isJumpingProgrammatically.current && maxIntersectionRatio > 0.35) {
          setCurrentPage(mostVisiblePage)
          setPageInputValue(String(mostVisiblePage))
          if (onPageChange) {
            onPageChange(mostVisiblePage, totalPages)
          }
        }
      },
      {
        root: container,
        rootMargin: "250px 0px 250px 0px",
        threshold: [0.1, 0.4, 0.7],
      }
    )

    pageContainerRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
    }
  }, [pdfDoc, totalPages, currentPage, onPageChange])

  // 5. Render visible page on its respective canvas
  const renderPageCanvas = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return
      const canvas = canvasRefs.current.get(pageNumber)
      if (!canvas) return

      // Cancel existing active render task on this canvas to prevent collision
      const existingTask = activeRenderTasks.current.get(pageNumber)
      if (existingTask) {
        try {
          existingTask.cancel()
        } catch {
          // ignore cancellation exceptions
        }
        activeRenderTasks.current.delete(pageNumber)
      }

      try {
        const page = await pdfDoc.getPage(pageNumber)
        const viewport = page.getViewport({ scale })
        const context = canvas.getContext("2d", { alpha: false })
        if (!context) return

        canvas.width = viewport.width
        canvas.height = viewport.height

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        const renderTask = page.render(renderContext)
        activeRenderTasks.current.set(pageNumber, renderTask)

        await renderTask.promise
        activeRenderTasks.current.delete(pageNumber)
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          err.name === "RenderingCancelledException"
        ) {
          // Normal expected cancellation due to quick zoom or scroll
          return
        }
        console.error(`Gagal merender halaman canvas ${pageNumber}:`, err)
      }
    },
    [pdfDoc, scale]
  )

  // Re-render canvases for all visible pages when doc, scale, or visiblePages change
  useEffect(() => {
    if (!pdfDoc) return
    visiblePages.forEach((pageNum) => {
      renderPageCanvas(pageNum)
    })
  }, [pdfDoc, scale, visiblePages, renderPageCanvas])

  // 6. Programmatic Page Jumping & Evidence Auto-Scroll
  const jumpToPage = useCallback(
    (pageNum: number) => {
      const clampedPage = Math.max(1, Math.min(pageNum, totalPages || 1))
      setCurrentPage(clampedPage)
      setPageInputValue(String(clampedPage))

      const targetEl = pageContainerRefs.current.get(clampedPage)
      if (targetEl && containerRef.current) {
        isJumpingProgrammatically.current = true
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" })

        // Re-enable scroll spy after scroll animation finishes
        setTimeout(() => {
          isJumpingProgrammatically.current = false
        }, 700)
      }

      if (onPageChange && totalPages) {
        onPageChange(clampedPage, totalPages)
      }
    },
    [totalPages, onPageChange]
  )

  // Jump when targetPage prop updates from parent
  useEffect(() => {
    if (targetPage && targetPage !== currentPage) {
      jumpToPage(targetPage)
    }
  }, [targetPage])

  // Precise coordinate scroll when active evidence changes
  useEffect(() => {
    if (!activeEvidence) return

    const evPage = activeEvidence.page_index || 1
    setCurrentPage(evPage)
    setPageInputValue(String(evPage))

    const matchedBlocks = findMatchingBlocks(activeEvidence, blocks, evPage)
    const targetEl = pageContainerRefs.current.get(evPage)

    if (targetEl && containerRef.current) {
      isJumpingProgrammatically.current = true

      if (matchedBlocks.length > 0) {
        const topCoord = matchedBlocks[0].bbox[1] * scale
        const targetScrollTop = targetEl.offsetTop + topCoord - 120
        containerRef.current.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        })
      } else {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" })
      }

      setTimeout(() => {
        isJumpingProgrammatically.current = false
      }, 700)
    }
  }, [activeEvidence, scale, blocks])

  // 7. Page Input Form Handler
  const handlePageInputSubmit = () => {
    const parsed = parseInt(pageInputValue, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      jumpToPage(parsed)
    } else {
      setPageInputValue(String(currentPage))
    }
  }

  // 8. Zoom Controls
  const handleZoomIn = () => setScale((s) => Math.min(Number((s + 0.15).toFixed(2)), 3.0))
  const handleZoomOut = () => setScale((s) => Math.max(Number((s - 0.15).toFixed(2)), 0.5))
  const handleResetZoom = () => setScale(1.15)

  const handleFitWidth = () => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth - 48 // margin & padding
    const p1 = pageDimensions[1]
    if (p1 && p1.rawWidth > 0) {
      const targetScale = Math.max(0.6, Math.min(2.5, containerWidth / p1.rawWidth))
      setScale(Number(targetScale.toFixed(2)))
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER: Loading & Error States
  // ---------------------------------------------------------------------------
  if (isLoadingPdf) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8 space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-foreground">
            Mengambil Dokumen PDF Privat
          </p>
          <p className="text-[11px] text-muted-foreground">
            Mengunduh biner PDF dan mengaktifkan memori cache 10 menit...
          </p>
        </div>
      </div>
    )
  }

  const combinedError =
    docInitError ||
    (isPdfError
      ? pdfErrorObj instanceof Error
        ? pdfErrorObj.message
        : "Terjadi gangguan koneksi saat mengunduh dokumen PDF."
      : null)

  if (combinedError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-destructive/5 p-8 text-center space-y-3">
        <AlertCircle className="size-9 text-destructive" />
        <h4 className="text-sm font-semibold text-foreground">Gagal Menampilkan PDF</h4>
        <p className="text-xs text-muted-foreground max-w-sm">{combinedError}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPdf()}
          className="text-xs gap-1.5 cursor-pointer"
        >
          <RotateCw className="size-3.5" />
          <span>Coba Muat Ulang</span>
        </Button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER: Active PDF Viewer
  // ---------------------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col border-b bg-card overflow-hidden">
      {/* Viewer Toolbar */}
      <div className="flex h-11 items-center justify-between border-b px-4 bg-muted/30 shrink-0">
        {/* Left Section: Page Indicator & Page Jumper Input */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-background/80 border rounded-lg px-1.5 py-0.5 shadow-2xs">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => jumpToPage(currentPage - 1)}
              className="size-6 rounded-md text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <div className="flex items-center gap-1 text-xs px-1 font-mono">
              <span className="text-[11px] text-muted-foreground font-sans">Hal.</span>
              <input
                type="text"
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePageInputSubmit()
                }}
                onBlur={handlePageInputSubmit}
                className="h-6 w-9 text-center rounded border border-border/80 bg-background text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                title="Ketik nomor halaman dan tekan Enter untuk melompat"
              />
              <span className="text-muted-foreground text-[11px]">/ {totalPages || 1}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => jumpToPage(currentPage + 1)}
              className="size-6 rounded-md text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          {activeEvidence && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="size-3" />
              <span>Bukti Halaman {activeEvidence.page_index}</span>
            </span>
          )}
        </div>

        {/* Right Section: Evidence Button, Zoom Controls, Fit Width, Expand */}
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
            className="text-xs font-mono font-semibold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Klik untuk Mereset Skala ke 115%"
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

          {/* Fit to Width Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitWidth}
            className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Sesuaikan Lebar Dokumen ke Layar (Fit Width)"
          >
            <Maximize className="size-3.5" />
          </Button>

          {/* Full Width / Expand Toggle */}
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer ml-1"
              title={
                isExpanded
                  ? "Kembalikan Tampilan Split Layar"
                  : "Perbesar Tampilan PDF Sepenuh Layar"
              }
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
          const isTargetPage = activeEvidence?.page_index === pageNum

          // Calculate matching evidence blocks for this page using multi-tier matcher
          const matchedBlocks: MatchedEvidenceBlock[] = isTargetPage
            ? findMatchingBlocks(activeEvidence, blocks, pageNum)
            : []

          const isPageVisible = visiblePages.has(pageNum)

          return (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageContainerRefs.current.set(pageNum, el)
                else pageContainerRefs.current.delete(pageNum)
              }}
              data-page-number={pageNum}
              style={{
                width: dim ? `${dim.scaledWidth}px` : "700px",
                minHeight: dim ? `${dim.scaledHeight}px` : "900px",
              }}
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
                className={`block transition-opacity duration-200 ${
                  isPageVisible ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Placeholder loader for non-rendered pages */}
              {!isPageVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50">
                  <span className="text-[11px] font-mono text-muted-foreground/60">
                    Halaman {pageNum}
                  </span>
                </div>
              )}

              {/* Absolute Overlay Layer for Evidence Highlighting */}
              {dim && matchedBlocks.length > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: `${dim.scaledWidth}px`, height: `${dim.scaledHeight}px` }}
                >
                  {matchedBlocks.map((mb, mIdx) => {
                    const coords = getScaledBboxCoordinates(mb.bbox, scale)

                    return (
                      <div
                        key={`${mb.block_id}-${mIdx}`}
                        style={{
                          left: `${coords.left}px`,
                          top: `${coords.top}px`,
                          width: `${coords.width}px`,
                          height: `${coords.height}px`,
                        }}
                        className="absolute rounded-sm bg-primary/25 border-2 border-primary shadow-sm pointer-events-auto transition-all animate-pulse"
                        title={`Bukti Kanonik (${mb.matchType}): ${mb.block_id}`}
                      >
                        {mIdx === 0 && (
                          <div className="absolute -top-6 left-0 rounded-md bg-primary px-2 py-0.5 text-[9px] font-bold text-white shadow-md flex items-center gap-1 whitespace-nowrap z-30">
                            <BookmarkCheck className="size-3" />
                            <span>
                              {componentLabel
                                ? `Bukti: ${componentLabel}`
                                : "Bukti Teks Teridentifikasi"}
                            </span>
                          </div>
                        )}
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
