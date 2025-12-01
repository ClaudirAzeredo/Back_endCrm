export type PlanType = "completo" | "crm" | "chat"

export interface Company {
  id: string
  name: string
  email: string
  status: "ativo" | "inativo"
  plan: PlanType
  createdAt: string
  usersCount?: number
  leadsCount?: number
}

export interface CompanyUser {
  id: string
  companyId: string
  name: string
  email: string
  role: string
  status: "ativo" | "suspenso"
  createdAt: string
  modules?: string[] // Array of module names the user can access
}
