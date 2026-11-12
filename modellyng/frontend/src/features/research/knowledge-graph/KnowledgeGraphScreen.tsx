import { Navigate, generatePath, useNavigate, useSearchParams } from "react-router-dom"
import { ROUTES } from "@/app/routes"
import { KnowledgeGraphProjectPicker } from "./components/KnowledgeGraphProjectPicker"

/**
 * KnowledgeGraphScreen (project selection)
 * Lists the projects that can be mapped. The graph itself lives on its own focused route
 * (`ROUTES.PROJECTS.KNOWLEDGE_GRAPH`), without the app sidebar and navbar, like the project workspace.
 */
export default function KnowledgeGraphScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Backwards compatibility with the former `/knowledge-graph?projectId=...` links
  const legacyProjectId = searchParams.get("projectId")
  if (legacyProjectId) {
    return (
      <Navigate
        to={generatePath(ROUTES.PROJECTS.KNOWLEDGE_GRAPH, { projectId: legacyProjectId })}
        replace
      />
    )
  }

  return (
    <KnowledgeGraphProjectPicker
      onSelectProject={(projectId) =>
        navigate(generatePath(ROUTES.PROJECTS.KNOWLEDGE_GRAPH, { projectId }))
      }
    />
  )
}
