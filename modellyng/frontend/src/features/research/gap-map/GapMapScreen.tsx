import { useParams, useSearchParams } from "react-router-dom"
import { GapMapProjectPicker } from "./components/GapMapProjectPicker"
import { ProjectGapMapView } from "./components/ProjectGapMapView"

/**
 * GapMapScreen (Research Gap Map Hub & Dispatcher)
 * Jika projectId belum dipilih, menampilkan katalog pemilihan proyek (GapMapProjectPicker).
 * Jika projectId dipilih, menampilkan ruang kerja peta celah riset proyek terkait (ProjectGapMapView).
 */
export default function GapMapScreen() {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Resolusi Project ID: route param > query param
  const activeProjectId = routeProjectId || searchParams.get("projectId")

  // Jika suatu proyek telah dipilih, tampilkan ruang kerja peta celah riset proyek tersebut
  if (activeProjectId) {
    return (
      <ProjectGapMapView
        projectId={activeProjectId}
        onBackToProjects={() => setSearchParams({})}
      />
    )
  }

  // Jika belum ada proyek yang dipilih, tampilkan katalog pemilihan proyek & kesiapan celah riset
  return <GapMapProjectPicker onSelectProject={(id) => setSearchParams({ projectId: id })} />
}
