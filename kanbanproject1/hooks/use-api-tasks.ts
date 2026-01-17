"use client"

import { useState, useEffect, useCallback } from "react"
import { useApiAuth } from "@/hooks/use-api-auth"
import { tasksApi, type Task } from "@/lib/api/tasks-api"
import { ApiError } from "@/lib/api-client"

interface UseTasksReturn {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  fetchTasks: () => Promise<void>
  createTask: (data: any) => Promise<Task>
  updateTask: (id: string, data: any) => Promise<Task>
  updateStatus: (id: string, status: "pending" | "in_progress" | "completed" | "cancelled") => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  clearError: () => void
}

export function useApiTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useApiAuth()

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: any = {}
      if (user?.companyId) params.companyId = user.companyId
      const data = await tasksApi.getTasks(params)
      setTasks(data)
      console.log("[v0] Tasks fetched:", data.length)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao carregar tarefas"
      setError(errorMessage)
      console.error("[v0] Fetch tasks error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.companyId])

  const createTask = useCallback(async (data: any): Promise<Task> => {
    setIsLoading(true)
    setError(null)

    try {
      const payload = { ...data }
      if (user?.companyId) payload.companyId = user.companyId
      const newTask = await tasksApi.createTask(payload)
      setTasks((prev) => [...prev, newTask])
      console.log("[v0] Task created:", newTask)
      return newTask
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao criar tarefa"
      setError(errorMessage)
      console.error("[v0] Create task error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateTask = useCallback(async (id: string, data: any): Promise<Task> => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedTask = await tasksApi.updateTask(id, data)
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)))
      console.log("[v0] Task updated:", updatedTask)
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao atualizar tarefa"
      setError(errorMessage)
      console.error("[v0] Update task error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateStatus = useCallback(async (id: string, status: "pending" | "in_progress" | "completed" | "cancelled"): Promise<Task> => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedTask = await tasksApi.updateStatus(id, { status })
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)))
      console.log("[v0] Task status updated:", updatedTask)
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao atualizar status da tarefa"
      setError(errorMessage)
      console.error("[v0] Update task status error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await tasksApi.deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      console.log("[v0] Task deleted:", id)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao deletar tarefa"
      setError(errorMessage)
      console.error("[v0] Delete task error:", err)
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
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
    clearError,
  }
}
