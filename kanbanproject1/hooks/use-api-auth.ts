"use client"

import { useState, useEffect, useCallback } from "react"
import { authApi, type User, type LoginRequest, type RegisterRequest } from "@/lib/api/auth-api"
import { ApiError } from "@/lib/api-client"

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

export function useApiAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth from localStorage and hydrate user via /auth/me
  useEffect(() => {
    const { user: storedUser, token } = authApi.initializeAuth()
    setUser(storedUser)
    if (token) {
      setIsLoading(true)
      authApi
        .me()
        .then((me) => {
          setUser(me)
          console.log("[v0] Auth initialized with token; user:", me)
        })
        .catch((err) => {
          console.warn("[v0] Auth init /auth/me failed; keeping stored user", err)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.login(data)
      // Após login, garantir dados completos do usuário (inclui companyId)
      try {
        const me = await authApi.me()
        setUser(me)
        console.log("[v0] Login successful (me):", me)
      } catch (e) {
        // Fallback para user retornado do login
        setUser(response.user)
        console.warn("[v0] /auth/me falhou após login; usando user da resposta de login.", e)
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao fazer login"
      setError(errorMessage)
      console.error("[v0] Login error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.register(data)
      try {
        const me = await authApi.me()
        setUser(me)
        console.log("[v0] Registration successful (me):", me)
      } catch (e) {
        setUser(response.user)
        console.warn("[v0] /auth/me falhou após registro; usando user da resposta de registro.", e)
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao criar conta"
      setError(errorMessage)
      console.error("[v0] Registration error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await authApi.logout()
      setUser(null)
      console.log("[v0] Logout successful")
    } catch (err) {
      console.error("[v0] Logout error:", err)
      // Still clear user even if API call fails
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const updatedUser = await authApi.me()
      setUser(updatedUser)
      console.log("[v0] User refreshed:", updatedUser)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Erro ao atualizar usuário"
      setError(errorMessage)
      console.error("[v0] Refresh user error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  }
}
