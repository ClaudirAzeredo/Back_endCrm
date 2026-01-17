"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import LeadsMovementDashboard from "./leads-movement-dashboard"
import { loadFromStorage } from "@/lib/storage"
import { useApiAuth } from "@/hooks/use-api-auth"
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Award,
  Phone,
  ArrowUp,
  PieChartIcon,
  BarChart3,
  Filter,
} from "lucide-react"

// Tipos
type Lead = {
  id: string
  name: string
  company: string
  status: string
  priority: "low" | "medium" | "high" | "urgent"
  source: string
  estimatedValue: number
  expectedCloseDate: string
  createdAt: string
  funnelId?: string // Novo campo para identificar o funil
}

type Task = {
  id: string
  title: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: string
  createdAt: string
  leadId?: string
  funnelId?: string // Novo campo para identificar o funil
}

type Funnel = {
  id: string
  name: string
  description: string
  columns: Array<{
    id: string
    name: string
    color: string
    order: number
  }>
  isActive: boolean
  createdAt: string
}

type DashboardProps = {
  leads: Lead[]
  projects: any[] // Mantemos para compatibilidade, mas não usamos
  tasks: Task[]
  funnels: Funnel[] // Nova prop para os funis
  period: "7d" | "30d" | "90d" | "1y"
  onPeriodChange: (period: "7d" | "30d" | "90d" | "1y") => void
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B"]

export default function Dashboard({ period, onPeriodChange }: DashboardProps) {
  const { user } = useApiAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [viewMode, setViewMode] = useState<"standard" | "pizza">("standard")
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("all")

  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [funnels, setFunnels] = useState<Funnel[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        // Load funnels from storage (UI only) while backend provides stats
        const storedFunnels = loadFromStorage("funnels", [])
        const validFunnels = Array.isArray(storedFunnels) ? storedFunnels : []
        if (mounted) setFunnels(validFunnels)

        // Fetch stats/charts from backend
        const params: Record<string, any> = { period }
        if (user?.companyId) params.companyId = user.companyId
        if (selectedFunnelId && selectedFunnelId !== "all") params.funnelId = selectedFunnelId
        const resp = await (await import("@/lib/api-client")).apiClient.get<any>(`/dashboard/leads`, params)

        // Derive minimal local lists for compatibility, if needed
        // Use backend stats directly in UI via state replacement
        if (mounted) {
          // Patch computed memo sources by injecting backend values
          (window as any).__dashboard_backend__ = resp
        }
      } catch (e) {
        console.error("[v0] Failed to load dashboard from backend:", e)
      }
    }
    load()
    return () => { mounted = false }
  }, [period, selectedFunnelId, user?.companyId])

  const filteredData = useMemo(() => {
    console.log("[v0] Filtering data for funnel:", selectedFunnelId)
    console.log("[v0] Available leads:", leads.length)
    console.log("[v0] Available tasks:", tasks.length)

    if (selectedFunnelId === "all") {
      return {
        leads: leads,
        tasks: tasks,
        selectedFunnel: null,
      }
    }

    const selectedFunnel = funnels.find((f) => f.id === selectedFunnelId)
    const funnelLeads = leads.filter((lead) => lead.funnelId === selectedFunnelId)
    const funnelTasks = tasks.filter((task) => task.funnelId === selectedFunnelId)

    console.log("[v0] Filtered leads for funnel:", funnelLeads.length)
    console.log("[v0] Filtered tasks for funnel:", funnelTasks.length)

    return {
      leads: funnelLeads,
      tasks: funnelTasks,
      selectedFunnel,
    }
  }, [leads, tasks, funnels, selectedFunnelId])

  const stats = useMemo(() => {
    const backend = (typeof window !== "undefined" && (window as any).__dashboard_backend__) || null
    if (backend?.stats) return backend.stats
    const { leads: filteredLeads, tasks: filteredTasks, selectedFunnel } = filteredData
    console.log("[v0] Calculating stats for", filteredLeads.length, "leads")

    const now = new Date()
    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Leads calculations
    const totalLeads = filteredLeads.length
    const newLeads = filteredLeads.filter((lead) => new Date(lead.createdAt) >= periodStart).length

    // Better status mapping for conversion detection
    const wonStatuses = ["ganho", "won", "fechado", "vendido", "convertido"]
    const convertedLeads = filteredLeads.filter((lead) =>
      wonStatuses.some((status) => lead.status.toLowerCase().includes(status.toLowerCase())),
    ).length

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    const totalLeadValue = filteredLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
    const avgLeadValue = totalLeads > 0 ? totalLeadValue / totalLeads : 0

    // Enhanced status mapping using funnel columns
    const statusCounts = {
      qualified: 0,
      proposal: 0,
      negotiation: 0,
      lost: 0,
      new: 0,
    }

    if (selectedFunnel && selectedFunnel.columns) {
      // Use actual funnel columns for more accurate counting
      selectedFunnel.columns.forEach((column) => {
        const columnLeads = filteredLeads.filter((lead) => lead.status === column.id)
        statusCounts[column.id as keyof typeof statusCounts] = columnLeads.length
      })
    } else {
      // Fallback to generic status mapping
      const qualifiedStatuses = ["qualificado", "qualified", "interessado"]
      const proposalStatuses = ["proposta", "proposal", "orcamento"]
      const negotiationStatuses = ["negociacao", "negotiation", "fechamento"]
      const lostStatuses = ["perdido", "lost", "cancelado"]
      const newStatuses = ["novo", "new", "lead", "contato"]

      statusCounts.qualified = filteredLeads.filter((lead) =>
        qualifiedStatuses.some((status) => lead.status.toLowerCase().includes(status.toLowerCase())),
      ).length

      statusCounts.proposal = filteredLeads.filter((lead) =>
        proposalStatuses.some((status) => lead.status.toLowerCase().includes(status.toLowerCase())),
      ).length

      statusCounts.negotiation = filteredLeads.filter((lead) =>
        negotiationStatuses.some((status) => lead.status.toLowerCase().includes(status.toLowerCase())),
      ).length

      statusCounts.lost = filteredLeads.filter((lead) =>
        lostStatuses.some((status) => lead.status.toLowerCase().includes(status.toLowerCase())),
      ).length

      statusCounts.new = filteredLeads.filter((lead) =>
        newStatuses.some((status) => lead.status.toLowerCase().includes(status.toLowerCase())),
      ).length
    }

    // Tasks calculations
    const totalTasks = filteredTasks.length
    const completedTasks = filteredTasks.filter((task) => task.status === "completed").length
    const pendingTasks = filteredTasks.filter((task) => task.status === "pending").length
    const overdueTasks = filteredTasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== "completed",
    ).length

    const calculatedStats = {
      leads: {
        total: totalLeads,
        new: newLeads,
        converted: convertedLeads,
        conversionRate,
        totalValue: totalLeadValue,
        avgValue: avgLeadValue,
        qualified: statusCounts.qualified,
        proposal: statusCounts.proposal,
        negotiation: statusCounts.negotiation,
        lost: statusCounts.lost,
        newCount: statusCounts.new,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
    }

    console.log("[v0] Calculated stats:", calculatedStats)
    return calculatedStats
  }, [filteredData, period])

  // Dados para gráficos simplificados baseados no funil selecionado
  const chartData = useMemo(() => {
    const backend = (typeof window !== "undefined" && (window as any).__dashboard_backend__) || null
    if (backend?.charts) return backend.charts
    const { leads: filteredLeads, selectedFunnel } = filteredData

    // Leads por status (usando colunas do funil se selecionado)
    const leadsByStatus = filteredLeads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const leadStatusData = Object.entries(leadsByStatus).map(([status, count]) => {
      let statusName = status

      // Se há um funil selecionado, usar os nomes das colunas
      if (selectedFunnel) {
        const column = selectedFunnel.columns.find((col) => col.id === status)
        statusName = column ? column.name : status
      } else {
        // Mapeamento padrão
        statusName =
          status === "novo" || status === "new"
            ? "Novos"
            : status === "qualificado" || status === "qualified"
              ? "Qualificados"
              : status === "proposta" || status === "proposal"
                ? "Proposta"
                : status === "negociacao" || status === "negotiation"
                  ? "Negociação"
                  : status === "ganho" || status === "won"
                    ? "Ganhos"
                    : status === "perdido" || status === "lost"
                      ? "Perdidos"
                      : status
      }

      return {
        name: statusName,
        value: count,
        percentage: filteredLeads.length > 0 ? ((count / filteredLeads.length) * 100).toFixed(1) : "0",
      }
    })

    // Leads por origem
    const leadsBySource = filteredLeads.reduce(
      (acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const leadSourceData = Object.entries(leadsBySource).map(([source, count]) => ({
      name:
        source === "website"
          ? "Website"
          : source === "google_ads"
            ? "Google Ads"
            : source === "referral"
              ? "Indicação"
              : source === "linkedin"
                ? "LinkedIn"
                : source === "phone"
                  ? "Telefone"
                  : source,
      value: count,
      percentage: filteredLeads.length > 0 ? ((count / filteredLeads.length) * 100).toFixed(1) : "0",
    }))

    // Leads por valor
    const leadValueRanges = [
      { range: "0-25k", min: 0, max: 25000 },
      { range: "25k-50k", min: 25000, max: 50000 },
      { range: "50k-100k", min: 50000, max: 100000 },
      { range: "100k+", min: 100000, max: Number.POSITIVE_INFINITY },
    ]

    const leadValueData = leadValueRanges.map(({ range, min, max }) => {
      const count = filteredLeads.filter((lead) => lead.estimatedValue >= min && lead.estimatedValue < max).length
      return {
        name: range,
        value: count,
        percentage: filteredLeads.length > 0 ? ((count / filteredLeads.length) * 100).toFixed(1) : "0",
      }
    })

    return {
      leadStatus: leadStatusData,
      leadSource: leadSourceData,
      leadValue: leadValueData,
    }
  }, [filteredData])

  // Se o modo pizza estiver ativo, renderizar o dashboard de pizza
  if (viewMode === "pizza") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard CRM</h1>
            <p className="text-muted-foreground">
              Visão geral do seu pipeline de vendas
              {filteredData.selectedFunnel && (
                <span className="ml-2 text-blue-600">• {filteredData.selectedFunnel.name}</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar funil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Todos os Funis
                  </div>
                </SelectItem>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      {funnel.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={viewMode === "standard" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("standard")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Padrão
            </Button>
            <Button
              variant={viewMode === "pizza" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("pizza")}
            >
              <PieChartIcon className="h-4 w-4 mr-2" />
              Pizza
            </Button>
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <LeadsMovementDashboard leads={filteredData.leads} period={period} onPeriodChange={onPeriodChange} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard CRM</h1>
          <p className="text-muted-foreground">
            Visão geral do seu pipeline de vendas
            {filteredData.selectedFunnel && (
              <span className="ml-2 text-blue-600">• {filteredData.selectedFunnel.name}</span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar funil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Todos os Funis
                </div>
              </SelectItem>
              {funnels.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    {funnel.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={viewMode === "standard" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("standard")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Padrão
          </Button>
          <Button variant={viewMode === "pizza" ? "default" : "outline"} size="sm" onClick={() => setViewMode("pizza")}>
            <PieChartIcon className="h-4 w-4 mr-2" />
            Pizza
          </Button>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Indicador de funil selecionado */}
      {filteredData.selectedFunnel && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <div>
                  <h3 className="font-medium text-blue-900">{filteredData.selectedFunnel.name}</h3>
                  <p className="text-sm text-blue-700">{filteredData.selectedFunnel.description}</p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                {filteredData.leads.length} leads • {filteredData.tasks.length} tarefas
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="leads">Análise de Leads</TabsTrigger>
          <TabsTrigger value="tasks">Gestão de Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cards de estatísticas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.total}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+{stats.leads.new}</span> novos no período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">{stats.leads.converted} leads convertidos</p>
                <Progress value={stats.leads.conversionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total Pipeline</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {stats.leads.totalValue.toLocaleString("pt-BR")}</div>
                <p className="text-xs text-muted-foreground">
                  Média: R$ {stats.leads.avgValue.toLocaleString("pt-BR")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.qualified}</div>
                <p className="text-xs text-muted-foreground">Prontos para proposta</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos principais - versão simplificada */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Leads por Status</CardTitle>
                {filteredData.selectedFunnel && (
                  <p className="text-sm text-muted-foreground">Funil: {filteredData.selectedFunnel.name}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.leadStatus.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                        <span className="text-sm font-bold">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leads por Origem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.leadSource.map((item, index) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.value} ({item.percentage}%)
                        </span>
                      </div>
                      <Progress value={Number.parseFloat(item.percentage)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards de pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Proposta</CardTitle>
                <Phone className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.proposal}</div>
                <p className="text-xs text-muted-foreground">Aguardando resposta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.negotiation}</div>
                <p className="text-xs text-muted-foreground">Próximos ao fechamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads Ganhos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.converted}</div>
                <p className="text-xs text-muted-foreground">Fechamentos realizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads Perdidos</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.lost}</div>
                <p className="text-xs text-muted-foreground">Oportunidades perdidas</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {/* Estatísticas detalhadas de Leads */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.total}</div>
                <p className="text-xs text-muted-foreground">Todos os leads cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.new}</div>
                <p className="text-xs text-muted-foreground">No período selecionado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">{stats.leads.converted} convertidos</p>
                <Progress value={stats.leads.conversionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {stats.leads.avgValue.toLocaleString("pt-BR")}</div>
                <p className="text-xs text-muted-foreground">Por lead</p>
              </CardContent>
            </Card>
          </div>

          {/* Análise detalhada de leads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise por Origem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.leadSource.map((item, index) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.value} leads ({item.percentage}%)
                        </span>
                      </div>
                      <Progress value={Number.parseFloat(item.percentage)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.leadValue.map((item, index) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">R$ {item.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.value} leads ({item.percentage}%)
                        </span>
                      </div>
                      <Progress value={Number.parseFloat(item.percentage)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funil de conversão */}
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
              {filteredData.selectedFunnel && (
                <p className="text-sm text-muted-foreground">Funil: {filteredData.selectedFunnel.name}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{stats.leads.newCount}</div>
                    <div className="text-sm text-muted-foreground">Novos</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-gray-600 h-2 rounded-full w-full" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.leads.qualified}</div>
                    <div className="text-sm text-muted-foreground">Qualificados</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${stats.leads.newCount > 0 ? (stats.leads.qualified / stats.leads.newCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.leads.proposal}</div>
                    <div className="text-sm text-muted-foreground">Proposta</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{
                          width: `${stats.leads.qualified > 0 ? (stats.leads.proposal / stats.leads.qualified) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.leads.negotiation}</div>
                    <div className="text-sm text-muted-foreground">Negociação</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{
                          width: `${stats.leads.proposal > 0 ? (stats.leads.negotiation / stats.leads.proposal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.leads.converted}</div>
                    <div className="text-sm text-muted-foreground">Fechados</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${stats.leads.negotiation > 0 ? (stats.leads.converted / stats.leads.negotiation) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Estatísticas de Tarefas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.total}</div>
                <p className="text-xs text-muted-foreground">Todas as tarefas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.completed}</div>
                <p className="text-xs text-muted-foreground">{stats.tasks.completionRate.toFixed(1)}% de conclusão</p>
                <Progress value={stats.tasks.completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.pending}</div>
                <p className="text-xs text-muted-foreground">Aguardando execução</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.overdue}</div>
                <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Performance de Tarefas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance de Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Taxa de Conclusão</span>
                    <span className="text-sm text-muted-foreground">{stats.tasks.completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.tasks.completionRate} className="h-3" />

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.tasks.completed}</div>
                      <div className="text-sm text-muted-foreground">Concluídas</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.tasks.overdue}</div>
                      <div className="text-sm text-muted-foreground">Atrasadas</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">Concluídas</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.tasks.completed} ({stats.tasks.completionRate.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={stats.tasks.completionRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm font-medium">Pendentes</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.tasks.pending} (
                        {stats.tasks.total > 0 ? ((stats.tasks.pending / stats.tasks.total) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <Progress
                      value={stats.tasks.total > 0 ? (stats.tasks.pending / stats.tasks.total) * 100 : 0}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm font-medium">Atrasadas</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.tasks.overdue} (
                        {stats.tasks.total > 0 ? ((stats.tasks.overdue / stats.tasks.total) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <Progress
                      value={stats.tasks.total > 0 ? (stats.tasks.overdue / stats.tasks.total) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
