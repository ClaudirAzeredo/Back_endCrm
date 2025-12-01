"use client"

function LeadCard({ lead, onClick, onDelete }) {
  const handleDeleteClick = (e) => {
    e.stopPropagation()
    onDelete()
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "urgent":
        return "priority-urgent"
      case "high":
        return "priority-high"
      case "medium":
        return "priority-medium"
      case "low":
        return "priority-low"
      default:
        return "priority-low"
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "urgent":
        return "Urgente"
      case "high":
        return "Alta"
      case "medium":
        return "Média"
      case "low":
        return "Baixa"
      default:
        return "Baixa"
    }
  }

  return (
    <div className="lead-card" onClick={onClick}>
      <div className="lead-card-header">
        <div className="lead-card-content">
          <h4 className="lead-card-title">{lead.title}</h4>
          <p className="lead-card-client">{lead.client}</p>
        </div>
        <div className="lead-card-actions">
          <button className="lead-delete-btn" onClick={handleDeleteClick} title="Excluir lead">
            🗑️
          </button>
        </div>
      </div>

      {lead.estimatedValue && <div className="lead-card-value">R$ {lead.estimatedValue.toLocaleString("pt-BR")}</div>}

      {lead.priority && (
        <div className="lead-card-priority">
          <span className={`priority-badge ${getPriorityClass(lead.priority)}`}>{getPriorityLabel(lead.priority)}</span>
        </div>
      )}

      <div className="lead-card-footer">
        <div className="lead-card-people">💬 1 pessoa(s)</div>
      </div>

      {lead.expectedCloseDate && (
        <div className="lead-card-date">Previsão: {new Date(lead.expectedCloseDate).toLocaleDateString("pt-BR")}</div>
      )}
    </div>
  )
}

export default LeadCard
