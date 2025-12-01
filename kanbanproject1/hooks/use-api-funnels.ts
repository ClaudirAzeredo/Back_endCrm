"use client"

import { useState, useEffect, useCallback } from "react"
import { funnelsApi, type Funnel } from "@/lib/api/funnels-api"
import { ApiError } from "@/lib/api-client"

interface UseFunnelsReturn {
  funnels: Funnel[]
  isLoading: boolean
  error: string | null
  fetchFunnels: () => Promise<void>
  createFunnel: (data: any) => Promise<Funnel>
  updateFunnel: (id: string, data: any) => Promise<Funnel>
  deleteFunnel: (id: string) => Promise<void>
  clearError: () => void
}

export function useApiFunnels(): UseFunnelsReturn {
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFunnels = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await funnelsApi.getFunnels()
      setFunnels(data)
      console.log("[v0] Funnels fetched:", data.length)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao carregar funis"
      setError(errorMessage)
      console.error("[v0] Fetch funnels error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createFunnel = useCallback(async (data: any): Promise<Funnel> => {
    setIsLoading(true)
    setError(null)

    try {
      const newFunnel = await funnelsApi.createFunnel(data)
      setFunnels((prev) => [...prev, newFunnel])
      console.log("[v0] Funnel created:", newFunnel)
      return newFunnel
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao criar funil"
      setError(errorMessage)
      console.error("[v0] Create funnel error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateFunnel = useCallback(async (id: string, data: any): Promise<Funnel> => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedFunnel = await funnelsApi.updateFunnel(id, data)
      setFunnels((prev) => prev.map((f) => (f.id === id ? updatedFunnel : f)))
      console.log("[v0] Funnel updated:", updatedFunnel)
      return updatedFunnel
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao atualizar funil"
      setError(errorMessage)
      console.error("[v0] Update funnel error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteFunnel = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await funnelsApi.deleteFunnel(id)
      setFunnels((prev) => prev.filter((f) => f.id !== id))
      console.log("[v0] Funnel deleted:", id)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao deletar funil"
      setError(errorMessage)
      console.error("[v0] Delete funnel error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchFunnels()
  }, [fetchFunnels])

  return {
    funnels,
    isLoading,
    error,
    fetchFunnels,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    clearError,
  }
}
