/**
 * ProjectMatrixDetailScreen
 * Route screen for `/projects/:projectId/matrix`. It is rendered as a focused page
 * (no app sidebar / navbar), like the project workspace, and delegates the matrix
 * itself to MatrixDetailView in src/features/research/matrix/.
 */

import MatrixDetailView from "@/features/research/matrix/MatrixDetailView"

export default function ProjectMatrixDetailScreen() {
  return <MatrixDetailView />
}
