"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { leadsApi } from "@/lib/api/leads-api"
import { usersApi } from "@/lib/api/users-api"
import { authApi } from "@/lib/api/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Building,
  Calendar,
  DollarSign,
  Edit,
  Save,
  X,
  Users,
  CheckCircle,
  FileText,
  Activity,
  TrendingUp,
  Plus,
  Star,
  AlertTriangle,
  Info,
  MessageSquare,
  Mail,
  Phone,
  Target,
  Tag,
  Trash2,
} from "lucide-react"
import TagInput from "./tag-input"
import { loadFromStorage, getCurrentUser } from "@/lib/storage"

type Lead = {
  id: string
  title: string
  client: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  source: string
  status: string
  assignedTo?: {
    id: string
    name: string
    avatar: string
    email?: string // Added email for assignedTo
  }
  people: Array<{
    id: string
    name: string
    avatar: string
    email?: string // Added email for people
    phone?: string // Added phone for people
  }>
  priority?: string
  estimatedValue?: number
  expectedCloseDate?: string
  notes?: string
  tags?: string[]
  createdAt: string
  interactions?: Array<{
    id: string
    type: "call" | "email" | "meeting" | "note" | "feedback"
    description: string
    date: string
    createdBy: string
    feedbackType?: "positive" | "negative" | "neutral" | "important"
    rating?: number
  }>
}

type LeadDetailsDialogProps = {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onUpdate: (leadId: string, updates: Partial<Lead>) => void
  onDelete: (leadId: string) => void
  columns: Array<{ id: string; name: string; color: string }>
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

export default function LeadDetailsDialog({
  lead,
  open,
  onClose,
  onUpdate,
  onDelete,
  columns,
}: LeadDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [editForm, setEditForm] = useState<Partial<Lead>>({})
  const [newInteraction, setNewInteraction] = useState<{
    type: "call" | "email" | "meeting" | "note" | "feedback"
    description: string
    feedbackType: "positive" | "negative" | "neutral" | "important"
    rating: number
  }>({
    type: "note",
    description: "",
    feedbackType: "neutral",
    rating: 5,
  })
  const [editContacts, setEditContacts] = useState<
    Array<{ id: string; name: string; email?: string; phone?: string; isPrimary: boolean }>
  >([])
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({})

  const isUuid = (val?: string) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

  if (!lead) return null

  const handleEdit = () => {
    setEditForm({ ...lead, tags: lead.tags || [] })
    const contacts = (lead.people || []).map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      phone: person.phone,
      isPrimary: lead.assignedTo?.id === person.id,
    }))
    setEditContacts(contacts.length > 0 ? contacts : [])
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editForm.id) {
      const people = editContacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        avatar: lead.people.find((p) => p.id === contact.id)?.avatar || "/placeholder.svg",
      }))

      const primaryContact = editContacts.find((c) => c.isPrimary)
      const assignedTo = primaryContact
        ? {
            id: primaryContact.id,
            name: primaryContact.name,
            avatar: lead.people.find((p) => p.id === primaryContact.id)?.avatar || "/placeholder.svg",
          }
        : undefined

      console.log("[v0] Updating lead with tags:", editForm.tags)
      console.log("[v0] Lead update data:", { ...editForm, people, assignedTo })

      onUpdate(editForm.id, {
        ...editForm,
        people,
        assignedTo,
      })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditForm({})
    setEditContacts([]) // Clear contacts state on cancel
    setIsEditing(false)
  }

  const handleAddInteraction = async () => {
    if (!newInteraction.description.trim()) return

    try {
      // Obtém o usuário atual para incluir no payload (garante createdBy correto no backend)
      let me: { id?: string; name?: string; email?: string } | null = null
      try {
        me = await authApi.me()
      } catch (e) {
        // fallback silencioso
      }

      const payload = {
        type: newInteraction.type,
        date: new Date().toISOString(),
        notes: newInteraction.description,
        rating: newInteraction.type === "feedback" ? newInteraction.rating : undefined,
        feedbackType: newInteraction.type === "feedback" ? newInteraction.feedbackType : undefined,
        // Envia o ID do usuário atual para evitar default para assignedToUserId
        user: me?.id,
      }
      const created = await leadsApi.addInteraction(lead.id, payload as any)

      // Normaliza os campos vindos do backend para o formato esperado pelo UI
      const normalized = {
        id: created.id,
        type: created.type,
        description: created.description ?? created.notes ?? "",
        date: created.date,
        createdBy: (() => {
          const raw = created.createdBy ?? created.userName ?? created.user
          if (!raw) return me?.name || me?.email || "Usuário"
          return isUuid(raw) ? (me?.name || raw) : raw
        })(),
        feedbackType: created.feedbackType,
        rating: created.rating,
      }

      const updatedInteractions = [...(lead.interactions || []), normalized]
      onUpdate(lead.id, { interactions: updatedInteractions })
    } catch (err) {
      console.error("Falha ao adicionar interação:", err)
    }
    setNewInteraction({
      type: "note",
      description: "",
      feedbackType: "neutral",
      rating: 5,
    })
  }

  // Carrega nomes de usuários para interações existentes (IDs -> nomes)
  // Executa quando o lead muda ou o modal abre
  useEffect(() => {
    const creators = Array.from(new Set((lead.interactions || []).map((i) => i.createdBy).filter(Boolean)))
    creators.forEach(async (creator) => {
      if (creator && isUuid(creator) && !userNameCache[creator]) {
        try {
          const user = await usersApi.get(creator)
          setUserNameCache((prev) => ({ ...prev, [creator]: user?.name || creator }))
        } catch {
          // ignore errors; keep ID if name not found
        }
      }
    })
  }, [lead])

  const getColumnInfo = (statusId: string) => {
    return columns.find((col) => col.id === statusId)
  }

  const columnInfo = getColumnInfo(lead.status)

  const getInteractionIcon = (type: string, feedbackType?: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "meeting":
        return <Calendar className="h-4 w-4" />
      case "feedback":
        const FeedbackIcon = feedbackTypes[(feedbackType || "neutral") as keyof typeof feedbackTypes].icon
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
      case "feedback":
        return "Feedback"
      default:
        return "Anotação"
    }
  }

  const addNewContact = () => {
    const newContact = {
      id: `contact_${Date.now()}`,
      name: "",
      email: "",
      phone: "",
      isPrimary: editContacts.length === 0, // First contact is primary by default
    }
    setEditContacts([...editContacts, newContact])
  }

  const updateContact = (id: string, field: string, value: string | boolean) => {
    setEditContacts(editContacts.map((contact) => (contact.id === id ? { ...contact, [field]: value } : contact)))
  }

  const togglePrimary = (id: string) => {
    setEditContacts(
      editContacts.map((contact) => ({
        ...contact,
        isPrimary: contact.id === id ? !contact.isPrimary : contact.isPrimary,
      })),
    )
  }

  const removeContact = (id: string) => {
    setEditContacts(editContacts.filter((contact) => contact.id !== id))
  }

  const availableTags = loadFromStorage("tags", [])
  const selectedTagObjects = Array.isArray(availableTags)
    ? availableTags.filter((tag: any) => (lead.tags || []).includes(tag.id))
    : []

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <DialogTitle>{isEditing ? "Editar Lead" : lead.title}</DialogTitle>
              </div>
              {columnInfo && (
                <Badge className="text-white" style={{ backgroundColor: columnInfo.color }}>
                  {columnInfo.name}
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
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
                        <p className="text-sm font-medium text-muted-foreground">Valor Estimado</p>
                        <p className="text-2xl font-bold">R$ {lead.estimatedValue?.toLocaleString("pt-BR") || "0"}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Origem</p>
                        <p className="text-2xl font-bold capitalize">{lead.source}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data Esperada</p>
                        <p className="text-lg font-bold">
                          {lead.expectedCloseDate
                            ? new Date(lead.expectedCloseDate).toLocaleDateString("pt-BR")
                            : "N/D"}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Interações</p>
                        <p className="text-2xl font-bold">{lead.interactions?.length || 0}</p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                      <p className="mt-1">{lead.client}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="mt-1">{lead.clientEmail || "Não definido"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="mt-1">{lead.clientPhone || "Não definido"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Endereço</Label>
                      <p className="mt-1">{lead.clientAddress || "Não definido"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Responsável</Label>
                      <p className="mt-1">{lead.assignedTo?.name || "Não definido"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Prioridade</Label>
                      <Badge className={`mt-1 ${priorityColors[(lead.priority || "low") as keyof typeof priorityColors]}`}>
                        {priorityLabels[(lead.priority || "low") as keyof typeof priorityLabels]}
                      </Badge>
                    </div>
                    {selectedTagObjects.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedTagObjects.map((tag: any) => (
                            <Badge key={tag.id} style={{ backgroundColor: tag.color, color: "white" }}>
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                      <Label className="text-sm font-medium">Data de Criação</Label>
                      <p className="mt-1">{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Data Esperada de Fechamento</Label>
                      <p className="mt-1">
                        {lead.expectedCloseDate
                          ? new Date(lead.expectedCloseDate).toLocaleDateString("pt-BR")
                          : "Não definido"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tempo no Pipeline</Label>
                      <p className="mt-1">
                        {Math.ceil((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))}{" "}
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
                    Detalhes do Lead
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Título do Lead</Label>
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email do Cliente</Label>
                          <Input
                            value={editForm.clientEmail || ""}
                            onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Telefone do Cliente</Label>
                          <Input
                            value={editForm.clientPhone || ""}
                            onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Endereço do Cliente</Label>
                        <Input
                          value={editForm.clientAddress || ""}
                          onChange={(e) => setEditForm({ ...editForm, clientAddress: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Tags
                        </Label>
                        <TagInput
                          selectedTags={editForm.tags || []}
                          onTagsChange={(tags) => setEditForm({ ...editForm, tags })}
                          placeholder="Digite para buscar ou criar tags..."
                        />
                      </div>

                      <div>
                        <Label>Observações</Label>
                        <Textarea
                          value={editForm.notes || ""}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
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
                                    {column.name}
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
                          <Label>Valor Estimado (R$)</Label>
                          <Input
                            type="number"
                            value={editForm.estimatedValue || 0}
                            onChange={(e) => setEditForm({ ...editForm, estimatedValue: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Origem</Label>
                          <Select
                            value={editForm.source || ""}
                            onValueChange={(value) => setEditForm({ ...editForm, source: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="google_ads">Google Ads</SelectItem>
                              <SelectItem value="referral">Indicação</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="phone">Telefone</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Data Esperada de Fechamento</Label>
                          <Input
                            type="date"
                            value={editForm.expectedCloseDate || ""}
                            onChange={(e) => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Observações</Label>
                        <p className="mt-1 text-muted-foreground">{lead.notes || "Nenhuma observação registrada."}</p>
                      </div>

                      {selectedTagObjects.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedTagObjects.map((tag: any) => (
                              <Badge key={tag.id} style={{ backgroundColor: tag.color, color: "white" }}>
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Origem do Lead</Label>
                          <p className="mt-1 capitalize">{lead.source}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Valor Estimado</Label>
                          <p className="mt-1">R$ {lead.estimatedValue?.toLocaleString("pt-BR") || "0"}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Equipe Responsável
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Contatos do Lead</Label>
                        <Button onClick={addNewContact} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Contato
                        </Button>
                      </div>

                      {editContacts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum contato adicionado</p>
                          <Button onClick={addNewContact} size="sm" variant="ghost" className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Primeiro Contato
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editContacts.map((contact, index) => (
                            <div key={contact.id} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Contato {index + 1}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePrimary(contact.id)}
                                    className={`h-6 w-6 p-0 ${contact.isPrimary ? "text-yellow-500" : "text-gray-300"}`}
                                    title={contact.isPrimary ? "Contato principal" : "Marcar como principal"}
                                  >
                                    <Star className={`h-4 w-4 ${contact.isPrimary ? "fill-yellow-500" : ""}`} />
                                  </Button>
                                  {contact.isPrimary && (
                                    <Badge variant="secondary" className="text-xs">
                                      Principal
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeContact(contact.id)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">Nome *</Label>
                                  <Input
                                    value={contact.name}
                                    onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                                    placeholder="Nome do contato"
                                    className="h-9"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Email</Label>
                                  <Input
                                    type="email"
                                    value={contact.email || ""}
                                    onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                                    placeholder="email@exemplo.com"
                                    className="h-9"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Telefone</Label>
                                  <Input
                                    type="tel"
                                    value={contact.phone || ""}
                                    onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                                    placeholder="(00) 00000-0000"
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        <Star className="h-3 w-3 inline mr-1" />
                        Clique na estrela para marcar contatos como principais. Você pode ter múltiplos contatos
                        principais.
                      </p>
                    </div>
                  ) : lead.people && lead.people.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Responsável Principal</Label>
                        <div className="flex items-center gap-2 mt-2 p-3 bg-muted rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={lead.assignedTo?.avatar || "/placeholder.svg"}
                              alt={lead.assignedTo?.name}
                            />
                            <AvatarFallback>{lead.assignedTo?.name?.substring(0, 2) || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{lead.assignedTo?.name || "Não definido"}</p>
                            {lead.assignedTo?.email && (
                              <p className="text-xs text-muted-foreground">{lead.assignedTo.email}</p>
                            )}
                          </div>
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Todos os Contatos</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {lead.people.map((member) => (
                            <div key={member.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                                <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{member.name}</p>
                                {member.email && (
                                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                )}
                              </div>
                              {lead.assignedTo?.id === member.id && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum contato definido.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              {/* Adicionar Nova Interação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Registrar Interação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={newInteraction.type}
                          onValueChange={(value: "call" | "email" | "meeting" | "note" | "feedback") =>
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
                              : "Descreva a interação..."
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleAddInteraction} className="w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar {newInteraction.type === "feedback" ? "Feedback" : "Interação"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline de Interações */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline de Interações</CardTitle>
                </CardHeader>
                <CardContent>
                  {lead.interactions && lead.interactions.length > 0 ? (
                    <div className="space-y-4">
                      {lead.interactions
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
                              <span className="text-sm text-muted-foreground">por {userNameCache[interaction.createdBy] || interaction.createdBy}</span>
                            </div>

                            {interaction.type === "feedback" && interaction.rating !== undefined && (
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">Avaliação: {interaction.rating}/10</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        i < (interaction.rating || 0) ? "bg-yellow-400" : "bg-gray-200"
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
                    <p className="text-muted-foreground text-center py-8">Nenhuma interação registrada ainda.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              {/* Resumo de Feedbacks */}
              {lead.interactions && lead.interactions.filter((i) => i.type === "feedback").length > 0 && (
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
                          lead.interactions?.filter((i) => i.type === "feedback" && i.feedbackType === type).length || 0
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
                        lead.interactions?.filter((i) => i.type === "feedback" && i.rating) || []
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

              {/* Lista Detalhada de Feedbacks */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Feedbacks</CardTitle>
                </CardHeader>
                <CardContent>
                  {lead.interactions && lead.interactions.filter((i) => i.type === "feedback").length > 0 ? (
                    <div className="space-y-4">
                      {lead.interactions
                        .filter((i) => i.type === "feedback")
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((feedback) => (
                          <div key={feedback.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getInteractionIcon(feedback.type, feedback.feedbackType)}
                                <Badge className={feedbackTypes[feedback.feedbackType || "neutral"].color}>
                                  {feedbackTypes[feedback.feedbackType || "neutral"].label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(feedback.date).toLocaleString("pt-BR")}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">por {userNameCache[feedback.createdBy] || feedback.createdBy}</span>
                            </div>

                            {feedback.rating !== undefined && (
                              <div className="flex items-center gap-2 mb-3">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">Avaliação: {feedback.rating}/10</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        i < (feedback.rating || 0) ? "bg-yellow-400" : "bg-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-sm">{feedback.description}</p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum feedback registrado ainda.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Ações do Footer */}
        {!isEditing && (
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Excluir Lead
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Lead
              </Button>
            </div>
          </div>
        )}

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
                  if (lead) {
                    onDelete(lead.id)
                  }
                  setConfirmDeleteOpen(false)
                  onClose()
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
