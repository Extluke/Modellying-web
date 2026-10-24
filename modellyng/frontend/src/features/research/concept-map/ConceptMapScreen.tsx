import { useParams, useSearchParams } from "react-router-dom"
import { ConceptMapProjectPicker } from "./components/ConceptMapProjectPicker"
import { ProjectConceptMapView } from "./components/ProjectConceptMapView"

/**
 * Halaman Utama Research Gap Map & Hub Peta Konsep Ilmiah
 * Menyediakan alur seleksi proyek terstruktur (minimal 2 paper siap analisis)
 * dan kanvas evaluasi komparatif berpasangan 5 tahap, graf limitasi, serta diagram alur Mermaid.
 */
export default function ConceptMapScreen() {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Resolusi ID proyek: route parameter > query search parameter
  const activeProjectId = routeProjectId || searchParams.get("projectId")

  // Jika proyek telah dipilih, buka workspace komparatif terpadu
  if (activeProjectId) {
    return (
      <ProjectConceptMapView
        projectId={activeProjectId}
        onBackToProjects={() => setSearchParams({})}
      />
    )
  }

  // Jika belum ada proyek dipilih, tampilkan katalog seleksi proyek
  return (
    <ConceptMapProjectPicker
      onSelectProject={(id) => setSearchParams({ projectId: id })}
    />
  )
}
