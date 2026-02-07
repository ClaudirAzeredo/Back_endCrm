import { useState, useCallback } from 'react'
import { tagsApi, Tag, CreateTagRequest, UpdateTagRequest } from '@/lib/api/tags-api'
import { toast } from 'sonner'

export function useApiTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await tagsApi.getTags()
      setTags(data)
    } catch (err: any) {
      setError(err.message)
      toast.error('Erro ao carregar tags', { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createTag = useCallback(async (data: CreateTagRequest) => {
    setIsLoading(true)
    try {
      const newTag = await tagsApi.createTag(data)
      setTags(prev => [...prev, newTag])
      toast.success('Tag criada com sucesso')
      return newTag
    } catch (err: any) {
      toast.error('Erro ao criar tag', { description: err.message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateTag = useCallback(async (id: string, data: UpdateTagRequest) => {
    setIsLoading(true)
    try {
      const updatedTag = await tagsApi.updateTag(id, data)
      setTags(prev => prev.map(t => t.id === id ? updatedTag : t))
      toast.success('Tag atualizada com sucesso')
      return updatedTag
    } catch (err: any) {
      toast.error('Erro ao atualizar tag', { description: err.message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteTag = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      await tagsApi.deleteTag(id)
      setTags(prev => prev.filter(t => t.id !== id))
      toast.success('Tag removida com sucesso')
    } catch (err: any) {
      toast.error('Erro ao remover tag', { description: err.message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag
  }
}
