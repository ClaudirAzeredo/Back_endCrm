import type { LandingPage, Lead } from "./types/landing-page"

const STORAGE_KEY = "unicrm_landing_pages"

export function getLandingPages(): LandingPage[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveLandingPage(landingPage: LandingPage): void {
  const pages = getLandingPages()
  const existingIndex = pages.findIndex((p) => p.id === landingPage.id)

  if (existingIndex >= 0) {
    pages[existingIndex] = landingPage
  } else {
    pages.push(landingPage)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
}

export function deleteLandingPage(id: string): void {
  const pages = getLandingPages().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
}

export function getLandingPageById(id: string): LandingPage | null {
  const pages = getLandingPages()
  return pages.find((p) => p.id === id) || null
}

export function addLeadToLandingPage(landingPageId: string, lead: Lead): void {
  const pages = getLandingPages()
  const page = pages.find((p) => p.id === landingPageId)

  if (page) {
    page.leads = page.leads || []
    page.leads.push(lead)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
  }
}
