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
  try {
    if (typeof window === "undefined") return defaultValue
    const storageKey = getTenantStorageKey(key || STORAGE_KEY)
    const raw = localStorage.getItem(storageKey)
    if (!raw) return defaultValue
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

export const saveToStorage = (data: any, key?: string) => {
  try {
    if (typeof window === "undefined") return
    const storageKey = getTenantStorageKey(key || STORAGE_KEY)
    localStorage.setItem(storageKey, JSON.stringify(data))
  } catch {}
}

export const clearStorage = () => {
  try {
    if (typeof window === "undefined") return
    localStorage.clear()
  } catch {}
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
