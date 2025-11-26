"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { getCurrentUser, setCurrentUser, logout } from "@/lib/storage"
import { authApi } from "@/lib/api/auth-api"
import { usersApi } from "@/lib/api/users-api"
import { companiesApi } from "@/lib/api/companies-api"
import type { Company } from "@/lib/types/company"
import type { JobTitle } from "@/lib/types/job-title"
import { jobTitlesApi } from "@/lib/api/job-titles-api"
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Edit,
  Trash2,
  LogOut,
  Crown,
  Network,
  Eye,
  EyeOff,
  Briefcase,
  Plus,
} from "lucide-react"

type UserType = {
  id: string
  name: string
  email: string
  password: string // Added password field
  phone?: string
  role: "admin" | "manager" | "supervisor" | "employee"
  jobTitleId?: string // Added job title reference
  department?: string
  position?: string
  status: "active" | "inactive"
  createdAt: string
  lastLogin?: string
  supervisorId?: string // ID of the user's supervisor/manager
  teamMembers?: string[] // IDs of users this person supervises
  modules?: string[] // Array of accessible modules
  companyId?: string // Added companyId field
}

type UserManagementProps = {
  onUserChange?: (user: UserType | null) => void
}

const AVAILABLE_MODULES = [
  { id: "pipeline", name: "Pipeline De Leads" },
  { id: "unichat", name: "UniChat" },
  { id: "dashboard", name: "Dashboard" },
  { id: "tarefas", name: "Tarefas" },
  { id: "relatorios", name: "Relatórios" },
  { id: "configuracoes", name: "Configurações" },
  { id: "usuarios", name: "Gerenciamento De Usuários" },
]

export default function UserManagement({ onUserChange }: UserManagementProps) {
  const [users, setUsers] = useState<UserType[]>([])
  const [currentUser, setCurrentUserState] = useState<UserType | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [activeTab, setActiveTab] = useState("users")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [companies, setCompanies] = useState<Company[]>([])

  const [jobTitles, setJobTitles] = useState<JobTitle[]>([])
  const [isAddJobTitleOpen, setIsAddJobTitleOpen] = useState(false)
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null)
  const [jobTitleForm, setJobTitleForm] = useState({
    name: "",
    systemRole: "employee" as "admin" | "manager" | "supervisor" | "employee",
    canViewSameRoleData: true,
  })

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // Added password field
    confirmPassword: "", // Added confirm password field
    phone: "",
    role: "employee" as "admin" | "manager" | "supervisor" | "employee",
    jobTitleId: "", // Added job title selection
    department: "",
    position: "",
    supervisorId: "", // Added supervisor reference
    companyId: "",
    modules: ["pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios"] as string[], // Updated to initialize with all modules selected by default
  })

  useEffect(() => {
    const init = async () => {
      let storedCurrentUser = getCurrentUser()

      // Fallback para /auth/me quando não há user em storage ou falta companyId
      if (!storedCurrentUser || !storedCurrentUser.companyId) {
        try {
          const me = await authApi.me()
          storedCurrentUser = me as any
          console.log("[v0] Loaded current user from /auth/me:", me)
        } catch (e) {
          console.warn("[v0] Could not load user from /auth/me", e)
        }
      }

      setCurrentUserState(storedCurrentUser)
      // Pré-seleciona empresa do usuário logado no formulário
      if (!editingUser && storedCurrentUser?.companyId) {
        setFormData((prev) => ({ ...prev, companyId: storedCurrentUser!.companyId }))
      }

      // Load companies from API (filtered by current company)
      try {
        const list = await companiesApi.list(storedCurrentUser?.companyId)
        const arr = Array.isArray(list) ? list : []
        // Defensive client-side filter: ensure only current tenant's company is shown
        const filtered = storedCurrentUser?.companyId
          ? arr.filter((c) => c.id === storedCurrentUser!.companyId)
          : arr
        setCompanies(filtered)
      } catch (e) {
        console.warn("[api] Could not load companies", e)
        setCompanies([])
      }
      try {
        const apiJobTitles = await jobTitlesApi.list(storedCurrentUser?.companyId)
        setJobTitles(Array.isArray(apiJobTitles) ? apiJobTitles : [])
      } catch (e) {
        console.warn("[api] Could not load job titles", e)
        setJobTitles([])
      }

      if (storedCurrentUser?.companyId) {
        try {
          const apiUsers = await usersApi.list(storedCurrentUser.companyId)
          console.log("[api] Loaded users for company:", storedCurrentUser.companyId, apiUsers)
          setUsers(Array.isArray(apiUsers) ? apiUsers : [])
        } catch (e) {
          console.error("[api] Failed to load users:", e)
          setUsers([])
        }
      } else {
        console.log("[v0] No current user or companyId, setting empty users array")
        setUsers([])
      }
    }
    init()
  }, [onUserChange])

  const handleAddJobTitle = async () => {
    if (!jobTitleForm.name.trim()) {
      alert("Por favor, insira um nome para o cargo")
      return
    }

    // Validação de duplicidade por empresa (case-insensitive)
    const exists = jobTitles.some(
      (jt) => jt.name.trim().toLowerCase() === jobTitleForm.name.trim().toLowerCase(),
    )
    if (exists) {
      alert("Já existe um cargo com esse nome nesta empresa")
      return
    }

    try {
      if (!currentUser?.companyId) {
        alert("Não foi possível identificar a empresa do usuário atual")
        return
      }
      await jobTitlesApi.create({
        name: jobTitleForm.name.trim(),
        systemRole: jobTitleForm.systemRole,
        companyId: currentUser.companyId,
        canViewSameRoleData: jobTitleForm.canViewSameRoleData,
      })
      const apiJobTitles = await jobTitlesApi.list(currentUser.companyId)
      setJobTitles(Array.isArray(apiJobTitles) ? apiJobTitles : [])
    } catch (e: any) {
      alert(e?.message || "Falha ao criar cargo")
    }
    resetJobTitleForm()
  }

  const handleEditJobTitle = (jobTitle: JobTitle) => {
    setEditingJobTitle(jobTitle)
    setJobTitleForm({
      name: jobTitle.name,
      systemRole: jobTitle.systemRole,
      canViewSameRoleData: jobTitle.canViewSameRoleData !== false,
    })
    setIsAddJobTitleOpen(true)
  }

  const handleUpdateJobTitle = async () => {
    if (!editingJobTitle || !jobTitleForm.name.trim()) return

    // Validação de duplicidade (exclui o próprio em edição)
    const exists = jobTitles.some(
      (jt) => jt.id !== editingJobTitle.id && jt.name.trim().toLowerCase() === jobTitleForm.name.trim().toLowerCase(),
    )
    if (exists) {
      alert("Já existe um cargo com esse nome nesta empresa")
      return
    }

    try {
      await jobTitlesApi.update(editingJobTitle.id, {
        name: jobTitleForm.name.trim(),
        systemRole: jobTitleForm.systemRole,
        canViewSameRoleData: jobTitleForm.canViewSameRoleData,
      })
      const apiJobTitles = await jobTitlesApi.list(currentUser?.companyId)
      setJobTitles(Array.isArray(apiJobTitles) ? apiJobTitles : [])
    } catch (e: any) {
      alert(e?.message || "Falha ao atualizar cargo")
    }
    resetJobTitleForm()
  }

  const handleDeleteJobTitle = async (id: string) => {
    const usersWithJobTitle = users.filter((u) => u.jobTitleId === id)
    if (usersWithJobTitle.length > 0) {
      alert(`Este cargo está sendo usado por ${usersWithJobTitle.length} usuário(s) e não pode ser excluído`)
      return
    }

    try {
      await jobTitlesApi.remove(id)
      const apiJobTitles = await jobTitlesApi.list(currentUser?.companyId)
      setJobTitles(Array.isArray(apiJobTitles) ? apiJobTitles : [])
    } catch (e: any) {
      alert(e?.message || "Falha ao excluir cargo")
    }
  }

  const resetJobTitleForm = () => {
    setJobTitleForm({
      name: "",
      systemRole: "employee",
      canViewSameRoleData: true,
    })
    setEditingJobTitle(null)
    setIsAddJobTitleOpen(false)
  }

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.companyId) {
      alert("Por favor, preencha os campos obrigatórios: nome, email, senha e empresa")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres")
      return
    }

    let role = formData.role
    if (formData.jobTitleId) {
      const jobTitle = jobTitles.find((jt) => jt.id === formData.jobTitleId)
      if (jobTitle) {
        role = jobTitle.systemRole
      }
    }

    const currentUserData = currentUser

    const existingUser = users.find((u: any) => u.email.toLowerCase() === formData.email.toLowerCase())
    if (existingUser) {
      alert("Este email já está cadastrado")
      return
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role,
      jobTitleId: formData.jobTitleId || undefined,
      companyId: formData.companyId,
      modules: formData.modules,
    }

    console.log("[api] Creating new user:", payload)
    try {
      const res = await usersApi.create(payload)
      const createdUser = res.user as UserType

    // Update supervisor's team members
      let updatedUsers: UserType[]
    if (formData.supervisorId) {
      updatedUsers = users.map((u) => {
        if (u.id === formData.supervisorId) {
          return {
            ...u,
            teamMembers: [...(u.teamMembers || []), newUser.id],
          }
        }
        return u
      })
      updatedUsers = [...updatedUsers, createdUser]
    } else {
      updatedUsers = [...users, createdUser]
    }

      setUsers(updatedUsers)

      resetForm()
      alert("Usuário criado com sucesso! Ele já pode fazer login no sistema.")
    } catch (e: any) {
      console.error("[api] Failed to create user:", e)
      alert(e?.message || "Falha ao criar usuário")
    }
  }

const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      confirmPassword: "",
      phone: user.phone || "",
      role: user.role,
      jobTitleId: user.jobTitleId || "",
      department: user.department || "",
      position: user.position || "",
      supervisorId: user.supervisorId || "",
      companyId: user.companyId || "",
      modules: user.modules || [],
    })
    setIsAddUserOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser || !formData.name || !formData.email) return

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }

    if (formData.password && formData.password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres")
      return
    }

    let role = formData.role
    if (formData.jobTitleId) {
      const jobTitle = jobTitles.find((jt) => jt.id === formData.jobTitleId)
      if (jobTitle) {
        role = jobTitle.systemRole
      }
    }

    const updatedUser: UserType = {
      ...editingUser,
      name: formData.name,
      email: formData.email,
      password: formData.password || editingUser.password,
      phone: formData.phone,
      role: role, // Now properly updates role based on job title
      jobTitleId: formData.jobTitleId || undefined,
      department: formData.department,
      position: formData.position,
      supervisorId: formData.supervisorId || undefined,
      modules: formData.modules,
    }

    try {
      const updatePayload: any = {
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        jobTitleId: updatedUser.jobTitleId,
        modules: updatedUser.modules,
      }
      if (formData.password) updatePayload.password = formData.password
      const res = await usersApi.update(editingUser.id, updatePayload)
      const saved = res.user as UserType

    const oldSupervisorId = editingUser.supervisorId
    const newSupervisorId = formData.supervisorId
    let updatedUsers = [...users]

    if (oldSupervisorId !== newSupervisorId) {
      // Remove from old supervisor's team
      if (oldSupervisorId) {
        updatedUsers = updatedUsers.map((u) => {
          if (u.id === oldSupervisorId) {
            return { ...u, teamMembers: u.teamMembers?.filter((id) => id !== editingUser.id) }
          }
          return u
        })
      }
      // Add to new supervisor's team
      if (newSupervisorId) {
        updatedUsers = updatedUsers.map((u) => {
          if (u.id === newSupervisorId) {
            return { ...u, teamMembers: [...(u.teamMembers || []), editingUser.id] }
          }
          return u
        })
      }
    }

    // Update the user itself
    updatedUsers = updatedUsers.map((u) => (u.id === editingUser.id ? updatedUser : u))

    console.log("[api] User updated:", saved)

    setUsers(updatedUsers)

    if (currentUser?.id === editingUser.id) {
      setCurrentUser(updatedUser)
      setCurrentUserState(updatedUser)
      onUserChange?.(updatedUser)
    }

      resetForm()
      alert("Usuário atualizado com sucesso!")
    } catch (e: any) {
      console.error("[api] Failed to update user:", e)
      alert(e?.message || "Falha ao atualizar usuário")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) return

    const userToDelete = users.find((u) => u.id === userId)

    if (userToDelete?.supervisorId) {
      const updatedUsers = users.map((u) => {
        if (u.id === userToDelete.supervisorId) {
          return {
            ...u,
            teamMembers: u.teamMembers?.filter((id) => id !== userId),
          }
        }
        return u
      })
      setUsers(updatedUsers)
      // persistência é feita no backend; aqui só atualizamos estado local
    }

    // Remove user's team members from reporting to this user (if this user was a supervisor)
    const teamMembers = getTeamHierarchy(userId)
    if (teamMembers.length > 0) {
      const updatedUsers = users.map((u) => {
        if (teamMembers.some((member) => member.id === u.id)) {
          return {
            ...u,
            supervisorId: undefined,
          }
        }
        return u
      })
      setUsers(updatedUsers)
      // persistência é feita no backend; aqui só atualizamos estado local
    }

    try {
      await usersApi.remove(userId)
      const finalUsers = users.filter((u) => u.id !== userId)
      setUsers(finalUsers)
    } catch (e: any) {
      console.error("[api] Failed to delete user:", e)
      alert(e?.message || "Falha ao excluir usuário")
    }
  }

  // const handleSwitchUser = (user: UserType) => {
  //   setCurrentUser(user)
  //   setCurrentUserState(user)
  //   onUserChange?.(user)
  // }

  const handleLogout = () => {
    logout()
    setCurrentUserState(null)
    onUserChange?.(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "", // Reset password fields
      confirmPassword: "",
      phone: "",
      role: "employee",
      jobTitleId: "", // Reset job title
      department: "",
      position: "",
      supervisorId: "", // Reset supervisor
      companyId: "",
      modules: ["pipeline", "unichat", "dashboard", "tarefas", "relatorios", "configuracoes", "usuarios"], // Updated to reset with all modules selected by default
    })
    setEditingUser(null)
    setIsAddUserOpen(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleJobTitleChange = (jobTitleId: string) => {
    const jobTitle = jobTitles.find((jt) => jt.id === jobTitleId)
    if (jobTitle) {
      setFormData({ ...formData, jobTitleId, role: jobTitle.systemRole })
    }
  }

  // Normaliza o papel/sistema de cargo para comparação e exibição
  const normalizeRole = (role?: string) => (role ? role.toLowerCase() : "")

  const getJobTitleName = (user: UserType): string => {
    if (user.jobTitleId) {
      const jobTitle = jobTitles.find((jt) => jt.id === user.jobTitleId)
      if (jobTitle) return jobTitle.name
    }
    return getRoleLabel(user.role)
  }

  const getRoleIcon = (role: string) => {
    const r = normalizeRole(role)
    switch (r) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-600" />
      case "manager":
        return <Shield className="h-4 w-4 text-blue-600" />
      case "supervisor":
        return <Network className="h-4 w-4 text-purple-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const r = normalizeRole(role)
    switch (r) {
      case "admin":
        return "bg-yellow-100 text-yellow-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "supervisor":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleLabel = (role: string) => {
    const r = normalizeRole(role)
    switch (r) {
      case "admin":
        return "Administrador"
      case "manager":
        return "Gerente"
      case "supervisor":
        return "Supervisor"
      case "employee":
        return "Funcionário"
      default:
        return role
    }
  }

  const getTeamHierarchy = (userId: string): UserType[] => {
    const user = users.find((u) => u.id === userId)
    if (!user || !user.teamMembers) return []
    return users.filter((u) => user.teamMembers?.includes(u.id))
  }

  const getSupervisor = (userId: string): UserType | undefined => {
    const user = users.find((u) => u.id === userId)
    if (!user || !user.supervisorId) return undefined
    return users.find((u) => u.id === user.supervisorId)
  }

  const toggleModule = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter((m) => m !== moduleId)
        : [...prev.modules, moduleId],
    }))
  }

  const toggleAllModules = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      modules: checked ? AVAILABLE_MODULES.map((m) => m.id) : [],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Gerencie funcionários, cargos e hierarquia do sistema</p>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-muted-foreground text-xs">{getRoleLabel(currentUser.role)}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="job-titles">Cargos</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarquia</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  {users.filter((u) => u.status === "active").length} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Crown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.filter((u) => normalizeRole(u.role) === "admin").length}</div>
                <p className="text-xs text-muted-foreground">Acesso total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gerentes</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.filter((u) => normalizeRole(u.role) === "manager").length}</div>
                <p className="text-xs text-muted-foreground">Gerenciam equipes</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Usuários */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lista de Usuários</CardTitle>
              <Button onClick={() => setIsAddUserOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => {
                  const supervisor = getSupervisor(user.id)
                  const teamMembers = getTeamHierarchy(user.id)

                  return (
                    <div
                      key={user.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar>
                          <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{user.name}</h3>
                            {currentUser?.id === user.id && <Badge variant="secondary">Você</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            {user.department && <span>• {user.department}</span>}
                            {user.position && <span>• {user.position}</span>}
                          </div>
                          {supervisor && (
                            <div className="text-xs text-muted-foreground mt-1">Reporta para: {supervisor.name}</div>
                          )}
                          {teamMembers.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Supervisiona: {teamMembers.length} pessoa(s)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          <Badge className={getRoleBadgeColor(user.role)}>{getJobTitleName(user)}</Badge>
                        </div>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {currentUser?.id !== user.id && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="job-titles" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Cargos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie todos os cargos personalizados que sua empresa precisa
                </p>
              </div>
              <Button onClick={() => setIsAddJobTitleOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cargo
              </Button>
            </CardHeader>
            <CardContent>
              {jobTitles.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum cargo cadastrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">Comece criando os cargos que sua empresa utiliza</p>
                  <Button onClick={() => setIsAddJobTitleOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Cargo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobTitles.map((jobTitle) => (
                    <div key={jobTitle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{jobTitle.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Nível de permissão: {getRoleLabel(jobTitle.systemRole)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditJobTitle(jobTitle)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteJobTitle(jobTitle.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hierarquia Organizacional</CardTitle>
              <p className="text-muted-foreground">Visualize a estrutura hierárquica da equipe</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {users
                  .filter((u) => !u.supervisorId)
                  .map((topUser) => (
                    <div key={topUser.id} className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar>
                          <AvatarFallback>{topUser.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{topUser.name}</span>
                            {getRoleIcon(topUser.role)}
                            <Badge className={getRoleBadgeColor(topUser.role)}>{getRoleLabel(topUser.role)}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {topUser.department && `${topUser.department} • `}
                            {topUser.position || topUser.email}
                          </div>
                        </div>
                      </div>

                      {/* Team Members */}
                      {getTeamHierarchy(topUser.id).length > 0 && (
                        <div className="ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
                          {getTeamHierarchy(topUser.id).map((member) => (
                            <div key={member.id}>
                              <div className="flex items-center space-x-3 p-2 bg-white rounded-lg border">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{member.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium">{member.name}</span>
                                    {getRoleIcon(member.role)}
                                    <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                                      {getRoleLabel(member.role)}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {member.department && `${member.department} • `}
                                    {member.position || member.email}
                                  </div>
                                </div>
                              </div>

                              {/* Sub-team members */}
                              {getTeamHierarchy(member.id).length > 0 && (
                                <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                                  {getTeamHierarchy(member.id).map((subMember) => (
                                    <div
                                      key={subMember.id}
                                      className="flex items-center space-x-3 p-2 bg-white rounded-lg border"
                                    >
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {subMember.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs font-medium">{subMember.name}</span>
                                          <Badge className={getRoleBadgeColor(subMember.role)} variant="outline">
                                            {getRoleLabel(subMember.role)}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {subMember.position || subMember.email}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="login" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trocar de Usuário</CardTitle>
              <p className="text-muted-foreground">Selecione um usuário para fazer login no sistema</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <Card
                    key={user.id}
                    className={`cursor-pointer transition-colors ${
                      currentUser?.id === user.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSwitchUser(user)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{user.name}</h3>
                            {currentUser?.id === user.id && <Badge variant="secondary">Ativo</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            {getRoleIcon(user.role)}
                            <span className="text-xs text-muted-foreground">
                              {user.role === "admin"
                                ? "Administrador"
                                : user.role === "manager"
                                  ? "Gerente"
                                  : user.role === "supervisor"
                                    ? "Supervisor"
                                    : "Funcionário"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Select value={formData.companyId} onValueChange={(val) => setFormData({ ...formData, companyId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="password">Senha {editingUser && "(deixe em branco para manter)"}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Repita a senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="jobTitle">Cargo/Função</Label>
                  <Select value={formData.jobTitleId} onValueChange={handleJobTitleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTitles.map((jobTitle) => (
                        <SelectItem key={jobTitle.id} value={jobTitle.id}>
                          {jobTitle.name} ({getRoleLabel(jobTitle.systemRole)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    O nível de permissão é definido pelo cargo selecionado
                  </p>
                </div>
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Ex: Vendas, Marketing"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Posição</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Júnior, Pleno, Sênior"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Hierarchy */}
            <div className="space-y-4">
              <h3 className="font-medium">Hierarquia</h3>
              <div>
                <Label htmlFor="supervisor">Supervisor/Gerente</Label>
                <Select
                  value={formData.supervisorId}
                  onValueChange={(value) => setFormData({ ...formData, supervisorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um supervisor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {users
                      .filter(
                        (u) =>
                          (u.role === "manager" || u.role === "supervisor" || u.role === "admin") &&
                          u.id !== editingUser?.id,
                      )
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({getRoleLabel(user.role)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Define quem supervisiona este usuário na hierarquia
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Permissões de Acesso</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={formData.modules.length === AVAILABLE_MODULES.length}
                    onCheckedChange={toggleAllModules}
                  />
                  <Label htmlFor="select-all" className="text-sm cursor-pointer">
                    Selecionar todos
                  </Label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Selecione quais módulos o usuário pode acessar</p>
              <div className="grid grid-cols-1 gap-3">
                {AVAILABLE_MODULES.map((module) => (
                  <div key={module.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={module.id}
                      checked={formData.modules.includes(module.id)}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                    <Label htmlFor={module.id} className="flex-1 cursor-pointer font-normal">
                      {module.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={editingUser ? handleUpdateUser : handleAddUser}>
                {editingUser ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddJobTitleOpen} onOpenChange={setIsAddJobTitleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingJobTitle ? "Editar Cargo" : "Adicionar Novo Cargo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="jobTitleName">Nome do Cargo</Label>
              <Input
                id="jobTitleName"
                value={jobTitleForm.name}
                onChange={(e) => setJobTitleForm({ ...jobTitleForm, name: e.target.value })}
                placeholder="Ex: Analista de Vendas, Coordenador"
              />
            </div>
            <div>
              <Label htmlFor="systemRole">Nível de Permissão</Label>
              <Select
                value={jobTitleForm.systemRole}
                onValueChange={(value: "admin" | "manager" | "supervisor" | "employee") =>
                  setJobTitleForm({ ...jobTitleForm, systemRole: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Funcionário (Básico)</SelectItem>
                  <SelectItem value="supervisor">Supervisor (Intermediário)</SelectItem>
                  <SelectItem value="manager">Gerente (Avançado)</SelectItem>
                  <SelectItem value="admin">Administrador (Total)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Define as permissões que usuários com este cargo terão no sistema
              </p>
              <div className="flex items-center gap-2 mt-2">
                {getRoleIcon(jobTitleForm.systemRole)}
                <Badge className={getRoleBadgeColor(jobTitleForm.systemRole)}>
                  {getRoleLabel(jobTitleForm.systemRole)}
                </Badge>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="canViewSameRoleData"
                checked={jobTitleForm.canViewSameRoleData}
                onCheckedChange={(checked) =>
                  setJobTitleForm({ ...jobTitleForm, canViewSameRoleData: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="canViewSameRoleData" className="cursor-pointer font-medium">
                  Compartilhar dados entre usuários do mesmo cargo
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Quando ativado, usuários com este cargo poderão visualizar leads e atendimentos uns dos outros.
                  Usuários em cargos superiores na hierarquia sempre terão acesso aos dados de cargos abaixo.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetJobTitleForm}>
                Cancelar
              </Button>
              <Button onClick={editingJobTitle ? handleUpdateJobTitle : handleAddJobTitle}>
                {editingJobTitle ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
