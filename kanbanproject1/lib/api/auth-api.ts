import { apiClient } from "../api-client"

export interface User {
  id: string
  name: string
  email: string
  role: string
  companyId?: string
  createdAt: string
  createdBy?: string
  lastLogin?: string
  phone?: string
  status?: string
  modules?: string[]
  jobTitleId?: string
}

export interface AuthResponse {
  success: boolean
  user: User
  token?: string
  accessToken?: string
  refreshToken?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
  company?: string
  role?: string
}

export const authApi = {
  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Ensure no stale Authorization header is sent for public endpoint
    apiClient.setToken(null)
    // Backend sets HttpOnly cookie; no localStorage usage
    const response = await apiClient.post<AuthResponse>("/auth/register", data)
    // Set bearer token from response to ensure authenticated API calls in SPA
    if (response.accessToken) {
      apiClient.setToken(response.accessToken)
      try { localStorage.setItem("unicrm_access_token", response.accessToken) } catch {}
    }
    return response
  },

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Ensure no stale Authorization header is sent for public endpoint
    apiClient.setToken(null)
    // Backend sets HttpOnly cookie; no localStorage usage
    const response = await apiClient.post<AuthResponse>("/auth/login", data)
    // Set bearer token from response to ensure authenticated API calls in SPA
    if (response.accessToken) {
      apiClient.setToken(response.accessToken)
      try { localStorage.setItem("unicrm_access_token", response.accessToken) } catch {}
    }
    return response
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout")
    } catch (error) {
      console.error("[v0] Logout API call failed:", error)
    } finally {
      // Clear token and local storage regardless of API response
      apiClient.setToken(null)
      try { localStorage.removeItem("unicrm_access_token") } catch {}
    }
  },

  // Get current user
  async me(): Promise<User> {
    // Backend responde { success: true, user: { ... } }
    const res = await apiClient.get<any>("/auth/me")
    if (res && typeof res === "object" && "user" in res) {
      return res.user as User
    }
    // Fallback: caso já retorne o usuário direto
    return res as User
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const response = await apiClient.post<{ token: string; refreshToken: string }>("/auth/refresh", {
      refreshToken,
    })

    // Update token in API client
    if (response.token) {
      apiClient.setToken(response.token)
    }

    return response
  },

  // Initialize auth: no localStorage; rely on cookie + /auth/me
  initializeAuth(): { user: User | null; token: string | null } {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("unicrm_access_token") : null
      if (token) apiClient.setToken(token)
      return { user: null, token }
    } catch {
      return { user: null, token: null }
    }
  },
}
