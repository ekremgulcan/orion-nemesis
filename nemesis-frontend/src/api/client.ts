import axios from "axios"

/**
 * Base API client for nemesis-frontend. Requests go through Vite's dev
 * proxy (see vite.config.ts) at /api/**, forwarded to the Spring Boot
 * backend on :8080. In production this can be pointed at an absolute
 * base URL once the app is deployed behind a fixed origin.
 *
 * Auth is not implemented yet (see orion-screen-migration skill) - once
 * JWT is added, an interceptor here will attach the Authorization header
 * and handle 401 redirects to /login.
 */
export const apiClient = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
})

export interface ApiErrorBody {
  message: string
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.message) {
      return body.message
    }
  }
  return fallback
}
