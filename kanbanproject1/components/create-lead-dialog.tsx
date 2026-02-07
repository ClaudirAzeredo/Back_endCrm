"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"
import {
  User,
  Building,
  Phone,
  MapPin,
  Target,
  AlertCircle,
  FileText,
  CheckCircle,
  Tag,
  Users,
  Star,
  Plus,
  Trash2,
} from "lucide-react"
import TagInput from "./tag-input"
import { usersApi } from "@/lib/api/users-api"
import { authApi } from "@/lib/api/auth-api"
import { useApiTags } from "@/hooks/use-api-tags"

type Person = {
  id: string
  name: string
  avatar: string
  phone?: string
  email?: string
}

type Contact = {
  id: string
  name: string
  email?: string
  phone?: string
  isPrincipal: boolean
}

type Lead = {
  id: string
  title: string
  client: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  clientType?: "fisica" | "juridica"
  clientCNPJ?: string
  source: string
  status: string
  assignedTo?: Person
  people: Person[]
  priority?: string
  estimatedValue?: number
  expectedCloseDate?: string
  notes?: string
  tags?: string[]
  contacts?: Contact[]
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

type Column = {
  id: string
  name: string
  color: string
  order: number
}

type CreateLeadDialogProps = {
  open: boolean
  people: Person[]
  columns: Column[]
  onClose: () => void
  onCreate: (leadData: Omit<Lead, "id" | "createdAt">) => void
}

const sources = [
  { value: "website", label: "Website" },
  { value: "google_ads", label: "Google Ads" },
  { value: "facebook_ads", label: "Facebook Ads" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Indicação" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "event", label: "Evento" },
  { value: "other", label: "Outros" },
]

const priorities = [
  { value: "low", label: "Baixa", color: "bg-blue-100 text-blue-800" },
  { value: "medium", label: "Média", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Alta", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgente", color: "bg-red-100 text-red-800" },
]

export default function CreateLeadDialog({ open, people, columns, onClose, onCreate }: CreateLeadDialogProps) {
  const [currentTab, setCurrentTab] = useState("contact")
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    clientType: "fisica" as "fisica" | "juridica",
    clientCNPJ: "",
    source: "",
    status: columns.find((col) => col.order === 0)?.id || "",
    assignedTo: "",
    priority: "medium",
    estimatedValue: "",
    expectedCloseDate: "",
    notes: "",
    tags: [] as string[],
  })

  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "contact-1",
      name: "",
      email: "",
      phone: "",
      isPrincipal: true,
    },
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Responsáveis carregados da API
  const [availableResponsibles, setAvailableResponsibles] = useState<
    Array<{ id: string; name: string; email: string; avatar: string }>
  >([])

  // Carrega usuários quando o diálogo abre (ou no primeiro render)
  // Evita usar funções legadas que retornam vazio
  useEffect(() => {
    let isMounted = true
    const loadUsers = async () => {
      try {
        // Obter empresa atual do usuário autenticado
        let companyId: string | undefined
        try {
          const me = await authApi.me()
          companyId = me?.companyId || undefined
          console.log("[v0] Current user for company scope:", me)
        } catch (e) {
          console.warn("[v0] Failed to fetch /auth/me; fallback to all users.", e)
        }

        const users = await usersApi.list(companyId)
        const filtered = companyId ? (users || []).filter((u: any) => u.companyId === companyId) : (users || [])
        const mapped = filtered.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: `/placeholder.svg?height=32&width=32&query=${encodeURIComponent(user.name || "Usuario")}`,
        }))
        if (isMounted) setAvailableResponsibles(mapped)
        console.log("[v0] Available responsibles loaded from API:", mapped)
      } catch (error) {
        console.error("[v0] Failed to load users for responsibles:", error)
        if (isMounted) setAvailableResponsibles([])
      }
    }
    loadUsers()
    return () => {
      isMounted = false
    }
  }, [])

  console.log("[v0] Available responsibles for lead assignment:", availableResponsibles)

  const addContact = () => {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name: "",
      email: "",
      phone: "",
      isPrincipal: false,
    }
    setContacts([...contacts, newContact])
  }

  const removeContact = (id: string) => {
    if (contacts.length === 1) {
      toast({
        title: "Atenção",
        description: "É necessário ter pelo menos um contato.",
        variant: "destructive",
      })
      return
    }
    setContacts(contacts.filter((c) => c.id !== id))
  }

  const updateContact = (id: string, field: keyof Contact, value: string | boolean) => {
    setContacts(
      contacts.map((c) => {
        if (c.id === id) {
          return { ...c, [field]: value }
        }
        return c
      }),
    )
  }

  const togglePrincipal = (id: string) => {
    setContacts(
      contacts.map((c) => {
        if (c.id === id) {
          return { ...c, isPrincipal: !c.isPrincipal }
        }
        return c
      }),
    )
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, "")
    return cleanCNPJ.length === 14
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const principalContacts = contacts.filter((c) => c.isPrincipal && c.name.trim() && c.phone?.trim())

    if (principalContacts.length === 0) {
      newErrors.contacts = "É necessário ter pelo menos um contato principal com nome e telefone"
    }

    if (formData.clientType === "juridica" && !formData.title.trim()) {
      newErrors.title = "Nome da empresa é obrigatório para pessoa jurídica"
    }

    if (formData.clientType === "juridica" && formData.clientCNPJ && !validateCNPJ(formData.clientCNPJ)) {
      newErrors.clientCNPJ = "CNPJ deve ter 14 dígitos"
    }

    // Removed validation for formData.client.trim() as it's replaced by contacts
    // if (!formData.client.trim()) {
    //   newErrors.client = "Nome completo é obrigatório"
    // }

    if (!formData.source) {
      newErrors.source = "Origem é obrigatória"
    }

    if (!formData.status) {
      newErrors.status = "Status inicial é obrigatório"
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = "Responsável é obrigatório"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Erro na validação",
        description: "Por favor, corrija os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const assignedPerson = availableResponsibles.find((p) => p.id === formData.assignedTo)

    const primaryContact = contacts.find((c) => c.isPrincipal) || contacts[0]

    const leadData: Omit<Lead, "id" | "createdAt"> = {
      title: formData.clientType === "juridica" ? formData.title : primaryContact.name,
      client: primaryContact.name,
      clientEmail: primaryContact.email || undefined,
      clientPhone: primaryContact.phone,
      clientAddress: formData.clientAddress || undefined,
      clientType: formData.clientType,
      clientCNPJ: formData.clientType === "juridica" ? formData.clientCNPJ || undefined : undefined,
      source: formData.source,
      status: formData.status,
      assignedTo: assignedPerson,
      people: assignedPerson ? [assignedPerson] : [],
      priority: formData.priority as "low" | "medium" | "high" | "urgent",
      estimatedValue: formData.estimatedValue ? Number.parseFloat(formData.estimatedValue) : undefined,
      expectedCloseDate: formData.expectedCloseDate || undefined,
      notes: formData.notes || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      contacts: contacts.filter((c) => c.name.trim()),
      interactions: [],
    }

    console.log("[v0] Creating lead with tags:", formData.tags)
    console.log("[v0] Lead data being saved:", leadData)

    onCreate(leadData)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      title: "",
      client: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      clientType: "fisica",
      clientCNPJ: "",
      source: "",
      status: columns.find((col) => col.order === 0)?.id || "",
      assignedTo: "",
      priority: "medium",
      estimatedValue: "",
      expectedCloseDate: "",
      notes: "",
      tags: [],
    })
    setContacts([
      {
        id: "contact-1",
        name: "",
        email: "",
        phone: "",
        isPrincipal: true,
      },
    ])
    setErrors({})
    setCurrentTab("contact")
    onClose()
  }

  const getNextTab = (current: string) => {
    const tabs = ["contact", "business", "details", "summary"]
    const currentIndex = tabs.indexOf(current)
    return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : current
  }

  const getPreviousTab = (current: string) => {
    const tabs = ["contact", "business", "details", "summary"]
    const currentIndex = tabs.indexOf(current)
    return currentIndex > 0 ? tabs[currentIndex - 1] : current
  }

  const selectedPriority = priorities.find((p) => p.value === formData.priority)
  const selectedSource = sources.find((s) => s.value === formData.source)
  const selectedColumn = columns.find((c) => c.id === formData.status)
  const selectedPerson = availableResponsibles.find((p) => p.id === formData.assignedTo)
  
  const { tags: availableTags, fetchTags } = useApiTags()

  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open, fetchTags])

  const selectedTags = Array.isArray(availableTags)
    ? availableTags.filter((tag) => formData.tags.includes(tag.id))
    : []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo lead.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Negócio
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo de Cliente</Label>
              <RadioGroup
                value={formData.clientType}
                onValueChange={(value: "fisica" | "juridica") => handleInputChange("clientType", value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fisica" id="fisica" />
                  <Label htmlFor="fisica">Pessoa Física</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="juridica" id="juridica" />
                  <Label htmlFor="juridica">Pessoa Jurídica</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.clientType === "juridica" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Nome da Empresa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Nome da empresa"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientCNPJ">CNPJ</Label>
                  <Input
                    id="clientCNPJ"
                    placeholder="00.000.000/0000-00"
                    value={formData.clientCNPJ}
                    onChange={(e) => handleInputChange("clientCNPJ", e.target.value)}
                    className={errors.clientCNPJ ? "border-red-500" : ""}
                  />
                  {errors.clientCNPJ && <p className="text-sm text-red-500">{errors.clientCNPJ}</p>}
                </div>
              </>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Contatos <span className="text-red-500">*</span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Contato
                </Button>
              </div>

              {errors.contacts && <p className="text-sm text-red-500">{errors.contacts}</p>}

              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={contact.id} className="border rounded-lg p-4 space-y-3 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Contato {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePrincipal(contact.id)}
                          className={contact.isPrincipal ? "text-yellow-500" : "text-gray-400"}
                        >
                          <Star className={`h-4 w-4 ${contact.isPrincipal ? "fill-yellow-500" : ""}`} />
                        </Button>
                        {contact.isPrincipal && (
                          <Badge variant="secondary" className="text-xs">
                            Principal
                          </Badge>
                        )}
                      </div>
                      {contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(contact.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`contact-name-${contact.id}`}>
                          Nome Completo {contact.isPrincipal && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id={`contact-name-${contact.id}`}
                          placeholder="Nome do contato"
                          value={contact.name}
                          onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`contact-email-${contact.id}`}>Email</Label>
                          <Input
                            id={`contact-email-${contact.id}`}
                            type="email"
                            placeholder="email@exemplo.com"
                            value={contact.email}
                            onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`contact-phone-${contact.id}`} className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Telefone {contact.isPrincipal && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id={`contact-phone-${contact.id}`}
                            placeholder="(11) 99999-9999"
                            value={contact.phone}
                            onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Clique na estrela para marcar contatos como principais. Você pode ter múltiplos contatos principais.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Input
                id="clientAddress"
                placeholder="Endereço completo"
                value={formData.clientAddress}
                onChange={(e) => handleInputChange("clientAddress", e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">
                  Origem <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                  <SelectTrigger className={errors.source ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.source && <p className="text-sm text-red-500">{errors.source}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status Inicial <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns
                      .sort((a, b) => a.order - b.order)
                      .map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                            {column.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Prioridade
                </Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={priority.color}>{priority.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Responsável <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange("assignedTo", value)}>
                  <SelectTrigger className={errors.assignedTo ? "border-red-500" : ""}>
                    {selectedPerson ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedPerson.avatar || "/placeholder.svg"} alt={selectedPerson.name} />
                          <AvatarFallback>{selectedPerson.name?.substring(0, 2) || "??"}</AvatarFallback>
                        </Avatar>
                        <span>{selectedPerson.name}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Selecione um responsável" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {availableResponsibles.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={person.avatar || "/placeholder.svg"} alt={person.name} />
                            <AvatarFallback>{person.name?.substring(0, 2) || "??"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{person.name}</div>
                            <div className="text-xs text-muted-foreground">{person.email}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignedTo && <p className="text-sm text-red-500">{errors.assignedTo}</p>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedValue" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Valor Estimado (R$)
                </Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  placeholder="0,00"
                  value={formData.estimatedValue}
                  onChange={(e) => handleInputChange("estimatedValue", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate">Data Esperada de Fechamento</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => handleInputChange("expectedCloseDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <TagInput
                selectedTags={formData.tags}
                onTagsChange={(tags) => handleInputChange("tags", tags)}
                placeholder="Digite para buscar ou criar tags..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre este lead..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Resumo do Lead</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Cliente</p>
                  <p className="font-medium">
                    {formData.clientType === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                  </p>
                </div>
                {formData.clientType === "juridica" && formData.title && (
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{formData.title}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Contatos</p>
                <div className="space-y-2">
                  {contacts
                    .filter((c) => c.name.trim())
                    .map((contact) => (
                      <div key={contact.id} className="flex items-start gap-2 p-2 bg-white rounded border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contact.name}</p>
                            {contact.isPrincipal && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                          </div>
                          {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                          {contact.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {formData.clientAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{formData.clientAddress}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Origem</p>
                  <p className="font-medium">{selectedSource?.label || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status Inicial</p>
                  <div className="flex items-center gap-2">
                    {selectedColumn && (
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedColumn.color }} />
                    )}
                    <p className="font-medium">{selectedColumn?.name || "Não informado"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Prioridade</p>
                  {selectedPriority && <Badge className={selectedPriority.color}>{selectedPriority.label}</Badge>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  {selectedPerson && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedPerson.avatar || "/placeholder.svg"} alt={selectedPerson.name} />
                        <AvatarFallback>{selectedPerson.name?.substring(0, 2) || "??"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedPerson.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedPerson.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedTags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTags.map((tag: any) => (
                      <Badge key={tag.id} style={{ backgroundColor: tag.color, color: "white" }}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.estimatedValue && (
                <div>
                  <p className="text-sm text-muted-foreground">Valor Estimado</p>
                  <p className="font-medium">R$ {Number.parseFloat(formData.estimatedValue).toLocaleString("pt-BR")}</p>
                </div>
              )}

              {formData.expectedCloseDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Data Esperada de Fechamento</p>
                  <p className="font-medium">{new Date(formData.expectedCloseDate).toLocaleDateString("pt-BR")}</p>
                </div>
              )}

              {formData.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{formData.notes}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() =>
              setCurrentTab(
                currentTab === "contact"
                  ? "contact"
                  : currentTab === "business"
                    ? "contact"
                    : currentTab === "details"
                      ? "business"
                      : "details",
              )
            }
            disabled={currentTab === "contact"}
          >
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>

            {currentTab === "summary" ? (
              <Button onClick={handleSubmit}>Criar Lead</Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentTab(
                    currentTab === "contact" ? "business" : currentTab === "business" ? "details" : "summary",
                  )
                }
              >
                Próximo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
