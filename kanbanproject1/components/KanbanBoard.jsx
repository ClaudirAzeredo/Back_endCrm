"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog"
import KanbanColumn from "./KanbanColumn"
import Modal from "./Modal"

// Dados de exemplo
const initialColumns = [
  { id: "novo", name: "Novos Leads", color: "#64748b", order: 0 },
  { id: "qualificado", name: "Qualificados", color: "#3b82f6", order: 1 },
  { id: "proposta", name: "Proposta", color: "#f59e0b", order: 2 },
  { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3 },
  { id: "ganho", name: "Ganhos", color: "#10b981", order: 4 },
  { id: "perdido", name: "Perdidos", color: "#ef4444", order: 5 },
]

const initialLeads = [
  {
    id: "lead1",
    title: "Interesse em Sistema ERP",
    client: "Empresa Nova Ltda",
    clientEmail: "contato@empresanova.com",
    clientPhone: "+55 11 98888-1111",
    source: "website",
    status: "novo",
    priority: "high",
    estimatedValue: 150000,
    expectedCloseDate: "2024-01-15",
    notes: "Cliente demonstrou muito interesse no módulo financeiro",
    createdAt: "2023-11-01T10:00:00Z",
  },
  {
    id: "lead2",
    title: "Migração de Sistema Legado",
    client: "Tech Solutions",
    clientEmail: "ti@techsolutions.com",
    clientPhone: "+55 11 97777-2222",
    source: "referral",
    status: "qualificado",
    priority: "medium",
    estimatedValue: 80000,
    expectedCloseDate: "2024-02-01",
    notes: "Necessita migração urgente do sistema atual",
    createdAt: "2023-11-02T14:00:00Z",
  },
]

function KanbanBoard() {
  const [leads, setLeads] = useState(initialLeads)
  const [columns] = useState(initialColumns)
  const [showCreateLead, setShowCreateLead] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [showLeadDetails, setShowLeadDetails] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const handleCreateLead = () => {
    setShowCreateLead(true)
  }

  const handleLeadClick = (lead) => {
    setSelectedLead(lead)
    setShowLeadDetails(true)
  }

  const handleDeleteLead = (leadId) => {
    setPendingDeleteId(leadId)
    setConfirmDeleteOpen(true)
  }

  const getLeadsForColumn = (columnId) => {
    return leads.filter((lead) => lead.status === columnId)
  }

  const getTotalValueForColumn = (columnId) => {
    return getLeadsForColumn(columnId).reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
  }

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <div className="kanban-title-section">
          <h1>Pipeline de Leads</h1>
          <p>Gerencie seus leads do primeiro contato até o fechamento</p>
        </div>
        <div className="kanban-actions">
          <button className="btn btn-primary" onClick={handleCreateLead}>
            ➕ Novo Lead
          </button>
          <button className="btn btn-outline">✅ Central de Tarefas</button>
          <button className="btn btn-outline">⚙️ Configurações</button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="stats-grid">
        {columns.map((column) => {
          const count = getLeadsForColumn(column.id).length
          const totalValue = getTotalValueForColumn(column.id)

          return (
            <div key={column.id} className="stat-card">
              <div className="stat-indicator" style={{ backgroundColor: column.color }}></div>
              <p className="stat-name">{column.name}</p>
              <p className="stat-count">{count}</p>
              <p className="stat-value">R$ {totalValue.toLocaleString("pt-BR")}</p>
            </div>
          )
        })}
      </div>

      {/* Colunas do Kanban */}
      <div className="kanban-columns">
        {columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              leads={getLeadsForColumn(column.id)}
              onLeadClick={handleLeadClick}
              onDeleteLead={handleDeleteLead}
              onAddLead={handleCreateLead}
            />
          ))}
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) {
                  setLeads((prev) => prev.filter((l) => l.id !== pendingDeleteId))
                }
                setConfirmDeleteOpen(false)
                setPendingDeleteId(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de criação de lead */}
      {showCreateLead && (
        <Modal title="Novo Lead" onClose={() => setShowCreateLead(false)}>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label required">Título do Lead</label>
              <input type="text" className="form-input" placeholder="Ex: Interesse em Sistema ERP" />
            </div>
            <div className="form-group">
              <label className="form-label required">Cliente</label>
              <input type="text" className="form-input" placeholder="Nome da empresa" />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="contato@empresa.com" />
              </div>
              <div className="form-group">
                <label className="form-label required">Telefone</label>
                <input type="tel" className="form-input" placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Adicione observações sobre este lead..."
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowCreateLead(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary">Criar Lead</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de detalhes do lead */}
      {showLeadDetails && selectedLead && (
        <Modal
          title={selectedLead.title}
          onClose={() => {
            setShowLeadDetails(false)
            setSelectedLead(null)
          }}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Informações do Cliente</h4>
              <p>
                <strong>Cliente:</strong> {selectedLead.client}
              </p>
              <p>
                <strong>Email:</strong> {selectedLead.clientEmail}
              </p>
              <p>
                <strong>Telefone:</strong> {selectedLead.clientPhone}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Detalhes do Lead</h4>
              <p>
                <strong>Valor Estimado:</strong> R$ {selectedLead.estimatedValue?.toLocaleString("pt-BR")}
              </p>
              <p>
                <strong>Prioridade:</strong> {selectedLead.priority}
              </p>
              <p>
                <strong>Origem:</strong> {selectedLead.source}
              </p>
            </div>
            {selectedLead.notes && (
              <div>
                <h4 className="font-medium mb-2">Observações</h4>
                <p>{selectedLead.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button className="btn btn-outline">✏️ Editar</button>
              <button className="btn btn-outline" style={{ color: "#dc2626" }}>
                🗑️ Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default KanbanBoard
