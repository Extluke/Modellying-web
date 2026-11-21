/**
 * ProjectKnowledgeGraphScreen
 * Route screen for `/projects/:projectId/knowledge-graph`. It is rendered as a focused page
 * (no app sidebar / navbar), like the project workspace and the comparative matrix.
 */

import { ProjectKnowledgeGraphView } from "@/features/research/knowledge-graph/components/ProjectKnowledgeGraphView"

export default function ProjectKnowledgeGraphScreen() {
  return <ProjectKnowledgeGraphView />
}
