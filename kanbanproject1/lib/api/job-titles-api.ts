import { apiClient } from "../api-client"

export type SystemRole = "admin" | "manager" | "supervisor" | "employee"

export interface JobTitle {
  id: string
  name: string
  systemRole: SystemRole
  isSystemDefault: boolean
  createdAt: string
  companyId: string
  canViewSameRoleData?: boolean
}

export interface CreateJobTitleRequest {
  name: string
  systemRole: SystemRole
  companyId: string
  canViewSameRoleData?: boolean
}

export interface UpdateJobTitleRequest {
  name?: string
  systemRole?: SystemRole
  canViewSameRoleData?: boolean
}

export const jobTitlesApi = {
  async list(companyId?: string): Promise<JobTitle[]> {
    const params = companyId ? { companyId } : undefined
    return apiClient.get<JobTitle[]>("/job-titles", params)
  },

  async get(id: string): Promise<JobTitle> {
    return apiClient.get<JobTitle>(`/job-titles/${id}`)
  },

  async create(data: CreateJobTitleRequest): Promise<{ success: boolean; jobTitle: JobTitle }> {
    return apiClient.post<{ success: boolean; jobTitle: JobTitle }>("/job-titles", data)
  },

  async update(id: string, data: UpdateJobTitleRequest): Promise<{ success: boolean; jobTitle: JobTitle }> {
    return apiClient.put<{ success: boolean; jobTitle: JobTitle }>(`/job-titles/${id}`, data)
  },

  async remove(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/job-titles/${id}`)
  },
}