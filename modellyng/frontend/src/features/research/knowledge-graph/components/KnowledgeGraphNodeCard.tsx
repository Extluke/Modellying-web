import React, { useMemo } from "react"
import { Handle, Position, NodeProps } from "@xyflow/react"
import {
  Lightbulb,
  Layers,
  Cpu,
  FileText,
  Sparkles,
  Flame,
  FileCheck2,
} from "lucide-react"
import { KnowledgeGraphNodeData } from "../types/knowledgeGraphTypes"
import { useKnowledgeGraphStore } from "../store/useKnowledgeGraphStore"

export const KnowledgeGraphNodeCard = React.memo(function KnowledgeGraphNodeCard({
  data,
  selected,
}: NodeProps & { data: KnowledgeGraphNodeData }) {
  const node = data
  const { setSelectedNode, selectedZoneFilter, selectedTypeFilter } =
    useKnowledgeGraphStore()

  // Periksa apakah simpul sedang redup karena filter zona / tipe
  const isDimmed = useMemo(() => {
    if (selectedZoneFilter !== "all" && node.saturationZone !== selectedZoneFilter) {
      return true
    }
    if (selectedTypeFilter !== "all" && node.nodeType !== selectedTypeFilter) {
      return true
    }
    return false
  }, [selectedZoneFilter, selectedTypeFilter, node.saturationZone, node.nodeType])

  // Konfigurasi visual berdasarkan zona saturasi
  const zoneConfig = useMemo(() => {
    switch (node.saturationZone) {
      case "low":
        return {
          badgeText: "Saturasi Rendah (Novelty)",
          badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
          cardBorder: "border-rose-500/50 hover:border-rose-500 bg-rose-500/[0.03]",
          dotColor: "bg-rose-500",
          glowShadow: "shadow-rose-500/10",
        }
      case "medium":
        return {
          badgeText: "Saturasi Sedang (Transisi)",
          badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          cardBorder: "border-amber-500/50 hover:border-amber-500 bg-amber-500/[0.03]",
          dotColor: "bg-amber-500",
          glowShadow: "shadow-amber-500/10",
        }
      case "high":
        return {
          badgeText: "Saturasi Tinggi (Mapan)",
          badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          cardBorder: "border-emerald-500/50 hover:border-emerald-500 bg-emerald-500/[0.03]",
          dotColor: "bg-emerald-500",
          glowShadow: "shadow-emerald-500/10",
        }
    }
  }, [node.saturationZone])

  // Ikon & label berdasarkan jenis simpul
  const typeConfig = useMemo(() => {
    switch (node.nodeType) {
      case "concept":
        return { icon: Lightbulb, label: "Konsep Ilmiah" }
      case "variable":
        return { icon: Layers, label: "Variabel Riset" }
      case "method":
        return { icon: Cpu, label: "Metodologi" }
      case "dataset":
        return { icon: FileText, label: "Dataset / Objek" }
      case "research_gap":
        return { icon: Flame, label: "Celah Riset (Gap)" }
      default:
        return { icon: Sparkles, label: "Konsep" }
    }
  }, [node.nodeType])

  const Icon = typeConfig.icon
  const isGap = node.nodeType === "research_gap"

  return (
    <div
      onClick={() => setSelectedNode(node)}
      className={`w-72 rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 cursor-pointer text-left select-none ${
        zoneConfig.cardBorder
      } ${zoneConfig.glowShadow} ${
        selected ? "ring-2 ring-primary border-primary shadow-md" : ""
      } ${isDimmed ? "opacity-30 grayscale-[50%]" : "opacity-100"} ${
        isGap ? "ring-1 ring-rose-500/30" : ""
      }`}
    >
      {/* Handles untuk Relasi Kurva */}
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2.5 !bg-primary !border-2 !border-background"
      />

      {/* Header: Ikon Tipe & Lencana Zona Saturasi */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isGap
                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Icon className="size-3.5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {typeConfig.label}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${zoneConfig.badgeClass}`}
        >
          <span className={`size-1.5 rounded-full ${zoneConfig.dotColor}`} />
          <span>{node.saturationPercentage}%</span>
        </span>
      </div>

      {/* Title / Concept Label */}
      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2 mb-1.5">
        {node.label}
      </h4>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
        {node.description}
      </p>

      {/* Footer Strip: Paper Count & Action Hint */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileCheck2 className="size-3 text-primary" />
          <span>
            {node.frequencyCount} dari {node.totalPapers} Paper
          </span>
        </div>

        <span className="text-primary font-semibold hover:underline">
          Lihat Bukti &rarr;
        </span>
      </div>
    </div>
  )
})
