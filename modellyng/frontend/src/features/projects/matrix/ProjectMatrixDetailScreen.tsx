/**
 * ProjectMatrixDetailScreen (Facade Re-export)
 * Menyediakan backwards-compatibility bagi rute dan impor eksisting
 * dengan mendelegasikan langsung ke MatrixDetailView di src/features/research/matrix/.
 */

import MatrixDetailView, {
  MatrixDetailViewProps,
} from "@/features/research/matrix/MatrixDetailView"

export type ProjectMatrixDetailScreenProps = MatrixDetailViewProps

export default function ProjectMatrixDetailScreen(props: ProjectMatrixDetailScreenProps) {
  return <MatrixDetailView {...props} />
}
