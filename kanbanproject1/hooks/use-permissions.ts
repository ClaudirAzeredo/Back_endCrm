"use client"

import { useEffect, useState } from "react"
import { hasPermission, getUserPermissions, type ModuleId } from "@/lib/permissions"
import { useApiAuth } from "./use-api-auth"

export function usePermissions() {
  const [permissions, setPermissions] = useState<ModuleId[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useApiAuth()

  useEffect(() => {
    if (user) {
      const userPermissions = getUserPermissions(user)
      setPermissions(userPermissions)
    }
    setIsLoading(false)
  }, [user])

  const checkPermission = (moduleId: ModuleId): boolean => {
    return user ? hasPermission(moduleId, user) : false
  }

  const hasAnyPermission = (moduleIds: ModuleId[]): boolean => {
    return moduleIds.some((moduleId) => user ? hasPermission(moduleId, user) : false)
  }

  const hasAllPermissions = (moduleIds: ModuleId[]): boolean => {
    return moduleIds.every((moduleId) => user ? hasPermission(moduleId, user) : false)
  }

  return {
    permissions,
    isLoading,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}

export function usePermission(moduleId: ModuleId) {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useApiAuth()

  useEffect(() => {
    if (user) {
      const access = hasPermission(moduleId, user)
      setHasAccess(access)
    }
    setIsLoading(false)
  }, [moduleId, user])

  return { hasAccess, isLoading }
}
