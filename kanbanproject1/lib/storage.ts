import { getCompanyScope, isSuperAdmin } from "./auth"
import { type User, authApi } from "./api/auth-api"

export interface StorageData {
  leads: any[]
  funnels: any[]
  tasks: any[]
  users: any[]
}

const STORAGE_KEY = "kanban-data"

const getTenantStorageKey = (key: string, companyId?: string): string => {
  if (key === "current-user" || key === "unicrm_auth") {
    return key
  }

  // Use provided companyId if available
  const targetCompanyId = companyId || getCompanyScope()

  // Superadmin uses global keys (only when no explicit companyId is provided)
  if (!companyId && isSuperAdmin()) {
    return key
  }

  // Regular users get company-scoped keys
  if (targetCompanyId) {
    return `${targetCompanyId}_${key}`
  }

  // Fallback to original key (for backward compatibility)
  return key
}

export const loadFromStorage = (key?: string, defaultValue?: any): any => {
  console.warn("[v0] loadFromStorage is deprecated. Use API hooks instead.")
  return defaultValue || { leads: [], funnels: [], tasks: [], users: [] }
}

export const saveToStorage = (data: any, key?: string) => {
  console.warn("[v0] saveToStorage is deprecated. Use API hooks instead.")
}

export const clearStorage = () => {
  console.warn("[v0] clearStorage is deprecated. Use API hooks instead.")
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("unicrm_auth")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.user || null
  } catch (error) {
    console.error("[v0] Error getting current user from storage:", error)
    return null
  }
}

export const setCurrentUser = (user: any) => {
  console.warn("[v0] setCurrentUser is deprecated. Use useApiAuth hook instead.")
}

export const logout = async () => {
  try {
    await authApi.logout()
  } catch (error) {
    console.error("[v0] Error logging out:", error)
  }
}
