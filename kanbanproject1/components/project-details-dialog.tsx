"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  Edit,
  Save,
  X,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Activity,
  TrendingUp,
  Settings,
  Plus,
  Star,
  AlertTriangle,
  Info,
  MessageSquare,
  Mail,
  Phone,
} from "lucide-react"

type Module = {
  id: string
  name: string
  description: string
  color: string
  status?: "not_started" | "in_progress" | "completed"
  progress?: number
}

type Project = {
  id: string
  title: string
  client: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  modules: string[]
  status: string
  priority?: string
  deadline?: string
  budget?: number
  description?: string
  leadId?: string
  createdAt: string
  updatedAt?: string
  assignedTo?: {
    id: string
    name: string
    avatar: string
  }
  people: Array<{
    id: string
    name: string
    avatar: string
  }>
  tasks?: Array<{
    id: string
    title: string
    status: "pending" | "in_progress" | "completed"
    assignedTo?: string
    dueDate?: string
  }>
  interactions?: Array<{
    id: string
    type: "call" | "email" | "meeting" | "note" | "feedback" | "milestone"
    description: string
    date: string
    createdBy: string
    feedbackType?: "positive" | "negative" | "neutral" | "important"
    rating?: number
  }>
}

type ProjectDetailsDialogProps = {
  project: Project | null
  open: boolean
  onClose: () => void
  onUpdate: (projectId: string, updates: Partial<Project>) => void
  onDelete: (projectId: string) => void
  columns: Array<{ id: string; title: string; color: string }>
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
}

const feedbackTypes = {
  positive: { label: "Positivo", color: "bg-green-100 text-green-800", icon: CheckCircle },
  negative: { label: "Negativo", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  neutral: { label: "Neutro", color: "bg-gray-100 text-gray-800", icon: Info },
  important: { label: "Importante", color: "bg-blue-100 text-blue-800", icon: Star },
}

export default function ProjectDetailsDialog({
  project,
  open,
  onClose,
  onUpdate,
  onDelete,
  columns,
}: ProjectDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [editForm, setEditForm] = useState<Partial<Project>>({})
  const [newInteraction, setNewInteraction] = useState({
    type: "note" as const,
    description: "",
    feedbackType: "neutral" as const,
    rating: 5,
  })

  if (!project) return null

  const handleEdit = () => {
    setEditForm(project)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editForm.id) {
      onUpdate(editForm.id, editForm)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditForm({})
    setIsEditing(false)
  }

  const handleAddInteraction = () => {
    if (!newInteraction.description.trim()) return

    const interaction = {
      id: `int_${Date.now()}`,
      type: newInteraction.type,
      description: newInteraction.description,
      date: new Date().toISOString(),
      createdBy: "Usuário Atual",
      ...(newInteraction.type === "feedback" && {
        feedbackType: newInteraction.feedbackType,
        rating: newInteraction.rating,
      }),
    }

    const updatedInteractions = [...(project.interactions || []), interaction]
    onUpdate(project.id, { interactions: updatedInteractions })
    setNewInteraction({
      type: "note",
      description: "",
      feedbackType: "neutral",
      rating: 5,
    })
  }

  const getColumnInfo = (statusId: string) => {
    return columns.find((col) => col.id === statusId)
  }

  const columnInfo = getColumnInfo(project.status)

  const calculateProgress = () => {
    if (project.tasks && project.tasks.length > 0) {
      const completedTasks = project.tasks.filter((task) => task.status === "completed").length
      return Math.round((completedTasks / project.tasks.length) * 100)
    }
    return 0
  }

  const progress = calculateProgress()

  const getDaysRemaining = () => {
    if (!project.deadline) return null
    const deadline = new Date(project.deadline)
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining()

  const getInteractionIcon = (type: string, feedbackType?: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "meeting":
        return <Calendar className="h-4 w-4" />
      case "milestone":
        return <CheckCircle className="h-4 w-4" />
      case "feedback":
        const FeedbackIcon = feedbackTypes[feedbackType || "neutral"].icon
        return <FeedbackIcon className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case "call":
        return "Ligação"
      case "email":
        return "Email"
      case "meeting":
        return "Reunião"
      case "milestone":
        return "Marco"
      case "feedback":
        return "Feedback"
      default:
        return "Anotação"
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <DialogTitle>{isEditing ? "Editar Projeto" : project.title}</DialogTitle>
              </div>
              {columnInfo && (
                <Badge className="text-white" style={{ backgroundColor: columnInfo.color }}>
                  {columnInfo.title}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="feedback">Feedbacks</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="space-y-6">
              {/* Cards de Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Progresso</p>
                        <p className="text-2xl font-bold">{progress}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Orçamento</p>
                        <p className="text-2xl font-bold">R$ {project.budget?.toLocaleString("pt-BR") || "0"}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dias Restantes</p>
                        <p
                          className={`text-2xl font-bold ${
                            daysRemaining === null
                              ? "text-gray-600"
                              : daysRemaining < 0
                                ? "text-red-600"
                                : daysRemaining < 7
                                  ? "text-orange-600"
                                  : "text-green-600"
                          }`}
                        >
                          {daysRemaining === null
                            ? "N/D"
                            : daysRemaining < 0
                              ? `${Math.abs(daysRemaining)} atrasado`
                              : daysRemaining}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tarefas</p>
                        <p className="text-2xl font-bold">
                          {project.tasks?.filter((t) => t.status === "completed").length || 0}/
                          {project.tasks?.length || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progresso Visual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Progresso do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Conclusão Geral</span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Informações do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Cliente</Label>
                      <p className="mt-1">{project.client}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="mt-1">{project.clientEmail || "Não definido"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="mt-1">{project.clientPhone || "Não definido"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Endereço</Label>
                      <p className="mt-1">{project.clientAddress || "Não definido"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Responsável</Label>
                      <p className="mt-1">{project.assignedTo?.name || "Não definido"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Prioridade</Label>
                      <Badge className={`mt-1 ${priorityColors[project.priority || "low"]}`}>
                        {priorityLabels[project.priority || "low"]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Cronograma
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Data de Início</Label>
                      <p className="mt-1">{new Date(project.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Data de Término</Label>
                      <p className="mt-1">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString("pt-BR") : "Não definido"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duração</Label>
                      <p className="mt-1">
                        {project.deadline
                          ? Math.ceil(
                              (new Date(project.deadline).getTime() - new Date(project.createdAt).getTime()) /
                                (1000 * 60 * 60 * 24),
                            )
                          : "Não definido"}{" "}
                        dias
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Detalhes do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Título do Projeto</Label>
                          <Input
                            value={editForm.title || ""}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Cliente</Label>
                          <Input
                            value={editForm.client || ""}
                            onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={editForm.description || ""}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={editForm.status || ""}
                            onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map((column) => (
                                <SelectItem key={column.id} value={column.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                                    {column.title}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Prioridade</Label>
                          <Select
                            value={editForm.priority || ""}
                            onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                              setEditForm({ ...editForm, priority: value })
                            }
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
                          <Label>Orçamento (R$)</Label>
                          <Input
                            type="number"
                            value={editForm.budget || 0}
                            onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Data de Início</Label>
                          <Input
                            type="date"
                            value={editForm.createdAt || ""}
                            onChange={(e) => setEditForm({ ...editForm, createdAt: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Data de Término</Label>
                          <Input
                            type="date"
                            value={editForm.deadline || ""}
                            onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Responsável</Label>
                        <Input
                          value={editForm.assignedTo?.name || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, assignedTo: { ...editForm.assignedTo, name: e.target.value } })
                          }
                          placeholder="Nome do responsável"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Descrição</Label>
                        <p className="mt-1 text-muted-foreground">
                          {project.description || "Nenhuma descrição fornecida."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Criado em</Label>
                          <p className="mt-1">{new Date(project.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        {project.updatedAt && (
                          <div>
                            <Label className="text-sm font-medium">Última atualização</Label>
                            <p className="mt-1">{new Date(project.updatedAt).toLocaleDateString("pt-BR")}</p>
                          </div>
                        )}
                      </div>

                      {project.leadId && (
                        <div>
                          <Label className="text-sm font-medium">Convertido do Lead</Label>
                          <p className="mt-1">ID: {project.leadId}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Módulos do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">Nenhum módulo definido para este projeto.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Equipe do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.people && project.people.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Responsável Principal</Label>
                        <div className="flex items-center gap-2 mt-2 p-3 bg-muted rounded-lg">
                          <Users className="h-4 w-4" />
                          <span>{project.assignedTo?.name || "Não definido"}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Membros da Equipe</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {project.people.map((member) => (
                            <div key={member.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <Users className="h-4 w-4" />
                              <span>{member.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum membro da equipe definido.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.tasks && project.tasks.length > 0 ? (
                      project.tasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-4">
                          <div
                            className={`w-4 h-4 rounded-full mt-1 ${task.status === "completed" ? "bg-green-500" : "bg-gray-300"}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{task.title}</h4>
                              <span className="text-sm text-muted-foreground">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "Não definido"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-4 h-4 rounded-full bg-green-500 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Projeto Iniciado</h4>
                              <span className="text-sm text-muted-foreground">
                                {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div
                            className={`w-4 h-4 rounded-full mt-1 ${project.deadline && new Date() > new Date(project.deadline) ? "bg-red-500" : "bg-gray-300"}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Entrega Prevista</h4>
                              <span className="text-sm text-muted-foreground">
                                {project.deadline
                                  ? new Date(project.deadline).toLocaleDateString("pt-BR")
                                  : "Não definido"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {project.tasks && project.tasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tarefas Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {project.tasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {task.status === "completed" ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : task.status === "in_progress" ? (
                              <Clock className="h-4 w-4 text-blue-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.assignedTo && (
                              <span className="text-xs text-muted-foreground">{task.assignedTo}</span>
                            )}
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              {/* Adicionar Novo Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Registrar Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={newInteraction.type}
                          onValueChange={(value: "call" | "email" | "meeting" | "note" | "feedback" | "milestone") =>
                            setNewInteraction({ ...newInteraction, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">Ligação</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="meeting">Reunião</SelectItem>
                            <SelectItem value="note">Anotação</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                            <SelectItem value="milestone">Marco</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newInteraction.type === "feedback" && (
                        <>
                          <div>
                            <Label>Tipo de Feedback</Label>
                            <Select
                              value={newInteraction.feedbackType}
                              onValueChange={(value: "positive" | "negative" | "neutral" | "important") =>
                                setNewInteraction({ ...newInteraction, feedbackType: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="positive">Positivo</SelectItem>
                                <SelectItem value="negative">Negativo</SelectItem>
                                <SelectItem value="neutral">Neutro</SelectItem>
                                <SelectItem value="important">Importante</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Avaliação (1-10)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={newInteraction.rating}
                              onChange={(e) => setNewInteraction({ ...newInteraction, rating: Number(e.target.value) })}
                            />
                          </div>
                        </>
                      )}

                      <div className={newInteraction.type === "feedback" ? "col-span-1" : "col-span-3"}>
                        <Label>Descrição</Label>
                        <Input
                          value={newInteraction.description}
                          onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                          placeholder={
                            newInteraction.type === "feedback"
                              ? "Descreva o feedback recebido..."
                              : newInteraction.type === "milestone"
                                ? "Descreva o marco alcançado..."
                                : "Descreva a interação..."
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleAddInteraction} className="w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar{" "}
                        {newInteraction.type === "feedback"
                          ? "Feedback"
                          : newInteraction.type === "milestone"
                            ? "Marco"
                            : "Interação"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline de Feedbacks e Interações */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline de Feedbacks e Interações</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.interactions && project.interactions.length > 0 ? (
                    <div className="space-y-4">
                      {project.interactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((interaction) => (
                          <div
                            key={interaction.id}
                            className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getInteractionIcon(interaction.type, interaction.feedbackType)}
                                <Badge
                                  variant="outline"
                                  className={
                                    interaction.type === "feedback" && interaction.feedbackType
                                      ? feedbackTypes[interaction.feedbackType].color
                                      : interaction.type === "milestone"
                                        ? "bg-purple-100 text-purple-800"
                                        : ""
                                  }
                                >
                                  {getInteractionLabel(interaction.type)}
                                  {interaction.type === "feedback" &&
                                    interaction.feedbackType &&
                                    ` - ${feedbackTypes[interaction.feedbackType].label}`}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(interaction.date).toLocaleString("pt-BR")}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">por {interaction.createdBy}</span>
                            </div>

                            {interaction.type === "feedback" && interaction.rating && (
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">Avaliação: {interaction.rating}/10</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        i < interaction.rating ? "bg-yellow-400" : "bg-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-sm">{interaction.description}</p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum feedback registrado ainda.</p>
                  )}
                </CardContent>
              </Card>

              {/* Resumo de Feedbacks */}
              {project.interactions && project.interactions.filter((i) => i.type === "feedback").length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Resumo de Feedbacks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(feedbackTypes).map(([type, config]) => {
                        const count =
                          project.interactions?.filter((i) => i.type === "feedback" && i.feedbackType === type)
                            .length || 0
                        return (
                          <div key={type} className="text-center p-3 bg-muted rounded-lg">
                            <config.icon className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-sm text-muted-foreground">{config.label}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Média de Avaliações */}
                    {(() => {
                      const feedbacksWithRating =
                        project.interactions?.filter((i) => i.type === "feedback" && i.rating) || []
                      if (feedbacksWithRating.length > 0) {
                        const averageRating =
                          feedbacksWithRating.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacksWithRating.length
                        return (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2">
                              <Star className="h-5 w-5 text-yellow-500" />
                              <span className="text-lg font-semibold">
                                Avaliação Média: {averageRating.toFixed(1)}/10
                              </span>
                            </div>
                            <div className="flex justify-center gap-1 mt-2">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-3 rounded-full ${
                                    i < Math.round(averageRating) ? "bg-yellow-400" : "bg-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Ações do Footer */}
        {!isEditing && (
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir este projeto?")) {
                  onDelete(project.id)
                  onClose()
                }
              }}
            >
              Excluir Projeto
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Projeto
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
