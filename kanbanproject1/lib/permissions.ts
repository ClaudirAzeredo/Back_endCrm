import { toast } from "@/hooks/use-toast"

export type ModuleId = "pipeline" | "unichat" | "dashboard" | "tarefas" | "relatorios" | "configuracoes" | "usuarios"

export const MODULE_ROUTES: Record<ModuleId, string[]> = {
  pipeline: ["/", "/leads"],
  unichat: ["/chat", "/conversations"],
  dashboard: ["/dashboard"],
  tarefas: ["/tasks", "/tarefas"],
  relatorios: ["/reports", "/relatorios"],
  configuracoes: ["/settings", "/configuracoes"],
  usuarios: ["/users", "/usuarios", "/user-management"],
}

export function hasPermission(moduleId: ModuleId, user: any): boolean {
  if (!user) {
    return false
  }

  const role = (user.role || "").toLowerCase()

  // Superadmin and admin have access to everything (case-insensitive)
  if (role === "superadmin" || role === "admin" || role === "administrador") {
    return true
  }

  // If modules are present, check membership
  if (user.modules && Array.isArray(user.modules)) {
    return user.modules.includes(moduleId)
  }

  // Fallback: allow ALL modules for any authenticated user
  // Admins can later restrict by assigning an explicit modules list
  return ["pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios"].includes(moduleId)
}

export function checkPermissionWithToast(moduleId: ModuleId, user: any, moduleName?: string): boolean {
  const hasAccess = hasPermission(moduleId, user)

  if (!hasAccess) {
    toast({
      title: "Sem permissão de acesso",
      description: `Você não tem permissão para acessar ${moduleName || "este módulo"}.`,
      variant: "destructive",
    })
  }

  return hasAccess
}

export function getUserPermissions(user: any): ModuleId[] {
  if (!user) {
    return []
  }

  const role = (user.role || "").toLowerCase()

  // Superadmin and admin have all permissions
  if (role === "superadmin" || role === "admin" || role === "administrador") {
    return ["pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios"]
  }

  const modules = (user.modules || []) as ModuleId[]
  // Ensure ALL modules by default (admin can restrict later)
  return modules.length ? modules : ["pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios"]
}

export function canAccessRoute(pathname: string, user: any): boolean {
  if (!user) {
    return false
  }

  const role = (user.role || "").toLowerCase()

  // Superadmin and admin can access everything
  if (role === "superadmin" || role === "admin" || role === "administrador") {
    return true
  }

  // Check if the route matches any module the user has access to
  const userModules = ((user.modules || []).length
    ? user.modules
    : ["pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios"]) as ModuleId[]

  for (const moduleId of userModules) {
    const routes = MODULE_ROUTES[moduleId]
    if (routes.some((route) => pathname.startsWith(route))) {
      return true
    }
  }

  return false
}
