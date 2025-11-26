"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X, User, Calendar, FileText, Settings } from "lucide-react"

type Module = {
  id: string
  name: string
  description?: string
  color?: string
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
}

type CreateProjectDialogProps = {
  open: boolean
  onClose: () => void
  onCreate: (project: Omit<Project, "id" | "createdAt">) => void
  columns: Array<{ id: string; name: string; color: string }>
  modules: Array<{
    id: string
    name: string
    description?: string
    color?: string
  }>
  people: Array<{
    id: string
    name: string
    avatar: string
  }>
  onAddModule: (module: Omit<Module, "id">) => void
  leadData?: {
    id: string
    title: string
    client: string
    clientEmail?: string
    clientPhone?: string
    estimatedValue?: number
  }
}

const moduleColors = [
  { name: "Azul", value: "bg-blue-500" },
  { name: "Verde", value: "bg-green-500" },
  { name: "Roxo", value: "bg-purple-500" },
  { name: "Laranja", value: "bg-orange-500" },
  { name: "Rosa", value: "bg-pink-500" },
  { name: "Vermelho", value: "bg-red-500" },
  { name: "Amarelo", value: "bg-yellow-500" },
  { name: "Indigo", value: "bg-indigo-500" },
]

export default function CreateProjectDialog({
  open,
  onClose,
  onCreate,
  columns,
  modules,
  people,
  onAddModule,
  leadData,
}: CreateProjectDialogProps) {
  const [currentTab, setCurrentTab] = useState("basic")
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [newModule, setNewModule] = useState({
    name: "",
    description: "",
    color: "bg-blue-500",
  })

  const [formData, setFormData] = useState({
    title: leadData ? `Projeto - ${leadData.client}` : "",
    client: leadData?.client || "",
    clientEmail: leadData?.clientEmail || "",
    clientPhone: leadData?.clientPhone || "",
    clientAddress: "",
    description: "",
    status: columns[0]?.id || "",
    priority: "medium",
    deadline: "",
    budget: leadData?.estimatedValue || 0,
    modules: [] as string[],
    assignedTo: undefined as { id: string; name: string; avatar: string } | undefined,
    people: [] as Array<{ id: string; name: string; avatar: string }>,
    leadId: leadData?.id,
  })

  const handleSubmit = () => {
    // Validação mínima - apenas título e cliente são obrigatórios
    if (!formData.title.trim() || !formData.client.trim()) return

    onCreate({
      ...formData,
      people: formData.people.filter(Boolean),
    })

    // Reset form
    setFormData({
      title: "",
      client: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      description: "",
      status: columns[0]?.id || "",
      priority: "medium",
      deadline: "",
      budget: 0,
      modules: [],
      assignedTo: undefined,
      people: [],
    })
    setCurrentTab("basic")
    onClose()
  }

  const handleCreateModule = () => {
    if (!newModule.name) return

    onAddModule(newModule)
    setNewModule({ name: "", description: "", color: "bg-blue-500" })
    setShowModuleDialog(false)
  }

  const addModule = (moduleId: string) => {
    if (!formData.modules.includes(moduleId)) {
      setFormData({
        ...formData,
        modules: [...formData.modules, moduleId],
      })
    }
  }

  const removeModule = (moduleId: string) => {
    setFormData({
      ...formData,
      modules: formData.modules.filter((id) => id !== moduleId),
    })
  }

  const addTeamMember = () => {
    setFormData({
      ...formData,
      people: [...formData.people, { id: "", name: "", avatar: "" }],
    })
  }

  const updateTeamMember = (index: number, personId: string) => {
    const person = people.find((p) => p.id === personId)
    if (person) {
      const newPeople = [...formData.people]
      newPeople[index] = person
      setFormData({ ...formData, people: newPeople })
    }
  }

  const removeTeamMember = (index: number) => {
    setFormData({
      ...formData,
      people: formData.people.filter((_, i) => i !== index),
    })
  }

  const canProceed = (tab: string) => {
    switch (tab) {
      case "basic":
        return formData.title.trim().length > 0 && formData.client.trim().length > 0
      case "details":
        return true
      case "modules":
        return true
      case "team":
        return true
      case "review":
        return formData.title.trim().length > 0 && formData.client.trim().length > 0
      default:
        return true
    }
  }

  const nextTab = () => {
    const tabs = ["basic", "details", "modules", "team", "review"]
    const currentIndex = tabs.indexOf(currentTab)
    if (currentIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentIndex + 1])
    }
  }

  const prevTab = () => {
    const tabs = ["basic", "details", "modules", "team", "review"]
    const currentIndex = tabs.indexOf(currentTab)
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1])
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{leadData ? `Converter Lead em Projeto - ${leadData.client}` : "Novo Projeto"}</DialogTitle>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="modules" className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Módulos
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Equipe
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Resumo
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Título do Projeto *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nome do projeto"
                    />
                  </div>
                  <div>
                    <Label>Cliente *</Label>
                    <Input
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      placeholder="Nome do cliente"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email do Cliente</Label>
                    <Input
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      placeholder="Email do cliente"
                    />
                  </div>
                  <div>
                    <Label>Telefone do Cliente</Label>
                    <Input
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      placeholder="Telefone do cliente"
                    />
                  </div>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do projeto"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status Inicial</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
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
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Entrega</Label>
                    <Input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Endereço do Cliente</Label>
                    <Input
                      value={formData.clientAddress}
                      onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                      placeholder="Endereço do cliente"
                    />
                  </div>
                </div>

                <div>
                  <Label>Orçamento (R$)</Label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <Label>Responsável Principal</Label>
                  <Select
                    value={formData.assignedTo?.id || ""}
                    onValueChange={(value) => {
                      const person = people.find((p) => p.id === value)
                      setFormData({ ...formData, assignedTo: person })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="modules" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Módulos do Projeto</h3>
                  <Button variant="outline" onClick={() => setShowModuleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Módulo
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Os módulos são opcionais e podem ser personalizados conforme a necessidade do projeto.
                </p>

                {modules.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Módulos Disponíveis</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {modules.map((module) => (
                        <Card
                          key={module.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addModule(module.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${module.color} mr-2`} />
                                <span className="font-medium text-sm">{module.name}</span>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {module.description && (
                              <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {formData.modules.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Módulos Selecionados</h4>
                    <div className="space-y-2">
                      {formData.modules.map((moduleId) => {
                        const module = modules.find((m) => m.id === moduleId)
                        if (!module) return null
                        return (
                          <div key={module.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${module.color} mr-2`} />
                              <span className="font-medium">{module.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeModule(moduleId)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Equipe do Projeto</h3>
                  <Button variant="outline" onClick={addTeamMember}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.people.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select value={member.id} onValueChange={(value) => updateTeamMember(index, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um membro" />
                        </SelectTrigger>
                        <SelectContent>
                          {people.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => removeTeamMember(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {formData.people.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro da equipe adicionado. Clique em "Adicionar Membro" para começar.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                <h3 className="text-lg font-medium">Resumo do Projeto</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Título</Label>
                      <p className="text-sm">{formData.title || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Cliente</Label>
                      <p className="text-sm">{formData.client || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Email do Cliente</Label>
                      <p className="text-sm">{formData.clientEmail || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Telefone do Cliente</Label>
                      <p className="text-sm">{formData.clientPhone || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Endereço do Cliente</Label>
                      <p className="text-sm">{formData.clientAddress || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Responsável Principal</Label>
                      <p className="text-sm">{formData.assignedTo?.name || "Não informado"}</p>
                    </div>
                  </div>

                  {formData.description && (
                    <div>
                      <Label className="text-sm font-medium">Descrição</Label>
                      <p className="text-sm">{formData.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Prioridade</Label>
                      <Badge
                        className={
                          formData.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : formData.priority === "high"
                              ? "bg-orange-100 text-orange-800"
                              : formData.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                        }
                      >
                        {formData.priority === "urgent"
                          ? "Urgente"
                          : formData.priority === "high"
                            ? "Alta"
                            : formData.priority === "medium"
                              ? "Média"
                              : "Baixa"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Orçamento</Label>
                      <p className="text-sm">
                        {formData.budget > 0 ? `R$ ${formData.budget.toLocaleString("pt-BR")}` : "Não informado"}
                      </p>
                    </div>
                  </div>

                  {formData.modules.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Módulos ({formData.modules.length})</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.modules.map((moduleId) => {
                          const module = modules.find((m) => m.id === moduleId)
                          if (!module) return null
                          return (
                            <Badge key={module.id} variant="outline" className="text-xs">
                              <div className={`w-2 h-2 rounded-full ${module.color} mr-1`} />
                              {module.name}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {formData.people.filter(Boolean).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Equipe ({formData.people.filter(Boolean).length})</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.people.filter(Boolean).map((member, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {member.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={prevTab} disabled={currentTab === "basic"}>
                Anterior
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                {currentTab === "review" ? (
                  <Button onClick={handleSubmit} disabled={!canProceed(currentTab)}>
                    Criar Projeto
                  </Button>
                ) : (
                  <Button onClick={nextTab} disabled={!canProceed(currentTab)}>
                    Próximo
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar módulo personalizado */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Módulo Personalizado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome do Módulo *</Label>
              <Input
                value={newModule.name}
                onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                placeholder="Ex: Desenvolvimento Frontend"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={newModule.description}
                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                placeholder="Descrição do módulo"
                rows={2}
              />
            </div>

            <div>
              <Label>Cor</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {moduleColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-full h-8 rounded ${color.value} ${
                      newModule.color === color.value ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    onClick={() => setNewModule({ ...newModule, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateModule} disabled={!newModule.name}>
                Criar Módulo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
