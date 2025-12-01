export type SavedFilter = {
  id: string
  name: string
  rules: any[] // Using any[] to avoid circular dependency
  createdAt: string
  createdBy?: string
}

const STORAGE_KEY = "unicrm_saved_filters"

export const loadSavedFilters = (companyId?: string): SavedFilter[] => {
  if (typeof window === "undefined") return []

  try {
    const key = companyId ? `${companyId}_${STORAGE_KEY}` : STORAGE_KEY
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("Error loading saved filters:", error)
  }

  return []
}

export const saveSavedFilters = (filters: SavedFilter[], companyId?: string) => {
  if (typeof window === "undefined") return

  try {
    const key = companyId ? `${companyId}_${STORAGE_KEY}` : STORAGE_KEY
    localStorage.setItem(key, JSON.stringify(filters))
  } catch (error) {
    console.error("Error saving filters:", error)
  }
}

export const addSavedFilter = (name: string, rules: any[], companyId?: string, userId?: string): SavedFilter => {
  const newFilter: SavedFilter = {
    id: `filter_${Date.now()}`,
    name,
    rules: rules.filter((r) => r.value), // Only save rules with values
    createdAt: new Date().toISOString(),
    createdBy: userId,
  }

  const filters = loadSavedFilters(companyId)
  const updatedFilters = [...filters, newFilter]
  saveSavedFilters(updatedFilters, companyId)

  return newFilter
}

export const deleteSavedFilter = (filterId: string, companyId?: string) => {
  const filters = loadSavedFilters(companyId)
  const updatedFilters = filters.filter((f) => f.id !== filterId)
  saveSavedFilters(updatedFilters, companyId)
}

export const updateSavedFilter = (filterId: string, name: string, rules: any[], companyId?: string) => {
  const filters = loadSavedFilters(companyId)
  const updatedFilters = filters.map((f) =>
    f.id === filterId
      ? {
          ...f,
          name,
          rules: rules.filter((r) => r.value),
        }
      : f,
  )
  saveSavedFilters(updatedFilters, companyId)
}
