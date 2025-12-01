"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Users, CreditCard, BarChart3, Eye, Edit, Key, UserX, ArrowLeft } from "lucide-react"
import type { Company, CompanyUser, PlanType } from "@/lib/types/company"
import { getUsersByCompany } from "@/lib/auth"

interface AdminPanelProps {
  onBack: () => void
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    totalLeads: 0,
    totalUsers: 0,
    planStats: {
      completo: 0,
      crm: 0,
      chat: 0,
    },
  })

  useEffect(() => {
    loadCompanies()
    calculateStats()
  }, [])

  const loadCompanies = () => {
    const companiesData = localStorage.getItem("unicrm_companies")
    if (companiesData) {
      setCompanies(JSON.parse(companiesData))
    } else {
      // Initialize with demo data
      const demoCompanies: Company[] = [
        {
          id: "1",
          name: "Empresa Demo",
          email: "contato@empresademo.com",
          status: "ativo",
          plan: "completo",
          createdAt: new Date().toISOString(),
          usersCount: 5,
          leadsCount: 120,
        },
      ]
      localStorage.setItem("unicrm_companies", JSON.stringify(demoCompanies))
      setCompanies(demoCompanies)
    }
  }

  const calculateStats = () => {
    const companiesData = localStorage.getItem("unicrm_companies")
    const companies: Company[] = companiesData ? JSON.parse(companiesData) : []

    const activeCompanies = companies.filter((c) => c.status === "ativo").length
    const totalLeads = companies.reduce((sum, c) => sum + (c.leadsCount || 0), 0)
    const totalUsers = companies.reduce((sum, c) => sum + (c.usersCount || 0), 0)

    const planStats = {
      completo: companies.filter((c) => c.plan === "completo").length,
      crm: companies.filter((c) => c.plan === "crm").length,
      chat: companies.filter((c) => c.plan === "chat").length,
    }

    setStats({
      totalCompanies: companies.length,
      activeCompanies,
      totalLeads,
      totalUsers,
      planStats,
    })
  }

  const handleChangePlan = (companyId: string, newPlan: PlanType) => {
    const updatedCompanies = companies.map((c) => (c.id === companyId ? { ...c, plan: newPlan } : c))
    setCompanies(updatedCompanies)
    localStorage.setItem("unicrm_companies", JSON.stringify(updatedCompanies))
    calculateStats()
  }

  const handleViewUsers = (company: Company) => {
    setSelectedCompany(company)
    const users = getUsersByCompany(company.id)
    const filteredUsers = users.map((u: any) => ({
      id: u.id,
      companyId: u.companyId,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || "ativo",
      createdAt: u.createdAt,
    }))
    setCompanyUsers(filteredUsers)
  }

  const handleResetPassword = (userId: string) => {
    const newPassword = prompt("Digite a nova senha para o usuário:")
    if (newPassword) {
      localStorage.setItem(`password_${userId}`, newPassword)
      alert("Senha resetada com sucesso!")
    }
  }

  const handleSuspendUser = (userId: string) => {
    if (!selectedCompany) return

    const storageKey = `${selectedCompany.id}_unicrm_users`
    const usersData = localStorage.getItem(storageKey)
    if (usersData) {
      const users = JSON.parse(usersData)
      const updatedUsers = users.map((u: any) =>
        u.id === userId ? { ...u, status: u.status === "ativo" ? "suspenso" : "ativo" } : u,
      )
      localStorage.setItem(storageKey, JSON.stringify(updatedUsers))
      handleViewUsers(selectedCompany!)
    }
  }

  const getPlanBadgeColor = (plan: PlanType) => {
    switch (plan) {
      case "completo":
        return "bg-green-500"
      case "crm":
        return "bg-blue-500"
      case "chat":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie empresas, usuários e planos do sistema</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Tabs defaultValue="empresas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="empresas">
            <Building2 className="w-4 h-4 mr-2" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="planos">
            <CreditCard className="w-4 h-4 mr-2" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="estatisticas">
            <BarChart3 className="w-4 h-4 mr-2" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* Empresas Tab */}
        <TabsContent value="empresas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas Cadastradas</CardTitle>
              <CardDescription>Gerencie todas as empresas do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{company.name}</h3>
                        <Badge variant={company.status === "ativo" ? "default" : "secondary"}>{company.status}</Badge>
                        <Badge className={getPlanBadgeColor(company.plan)}>{company.plan.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{company.email}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{company.usersCount || 0} usuários</span>
                        <span>{company.leadsCount || 0} leads</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewUsers(company)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Usuários
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Alterar Plano
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar Plano - {company.name}</DialogTitle>
                            <DialogDescription>Selecione o novo plano para esta empresa</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Plano Atual: {company.plan.toUpperCase()}</Label>
                              <Select
                                defaultValue={company.plan}
                                onValueChange={(value) => handleChangePlan(company.id, value as PlanType)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="completo">Completo (CRM + Chat)</SelectItem>
                                  <SelectItem value="crm">CRM Apenas</SelectItem>
                                  <SelectItem value="chat">Chat Apenas</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuários Tab */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários da Empresa</CardTitle>
              <CardDescription>
                {selectedCompany ? `Usuários de ${selectedCompany.name}` : "Selecione uma empresa na aba Empresas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCompany ? (
                <div className="space-y-4">
                  {companyUsers.length > 0 ? (
                    companyUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            <Badge variant={user.status === "ativo" ? "default" : "destructive"}>{user.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">Cargo: {user.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleResetPassword(user.id)}>
                            <Key className="w-4 h-4 mr-2" />
                            Resetar Senha
                          </Button>
                          <Button
                            variant={user.status === "ativo" ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleSuspendUser(user.id)}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {user.status === "ativo" ? "Suspender" : "Reativar"}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado para esta empresa
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Selecione uma empresa na aba Empresas para ver seus usuários
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planos Tab */}
        <TabsContent value="planos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Plano Completo</CardTitle>
                <CardDescription>CRM + Chat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.planStats.completo}</div>
                <p className="text-sm text-muted-foreground">empresas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>CRM Apenas</CardTitle>
                <CardDescription>Somente CRM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.planStats.crm}</div>
                <p className="text-sm text-muted-foreground">empresas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Chat Apenas</CardTitle>
                <CardDescription>Somente Chat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.planStats.chat}</div>
                <p className="text-sm text-muted-foreground">empresas</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Estatísticas Tab */}
        <TabsContent value="estatisticas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de Empresas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCompanies}</div>
                <p className="text-sm text-muted-foreground">{stats.activeCompanies} ativas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leads Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalLeads}</div>
                <p className="text-sm text-muted-foreground">no sistema</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-sm text-muted-foreground">no sistema</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Acessos Diários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">-</div>
                <p className="text-sm text-muted-foreground">em breve</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
