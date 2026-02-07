export type MessageTemplateType = "text" | "image" | "video" | "buttons"

export type MessageTemplate = {
  id: string
  name: string
  type: MessageTemplateType
  content: any
  createdAt: string
  updatedAt: string
}

export type CreateMessageTemplateRequest = {
  name: string
  type: MessageTemplateType
  content: any
}

export type UpdateMessageTemplateRequest = Partial<CreateMessageTemplateRequest>

export const messageTemplatesApi = {
  async list(): Promise<MessageTemplate[]> {
    const response = await fetch("/api/message-templates")
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || "Falha ao carregar templates")
    }
    return response.json()
  },

  async create(data: CreateMessageTemplateRequest): Promise<MessageTemplate> {
    const response = await fetch("/api/message-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || "Falha ao criar template")
    }
    return response.json()
  },

  async update(id: string, data: UpdateMessageTemplateRequest): Promise<MessageTemplate> {
    const response = await fetch(`/api/message-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || "Falha ao atualizar template")
    }
    return response.json()
  },

  async remove(id: string): Promise<void> {
    const response = await fetch(`/api/message-templates/${id}`, { method: "DELETE" })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || "Falha ao excluir template")
    }
  },
}

