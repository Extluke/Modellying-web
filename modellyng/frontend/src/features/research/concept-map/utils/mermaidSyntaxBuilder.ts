import { PaperPairComparison } from "../types/conceptMapTypes"

/**
 * Membangun sintaks Mermaid diagram alur 5 tahap (5-Step Deterministic Stopping Rule)
 * untuk pasangan paper yang dipilih.
 */
export function build5StepMermaidSyntax(pair: PaperPairComparison): string {
  const p1Short = pair.paper1.title.slice(0, 30)
  const p2Short = pair.paper2.title.slice(0, 30)

  return `graph TD
  START(["Pasangan: ${p1Short}... vs ${p2Short}..."]) --> S1

  S1{"1. Konsep Utama Sama?"}
  S1 -- Tidak --> R1["Berhenti: Tidak Berhubungan (Unrelated)"]
  S1 -- Ya --> S2

  S2{"2. Variabel Penelitian Sama?"}
  S2 -- Tidak --> R2["Berhenti: Celah Variabel (Candidate Gap)"]
  S2 -- Ya --> S3

  S3{"3. Objek / Dataset Sama?"}
  S3 -- Tidak --> R3["Berhenti: Celah Objek/Populasi (Candidate Gap)"]
  S3 -- Ya --> S4

  S4{"4. Metodologi / Algoritma Sama?"}
  S4 -- Tidak --> R4["Berhenti: Celah Metodologi (Candidate Gap)"]
  S4 -- Ya --> S5

  S5{"5. Cakupan Masalah Sama?"}
  S5 -- Tidak --> R5["Berhenti: Celah Masalah (Candidate Gap)"]
  S5 -- Ya --> R_FINAL["Selesai: Identik pada 5 Aspek (No Gap)"]

  classDef default fill:#FFFFFF,stroke:#6366F1,stroke-width:1.5px,color:#1E293B,font-family:Inter;
  classDef decision fill:#EEF2FF,stroke:#4F46E5,stroke-width:2px,color:#312E81,font-weight:bold;
  classDef candidateGap fill:#FFF1F2,stroke:#F43F5E,stroke-width:2.5px,color:#9F1239,font-weight:bold;
  classDef noGap fill:#ECFDF5,stroke:#10B981,stroke-width:2.5px,color:#065F46,font-weight:bold;
  classDef unrelated fill:#F8FAFC,stroke:#94A3B8,stroke-width:1.5px,color:#475569;

  class S1,S2,S3,S4,S5 decision;
  class R2,R3,R4,R5 candidateGap;
  class R_FINAL noGap;
  class R1 unrelated;
`
}
