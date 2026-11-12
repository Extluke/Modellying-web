import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, Loader2, Quote, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/store/useToastStore"
import type {
  GraphEvidence,
  KnowledgeGraphMap,
  KnowledgeGraphNode,
} from "../types/knowledgeGraphTypes"
import { zoneOf } from "../utils/graphLayout"
import { GAP_TYPOLOGY_LABEL, KIND_META, ZONE_META, relationLabel } from "../utils/graphMeta"
import { ZoneChip } from "./ZoneChip"

interface NodeDetailPanelProps {
  graph: KnowledgeGraphMap
  node: KnowledgeGraphNode
  onClose: () => void
  onSelectNode: (id: string) => void
  onOpenEvidence: (evidence: GraphEvidence) => void
  onSynthesize: () => void
  isSynthesizing: boolean
}

interface Neighbour {
  node: KnowledgeGraphNode
  direction: "out" | "in"
  phrase: string
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-foreground">{children}</h3>
}

/**
 * Detail of the selected node. Mirrors the mobile bottom sheet ("DETAIL <JENIS>", title, description)
 * and adds the evidence chain, the connected nodes and, for research gaps, the AI synthesis action.
 */
export function NodeDetailPanel({
  graph,
  node,
  onClose,
  onSelectNode,
  onOpenEvidence,
  onSynthesize,
  isSynthesizing,
}: NodeDetailPanelProps) {
  const [copied, setCopied] = useState(false)
  const meta = KIND_META[node.kind]
  const KindIcon = meta.icon
  const zoneMeta = ZONE_META[zoneOf(node)]

  const nodeById = useMemo(() => new Map(graph.nodes.map((item) => [item.id, item])), [graph.nodes])

  const papers = useMemo(
    () =>
      node.kind === "paper"
        ? []
        : node.paperIds.flatMap((id) => {
            const paper = nodeById.get(`paper:${id}`)
            return paper ? [paper] : []
          }),
    [node, nodeById]
  )

  const neighbours = useMemo<Neighbour[]>(() => {
    const items: Neighbour[] = []
    for (const edge of graph.edges) {
      if (edge.source === node.id) {
        const other = nodeById.get(edge.target)
        if (other) items.push({ node: other, direction: "out", phrase: relationLabel(edge.relation, other.kind) })
      } else if (edge.target === node.id) {
        const other = nodeById.get(edge.source)
        if (other) items.push({ node: other, direction: "in", phrase: relationLabel(edge.relation, node.kind) })
      }
    }
    return items
  }, [graph.edges, node, nodeById])

  const coverage =
    node.kind === "paper" || node.kind === "gap"
      ? null
      : Math.round((node.paperIds.length / Math.max(graph.totalPapers, 1)) * 100)

  const handleCopy = async () => {
    const lines = [
      `${meta.label.toUpperCase()}: ${node.label}`,
      node.kind !== "paper" ? `${zoneMeta.title} (${node.paperIds.length} dari ${graph.totalPapers} paper)` : "",
      "",
      node.detail,
      ...(node.evidence.length > 0
        ? ["", "BUKTI:", ...node.evidence.map((item) => `- "${item.quote}" (${item.paperTitle}, Hal. ${item.pageNumber ?? "-"})`)]
        : []),
    ]
    try {
      await navigator.clipboard.writeText(lines.filter((line, index) => line !== "" || index > 0).join("\n"))
      setCopied(true)
      toast.success("Ringkasan simpul berhasil disalin ke papan klip.")
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Ringkasan simpul belum dapat disalin. Coba lagi.")
    }
  }

  return (
    <aside
      aria-label={`Detail ${meta.label}`}
      className={cn(
        "absolute z-20 flex flex-col overflow-hidden border-border bg-card shadow-floating animate-in duration-200",
        "inset-x-0 bottom-0 h-[62%] rounded-t-card border-t slide-in-from-bottom",
        "md:inset-x-auto md:inset-y-0 md:right-0 md:h-auto md:w-[380px] md:rounded-none md:border-l md:border-t-0 md:slide-in-from-right"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-button bg-gradient-to-br text-white", meta.gradient)}>
            <KindIcon className="size-4" />
          </div>
          <span className="truncate text-xs font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
            Detail {meta.label}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Tutup" aria-label="Tutup detail">
          <X />
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          <h2 className="break-words text-base font-bold leading-snug text-foreground">{node.label}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {node.kind !== "paper" && <ZoneChip zone={zoneOf(node)} />}
            {coverage !== null && (
              <Badge variant="muted">
                {node.paperIds.length} dari {graph.totalPapers} paper ({coverage}%)
              </Badge>
            )}
            {node.gapTypology && <Badge variant="review">{GAP_TYPOLOGY_LABEL[node.gapTypology]}</Badge>}
            {node.confidence !== undefined && (
              <Badge variant="primary">Keyakinan {Math.round(node.confidence * 100)}%</Badge>
            )}
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <SectionTitle>{node.kind === "paper" ? "Informasi paper" : "Uraian"}</SectionTitle>
          <p className="whitespace-pre-line break-words rounded-button border border-border bg-background p-3 text-xs leading-relaxed text-foreground">
            {node.detail}
          </p>
        </section>

        {papers.length > 0 && (
          <section className="flex flex-col gap-2">
            <SectionTitle>Dilaporkan oleh ({papers.length} paper)</SectionTitle>
            <ul className="flex flex-col gap-1.5">
              {papers.map((paper) => (
                <li key={paper.id}>
                  <button
                    type="button"
                    onClick={() => onSelectNode(paper.id)}
                    className="w-full rounded-button border border-border bg-card px-3 py-2 text-left text-xs font-medium leading-snug text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft"
                  >
                    <span className="line-clamp-2 break-words">{paper.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {node.evidence.length > 0 && (
          <section className="flex flex-col gap-2">
            <SectionTitle>Bukti kutipan ({node.evidence.length})</SectionTitle>
            <ul className="flex flex-col gap-2">
              {node.evidence.map((item, index) => (
                <li
                  key={`${item.paperId}-${item.blockId ?? index}-${index}`}
                  className="flex flex-col gap-2 rounded-button border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-start gap-2">
                    <Quote className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <p className="break-words text-xs italic leading-relaxed text-foreground">&ldquo;{item.quote}&rdquo;</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[11px] text-muted-foreground" title={item.paperTitle}>
                      {item.section ? `${item.section} \u00b7 ` : ""}Hal. {item.pageNumber ?? "-"} &middot; {item.paperTitle}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEvidence(item)}
                      className="h-8 shrink-0 gap-1.5 px-2.5 text-primary hover:text-primary"
                    >
                      <BookOpen />
                      <span>Lihat di PDF</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {neighbours.length > 0 && (
          <section className="flex flex-col gap-2">
            <SectionTitle>Terhubung dengan ({neighbours.length})</SectionTitle>
            <ul className="flex flex-col gap-1.5">
              {neighbours.map(({ node: other, direction, phrase }) => {
                const otherMeta = KIND_META[other.kind]
                const OtherIcon = otherMeta.icon
                const Arrow = direction === "out" ? ArrowRight : ArrowLeft
                return (
                  <li key={`${direction}-${other.id}-${phrase}`}>
                    <button
                      type="button"
                      onClick={() => onSelectNode(other.id)}
                      className="flex w-full items-start gap-2.5 rounded-button border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft"
                    >
                      <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white", otherMeta.gradient)}>
                        <OtherIcon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 break-words text-xs font-medium leading-snug text-foreground">{other.label}</span>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Arrow className="size-3" />
                          {otherMeta.label} &middot; {phrase}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-border px-4 py-3">
        {node.kind === "gap" && (
          <>
            <Button onClick={onSynthesize} disabled={isSynthesizing} className="w-full gap-2">
              {isSynthesizing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span>{isSynthesizing ? "Menyusun rumusan..." : "Buat Rumusan Masalah (AI)"}</span>
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Hasil AI berupa draf. Tinjau kembali sebelum dipakai pada proposal Anda.
            </p>
          </>
        )}
        <Button variant="outline" onClick={handleCopy} className="w-full gap-2">
          {copied ? <Check className="text-status-green" /> : <Copy />}
          <span>{copied ? "Tersalin" : "Salin Ringkasan"}</span>
        </Button>
      </div>
    </aside>
  )
}
