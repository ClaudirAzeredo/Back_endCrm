"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Users, Clock, ArrowRight, Target, Activity, Calendar } from "lucide-react"

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
  statusHistory?: Array<{
    status: string
    timestamp: string
    duration?: number // em dias
  }>
}

type Column = {
  id: string
  name: string
  color: string
  order: number
}

type LeadsHistoryDashboardProps = {
  leads: Lead[]
  columns: Column[]
  period: "7d" | "30d" | "90d" | "1y"
  onPeriodChange: (period: "7d" | "30d" | "90d" | "1y") => void
}

export default function LeadsHistoryDashboard({ leads, columns, period, onPeriodChange }: LeadsHistoryDashboardProps) {
  const [activeTab, setActiveTab] = useState("passage")
  const [selectedColumn, setSelectedColumn] = useState<string>("all")

  // Simular histórico de status para leads existentes
  const leadsWithHistory = useMemo(() => {
    return leads.map((lead) => {
      if (!lead.statusHistory) {
        // Simular histórico baseado na data de criação e status atual
        const createdDate = new Date(lead.createdAt)
        const now = new Date()
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

        const history = [
          {
            status: "novo",
            timestamp: lead.createdAt,
            duration: Math.min(daysSinceCreated, 2),
          },
        ]

        // Adicionar etapas baseadas no status atual
        if (lead.status !== "novo" && lead.status !== "new") {
          history.push({
            status: "qualificado",
            timestamp: new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            duration: Math.min(daysSinceCreated - 2, 3),
          })
        }

        if (["proposta", "negociacao", "ganho", "perdido"].includes(lead.status)) {
          history.push({
            status: "proposta",
            timestamp: new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            duration: Math.min(daysSinceCreated - 5, 4),
          })
        }

        if (["negociacao", "ganho", "perdido"].includes(lead.status)) {
          history.push({
            status: "negociacao",
            timestamp: new Date(createdDate.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
            duration: Math.min(daysSinceCreated - 9, 5),
          })
        }

        if (lead.status === "ganho" || lead.status === "perdido") {
          history.push({
            status: lead.status,
            timestamp: new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            duration: daysSinceCreated - 14,
          })
        }

        return { ...lead, statusHistory: history }
      }
      return lead
    })
  }, [leads])

  // Calcular estatísticas de passagem por etapas
  const passageStats = useMemo(() => {
    const now = new Date()
    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    const stats: Record<string, any> = {}

    columns.forEach((column) => {
      const leadsPassedThrough = leadsWithHistory.filter((lead) =>
        lead.statusHistory?.some(
          (history) => history.status === column.id && new Date(history.timestamp) >= periodStart,
        ),
      )

      const totalLeadsPassedThrough = leadsWithHistory.filter((lead) =>
        lead.statusHistory?.some((history) => history.status === column.id),
      )

      const avgTimeInStage =
        totalLeadsPassedThrough.length > 0
          ? totalLeadsPassedThrough.reduce((sum, lead) => {
              const stageHistory = lead.statusHistory?.find((h) => h.status === column.id)
              return sum + (stageHistory?.duration || 0)
            }, 0) / totalLeadsPassedThrough.length
          : 0

      const conversionRate =
        totalLeadsPassedThrough.length > 0
          ? (totalLeadsPassedThrough.filter((lead) => ["ganho", "won"].includes(lead.status)).length /
              totalLeadsPassedThrough.length) *
            100
          : 0

      stats[column.id] = {
        name: column.name,
        color: column.color,
        passedThroughPeriod: leadsPassedThrough.length,
        totalPassedThrough: totalLeadsPassedThrough.length,
        avgTimeInStage: Math.round(avgTimeInStage),
        conversionRate: Math.round(conversionRate * 10) / 10,
        currentlyInStage: leads.filter((lead) => lead.status === column.id).length,
      }
    })

    return stats
  }, [leadsWithHistory, columns, period])

  // Calcular fluxo entre etapas
  const flowStats = useMemo(() => {
    const flows: Record<string, Record<string, number>> = {}

    leadsWithHistory.forEach((lead) => {
      if (lead.statusHistory && lead.statusHistory.length > 1) {
        for (let i = 0; i < lead.statusHistory.length - 1; i++) {
          const from = lead.statusHistory[i].status
          const to = lead.statusHistory[i + 1].status

          if (!flows[from]) flows[from] = {}
          flows[from][to] = (flows[from][to] || 0) + 1
        }
      }
    })

    return flows
  }, [leadsWithHistory])

  // Filtrar dados por coluna selecionada
  const filteredData = useMemo(() => {
    if (selectedColumn === "all") {
      return Object.values(passageStats)
    }
    return passageStats[selectedColumn] ? [passageStats[selectedColumn]] : []
  }, [passageStats, selectedColumn])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Movimentação</h1>
          <p className="text-muted-foreground">Análise detalhada da passagem de leads pelas etapas</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Etapas</SelectItem>
              {columns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                    {column.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="passage">Passagem por Etapas</TabsTrigger>
          <TabsTrigger value="flow">Fluxo entre Etapas</TabsTrigger>
          <TabsTrigger value="performance">Performance Temporal</TabsTrigger>
        </TabsList>

        <TabsContent value="passage" className="space-y-6">
          {/* Cards de estatísticas por etapa */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(passageStats).map((stat) => (
              <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stat.color }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.totalPassedThrough}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+{stat.passedThroughPeriod}</span> no período
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Atualmente: {stat.currentlyInStage}</span>
                      <span>{stat.conversionRate}% conversão</span>
                    </div>
                    <Progress value={(stat.currentlyInStage / stat.totalPassedThrough) * 100} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico de tempo médio por etapa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Tempo Médio por Etapa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.values(passageStats).map((stat) => (
                  <div key={stat.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="text-sm font-medium">{stat.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{stat.avgTimeInStage} dias em média</span>
                    </div>
                    <Progress value={Math.min((stat.avgTimeInStage / 30) * 100, 100)} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista detalhada de leads por etapa */}
          {selectedColumn !== "all" && passageStats[selectedColumn] && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Leads que Passaram por {passageStats[selectedColumn].name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leadsWithHistory
                    .filter((lead) => lead.statusHistory?.some((h) => h.status === selectedColumn))
                    .slice(0, 10)
                    .map((lead) => {
                      const stageHistory = lead.statusHistory?.find((h) => h.status === selectedColumn)
                      return (
                        <div key={lead.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{lead.company}</p>
                            <p className="text-sm text-muted-foreground">{lead.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{stageHistory?.duration || 0} dias nesta etapa</p>
                            <p className="text-xs text-muted-foreground">Status atual: {lead.status}</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flow" className="space-y-6">
          {/* Matriz de fluxo entre etapas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowRight className="h-5 w-5" />
                <span>Fluxo entre Etapas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(flowStats).map(([fromStage, toStages]) => {
                  const fromColumn = columns.find((c) => c.id === fromStage)
                  if (!fromColumn) return null

                  return (
                    <div key={fromStage} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fromColumn.color }} />
                        <span className="font-medium">{fromColumn.name}</span>
                      </div>
                      <div className="ml-5 space-y-1">
                        {Object.entries(toStages).map(([toStage, count]) => {
                          const toColumn = columns.find((c) => c.id === toStage)
                          if (!toColumn) return null

                          const total = Object.values(toStages).reduce((sum, c) => sum + c, 0)
                          const percentage = ((count / total) * 100).toFixed(1)

                          return (
                            <div key={toStage} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: toColumn.color }} />
                                <span className="text-sm">{toColumn.name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {count} leads ({percentage}%)
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance temporal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio Total</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(Object.values(passageStats).reduce((sum, stat) => sum + stat.avgTimeInStage, 0))} dias
                </div>
                <p className="text-xs text-muted-foreground">Do lead ao fechamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão Geral</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(
                    Object.values(passageStats).reduce((sum, stat) => sum + stat.conversionRate, 0) /
                      Object.values(passageStats).length || 0
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Média entre todas as etapas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads em Movimento</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(passageStats).reduce((sum, stat) => sum + stat.currentlyInStage, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Atualmente no pipeline</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de performance por período */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Performance por Etapa no Período</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.values(passageStats).map((stat) => (
                  <div key={stat.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="text-sm font-medium">{stat.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.passedThroughPeriod} leads • {stat.conversionRate}% conversão
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Passaram no período</div>
                        <Progress value={(stat.passedThroughPeriod / stat.totalPassedThrough) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Taxa de conversão</div>
                        <Progress value={stat.conversionRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
