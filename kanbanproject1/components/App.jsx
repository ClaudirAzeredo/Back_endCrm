"use client"

import { useState } from "react"
import Header from "./Header"
import Navigation from "./Navigation"
import Dashboard from "./Dashboard"
import KanbanBoard from "./KanbanBoard"
import TaskCenter from "./TaskCenter"
import ConversationPanel from "./ConversationPanel"
import "../styles/globals.css"
import "../styles/components.css"

// Dados de exemplo para funis
const sampleFunnels = [
  {
    id: "funnel1",
    name: "Vendas B2B",
    description: "Funil para vendas corporativas",
    columns: [
      { id: "novo", name: "Novos Leads", color: "#64748b", order: 0 },
      { id: "qualificado", name: "Qualificados", color: "#3b82f6", order: 1 },
      { id: "proposta", name: "Proposta", color: "#f59e0b", order: 2 },
      { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3 },
      { id: "ganho", name: "Ganhos", color: "#10b981", order: 4 },
      { id: "perdido", name: "Perdidos", color: "#ef4444", order: 5 },
    ],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "funnel2",
    name: "Vendas B2C",
    description: "Funil para vendas diretas ao consumidor",
    columns: [
      { id: "interesse", name: "Interesse", color: "#64748b", order: 0 },
      { id: "contato", name: "Primeiro Contato", color: "#3b82f6", order: 1 },
      { id: "demonstracao", name: "Demonstração", color: "#f59e0b", order: 2 },
      { id: "fechamento", name: "Fechamento", color: "#10b981", order: 3 },
      { id: "perdido", name: "Perdidos", color: "#ef4444", order: 4 },
    ],
    isActive: true,
    createdAt: "2024-01-02T00:00:00Z",
  },
]

// Dados de exemplo para leads
const sampleLeads = [
  {
    id: "l1",
    name: "João Silva",
    company: "Tech Corp",
    status: "qualificado",
    priority: "high",
    source: "website",
    estimatedValue: 50000,
    expectedCloseDate: "2024-02-15",
    createdAt: "2024-01-10T10:00:00Z",
    funnelId: "funnel1",
  },
  {
    id: "l2",
    name: "Maria Santos",
    company: "Digital Solutions",
    status: "proposta",
    priority: "medium",
    source: "google_ads",
    estimatedValue: 75000,
    expectedCloseDate: "2024-02-20",
    createdAt: "2024-01-12T14:30:00Z",
    funnelId: "funnel1",
  },
  {
    id: "l3",
    name: "Pedro Costa",
    company: "Innovation Labs",
    status: "ganho",
    priority: "urgent",
    source: "referral",
    estimatedValue: 120000,
    expectedCloseDate: "2024-01-30",
    createdAt: "2024-01-05T09:15:00Z",
    funnelId: "funnel1",
  },
  {
    id: "l4",
    name: "Ana Oliveira",
    company: "StartupXYZ",
    status: "interesse",
    priority: "medium",
    source: "linkedin",
    estimatedValue: 35000,
    expectedCloseDate: "2024-03-01",
    createdAt: "2024-01-15T16:20:00Z",
    funnelId: "funnel2",
  },
]

const sampleTasks = [
  {
    id: "t1",
    title: "Ligar para João Silva",
    status: "completed",
    priority: "high",
    dueDate: "2024-01-20",
    createdAt: "2024-01-15T10:00:00Z",
    leadId: "l1",
    funnelId: "funnel1",
  },
  {
    id: "t2",
    title: "Enviar proposta para Maria Santos",
    status: "in_progress",
    priority: "medium",
    dueDate: "2024-01-25",
    createdAt: "2024-01-16T14:00:00Z",
    leadId: "l2",
    funnelId: "funnel1",
  },
]

function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [dashboardPeriod, setDashboardPeriod] = useState("30d")

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            leads={sampleLeads}
            tasks={sampleTasks}
            funnels={sampleFunnels}
            period={dashboardPeriod}
            onPeriodChange={setDashboardPeriod}
          />
        )
      case "leads":
        return <KanbanBoard />
      case "tasks":
        return (
          <TaskCenter
            tasks={sampleTasks}
            projects={sampleLeads.map((lead) => ({
              id: lead.id,
              title: `Lead: ${lead.name}`,
              client: lead.company,
              status: lead.status,
            }))}
            onUpdateTask={(taskId, updates) => {
              console.log("Update task:", taskId, updates)
            }}
            onCreateTask={(task) => {
              console.log("Create task:", task)
            }}
            onDeleteTask={(taskId) => {
              console.log("Delete task:", taskId)
            }}
          />
        )
      case "conversations":
        return <ConversationPanel />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto p-4">
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="mt-4">{renderContent()}</div>
      </div>
    </div>
  )
}

export default App
