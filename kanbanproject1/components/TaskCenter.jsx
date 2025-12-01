"use client"

import { useState } from "react"

function TaskCenter({ tasks, projects, onUpdateTask, onCreateTask, onDeleteTask }) {
  const [filters, setFilters] = useState({
    status: "all_status",
    priority: "all_priority",
    project: "all_projects",
    search: "",
  })
  const [activeTab, setActiveTab] = useState("kanban")

  // Filtrar tarefas
  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== "all_status" && task.status !== filters.status) return false
    if (filters.priority !== "all_priority" && task.priority !== filters.priority) return false
    if (filters.project !== "all_projects" && task.leadId !== filters.project) return false
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  // Agrupar tarefas por status
  const tasksByStatus = {
    pending: filteredTasks.filter((t) => t.status === "pending"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
    cancelled: filteredTasks.filter((t) => t.status === "cancelled"),
  }

  // Estatísticas
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length,
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return colors[priority] || colors.low
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || colors.pending
  }

  return (
    <div className="task-center">
      {/* Header com estatísticas */}
      <div className="task-stats">
        <div className="task-stat-card">
          <div className="task-stat-header">
            <span className="task-stat-title">Total</span>
            <span className="task-stat-icon">📋</span>
          </div>
          <div className="task-stat-value">{stats.total}</div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-header">
            <span className="task-stat-title">Pendentes</span>
            <span className="task-stat-icon">⏳</span>
          </div>
          <div className="task-stat-value">{stats.pending}</div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-header">
            <span className="task-stat-title">Em Andamento</span>
            <span className="task-stat-icon">🔄</span>
          </div>
          <div className="task-stat-value">{stats.in_progress}</div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-header">
            <span className="task-stat-title">Concluídas</span>
            <span className="task-stat-icon">✅</span>
          </div>
          <div className="task-stat-value">{stats.completed}</div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-header">
            <span className="task-stat-title">Atrasadas</span>
            <span className="task-stat-icon">⚠️</span>
          </div>
          <div className="task-stat-value">{stats.overdue}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="task-filters">
        <div className="task-filters-header">
          <h3>Central de Tarefas</h3>
          <button className="btn btn-primary">➕ Nova Tarefa</button>
        </div>

        <div className="task-filters-grid">
          <div className="task-search">
            <span className="task-search-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar tarefas..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all_status">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <select
            className="form-select"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="all_priority">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          <select
            className="form-select"
            value={filters.project}
            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
          >
            <option value="all_projects">Todos os Projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>

          <button
            className="btn btn-outline"
            onClick={() =>
              setFilters({
                status: "all_status",
                priority: "all_priority",
                project: "all_projects",
                search: "",
              })
            }
          >
            🔄 Limpar Filtros
          </button>
        </div>
      </div>

      {/* Visualização em abas */}
      <div className="task-tabs">
        <div className="task-tabs-header">
          <div className="tabs-list">
            <button
              className={`tabs-trigger ${activeTab === "kanban" ? "active" : ""}`}
              onClick={() => setActiveTab("kanban")}
            >
              Kanban
            </button>
            <button
              className={`tabs-trigger ${activeTab === "list" ? "active" : ""}`}
              onClick={() => setActiveTab("list")}
            >
              Lista
            </button>
            <button
              className={`tabs-trigger ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}
            >
              Calendário
            </button>
          </div>
        </div>

        <div className="task-tabs-content">
          {activeTab === "kanban" && (
            <div className="task-kanban">
              {/* Coluna Pendente */}
              <div className="task-column pending">
                <h3 className="task-column-header">
                  <span className="task-column-icon">⏳</span>
                  Pendentes
                  <span className="task-column-count">({tasksByStatus.pending.length})</span>
                </h3>
                <div className="task-list">
                  {tasksByStatus.pending.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={onUpdateTask}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>

              {/* Coluna Em Andamento */}
              <div className="task-column in-progress">
                <h3 className="task-column-header">
                  <span className="task-column-icon">🔄</span>
                  Em Andamento
                  <span className="task-column-count">({tasksByStatus.in_progress.length})</span>
                </h3>
                <div className="task-list">
                  {tasksByStatus.in_progress.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={onUpdateTask}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>

              {/* Coluna Concluída */}
              <div className="task-column completed">
                <h3 className="task-column-header">
                  <span className="task-column-icon">✅</span>
                  Concluídas
                  <span className="task-column-count">({tasksByStatus.completed.length})</span>
                </h3>
                <div className="task-list">
                  {tasksByStatus.completed.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={onUpdateTask}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>

              {/* Coluna Cancelada */}
              <div className="task-column cancelled">
                <h3 className="task-column-header">
                  <span className="task-column-icon">❌</span>
                  Canceladas
                  <span className="task-column-count">({tasksByStatus.cancelled.length})</span>
                </h3>
                <div className="task-list">
                  {tasksByStatus.cancelled.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={onUpdateTask}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "list" && (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  onUpdate={onUpdateTask}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="text-center py-12">
              <span className="text-6xl">📅</span>
              <h3 className="text-lg font-medium mb-2">Visualização de Calendário</h3>
              <p className="text-gray-500">Em desenvolvimento - Visualize tarefas por data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente do item de tarefa
function TaskItem({ task, onUpdate, getPriorityColor, getStatusColor }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

  return (
    <div className={`task-item ${isOverdue ? "overdue" : ""}`}>
      <div className="task-item-header">
        <input
          type="checkbox"
          className="task-checkbox"
          checked={task.status === "completed"}
          onChange={(e) => {
            onUpdate(task.id, {
              status: e.target.checked ? "completed" : "pending",
              completedAt: e.target.checked ? new Date().toISOString() : undefined,
            })
          }}
        />
        <div className="task-item-content">
          <h4 className="task-item-title">{task.title}</h4>
          <div className="task-item-meta">
            {task.dueDate && (
              <div className={`task-item-date ${isOverdue ? "text-red-600" : ""}`}>
                📅 {new Date(task.dueDate).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="task-item-actions">
        <span className={`task-item-priority ${getPriorityColor(task.priority)}`}>
          {task.priority === "urgent"
            ? "Urgente"
            : task.priority === "high"
              ? "Alta"
              : task.priority === "medium"
                ? "Média"
                : "Baixa"}
        </span>
        <span className={`task-item-status ${getStatusColor(task.status)}`}>
          {task.status === "pending"
            ? "Pendente"
            : task.status === "in_progress"
              ? "Em Andamento"
              : task.status === "completed"
                ? "Concluída"
                : "Cancelada"}
        </span>
      </div>
    </div>
  )
}

// Componente do item da lista
function TaskListItem({ task, onUpdate, getPriorityColor, getStatusColor }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

  return (
    <div className={`task-item ${isOverdue ? "overdue" : ""}`}>
      <div className="task-item-header">
        <input
          type="checkbox"
          className="task-checkbox"
          checked={task.status === "completed"}
          onChange={(e) => {
            onUpdate(task.id, {
              status: e.target.checked ? "completed" : "pending",
              completedAt: e.target.checked ? new Date().toISOString() : undefined,
            })
          }}
        />
        <div className="task-item-content">
          <h4 className="task-item-title">{task.title}</h4>
          <div className="task-item-meta">
            {task.dueDate && (
              <div className={`task-item-date ${isOverdue ? "text-red-600" : ""}`}>
                📅 {new Date(task.dueDate).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>
        </div>
        <div className="task-item-actions">
          <span className={`task-item-priority ${getPriorityColor(task.priority)}`}>
            {task.priority === "urgent"
              ? "Urgente"
              : task.priority === "high"
                ? "Alta"
                : task.priority === "medium"
                  ? "Média"
                  : "Baixa"}
          </span>
          <span className={`task-item-status ${getStatusColor(task.status)}`}>
            {task.status === "pending"
              ? "Pendente"
              : task.status === "in_progress"
                ? "Em Andamento"
                : task.status === "completed"
                  ? "Concluída"
                  : "Cancelada"}
          </span>
          <button className="btn btn-ghost btn-sm">👁️</button>
        </div>
      </div>
    </div>
  )
}

export default TaskCenter
