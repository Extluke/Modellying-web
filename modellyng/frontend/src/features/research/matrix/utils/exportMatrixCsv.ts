import type { ComparativeMatrixResponse, MatrixPaper } from "@/features/projects/api/projectsApi"
import { formatGroupName } from "./matrixFormatters"

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

/** Builds the CSV text of the comparative matrix for the given (already filtered) papers. */
export function buildMatrixCsv(matrix: ComparativeMatrixResponse, papers: MatrixPaper[]): string {
  const header = ["Parameter", "Kategori", ...papers.map((paper) => paper.title)].map(csvField).join(",")

  const rows = matrix.parameters.map((parameter) => {
    const label = parameter.label.id || parameter.label.en || parameter.key
    const cells = papers.map((paper) => {
      const cell = matrix.matrix[parameter.key]?.[paper.id]
      if (!cell) return csvField("")
      const text = cell.value?.text || (cell.state === "not_found" ? "Tidak Ditemukan" : "-")
      return csvField(text)
    })
    return [csvField(label), csvField(formatGroupName(parameter.group_name)), ...cells].join(",")
  })

  return [header, ...rows].join("\n")
}

/** Downloads the matrix as a UTF-8 CSV file (with BOM so Excel detects the encoding). */
export function downloadMatrixCsv(matrix: ComparativeMatrixResponse, papers: MatrixPaper[]): void {
  const csv = buildMatrixCsv(matrix, papers)
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `Matriks_Komparasi_${matrix.project_name.replace(/\s+/g, "_")}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
