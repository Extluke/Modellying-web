import { useMemo } from "react"
import { parseResearchQuestions } from "../utils/researchQuestionsFormatter"

interface ResearchQuestionsCardContentProps {
  text?: string | null
}

export function ResearchQuestionsCardContent({
  text,
}: ResearchQuestionsCardContentProps) {
  const parsed = useMemo(() => parseResearchQuestions(text), [text])

  if (!text || parsed.questions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-normal italic">
        {text || "Informasi tidak ditemukan dalam dokumen paper ini."}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Kalimat Pengantar / Preamble (jika ada) */}
      {parsed.preamble && (
        <p className="text-xs text-muted-foreground font-medium leading-relaxed pb-0.5">
          {parsed.preamble}
        </p>
      )}

      {/* Butir-butir Pertanyaan Penelitian Bernomor Urut */}
      <ol className="flex flex-col gap-2.5 list-none m-0 p-0">
        {parsed.questions.map((question, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed group/item"
          >
            <span className="font-bold text-primary font-mono shrink-0 select-none pt-px text-xs">
              {idx + 1}.
            </span>
            <span className="flex-1 font-normal text-foreground">
              {question}
            </span>
          </li>
        ))}
      </ol>

      {/* Kalimat Penutup / Konteks Tambahan (jika ada) */}
      {parsed.closing && (
        <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-2 border-t border-border/40 mt-1">
          {parsed.closing}
        </p>
      )}
    </div>
  )
}
