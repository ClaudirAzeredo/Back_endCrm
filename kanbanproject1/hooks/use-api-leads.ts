"use client"

import { useState, useEffect, useCallback } from "react"
import {
  leadsApi,
  type Lead,
  type LeadsQueryParams,
  type CreateLeadRequest,
  type UpdateLeadRequest,
} from "@/lib/api/leads-api"
import { ApiError } from "@/lib/api-client"

interface UseLeadsReturn {
  leads: Lead[]
  isLoading: boolean
  error: string | null
  fetchLeads: (params?: LeadsQueryParams) => Promise<void>
  createLead: (data: CreateLeadRequest) => Promise<Lead>
  updateLead: (id: string, data: UpdateLeadRequest) => Promise<Lead>
  deleteLead: (id: string) => Promise<void>
  updateLeadStatus: (id: string, status: string, notes?: string) => Promise<Lead>
  clearError: () => void
}

export function useApiLeads(initialParams?: LeadsQueryParams): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(
    async (params?: LeadsQueryParams) => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await leadsApi.getLeads(params || initialParams)
        setLeads(data)
        console.log("[v0] Leads fetched:", data.length)
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : "Erro ao carregar leads"
        setError(errorMessage)
        console.error("[v0] Fetch leads error:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [initialParams],
  )

  const createLead = useCallback(async (data: CreateLeadRequest): Promise<Lead> => {
    setIsLoading(true)
    setError(null)

    try {
      const newLead = await leadsApi.createLead(data)
      setLeads((prev) => [...prev, newLead])
      console.log("[v0] Lead created:", newLead)
      return newLead
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao criar lead"
      setError(errorMessage)
      console.error("[v0] Create lead error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateLead = useCallback(async (id: string, data: UpdateLeadRequest): Promise<Lead> => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedLead = await leadsApi.updateLead(id, data)
      setLeads((prev) => prev.map((lead) => (lead.id === id ? updatedLead : lead)))
      console.log("[v0] Lead updated:", updatedLead)
      return updatedLead
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao atualizar lead"
      setError(errorMessage)
      console.error("[v0] Update lead error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteLead = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await leadsApi.deleteLead(id)
      setLeads((prev) => prev.filter((lead) => lead.id !== id))
      console.log("[v0] Lead deleted:", id)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao deletar lead"
      setError(errorMessage)
      console.error("[v0] Delete lead error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateLeadStatus = useCallback(async (id: string, status: string, notes?: string): Promise<Lead> => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedLead = await leadsApi.updateStatus(id, { status, notes })
      setLeads((prev) => prev.map((lead) => (lead.id === id ? updatedLead : lead)))
      console.log("[v0] Lead status updated:", updatedLead)
      return updatedLead
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao atualizar status do lead"
      setError(errorMessage)
      console.error("[v0] Update lead status error:", err)
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
    fetchLeads()
  }, [fetchLeads])

  return {
    leads,
    isLoading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    updateLeadStatus,
    clearError,
  }
}
