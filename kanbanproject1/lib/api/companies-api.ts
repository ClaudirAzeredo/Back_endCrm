import { apiClient } from "../api-client"
import type { Company } from "../types/company"

export const companiesApi = {
  async list(companyId?: string): Promise<Company[]> {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ""
    return apiClient.get<Company[]>(`/companies${qs}`)
  },
  async get(id: string): Promise<Company> {
    return apiClient.get<Company>(`/companies/${id}`)
  },
}