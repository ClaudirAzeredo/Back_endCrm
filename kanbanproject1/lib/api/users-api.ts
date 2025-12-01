import { apiClient } from "../api-client"

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  phone?: string
  role?: string
  companyId: string
  jobTitleId?: string
  modules?: string[]
}

export interface UpdateUserRequest {
  name?: string
  password?: string
  phone?: string
  role?: string
  jobTitleId?: string
  modules?: string[]
}

export const usersApi = {
  async list(companyId?: string) {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ""
    return apiClient.get<any[]>(`/users${qs}`)
  },

  async get(id: string) {
    return apiClient.get<any>(`/users/${id}`)
  },

  async create(data: CreateUserRequest) {
    return apiClient.post<{ success: boolean; user: any }>("/users", data)
  },

  async update(id: string, data: UpdateUserRequest) {
    return apiClient.put<{ success: boolean; user: any }>(`/users/${id}`, data)
  },

  async updateModules(id: string, modules: string[]) {
    return apiClient.put<{ success: boolean; user: any }>(`/users/${id}/modules`, modules)
  },

  async remove(id: string) {
    return apiClient.delete<{ success: boolean }>(`/users/${id}`)
  },
}