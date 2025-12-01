"use client"

import { useState, useMemo } from "react"
import MetricCard from "./MetricCard"
import ChartCard from "./ChartCard"
import PieChart from "./PieChart"
import DonutChart from "./DonutChart"

function Dashboard({ leads, tasks, funnels, period, onPeriodChange }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [viewMode, setViewMode] = useState("standard")
  const [selectedFunnelId, setSelectedFunnelId] = useState("all")

  // Filtrar dados por funil selecionado
  const filteredData = useMemo(() => {
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

    return {
      leads: funnelLeads,
      tasks: funnelTasks,
      selectedFunnel,
    }
  }, [leads, tasks, funnels, selectedFunnelId])

  // Cálculos de estatísticas
  const stats = useMemo(() => {
    const { leads: filteredLeads, tasks: filteredTasks } = filteredData
    const now = new Date()
    const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Leads
    const totalLeads = filteredLeads.length
    const newLeads = filteredLeads.filter((lead) => new Date(lead.createdAt) >= periodStart).length
    const convertedLeads = filteredLeads.filter((lead) => lead.status === "ganho" || lead.status === "won").length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    const totalLeadValue = filteredLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0)
    const avgLeadValue = totalLeads > 0 ? totalLeadValue / totalLeads : 0

    // Tarefas
    const totalTasks = filteredTasks.length
    const completedTasks = filteredTasks.filter((task) => task.status === "completed").length
    const pendingTasks = filteredTasks.filter((task) => task.status === "pending").length
    const overdueTasks = filteredTasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== "completed",
    ).length

    return {
      leads: {
        total: totalLeads,
        new: newLeads,
        converted: convertedLeads,
        conversionRate,
        totalValue: totalLeadValue,
        avgValue: avgLeadValue,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
    }
  }, [filteredData, period])

  // Dados para gráficos
  const chartData = useMemo(() => {
    const { leads: filteredLeads } = filteredData

    // Leads por status
    const leadsByStatus = filteredLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {})

    const leadStatusData = Object.entries(leadsByStatus).map(([status, count]) => ({
      name:
        status === "novo"
          ? "Novos"
          : status === "qualificado"
            ? "Qualificados"
            : status === "proposta"
              ? "Proposta"
              : status === "negociacao"
                ? "Negociação"
                : status === "ganho"
                  ? "Ganhos"
                  : status === "perdido"
                    ? "Perdidos"
                    : status,
      value: count,
      percentage: filteredLeads.length > 0 ? ((count / filteredLeads.length) * 100).toFixed(1) : "0",
    }))

    // Leads por origem
    const leadsBySource = filteredLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1
      return acc
    }, {})

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

    return {
      leadStatus: leadStatusData,
      leadSource: leadSourceData,
    }
  }, [filteredData])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard CRM</h1>
          <p className="dashboard-subtitle">
            Visão geral do seu pipeline de vendas
            {filteredData.selectedFunnel && (
              <span className="ml-2 text-blue-600">• {filteredData.selectedFunnel.name}</span>
            )}
          </p>
        </div>
        <div className="dashboard-controls">
          <select
            className="form-select"
            value={selectedFunnelId}
            onChange={(e) => setSelectedFunnelId(e.target.value)}
          >
            <option value="all">Todos os Funis</option>
            {funnels.map((funnel) => (
              <option key={funnel.id} value={funnel.id}>
                {funnel.name}
              </option>
            ))}
          </select>
          <select className="form-select" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
            <option value="90d">90 dias</option>
            <option value="1y">1 ano</option>
          </select>
        </div>
      </div>

      {/* Indicador de funil selecionado */}
      {filteredData.selectedFunnel && (
        <div className="card mb-6" style={{ borderColor: "#3b82f6", backgroundColor: "#eff6ff" }}>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <div>
                  <h3 className="font-medium text-blue-900">{filteredData.selectedFunnel.name}</h3>
                  <p className="text-sm text-blue-700">{filteredData.selectedFunnel.description}</p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                {filteredData.leads.length} leads • {filteredData.tasks.length} tarefas
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="tabs">
        <div className="tabs-list">
          <button
            className={`tabs-trigger ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Visão Geral
          </button>
          <button
            className={`tabs-trigger ${activeTab === "leads" ? "active" : ""}`}
            onClick={() => setActiveTab("leads")}
          >
            Análise de Leads
          </button>
          <button
            className={`tabs-trigger ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            Gestão de Tarefas
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Cards de estatísticas principais */}
              <div className="metrics-grid">
                <MetricCard
                  title="Total de Leads"
                  value={stats.leads.total}
                  change={`+${stats.leads.new} novos no período`}
                  changeType="positive"
                  icon="👥"
                />
                <MetricCard
                  title="Taxa de Conversão"
                  value={`${stats.leads.conversionRate.toFixed(1)}%`}
                  change={`${stats.leads.converted} leads convertidos`}
                  changeType="neutral"
                  icon="🎯"
                />
                <MetricCard
                  title="Valor Total Pipeline"
                  value={`R$ ${stats.leads.totalValue.toLocaleString("pt-BR")}`}
                  change={`Média: R$ ${stats.leads.avgValue.toLocaleString("pt-BR")}`}
                  changeType="neutral"
                  icon="💰"
                />
                <MetricCard
                  title="Tarefas Concluídas"
                  value={stats.tasks.completed}
                  change={`${stats.tasks.completionRate.toFixed(1)}% de conclusão`}
                  changeType="positive"
                  icon="✅"
                />
              </div>

              {/* Gráficos principais */}
              <div className="charts-grid">
                <ChartCard title="Distribuição de Leads por Status">
                  <PieChart data={chartData.leadStatus} />
                </ChartCard>
                <ChartCard title="Leads por Origem">
                  <DonutChart data={chartData.leadSource} />
                </ChartCard>
              </div>
            </div>
          )}

          {activeTab === "leads" && (
            <div className="space-y-6">
              <div className="metrics-grid">
                <MetricCard
                  title="Total de Leads"
                  value={stats.leads.total}
                  change="Todos os leads cadastrados"
                  changeType="neutral"
                  icon="👥"
                />
                <MetricCard
                  title="Novos Leads"
                  value={stats.leads.new}
                  change="No período selecionado"
                  changeType="positive"
                  icon="📈"
                />
                <MetricCard
                  title="Taxa de Conversão"
                  value={`${stats.leads.conversionRate.toFixed(1)}%`}
                  change={`${stats.leads.converted} convertidos`}
                  changeType="positive"
                  icon="🎯"
                />
                <MetricCard
                  title="Valor Médio"
                  value={`R$ ${stats.leads.avgValue.toLocaleString("pt-BR")}`}
                  change="Por lead"
                  changeType="neutral"
                  icon="💰"
                />
              </div>

              <div className="charts-grid">
                <ChartCard title="Análise por Origem">
                  <div className="space-y-4">
                    {chartData.leadSource.map((item, index) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500">
                            {item.value} leads ({item.percentage}%)
                          </span>
                        </div>
                        <div className="progress">
                          <div className="progress-bar" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
                <ChartCard title="Distribuição por Status">
                  <PieChart data={chartData.leadStatus} />
                </ChartCard>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-6">
              <div className="metrics-grid">
                <MetricCard
                  title="Total de Tarefas"
                  value={stats.tasks.total}
                  change="Todas as tarefas"
                  changeType="neutral"
                  icon="📋"
                />
                <MetricCard
                  title="Concluídas"
                  value={stats.tasks.completed}
                  change={`${stats.tasks.completionRate.toFixed(1)}% de conclusão`}
                  changeType="positive"
                  icon="✅"
                />
                <MetricCard
                  title="Pendentes"
                  value={stats.tasks.pending}
                  change="Aguardando execução"
                  changeType="neutral"
                  icon="⏳"
                />
                <MetricCard
                  title="Atrasadas"
                  value={stats.tasks.overdue}
                  change="Requerem atenção imediata"
                  changeType="negative"
                  icon="⚠️"
                />
              </div>

              <div className="charts-grid">
                <ChartCard title="Performance de Tarefas">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taxa de Conclusão</span>
                      <span className="text-sm text-gray-500">{stats.tasks.completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${stats.tasks.completionRate}%` }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.tasks.completed}</div>
                        <div className="text-sm text-gray-500">Concluídas</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{stats.tasks.overdue}</div>
                        <div className="text-sm text-gray-500">Atrasadas</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
