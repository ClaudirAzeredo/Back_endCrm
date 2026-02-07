// Prefer a local same-site base URL in development to ensure cookies are sent.
// If running in the browser, derive API URL from current origin, mapping port 3000 -> 8080.
// Fallback to NEXT_PUBLIC_API_URL or localhost when window is not available.
const API_BASE_URL = (() => {
  const envUrl = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || undefined
  if (envUrl) return envUrl
  if (typeof window !== "undefined") {
    const origin = window.location.origin
    try {
      const url = new URL(origin)
      const backendOrigin = `${url.protocol}//${url.hostname}:8080`
      return `${backendOrigin}/api`
    } catch {
      return "http://localhost:8080/api"
    }
  }
  return "http://localhost:8080/api"
})()

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
    console.log("[v0] API token updated:", token ? "Token set" : "Token cleared")
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    }

    // Bypass ngrok free abuse warning
    if (this.baseUrl.includes("ngrok-free.dev") || this.baseUrl.includes("ngrok.app")) {
      headers["ngrok-skip-browser-warning"] = "true"
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
      console.log("[v0] Adding token to request:", { tokenExists: !!this.token })
    }

    console.log("[v0] API Request:", {
      method: options.method || "GET",
      url,
      hasToken: !!this.token,
      hasBody: !!options.body,
    })

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // include cookies for auth
      })

      console.log("[v0] API Response:", {
        status: response.status,
        statusText: response.statusText,
        url,
      })

      if (!response.ok) {
        let errorData
        try {
          const text = await response.text()
          try {
            errorData = JSON.parse(text)
          } catch {
            errorData = { message: text || response.statusText }
          }
        } catch {
          errorData = { message: response.statusText }
        }

        // Handle 401 Unauthorized - redirect to login
        // Skip redirect for login endpoint itself to avoid loops or confusing messages
        if (response.status === 401 && !url.includes("/auth/login")) {
          console.error("[v0] 401 Unauthorized - clearing token and redirecting to login")
          this.token = null
          localStorage.removeItem("unicrm_access_token")
          
          // Redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          
          throw new ApiError("Sessão expirada. Por favor, faça login novamente.", 401, errorData)
        }

        const errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`
        const detailedMessage = errorData.exception ? `${errorMessage} \nException: ${errorData.exception}` : errorMessage

        throw new ApiError(
          detailedMessage,
          response.status,
          errorData,
        )
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      console.error("[v0] API Request failed:", error)
      throw new ApiError("Network error or server unavailable", 0, error)
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""

    return this.request<T>(`${endpoint}${queryString}`, {
      method: "GET",
    })
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // POST request que retorna texto bruto (para QR code)
  async postText(endpoint: string, data?: any): Promise<string> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Bypass ngrok free abuse warning
    if (this.baseUrl.includes("ngrok-free.dev") || this.baseUrl.includes("ngrok.app")) {
      headers["ngrok-skip-browser-warning"] = "true"
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
      console.log("[v0] Adding token to request:", { tokenExists: !!this.token })
    }

    console.log("[v0] API Text Request:", {
      method: "POST",
      url,
      hasToken: !!this.token,
      hasBody: !!data,
    })

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      })

      console.log("[v0] API Text Response:", {
        status: response.status,
        statusText: response.statusText,
        url,
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText }
        }

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
          console.error("[v0] 401 Unauthorized - clearing token and redirecting to login")
          this.token = null
          localStorage.removeItem("unicrm_access_token")
          
          // Redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          
          throw new ApiError("Sessão expirada. Por favor, faça login novamente.", 401, errorData)
        }

        throw new ApiError(errorData.error || errorData.message || "Request failed", response.status, errorData)
      }

      // Retorna texto bruto
      return await response.text()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      console.error("[v0] API Text Request failed:", error)
      throw new ApiError("Network error or server unavailable", 0, error)
    }
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    })
  }

  // Removed getBinary: prefer getText + data URL for QR

  async getText(endpoint: string): Promise<string> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {}
    if (this.baseUrl.includes("ngrok-free.dev") || this.baseUrl.includes("ngrok.app")) {
      headers["ngrok-skip-browser-warning"] = "true"
    }
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }
    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    })
    if (!response.ok) {
      let errorData
      try { errorData = await response.json() } catch { errorData = { message: response.statusText } }
      throw new ApiError(errorData.error || errorData.message || "Request failed", response.status, errorData)
    }
    return await response.text()
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export API base URL for reference
export { API_BASE_URL }
