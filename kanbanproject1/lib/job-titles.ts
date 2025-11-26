import type { JobTitle } from "./types/job-title"

const STORAGE_KEY = "job-titles"

const getStorageKey = (companyId?: string) => {
  return companyId ? `${companyId}_${STORAGE_KEY}` : STORAGE_KEY
}

export const loadJobTitles = (companyId?: string): JobTitle[] => {
  if (typeof window === "undefined") return []
  try {
    const key = getStorageKey(companyId)
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("[v0] Failed to load job titles:", error)
    return []
  }
}

export const saveJobTitles = (jobTitles: JobTitle[], companyId?: string) => {
  if (typeof window === "undefined") return
  try {
    const key = getStorageKey(companyId)
    localStorage.setItem(key, JSON.stringify(jobTitles))
  } catch (error) {
    console.error("[v0] Failed to save job titles:", error)
  }
}

export const addJobTitle = (
  name: string,
  systemRole: "admin" | "manager" | "supervisor" | "employee",
  companyId?: string,
  canViewSameRoleData = true,
): JobTitle => {
  const jobTitles = loadJobTitles(companyId)
  const newJobTitle: JobTitle = {
    id: `jt-${Date.now()}`,
    name,
    systemRole,
    isSystemDefault: false,
    createdAt: new Date().toISOString(),
    canViewSameRoleData,
  }
  jobTitles.push(newJobTitle)
  console.log("[v0] addJobTitle:", { name, systemRole, companyId, canViewSameRoleData, newJobTitle })
  saveJobTitles(jobTitles, companyId)
  return newJobTitle
}

export const findOrCreateJobTitle = (
  name: string,
  systemRole: "admin" | "manager" | "supervisor" | "employee" = "employee",
  companyId?: string,
): JobTitle => {
  console.log("[v0] findOrCreateJobTitle called:", { name, systemRole, companyId })
  const jobTitles = loadJobTitles(companyId)
  console.log("[v0] Loaded job titles:", jobTitles)

  const existing = jobTitles.find((jt) => jt.name.toLowerCase().trim() === name.toLowerCase().trim())

  if (existing) {
    console.log("[v0] Found existing job title:", existing)
    return existing
  }

  console.log("[v0] Creating new job title")
  return addJobTitle(name, systemRole, companyId, true)
}

export const updateJobTitle = (
  id: string,
  name: string,
  systemRole: "admin" | "manager" | "supervisor" | "employee",
  companyId?: string,
  canViewSameRoleData?: boolean,
) => {
  const jobTitles = loadJobTitles(companyId)
  const index = jobTitles.findIndex((jt) => jt.id === id)
  if (index !== -1) {
    jobTitles[index] = {
      ...jobTitles[index],
      name,
      systemRole,
      ...(canViewSameRoleData !== undefined && { canViewSameRoleData }),
    }
    saveJobTitles(jobTitles, companyId)
  }
}

export const deleteJobTitle = (id: string, companyId?: string) => {
  const jobTitles = loadJobTitles(companyId)
  const filtered = jobTitles.filter((jt) => jt.id !== id)
  saveJobTitles(filtered, companyId)
}

export const getJobTitleById = (id: string, companyId?: string): JobTitle | undefined => {
  const jobTitles = loadJobTitles(companyId)
  return jobTitles.find((jt) => jt.id === id)
}
