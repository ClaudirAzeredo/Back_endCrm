import { apiClient } from "../api-client"

export interface Lead {
  id: string
  title: string
  client: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  clientType?: "fisica" | "juridica"
  clientCPF?: string
  clientCNPJ?: string
  source?: string
  status: string
  priority?: "low" | "medium" | "high" | "urgent"
  assignedTo?: {
    id: string
    name: string
    avatar?: string
    phone?: string
    email?: string
  }
  people?: Array<{
    id: string
    name: string
    avatar?: string
    phone?: string
    email?: string
  }>
  funnelId: string
  estimatedValue?: number
  expectedCloseDate?: string
  notes?: string
  tags?: string[]
  createdAt: string
  statusHistory?: Array<{
    status: string
    changedAt: string
    changedBy: string
    notes?: string
  }>
  interactions?: Array<{
    id: string
    type: "call" | "email" | "meeting" | "note" | "feedback"
    date: string
    notes: string
    user: string
    rating?: number
  }>
}

export interface LeadsQueryParams {
  funnelId?: string
  status?: string
  priority?: string
  assignedTo?: string
  search?: string
}

export interface CreateLeadRequest {
  title: string
  client: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  clientType?: "fisica" | "juridica"
  clientCPF?: string
  clientCNPJ?: string
  source?: string
  status: string
  priority?: "low" | "medium" | "high" | "urgent"
  assignedTo?: {
    id: string
    name: string
    email?: string
  }
  // Optional people list (mirrors backend PersonDto)
  people?: Array<{
    id: string
    name: string
    avatar?: string
    email?: string
    phone?: string
  }>
  funnelId: string
  estimatedValue?: number
  expectedCloseDate?: string
  notes?: string
  tags?: string[]
  currentActionId?: string
  // Contacts are REQUIRED by backend; include shape here
  contacts?: Array<{
    id?: string
    name: string
    email?: string
    phone?: string
    isPrincipal?: boolean
  }>
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {}

export interface AddInteractionRequest {
  type: "call" | "email" | "meeting" | "note" | "feedback"
  date: string
  notes: string
  rating?: number
  feedbackType?: "positive" | "negative" | "neutral" | "important"
  user?: string
}

export interface UpdateStatusRequest {
  status: string
  notes?: string
}

export const leadsApi = {
  // Get all leads
  async getLeads(params?: LeadsQueryParams): Promise<Lead[]> {
    return apiClient.get<Lead[]>("/leads", params)
  },

  // Get single lead
  async getLead(id: string): Promise<Lead> {
    return apiClient.get<Lead>(`/leads/${id}`)
  },

  // Create lead
  async createLead(data: CreateLeadRequest): Promise<Lead> {
    return apiClient.post<Lead>("/leads", data)
  },

  // Update lead
  async updateLead(id: string, data: UpdateLeadRequest): Promise<Lead> {
    return apiClient.put<Lead>(`/leads/${id}`, data)
  },

  // Delete lead
  async deleteLead(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/leads/${id}`)
  },

  // Add interaction to lead
  async addInteraction(leadId: string, data: AddInteractionRequest): Promise<any> {
    return apiClient.post(`/leads/${leadId}/interactions`, data)
  },

  // Update lead status
  async updateStatus(leadId: string, data: UpdateStatusRequest): Promise<Lead> {
    return apiClient.put<Lead>(`/leads/${leadId}/status`, data)
  },
}
