import React from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Lightbulb,
  Layers,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import { FlowNodeData } from "../types/flowTypes"

export type FlowCardNode = Node<FlowNodeData, "flowCard">

const STAGE_CONFIG = {
  topic: {
    icon: Lightbulb,
    badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    label: "Tahap 1: Topik",
  },
  theme: {
    icon: Layers,
    badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    label: "Tahap 2: Tema",
  },
  problem: {
    icon: HelpCircle,
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    label: "Tahap 3: Masalah",
  },
  solution: {
    icon: Sparkles,
    badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    label: "Tahap 4: Solusi",
  },
}

export const FlowNodeCard = React.memo(function FlowNodeCard({
  data,
  selected,
}: NodeProps<FlowCardNode>) {
  const nodeData = data
  const isShared = nodeData.status === "shared"
  const stageCfg = STAGE_CONFIG[nodeData.stage] || STAGE_CONFIG.topic
  const StageIcon = stageCfg.icon

  return (
    <div
      className={`relative w-72 rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 cursor-pointer ${
        isShared
          ? "border-emerald-500/60 hover:border-emerald-500 bg-emerald-500/[0.02]"
          : "border-rose-500/70 hover:border-rose-500 bg-rose-500/[0.03]"
      } ${
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
          : "hover:shadow-md"
      }`}
    >
      {/* Target Handle (Left) - for incoming connection */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!size-3 !border-2 !border-background ${
          isShared ? "!bg-emerald-500" : "!bg-rose-500"
        }`}
      />

      {/* Card Header: Stage Pill & Frequency Badge */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageCfg.badgeBg}`}
        >
          <StageIcon className="size-3" />
          <span>{nodeData.stageLabel || stageCfg.label}</span>
        </span>

        {/* Frequency Status Badge (Hijau vs Merah) */}
        {isShared ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
            title="Diteliti oleh 2 dokumen paper atau lebih (Sering Diteliti)"
          >
            <CheckCircle2 className="size-3 text-emerald-600" />
            <span>{nodeData.paperCount} Paper</span>
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
            title="Baru diteliti oleh 1 paper (Celah Riset Langka / Peluang Kebaruan)"
          >
            <AlertCircle className="size-3 text-rose-600" />
            <span>Celah Langka</span>
          </span>
        )}
      </div>

      {/* Card Body: Title & Description */}
      <div className="pt-2.5 pb-2 space-y-1.5">
        <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
          {nodeData.title}
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
          {nodeData.description}
        </p>
      </div>

      {/* Card Footer: Contributing Papers Count & Status Label */}
      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <FileText className="size-3" />
          <span>
            {nodeData.papers.length} rujukan naskah
          </span>
        </div>

        <span
          className={`font-semibold ${
            isShared ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {isShared ? "Shared Focus" : "Potential Gap"}
        </span>
      </div>

      {/* Source Handle (Right) - for outgoing connection */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!size-3 !border-2 !border-background ${
          isShared ? "!bg-emerald-500" : "!bg-rose-500"
        }`}
      />
    </div>
  )
})
