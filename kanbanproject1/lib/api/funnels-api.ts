import { apiClient } from "../api-client"

export interface FunnelColumn {
  id: string
  name: string
  color: string
  order: number
  description?: string
  visible: boolean
  limit?: number | null
}

export interface Funnel {
  id: string
  name: string
  description?: string
  category?: string
  icon?: string
  isActive: boolean
  createdAt: string
  columns: FunnelColumn[]
}

export interface CreateFunnelRequest {
  name: string
  description?: string
  category?: string
  icon?: string
  isActive: boolean
  columns: Array<{
    name: string
    color: string
    order: number
    description?: string
    visible: boolean
    limit?: number | null
  }>
}

export interface UpdateFunnelRequest extends Partial<CreateFunnelRequest> {}

export interface UpdateColumnsRequest {
  columns: FunnelColumn[]
}

export const funnelsApi = {
  // Get all funnels
  async getFunnels(): Promise<Funnel[]> {
    return apiClient.get<Funnel[]>("/funnels")
  },

  // Get single funnel
  async getFunnel(id: string): Promise<Funnel> {
    return apiClient.get<Funnel>(`/funnels/${id}`)
  },

  // Create funnel
  async createFunnel(data: CreateFunnelRequest): Promise<Funnel> {
    return apiClient.post<Funnel>("/funnels", data)
  },

  // Update funnel
  async updateFunnel(id: string, data: UpdateFunnelRequest): Promise<Funnel> {
    return apiClient.put<Funnel>(`/funnels/${id}`, data)
  },

  // Delete funnel
  async deleteFunnel(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/funnels/${id}`)
  },

  // Update funnel columns
  async updateColumns(id: string, data: UpdateColumnsRequest): Promise<Funnel> {
    return apiClient.put<Funnel>(`/funnels/${id}/columns`, data)
  },
}
