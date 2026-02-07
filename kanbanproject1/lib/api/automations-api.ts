import { apiClient } from "../api-client"

export interface AutomationAction {
  id?: string
  mode?: "automatic" | "manual"
  enabled?: boolean
  delayConfig?: { value: number; unit: "minutes" | "hours" | "days" }
  next?: { kind: "action"; actionId: string } | { kind: "stage"; columnId: string; startActionId?: string } | null
  type:
    | "whatsapp"
    | "task"
    | "email"
    | "notification"
    | "move_lead"
    | "transfer_command"
    | "batch_transfer"
    | "manual"
  recipients?: "assigned" | "all_members" | "custom" | "lead_contact"
  customRecipients?: string[]
  variables?: Record<string, string>
  waitForResponse?: boolean
  responseTimeout?: number
  responseTargetColumnId?: string
  onResponseNext?: { kind: "stage"; columnId: string; startActionId?: string } | null
  onNoResponseNext?: { kind: "action"; actionId: string } | { kind: "stage"; columnId: string; startActionId?: string } | null
  template?: string
  title?: string
  customName?: string
  description?: string
  priority?: "low" | "medium" | "high" | "urgent"
  dueInMinutes?: number
  assignTo?: string
  delay?: number
  targetColumnId?: string
  targetFunnelId?: string
  batchSize?: number
  batchInterval?: number
  batchIntervalUnit?: "minutes" | "hours" | "days"
  totalLeads?: number
}

export interface Automation {
  id: string
  name: string
  columnId: string
  trigger: "on_enter" | "on_exit" | "on_time_spent" | "on_deadline" | "on_response" | "on_no_response"
  conditions?: any[]
  actions: AutomationAction[]
  active: boolean
  delay?: number
  createdAt: string
}

export interface AutomationsQueryParams {
  funnelId?: string
  columnId?: string
  active?: boolean
}

export interface CreateAutomationRequest {
  name: string
  columnId: string
  trigger: "on_enter" | "on_exit" | "on_time_spent" | "on_deadline" | "on_response" | "on_no_response"
  conditions?: any[]
  actions: AutomationAction[]
  active: boolean
  delay?: number
}

export interface UpdateAutomationRequest extends Partial<CreateAutomationRequest> {}

export interface ToggleAutomationRequest {
  active: boolean
}

export const automationsApi = {
  // Get all automations
  async getAutomations(params?: AutomationsQueryParams): Promise<Automation[]> {
    return apiClient.get<Automation[]>("/automations", params)
  },

  // Get single automation
  async getAutomation(id: string): Promise<Automation> {
    return apiClient.get<Automation>(`/automations/${id}`)
  },

  // Create automation
  async createAutomation(data: CreateAutomationRequest): Promise<Automation> {
    return apiClient.post<Automation>("/automations", data)
  },

  // Update automation
  async updateAutomation(id: string, data: UpdateAutomationRequest): Promise<Automation> {
    return apiClient.put<Automation>(`/automations/${id}`, data)
  },

  // Delete automation
  async deleteAutomation(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/automations/${id}`)
  },

  // Toggle automation active status
  async toggleAutomation(id: string, data: ToggleAutomationRequest): Promise<Automation> {
    return apiClient.put<Automation>(`/automations/${id}/toggle`, data)
  },
}
