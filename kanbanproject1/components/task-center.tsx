"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Link,
  ExternalLink,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApiTasks } from "@/hooks/use-api-tasks"
import { useApiLeads } from "@/hooks/use-api-leads"

// Tipos
type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled"
type TaskPriority = "low" | "medium" | "high" | "urgent"

type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: {
    id: string
    name: string
    avatar: string
  }
  leadId?: string
  leadName?: string
  clientName?: string
  dueDate?: string
  createdAt: string
  createdBy: "automation" | "manual"
  automationId?: string
  completedAt?: string
  tags?: string[]
  relatedConversations?: string[]
}

type TaskCenterProps = {
  tasks: Task[]
  projects: Array<{
    id: string
    title: string
    client: string
    status: string
  }>
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onCreateTask: (task: Omit<Task, "id" | "createdAt">) => void
  onDeleteTask: (taskId: string) => void
}

export default function TaskCenter({
  tasks: initialTasks,
  projects: initialProjects,
  onUpdateTask,
  onCreateTask,
  onDeleteTask,
}: TaskCenterProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: "all_status",
    priority: "all_priority",
    project: "all_projects",
    assignee: "all_assignee",
    search: "",
  })

  const { tasks, isLoading: tasksLoading, createTask, updateTask, updateStatus, deleteTask } = useApiTasks()
  const { leads, isLoading: leadsLoading } = useApiLeads()

  // Use API data if available, otherwise fall back to props
  const displayTasks = tasks.length > 0 ? tasks : initialTasks
  const displayLeads = leads.length > 0 ? leads : initialProjects

  const filteredTasks = displayTasks.filter((task: any) => {
    if (filters.status !== "all_status" && task.status !== filters.status) return false
    if (filters.priority !== "all_priority" && task.priority !== filters.priority) return false
    if (filters.project !== "all_projects" && task.leadId !== filters.project) return false
    if (filters.assignee !== "all_assignee" && task.assignedTo?.id !== filters.assignee) return false
    if (
      filters.search &&
      !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !task.description.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false
    return true
  })

  const tasksByStatus = {
    pending: filteredTasks.filter((t: any) => t.status === "pending"),
    in_progress: filteredTasks.filter((t: any) => t.status === "in_progress"),
    completed: filteredTasks.filter((t: any) => t.status === "completed"),
    cancelled: filteredTasks.filter((t: any) => t.status === "cancelled"),
  }

  const stats = {
    total: displayTasks.length,
    pending: displayTasks.filter((t: any) => t.status === "pending").length,
    in_progress: displayTasks.filter((t: any) => t.status === "in_progress").length,
    completed: displayTasks.filter((t: any) => t.status === "completed").length,
    overdue: displayTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed")
      .length,
  }

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return colors[priority]
  }

  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      pending: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status]
  }

  const getStatusLabel = (status: TaskStatus) => {
    const labels = {
      pending: "Pendente",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    }
    return labels[status]
  }

  const getPriorityLabel = (priority: TaskPriority) => {
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    }
    return labels[priority]
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      if (typeof updates.status !== "undefined") {
        await updateStatus(taskId, updates.status as any)
      } else {
        await updateTask(taskId, updates)
      }
      onUpdateTask(taskId, updates)
    } catch (error) {
      console.error("[v0] Error updating task:", error)
    }
  }

  const handleCreateTask = async (task: Omit<Task, "id" | "createdAt">) => {
    try {
      await createTask(task)
      onCreateTask(task)
    } catch (error) {
      console.error("[v0] Error creating task:", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      onDeleteTask(taskId)
    } catch (error) {
      console.error("[v0] Error deleting task:", error)
    }
  }

  if (tasksLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Carregando tarefas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Central de Tarefas</CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_status">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_priority">Todas as Prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.project} onValueChange={(value) => setFilters({ ...filters, project: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_projects">Todos os Leads</SelectItem>
                {displayLeads.map((lead: any) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.title} - {lead.company || lead.funnelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.assignee} onValueChange={(value) => setFilters({ ...filters, assignee: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_assignee">Todos os Responsáveis</SelectItem>
                {displayTasks.map(
                  (task: any) =>
                    task.assignedTo && (
                      <SelectItem key={task.assignedTo.id} value={task.assignedTo.id}>
                        {task.assignedTo.name}
                      </SelectItem>
                    ),
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  status: "all_status",
                  priority: "all_priority",
                  project: "all_projects",
                  assignee: "all_assignee",
                  search: "",
                })
              }
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>

          <Tabs defaultValue="kanban" className="w-full">
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
            </TabsList>

            <TabsContent value="kanban" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-4 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-600" />
                    Pendentes ({tasksByStatus.pending.length})
                  </h3>
                  <div className="space-y-3">
                    {tasksByStatus.pending.map((task: any) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                        getPriorityColor={getPriorityColor}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium mb-4 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    Em Andamento ({tasksByStatus.in_progress.length})
                  </h3>
                  <div className="space-y-3">
                    {tasksByStatus.in_progress.map((task: any) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                        getPriorityColor={getPriorityColor}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium mb-4 flex items-center">
                    <CheckSquare className="h-4 w-4 mr-2 text-green-600" />
                    Concluídas ({tasksByStatus.completed.length})
                  </h3>
                  <div className="space-y-3">
                    {tasksByStatus.completed.map((task: any) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                        getPriorityColor={getPriorityColor}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-medium mb-4 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                    Canceladas ({tasksByStatus.cancelled.length})
                  </h3>
                  <div className="space-y-3">
                    {tasksByStatus.cancelled.map((task: any) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                        getPriorityColor={getPriorityColor}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <div className="space-y-2">
                {filteredTasks.map((task: any) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    onUpdateTask={handleUpdateTask}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                    getPriorityLabel={getPriorityLabel}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Visualização de Calendário</h3>
                <p className="text-muted-foreground">Em desenvolvimento - Visualize tarefas por data</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          projects={displayLeads}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => {
            handleUpdateTask(selectedTask.id, updates)
            setSelectedTask({ ...selectedTask, ...updates })
          }}
          onDelete={() => {
            handleDeleteTask(selectedTask.id)
            setSelectedTask(null)
          }}
          getStatusLabel={getStatusLabel}
          getPriorityLabel={getPriorityLabel}
        />
      )}

      {showCreateDialog && (
        <CreateTaskDialog
          leads={displayLeads}
          onClose={() => setShowCreateDialog(false)}
          onCreate={(task) => {
            handleCreateTask(task)
            setShowCreateDialog(false)
          }}
        />
      )}
    </div>
  )
}

function TaskCard({
  task,
  onClick,
  getPriorityColor,
  getStatusColor,
}: {
  task: Task
  onClick: () => void
  getPriorityColor: (priority: TaskPriority) => string
  getStatusColor: (status: TaskStatus) => string
}) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? "border-red-200 bg-red-50" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            {task.createdBy === "automation" && (
              <Badge variant="outline" className="text-xs">
                Auto
              </Badge>
            )}
          </div>

          {task.leadName && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Link className="h-3 w-3 mr-1" />
              {task.leadName}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority === "low" && "Baixa"}
              {task.priority === "medium" && "Média"}
              {task.priority === "high" && "Alta"}
              {task.priority === "urgent" && "Urgente"}
            </Badge>

            {task.dueDate && (
              <div className={`text-xs flex items-center ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>

          {task.assignedTo && (
            <div className="flex items-center">
              <Avatar className="h-5 w-5 mr-2">
                <AvatarImage src={task.assignedTo.avatar || "/placeholder.svg"} alt={task.assignedTo.name} />
                <AvatarFallback className="text-xs">{task.assignedTo.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{task.assignedTo.name}</span>
            </div>
          )}

          {task.relatedConversations && task.relatedConversations.length > 0 && (
            <div className="flex items-center text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3 mr-1" />
              {task.relatedConversations.length} conversa(s)
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskListItem({
  task,
  onClick,
  onUpdateTask,
  getPriorityColor,
  getStatusColor,
  getStatusLabel,
  getPriorityLabel,
}: {
  task: Task
  onClick: () => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  getPriorityColor: (priority: TaskPriority) => string
  getStatusColor: (status: TaskStatus) => string
  getStatusLabel: (status: TaskStatus) => string
  getPriorityLabel: (priority: TaskPriority) => string
}) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

  return (
    <Card className={`${isOverdue ? "border-red-200 bg-red-50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <Checkbox
              checked={task.status === "completed"}
              onCheckedChange={(checked) => {
                onUpdateTask(task.id, {
                  status: checked ? "completed" : "pending",
                })
              }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium cursor-pointer hover:text-blue-600" onClick={onClick}>
                  {task.title}
                </h4>
                {task.createdBy === "automation" && (
                  <Badge variant="outline" className="text-xs">
                    Automação
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                {task.leadName && (
                  <div className="flex items-center">
                    <Link className="h-3 w-3 mr-1" />
                    {task.leadName}
                  </div>
                )}

                {task.assignedTo && (
                  <div className="flex items-center">
                    <Avatar className="h-4 w-4 mr-1">
                      <AvatarImage src={task.assignedTo.avatar || "/placeholder.svg"} alt={task.assignedTo.name} />
                      <AvatarFallback className="text-xs">{task.assignedTo.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    {task.assignedTo.name}
                  </div>
                )}

                {task.dueDate && (
                  <div className={`flex items-center ${isOverdue ? "text-red-600" : ""}`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                  </div>
                )}

                {task.relatedConversations && task.relatedConversations.length > 0 && (
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {task.relatedConversations.length} conversa(s)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className={`${getPriorityColor(task.priority)}`}>{getPriorityLabel(task.priority)}</Badge>
            <Select
              value={task.status}
              onValueChange={(value: TaskStatus) => {
                onUpdateTask(task.id, {
                  status: value,
                })
              }}
            >
              <SelectTrigger className={`w-auto border-0 ${getStatusColor(task.status)}`}>
                <SelectValue>{getStatusLabel(task.status)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={onClick}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskDetailsDialog({
  task,
  projects,
  onClose,
  onUpdate,
  onDelete,
  getStatusLabel,
  getPriorityLabel,
}: {
  task: Task
  projects: Array<{ id: string; title: string; client: string }>
  onClose: () => void
  onUpdate: (updates: Partial<Task>) => void
  onDelete: () => void
  getStatusLabel: (status: TaskStatus) => string
  getPriorityLabel: (priority: TaskPriority) => string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(task)

  const handleSave = () => {
    onUpdate(editForm)
    setIsEditing(false)
  }

  const lead = projects.find((p) => p.id === task.leadId)

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{task.title}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Cancelar" : "Editar"}
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: TaskStatus) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={editForm.priority}
                    onValueChange={(value: TaskPriority) => setEditForm({ ...editForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={editForm.dueDate || ""}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar Alterações</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-muted-foreground">{task.description || "Sem descrição"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge className="bg-blue-100 text-blue-800">{getStatusLabel(task.status)}</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Prioridade</h4>
                  <Badge className="bg-orange-100 text-orange-800">{getPriorityLabel(task.priority)}</Badge>
                </div>
              </div>

              {lead && (
                <div>
                  <h4 className="font-medium mb-2">Lead Vinculado</h4>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{lead.title}</p>
                      <p className="text-sm text-muted-foreground">{lead.client}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Lead
                    </Button>
                  </div>
                </div>
              )}

              {task.assignedTo && (
                <div>
                  <h4 className="font-medium mb-2">Responsável</h4>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={task.assignedTo.avatar || "/placeholder.svg"} alt={task.assignedTo.name} />
                      <AvatarFallback>{task.assignedTo.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{task.assignedTo.name}</span>
                  </div>
                </div>
              )}

              {task.dueDate && (
                <div>
                  <h4 className="font-medium mb-2">Data de Vencimento</h4>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              )}

              {task.createdBy === "automation" && (
                <div>
                  <h4 className="font-medium mb-2">Criada por Automação</h4>
                  <Badge variant="outline">Tarefa criada automaticamente</Badge>
                </div>
              )}

              {task.relatedConversations && task.relatedConversations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Conversas Relacionadas</h4>
                  <div className="space-y-2">
                    {task.relatedConversations.map((conversationId, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          <span className="text-sm">Conversa #{conversationId}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>Criada em: {new Date(task.createdAt).toLocaleString("pt-BR")}</p>
                {task.completedAt && <p>Concluída em: {new Date(task.completedAt).toLocaleString("pt-BR")}</p>}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CreateTaskDialog({
  leads,
  onClose,
  onCreate,
}: {
  leads: Array<{ id: string; title: string; company?: string; funnelName?: string }>
  onClose: () => void
  onCreate: (task: Omit<Task, "id" | "createdAt">) => void
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending" as TaskStatus,
    priority: "medium" as TaskPriority,
    leadId: "",
    dueDate: "",
  })

  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedLead = form.leadId !== "no_lead" ? leads.find((l) => l.id === form.leadId) : null

    onCreate({
      ...form,
      leadId: form.leadId !== "no_lead" ? form.leadId : undefined,
      leadName: selectedLead?.title,
      clientName: selectedLead?.company || selectedLead?.funnelName,
      createdBy: "manual",
      tags: [],
      relatedConversations: [],
    })
  }

  const selectedLead = leads.find((lead) => lead.id === form.leadId)

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Título da tarefa"
              required
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição da tarefa"
              rows={3}
            />
          </div>

          <div>
            <Label>Lead</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-transparent"
                >
                  {selectedLead
                    ? `${selectedLead.title} - ${selectedLead.company || selectedLead.funnelName}`
                    : "Buscar lead..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar lead..." value={searchValue} onValueChange={setSearchValue} />
                  <CommandList>
                    <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="no_lead"
                        onSelect={() => {
                          setForm({ ...form, leadId: "no_lead" })
                          setOpen(false)
                          setSearchValue("")
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", form.leadId === "no_lead" ? "opacity-100" : "opacity-0")}
                        />
                        Nenhum lead
                      </CommandItem>
                      {leads.map((lead) => (
                        <CommandItem
                          key={lead.id}
                          value={`${lead.title} ${lead.company || lead.funnelName}`}
                          onSelect={() => {
                            setForm({ ...form, leadId: lead.id })
                            setOpen(false)
                            setSearchValue("")
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", form.leadId === lead.id ? "opacity-100" : "opacity-0")}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{lead.title}</span>
                            <span className="text-xs text-muted-foreground">{lead.company || lead.funnelName}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value: TaskStatus) => setForm({ ...form, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(value: TaskPriority) => setForm({ ...form, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Vencimento</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Criar Tarefa</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
