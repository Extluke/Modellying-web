import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { ROUTES } from "@/app/routes"

// Loading skeleton fallback for lazy-loaded route chunks
function RouteLoader() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Memuat modul...</span>
      </div>
    </div>
  )
}

// 1. Auth Domain
const WelcomeScreen = lazy(() => import("@/features/auth/WelcomeScreen"))
const LoginScreen = lazy(() => import("@/features/auth/LoginScreen"))
const RegisterScreen = lazy(() => import("@/features/auth/RegisterScreen"))
const ForgotPasswordScreen = lazy(
  () => import("@/features/auth/ForgotPasswordScreen")
)

// 2. Dashboard Domain
const DashboardScreen = lazy(
  () => import("@/features/dashboard/DashboardScreen")
)

// 3. Projects Domain
const ProjectsScreen = lazy(() => import("@/features/projects/ProjectsScreen"))
const ProjectOverviewScreen = lazy(
  () => import("@/features/projects/overview/ProjectOverviewScreen")
)
const PaperResultScreen = lazy(
  () => import("@/features/projects/paper-analysis/PaperResultScreen")
)
const ReviewQueueScreen = lazy(
  () => import("@/features/projects/review/ReviewQueueScreen")
)
const ProjectChatScreen = lazy(
  () => import("@/features/projects/chat/ProjectChatScreen")
)

// 4. Research Domain (Cross-paper tools)
const MatrixScreen = lazy(() => import("@/features/research/matrix/MatrixScreen"))
const GapMapScreen = lazy(() => import("@/features/research/gap-map/GapMapScreen"))
const ResearchFlowScreen = lazy(
  () => import("@/features/research/research-flow/ResearchFlowScreen")
)
const KnowledgeGraphScreen = lazy(
  () => import("@/features/research/knowledge-graph/KnowledgeGraphScreen")
)
const ConceptMapScreen = lazy(
  () => import("@/features/research/concept-map/ConceptMapScreen")
)
const SynthesisScreen = lazy(
  () => import("@/features/research/synthesis/SynthesisScreen")
)
const ExportScreen = lazy(() => import("@/features/research/export/ExportScreen"))

// 5. User Domain
const ChatGlobalScreen = lazy(
  () => import("@/features/user/chat-global/ChatGlobalScreen")
)
const NotificationsScreen = lazy(
  () => import("@/features/user/notifications/NotificationsScreen")
)
const SettingsScreen = lazy(
  () => import("@/features/user/settings/SettingsScreen")
)

// 6. Admin Domain (Future)
const AdminDashboardScreen = lazy(
  () => import("@/features/admin/dashboard/AdminDashboardScreen")
)
const UserManagementScreen = lazy(
  () => import("@/features/admin/user-management/UserManagementScreen")
)
const ModelQuotasScreen = lazy(
  () => import("@/features/admin/model-quotas/ModelQuotasScreen")
)
const StyleGuideScreen = lazy(
  () => import("@/features/styleguide/StyleGuideScreen")
)

export const router = createBrowserRouter([
  // Public Guest Routes (No AppShell)
  {
    path: ROUTES.WELCOME,
    element: (
      <Suspense fallback={<RouteLoader />}>
        <WelcomeScreen />
      </Suspense>
    ),
  },
  {
    path: ROUTES.AUTH.LOGIN,
    element: (
      <Suspense fallback={<RouteLoader />}>
        <LoginScreen />
      </Suspense>
    ),
  },
  {
    path: ROUTES.AUTH.REGISTER,
    element: (
      <Suspense fallback={<RouteLoader />}>
        <RegisterScreen />
      </Suspense>
    ),
  },
  {
    path: ROUTES.AUTH.FORGOT_PASSWORD,
    element: (
      <Suspense fallback={<RouteLoader />}>
        <ForgotPasswordScreen />
      </Suspense>
    ),
  },

  // Authenticated User Routes (With AppShell)
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <DashboardScreen />
          </Suspense>
        ),
      },
      // Projects
      {
        path: ROUTES.PROJECTS.ROOT,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ProjectsScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.PROJECTS.DETAIL,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ProjectOverviewScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.PROJECTS.PAPER_ANALYSIS,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <PaperResultScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.PROJECTS.REVIEW,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ReviewQueueScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.PROJECTS.CHAT,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ProjectChatScreen />
          </Suspense>
        ),
      },
      // Research Domain
      {
        path: ROUTES.RESEARCH.MATRIX,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <MatrixScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.RESEARCH.GAP_MAP,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <GapMapScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.RESEARCH.FLOW,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ResearchFlowScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.RESEARCH.GRAPH,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <KnowledgeGraphScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.RESEARCH.CONCEPT_MAP,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ConceptMapScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.RESEARCH.SYNTHESIS,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <SynthesisScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.RESEARCH.EXPORT,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ExportScreen />
          </Suspense>
        ),
      },
      // User Domain
      {
        path: ROUTES.USER.CHAT,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ChatGlobalScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.USER.NOTIFICATIONS,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <NotificationsScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.USER.SETTINGS,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <SettingsScreen />
          </Suspense>
        ),
      },
      // Admin Domain (Future)
      {
        path: ROUTES.ADMIN.DASHBOARD,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <AdminDashboardScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.ADMIN.USERS,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <UserManagementScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.ADMIN.MODELS,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ModelQuotasScreen />
          </Suspense>
        ),
      },
      {
        path: ROUTES.STYLEGUIDE,
        element: (
          <Suspense fallback={<RouteLoader />}>
            <StyleGuideScreen />
          </Suspense>
        ),
      },
    ],
  },
])
