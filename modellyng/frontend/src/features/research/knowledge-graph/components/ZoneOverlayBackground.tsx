import { Flame, Compass, BookOpenCheck } from "lucide-react"

/**
 * Komponen overlay latar belakang visual yang menandai 3 zona saturasi konsep spasial
 * di atas kanvas 2D tak terbatas React Flow.
 */
export function ZoneOverlayBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex min-w-[2000px] h-full">
      {/* 1. ZONA SATURASI RENDAH (Kiri: X in [40, 640 px]) */}
      <div
        className="w-[620px] shrink-0 border-r-2 border-dashed border-rose-500/25 bg-rose-500/[0.015] p-6 flex flex-col justify-between"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-2xs">
            <Flame className="size-3.5 text-rose-600 dark:text-rose-400" />
            <span>ZONA NOVELTY &bull; SATURASI RENDAH (&le; 20%)</span>
          </div>
          <p className="text-[11px] text-muted-foreground/80 max-w-sm leading-relaxed pl-1">
            Konsep &amp; masalah ilmiah yang jarang dijamah dalam literatur. Titik fokus utama untuk menghasilkan kebaruan riset tesis.
          </p>
        </div>

        <div className="text-[10px] font-mono text-rose-600/40 font-bold uppercase tracking-widest pl-1 pb-2">
          &larr; Novelty &bull; Area Celah Riset
        </div>
      </div>

      {/* 2. ZONA SATURASI SEDANG (Tengah: X in [680, 1280 px]) */}
      <div
        className="w-[640px] shrink-0 border-r-2 border-dashed border-amber-500/25 bg-amber-500/[0.015] p-6 flex flex-col justify-between ml-10"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
            <Compass className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span>ZONA TRANSISI &bull; SATURASI SEDANG (21% - 50%)</span>
          </div>
          <p className="text-[11px] text-muted-foreground/80 max-w-sm leading-relaxed pl-1">
            Metode atau variabel yang mulai dieksplorasi oleh sebagian naskah. Cocok untuk integrasi komparatif lanjutan.
          </p>
        </div>

        <div className="text-[10px] font-mono text-amber-600/40 font-bold uppercase tracking-widest pl-1 pb-2">
          Eksplorasi Berkembang &bull; Transisi
        </div>
      </div>

      {/* 3. ZONA SATURASI TINGGI (Kanan: X in [1320, 1920 px]) */}
      <div
        className="w-[640px] shrink-0 bg-emerald-500/[0.015] p-6 flex flex-col justify-between ml-10"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
            <BookOpenCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>ZONA MAPAN &bull; SATURASI TINGGI (&gt; 50%)</span>
          </div>
          <p className="text-[11px] text-muted-foreground/80 max-w-sm leading-relaxed pl-1">
            Konsep teoretis atau dataset acuan yang telah dipakai luas dan mapan. Landasan utama tinjauan pustaka akademik.
          </p>
        </div>

        <div className="text-[10px] font-mono text-emerald-600/40 font-bold uppercase tracking-widest pl-1 pb-2">
          Landasan Mapan &bull; Jenuh &rarr;
        </div>
      </div>
    </div>
  )
}
