/**
 * OpenAPI Data Transfer Objects (DTO) and Schema Types.
 * Auto-generated or synchronized with FastAPI Backend (backend/app/main.py).
 */

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
