import { useParams, useSearchParams } from "react-router-dom"
import { KnowledgeGraphProjectPicker } from "./components/KnowledgeGraphProjectPicker"
import { ProjectKnowledgeGraphView } from "./components/ProjectKnowledgeGraphView"

/**
 * KnowledgeGraphScreen (Research Knowledge Graph Hub & Dispatcher)
 * Jika projectId belum dipilih, menampilkan katalog pemilihan proyek (KnowledgeGraphProjectPicker).
 * Jika projectId dipilih, menampilkan ruang kerja kanvas graf spasial 2D & zona saturasi konsep (ProjectKnowledgeGraphView).
 */
export default function KnowledgeGraphScreen() {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Resolusi Project ID: route param > query param
  const activeProjectId = routeProjectId || searchParams.get("projectId")

  // Jika suatu proyek telah dipilih, tampilkan ruang kerja graf pengetahuan spasial 2D
  if (activeProjectId) {
    return (
      <ProjectKnowledgeGraphView
        projectId={activeProjectId}
        onBackToProjects={() => setSearchParams({})}
      />
    )
  }

  // Jika belum ada proyek yang dipilih, tampilkan katalog pemilihan proyek & kesiapan paper
  return (
    <KnowledgeGraphProjectPicker
      onSelectProject={(id) => setSearchParams({ projectId: id })}
    />
  )
}
