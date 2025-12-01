"use client"
import LeadCard from "./LeadCard"

function KanbanColumn({ column, leads, onLeadClick, onDeleteLead, onAddLead }) {
  return (
    <div className="kanban-column">
      <div
        className="column-header"
        style={{
          borderTopColor: column.color,
          backgroundColor: `${column.color}20`,
        }}
      >
        <div className="column-header-content">
          <div>
            <h3 className="column-title" style={{ color: column.color }}>
              {column.name}
            </h3>
            <span className="column-count">{leads.length} leads</span>
          </div>
          <button className="column-add-btn" onClick={onAddLead}>
            ➕
          </button>
        </div>
      </div>
      <div className="column-content">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onLeadClick(lead)}
            onDelete={() => onDeleteLead(lead.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default KanbanColumn
