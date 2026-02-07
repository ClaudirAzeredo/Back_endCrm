import { useCallback, useState } from "react"
import { toast } from "sonner"
import {
  messageTemplatesApi,
  type CreateMessageTemplateRequest,
  type MessageTemplate,
  type UpdateMessageTemplateRequest,
} from "@/lib/api/message-templates-api"

export function useApiMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await messageTemplatesApi.list()
      setTemplates(data)
    } catch (err: any) {
      setError(err.message)
      toast.error("Erro ao carregar templates", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (data: CreateMessageTemplateRequest) => {
    setIsLoading(true)
    try {
      const created = await messageTemplatesApi.create(data)
      setTemplates((prev) => [created, ...prev])
      toast.success("Template criado")
      return created
    } catch (err: any) {
      toast.error("Erro ao criar template", { description: err.message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateTemplate = useCallback(async (id: string, data: UpdateMessageTemplateRequest) => {
    setIsLoading(true)
    try {
      const updated = await messageTemplatesApi.update(id, data)
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)))
      toast.success("Template atualizado")
      return updated
    } catch (err: any) {
      toast.error("Erro ao atualizar template", { description: err.message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      await messageTemplatesApi.remove(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success("Template removido")
    } catch (err: any) {
      toast.error("Erro ao remover template", { description: err.message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { templates, isLoading, error, fetchTemplates, createTemplate, updateTemplate, deleteTemplate }
}

