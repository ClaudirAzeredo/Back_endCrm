import { apiClient } from "../api-client"

export interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  assignedTo?: {
    id: string
    name: string
    email?: string
  }
  leadId?: string
  clientName?: string
  dueDate?: string
  createdAt: string
  createdBy: "manual" | "automation"
  automationId?: string | null
  completedAt?: string | null
  tags?: string[]
  relatedConversations?: string[]
}

export interface TasksQueryParams {
  status?: "pending" | "in_progress" | "completed" | "cancelled"
  priority?: "low" | "medium" | "high" | "urgent"
  assignedTo?: string
  leadId?: string
  dueDate?: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  status?: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  assignedTo?: {
    id: string
    name: string
  }
  leadId?: string
  dueDate?: string
  tags?: string[]
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {}

export interface UpdateTaskStatusRequest {
  status: "pending" | "in_progress" | "completed" | "cancelled"
  notes?: string
}

export const tasksApi = {
  // Get all tasks
  async getTasks(params?: TasksQueryParams): Promise<Task[]> {
    return apiClient.get<Task[]>("/tasks", params)
  },

  // Get single task
  async getTask(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`)
  },

  // Create task
  async createTask(data: CreateTaskRequest): Promise<Task> {
    return apiClient.post<Task>("/tasks", data)
  },

  // Update task
  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    return apiClient.put<Task>(`/tasks/${id}`, data)
  },

  // Delete task
  async deleteTask(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/tasks/${id}`)
  },

  // Update task status
  async updateStatus(id: string, data: UpdateTaskStatusRequest): Promise<Task> {
    return apiClient.put<Task>(`/tasks/${id}/status`, data)
  },
}
