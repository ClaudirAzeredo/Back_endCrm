export interface User {
  id: string
  name: string
  email: string
  role: string // Changed from union type to string to accept custom roles
  companyId?: string
  createdAt: string
  createdBy?: string
  lastLogin?: string
  password?: string
  phone?: string
  status?: string
  modules?: string[]
  jobTitleId?: string // Added jobTitleId to User interface
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
}

// Storage keys
const AUTH_STORAGE_KEY = "unicrm_auth"
const USERS_STORAGE_KEY = "unicrm_users"

export const getAuthState = (): AuthState => {
  console.warn("[v0] getAuthState is deprecated. Use useApiAuth hook instead.")
  return { isAuthenticated: false, user: null }
}

export const getAllUsers = (): User[] => {
  console.warn("[v0] getAllUsers is deprecated. Use API instead.")
  return []
}

export const getUsersByCompany = (companyId: string): User[] => {
  console.warn("[v0] getUsersByCompany is deprecated. Use API instead.")
  return []
}

export const validateTenantAccess = (resourceCompanyId: string): boolean => {
  console.warn("[v0] validateTenantAccess is deprecated. Use API instead.")
  return false
}

export const getCompanyScope = (): string | null => {
  console.warn("[v0] getCompanyScope is deprecated. Use useApiAuth hook instead.")
  return null
}

export const registerUser = async (userData: any): Promise<{ success: boolean; error?: string; user?: User }> => {
  console.warn("[v0] registerUser is deprecated. Use useApiAuth hook instead.")
  return { success: false, error: "Use useApiAuth hook instead" }
}

export const loginUser = async (
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  console.warn("[v0] loginUser is deprecated. Use useApiAuth hook instead.")
  return { success: false, error: "Use useApiAuth hook instead" }
}

export const isAccountVerified = (userId: string): boolean => {
  console.warn("[v0] isAccountVerified is deprecated.")
  return false
}

export const verifyAccount = (userId: string): void => {
  console.warn("[v0] verifyAccount is deprecated.")
}

export const createUser = async (
  userData: any,
  createdBy: string,
): Promise<{ success: boolean; error?: string; user?: User }> => {
  console.warn("[v0] createUser is deprecated. Use API instead.")
  return { success: false, error: "Use API instead" }
}

export const isOwner = (): boolean => {
  console.warn("[v0] isOwner is deprecated. Use useApiAuth hook instead.")
  return false
}

export const isAdminOrOwner = (): boolean => {
  console.warn("[v0] isAdminOrOwner is deprecated. Use useApiAuth hook instead.")
  return false
}

export const isSuperAdmin = (): boolean => {
  console.warn("[v0] isSuperAdmin is deprecated. Use useApiAuth hook instead.")
  return false
}

export const getCompanyPlan = (): "completo" | "crm" | "chat" | null => {
  console.warn("[v0] getCompanyPlan is deprecated. Use API instead.")
  return "completo"
}

export const hasModuleAccess = (module: "crm" | "chat"): boolean => {
  console.warn("[v0] hasModuleAccess is deprecated. Use useApiAuth hook instead.")
  return true
}

// Chat access based on plan verification
// Returns true if the current company plan includes chat features.
// In the current implementation, this defers to getCompanyPlan()
// and grants access for plans "completo" or "chat".
export const hasChatAccess = (): boolean => {
  try {
    const plan = getCompanyPlan()
    return plan === "completo" || plan === "chat"
  } catch (e) {
    console.warn("[v0] hasChatAccess fallback to true due to plan check error", e)
    return true
  }
}

// Legacy functions for backward compatibility
export type UserRole = "admin" | "client"

export const getUserRole = (): UserRole => {
  console.warn("[v0] getUserRole is deprecated. Use useApiAuth hook instead.")
  return "client"
}

export const isAdmin = (): boolean => {
  console.warn("[v0] isAdmin is deprecated. Use useApiAuth hook instead.")
  return false
}
