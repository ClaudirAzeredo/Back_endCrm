"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import PieChart from "./pie-chart"
import DonutChart from "./donut-chart"
import { TrendingUp, Users, DollarSign, Target, ArrowUp, ArrowDown, Minus } from "lucide-react"

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
  funnelId?: string
}

type LeadsMovementDashboardProps = {
  leads: Lead[]
  period: "7d" | "30d" | "90d" | "1y"
  onPeriodChange: (period: "7d" | "30d" | "90d" | "1y") => void
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B", "#82CA9D", "#FFC658"]

export default function LeadsMovementDashboard({ leads, period, onPeriodChange }: LeadsMovementDashboardProps) {
  const [activeTab, setActiveTab] = useState("status")
  const [chartType, setChartType] = useState<"pie" | "donut">("pie")

  // Cálculos gerais
  const stats = useMemo(() => {
    const now = new Date()
    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    const totalLeads = leads.length
    const newLeads = leads.filter((lead) => new Date(lead.createdAt) >= periodStart).length
    const convertedLeads = leads.filter((lead) => lead.status === "ganho" || lead.status === "won").length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0)
    const avgValue = totalLeads > 0 ? totalValue / totalLeads : 0

    return {
      totalLeads,
      newLeads,
      convertedLeads,
      conversionRate,
      totalValue,
      avgValue,
    }
  }, [leads, period])

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Leads por status
    const leadsByStatus = leads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const statusData = Object.entries(leadsByStatus).map(([status, count]) => ({
      name:
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
                    : status === "interesse"
                      ? "Interesse"
                      : status === "contato"
                        ? "Contato"
                        : status === "demonstracao"
                          ? "Demonstração"
                          : status === "fechamento"
                            ? "Fechamento"
                            : status === "prospeccao"
                              ? "Prospecção"
                              : status === "primeiro_contato"
                                ? "Primeiro Contato"
                                : status === "avaliacao"
                                  ? "Avaliação"
                                  : status === "acordo"
                                    ? "Acordo"
                                    : status === "rejeitado"
                                      ? "Rejeitado"
                                      : status,
      value: count,
      percentage: ((count / leads.length) * 100).toFixed(1),
    }))

    // Leads por origem
    const leadsBySource = leads.reduce(
      (acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const sourceData = Object.entries(leadsBySource).map(([source, count]) => ({
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
      percentage: ((count / leads.length) * 100).toFixed(1),
    }))

    // Leads por prioridade
    const leadsByPriority = leads.reduce(
      (acc, lead) => {
        acc[lead.priority] = (acc[lead.priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const priorityData = Object.entries(leadsByPriority).map(([priority, count]) => ({
      name:
        priority === "urgent"
          ? "Urgente"
          : priority === "high"
            ? "Alta"
            : priority === "medium"
              ? "Média"
              : priority === "low"
                ? "Baixa"
                : priority,
      value: count,
      percentage: ((count / leads.length) * 100).toFixed(1),
    }))

    // Leads por valor
    const valueRanges = [
      { range: "0-25k", min: 0, max: 25000 },
      { range: "25k-50k", min: 25000, max: 50000 },
      { range: "50k-100k", min: 50000, max: 100000 },
      { range: "100k+", min: 100000, max: Number.POSITIVE_INFINITY },
    ]

    const valueData = valueRanges.map(({ range, min, max }) => {
      const count = leads.filter((lead) => lead.estimatedValue >= min && lead.estimatedValue < max).length
      return {
        name: `R$ ${range}`,
        value: count,
        percentage: leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : "0",
      }
    })

    return {
      status: statusData,
      source: sourceData,
      priority: priorityData,
      value: valueData,
    }
  }, [leads])

  const renderChart = (data: any[]) => {
    const chartProps = {
      data,
      colors: COLORS,
      width: 400,
      height: 300,
    }

    return chartType === "pie" ? <PieChart {...chartProps} /> : <DonutChart {...chartProps} />
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Análise de Movimentação de Leads</h2>
          <p className="text-muted-foreground">Visualização detalhada em formato pizza</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={chartType} onValueChange={(value: "pie" | "donut") => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pie">Pizza</SelectItem>
              <SelectItem value="donut">Rosquinha</SelectItem>
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

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{stats.newLeads}</span> novos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{stats.convertedLeads} leads convertidos</p>
            <Progress value={stats.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalValue.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Média: R$ {stats.avgValue.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {stats.newLeads > 0 ? (
                <ArrowUp className="h-5 w-5 text-green-600 mr-1" />
              ) : stats.newLeads < 0 ? (
                <ArrowDown className="h-5 w-5 text-red-600 mr-1" />
              ) : (
                <Minus className="h-5 w-5 text-gray-600 mr-1" />
              )}
              {Math.abs(stats.newLeads)}
            </div>
            <p className="text-xs text-muted-foreground">Novos leads no período</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Por Status</TabsTrigger>
          <TabsTrigger value="source">Por Origem</TabsTrigger>
          <TabsTrigger value="priority">Por Prioridade</TabsTrigger>
          <TabsTrigger value="value">Por Valor</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualização em {chartType === "pie" ? "pizza" : "rosquinha"}
                </p>
              </CardHeader>
              <CardContent className="flex justify-center">{renderChart(chartData.status)}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.status.map((item, index) => (
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
          </div>
        </TabsContent>

        <TabsContent value="source" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Origem</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualização em {chartType === "pie" ? "pizza" : "rosquinha"}
                </p>
              </CardHeader>
              <CardContent className="flex justify-center">{renderChart(chartData.source)}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Origem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.source.map((item, index) => (
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
          </div>
        </TabsContent>

        <TabsContent value="priority" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Prioridade</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualização em {chartType === "pie" ? "pizza" : "rosquinha"}
                </p>
              </CardHeader>
              <CardContent className="flex justify-center">{renderChart(chartData.priority)}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.priority.map((item, index) => (
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
          </div>
        </TabsContent>

        <TabsContent value="value" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Valor</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualização em {chartType === "pie" ? "pizza" : "rosquinha"}
                </p>
              </CardHeader>
              <CardContent className="flex justify-center">{renderChart(chartData.value)}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.value.map((item, index) => (
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
