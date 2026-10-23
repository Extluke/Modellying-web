/**
 * Centralized Route Paths Constants.
 * Organized strictly by feature domain groups to prevent magic strings.
 */
export const ROUTES = {
  WELCOME: "/welcome",
  AUTH: {
    ROOT: "/auth",
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },
  DASHBOARD: "/dashboard",
  PROJECTS: {
    ROOT: "/projects",
    NEW: "/projects/new",
    DETAIL: "/projects/:projectId",
    OVERVIEW: "/projects/:projectId/overview",
    PAPER_ANALYSIS: "/projects/:projectId/papers/:paperId",
    REVIEW: "/projects/:projectId/review",
    CHAT: "/projects/:projectId/chat",
    MATRIX: "/projects/:projectId/matrix",
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
