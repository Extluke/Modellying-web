/**
 * Presentation metadata of the knowledge graph: labels (Bahasa Indonesia), icons and colors per
 * node kind, saturation zone and relation. Kept apart from the data builder so the builder stays
 * free of UI imports.
 */

import {
  CheckCircle2,
  Compass,
  Database,
  FileText,
  Flame,
  FlaskConical,
  Lightbulb,
  type LucideIcon,
} from "lucide-react"
import type {
  GapTypology,
  GraphNodeKind,
  GraphRelation,
  GraphZoneKey,
} from "../types/knowledgeGraphTypes"

export interface KindMeta {
  label: string
  icon: LucideIcon
  /** Tailwind gradient classes of the node card (mobile app: gradient card per kind). */
  gradient: string
  /** Colored glow under the card. */
  glow: string
  /** CSS color used by the minimap and the edge gradients. */
  color: string
}

export const KIND_META: Record<GraphNodeKind, KindMeta> = {
  paper: {
    label: "Paper",
    icon: FileText,
    gradient: "from-foreground to-foreground/75",
    glow: "shadow-foreground/25",
    color: "hsl(var(--foreground))",
  },
  research_area: {
    label: "Bidang Riset",
    icon: Compass,
    gradient: "from-status-blue to-primary",
    glow: "shadow-status-blue/30",
    color: "hsl(var(--status-blue))",
  },
  concept: {
    label: "Konsep",
    icon: Lightbulb,
    gradient: "from-primary to-primary-hover",
    glow: "shadow-primary/30",
    color: "hsl(var(--primary))",
  },
  method: {
    label: "Metode",
    icon: FlaskConical,
    gradient: "from-graph-method to-graph-method-dark",
    glow: "shadow-graph-method/30",
    color: "hsl(var(--graph-method))",
  },
  object: {
    label: "Dataset / Objek",
    icon: Database,
    gradient: "from-graph-object to-graph-object-dark",
    glow: "shadow-graph-object/30",
    color: "hsl(var(--graph-object))",
  },
  result: {
    label: "Hasil",
    icon: CheckCircle2,
    gradient: "from-status-green to-status-green/75",
    glow: "shadow-status-green/30",
    color: "hsl(var(--status-green))",
  },
  gap: {
    label: "Celah Riset",
    icon: Flame,
    gradient: "from-canvas-gap to-status-red",
    glow: "shadow-canvas-gap/40",
    color: "hsl(var(--canvas-gap-fire))",
  },
}

/** Order used by the legend and the type filter. */
export const KIND_ORDER: GraphNodeKind[] = [
  "paper",
  "research_area",
  "concept",
  "object",
  "method",
  "result",
  "gap",
]

export interface ZoneMeta {
  title: string
  hint: string
  /** Chip classes (background, text, border). */
  chip: string
  /** Soft tint of the zone band drawn behind the nodes. */
  band: string
  /** Solid dot / swatch color class. */
  dot: string
}

export const ZONE_META: Record<GraphZoneKey, ZoneMeta> = {
  none: {
    title: "Celah Riset",
    hint: "Belum diteliti secara tuntas. Titik awal untuk menemukan kebaruan.",
    chip: "bg-canvas-gap/10 text-canvas-gap border-canvas-gap/30",
    band: "bg-canvas-gap/[0.06] border-canvas-gap/25",
    dot: "bg-canvas-gap",
  },
  low: {
    title: "Saturasi Rendah",
    hint: "Dibahas oleh 20% paper atau kurang. Peluang kebaruan.",
    chip: "bg-primary/5 text-primary border-primary/20",
    band: "bg-primary/[0.03] border-primary/15",
    dot: "bg-primary/35",
  },
  medium: {
    title: "Saturasi Sedang",
    hint: "Dibahas oleh 21% sampai 50% paper. Topik yang sedang berkembang.",
    chip: "bg-primary/10 text-primary border-primary/25",
    band: "bg-primary/[0.06] border-primary/20",
    dot: "bg-primary/65",
  },
  high: {
    title: "Saturasi Tinggi",
    hint: "Dibahas oleh lebih dari 50% paper. Landasan yang sudah mapan.",
    chip: "bg-primary/15 text-primary border-primary/30",
    band: "bg-primary/[0.1] border-primary/25",
    dot: "bg-primary",
  },
  source: {
    title: "Sumber Paper",
    hint: "Paper dalam proyek ini. Setiap simpul terhubung ke paper yang melaporkannya.",
    chip: "bg-foreground/5 text-foreground border-foreground/15",
    band: "bg-foreground/[0.04] border-foreground/15",
    dot: "bg-foreground",
  },
}

export const GAP_TYPOLOGY_LABEL: Record<GapTypology, string> = {
  methodological: "Metodologis",
  dataset: "Dataset",
  population: "Populasi / Sampel",
  empirical: "Empiris",
  theoretical: "Teoretis",
  unexplored_concept: "Konsep belum dieksplorasi",
}

/** Verb phrase of a relation, read from the source node to the target node. */
export function relationLabel(relation: GraphRelation, targetKind: GraphNodeKind): string {
  switch (relation) {
    case "studies":
      return targetKind === "research_area" ? "membahas" : "meneliti"
    case "uses":
      return targetKind === "object" ? "memakai data" : "menggunakan"
    case "produces":
      return "menghasilkan"
    case "reveals":
      return "mengungkap"
    case "relates_to":
      return "serupa dengan"
  }
}
