/**
 * Centralized Route Paths Constants.
 * Organized strictly by feature domain groups to prevent magic strings.
 */
export const ROUTES = {
  WELCOME: "/welcome",
  AUTH: {
    ROOT: "/auth",
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  DASHBOARD: "/dashboard",
  PROJECTS: {
    ROOT: "/projects",
    DETAIL: "/projects/:projectId",
    PAPER_ANALYSIS: "/projects/:projectId/papers/:paperId",
    REVIEW: "/projects/:projectId/review",
    CHAT: "/projects/:projectId/chat",
  },
  RESEARCH: {
    MATRIX: "/matrix",
    GAP_MAP: "/gap-map",
    FLOW: "/research-flow",
    GRAPH: "/knowledge-graph",
    CONCEPT_MAP: "/concept-map",
    SYNTHESIS: "/synthesis",
    EXPORT: "/export",
  },
  USER: {
    CHAT: "/chat",
    NOTIFICATIONS: "/notifications",
    SETTINGS: "/settings",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    MODELS: "/admin/models",
  },
  STYLEGUIDE: "/styleguide",
} as const
