"use client"

function Navigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "leads", label: "Pipeline de Leads", icon: "🎯" },
    { id: "tasks", label: "Tarefas", icon: "✅" },
    { id: "conversations", label: "Conversações", icon: "💬" },
  ]

  return (
    <nav className="nav-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export default Navigation
