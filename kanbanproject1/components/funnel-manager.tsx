"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Target,
  Users,
  Briefcase,
  Heart,
  Star,
  TrendingUp,
  Building,
  Handshake,
  GripVertical,
  X,
} from "lucide-react"

type Funnel = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  columns: Array<{
    id: string
    name: string
    color: string
    order: number
    description?: string
    visible?: boolean
    limit?: number
  }>
  isActive: boolean
  createdAt: string
}

type FunnelTemplate = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  columns: Array<{
    id: string
    name: string
    color: string
    order: number
    description?: string
  }>
}

interface FunnelManagerProps {
  funnels: Funnel[]
  onSave: (funnels: Funnel[]) => void
  onClose: () => void
}

// Templates predefinidos
const funnelTemplates: FunnelTemplate[] = [
  {
    id: "template1",
    name: "Vendas B2B Tradicional",
    description: "Funil clássico para vendas corporativas",
    category: "Vendas",
    icon: "briefcase",
    columns: [
      { id: "lead", name: "Lead", color: "#64748b", order: 0, description: "Novos contatos identificados" },
      {
        id: "qualificado",
        name: "Qualificado",
        color: "#3b82f6",
        order: 1,
        description: "Leads com potencial confirmado",
      },
      { id: "proposta", name: "Proposta", color: "#f59e0b", order: 2, description: "Proposta comercial enviada" },
      { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3, description: "Em processo de negociação" },
      { id: "fechamento", name: "Fechamento", color: "#10b981", order: 4, description: "Venda concluída" },
      { id: "perdido", name: "Perdido", color: "#ef4444", order: 5, description: "Oportunidade perdida" },
    ],
  },
  {
    id: "template2",
    name: "Vendas B2C Rápidas",
    description: "Funil otimizado para vendas diretas ao consumidor",
    category: "Vendas",
    icon: "users",
    columns: [
      { id: "interesse", name: "Interesse", color: "#64748b", order: 0, description: "Cliente demonstrou interesse" },
      {
        id: "contato",
        name: "Primeiro Contato",
        color: "#3b82f6",
        order: 1,
        description: "Primeiro contato realizado",
      },
      { id: "apresentacao", name: "Apresentação", color: "#f59e0b", order: 2, description: "Produto apresentado" },
      { id: "fechamento", name: "Fechamento", color: "#10b981", order: 3, description: "Venda finalizada" },
      { id: "perdido", name: "Perdido", color: "#ef4444", order: 4, description: "Não converteu" },
    ],
  },
  {
    id: "template3",
    name: "Parcerias Estratégicas",
    description: "Desenvolvimento de parcerias comerciais",
    category: "Parcerias",
    icon: "handshake",
    columns: [
      { id: "prospeccao", name: "Prospecção", color: "#64748b", order: 0, description: "Identificação de parceiros" },
      {
        id: "contato_inicial",
        name: "Contato Inicial",
        color: "#3b82f6",
        order: 1,
        description: "Primeiro contato estabelecido",
      },
      { id: "avaliacao", name: "Avaliação", color: "#f59e0b", order: 2, description: "Avaliação mútua de fit" },
      { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3, description: "Termos sendo negociados" },
      { id: "acordo", name: "Acordo", color: "#10b981", order: 4, description: "Parceria estabelecida" },
      { id: "rejeitado", name: "Rejeitado", color: "#ef4444", order: 5, description: "Parceria não estabelecida" },
    ],
  },
  {
    id: "template4",
    name: "Atendimento ao Cliente",
    description: "Gestão de tickets de suporte",
    category: "Suporte",
    icon: "heart",
    columns: [
      { id: "aberto", name: "Aberto", color: "#64748b", order: 0, description: "Ticket criado" },
      { id: "em_andamento", name: "Em Andamento", color: "#3b82f6", order: 1, description: "Sendo analisado" },
      { id: "aguardando", name: "Aguardando Cliente", color: "#f59e0b", order: 2, description: "Aguardando resposta" },
      { id: "resolvido", name: "Resolvido", color: "#10b981", order: 3, description: "Problema solucionado" },
      { id: "fechado", name: "Fechado", color: "#6b7280", order: 4, description: "Ticket finalizado" },
    ],
  },
  {
    id: "template5",
    name: "Recrutamento",
    description: "Processo seletivo de candidatos",
    category: "RH",
    icon: "star",
    columns: [
      { id: "candidatura", name: "Candidatura", color: "#64748b", order: 0, description: "Candidato se inscreveu" },
      { id: "triagem", name: "Triagem", color: "#3b82f6", order: 1, description: "Análise inicial do perfil" },
      {
        id: "entrevista",
        name: "Entrevista",
        color: "#f59e0b",
        order: 2,
        description: "Entrevista agendada/realizada",
      },
      { id: "teste", name: "Teste Técnico", color: "#8b5cf6", order: 3, description: "Avaliação técnica" },
      { id: "aprovado", name: "Aprovado", color: "#10b981", order: 4, description: "Candidato selecionado" },
      { id: "reprovado", name: "Reprovado", color: "#ef4444", order: 5, description: "Candidato não selecionado" },
    ],
  },
]

// Cores disponíveis
const availableColors = [
  "#64748b",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#64748b",
]

// Ícones disponíveis
const availableIcons = [
  { id: "target", name: "Alvo", icon: Target },
  { id: "users", name: "Usuários", icon: Users },
  { id: "briefcase", name: "Maleta", icon: Briefcase },
  { id: "heart", name: "Coração", icon: Heart },
  { id: "star", name: "Estrela", icon: Star },
  { id: "trending-up", name: "Crescimento", icon: TrendingUp },
  { id: "building", name: "Prédio", icon: Building },
  { id: "handshake", name: "Aperto de Mão", icon: Handshake },
]

export default function FunnelManager({ funnels, onSave, onClose }: FunnelManagerProps) {
  const [localFunnels, setLocalFunnels] = useState<Funnel[]>(funnels)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null)
  const [activeTab, setActiveTab] = useState("funnels")

  // Estados para criação/edição
  const [funnelName, setFunnelName] = useState("")
  const [funnelDescription, setFunnelDescription] = useState("")
  const [funnelCategory, setFunnelCategory] = useState("")
  const [funnelIcon, setFunnelIcon] = useState("target")
  const [funnelColumns, setFunnelColumns] = useState<
    Array<{
      id: string
      name: string
      color: string
      order: number
      description?: string
    }>
  >([])

  const handleCreateFunnel = () => {
    setFunnelName("")
    setFunnelDescription("")
    setFunnelCategory("")
    setFunnelIcon("target")
    setFunnelColumns([{ id: "step1", name: "Nova Etapa", color: "#64748b", order: 0, description: "" }])
    setEditingFunnel(null)
    setShowCreateDialog(true)
  }

  const handleEditFunnel = (funnel: Funnel) => {
    setFunnelName(funnel.name)
    setFunnelDescription(funnel.description)
    setFunnelCategory(funnel.category)
    setFunnelIcon(funnel.icon)
    setFunnelColumns(funnel.columns.map((col) => ({ ...col })))
    setEditingFunnel(funnel)
    setShowCreateDialog(true)
  }

  const handleDuplicateFunnel = (funnel: Funnel) => {
    const newFunnel: Funnel = {
      ...funnel,
      id: `funnel_${Date.now()}`,
      name: `${funnel.name} (Cópia)`,
      createdAt: new Date().toISOString(),
    }
    setLocalFunnels((prev) => [...prev, newFunnel])
    toast({
      title: "Funil duplicado",
      description: `O funil "${newFunnel.name}" foi criado com sucesso.`,
    })
  }

  const handleDeleteFunnel = (funnelId: string) => {
    const funnel = localFunnels.find((f) => f.id === funnelId)
    if (!funnel) return

    setLocalFunnels((prev) => prev.filter((f) => f.id !== funnelId))
    toast({
      title: "Funil excluído",
      description: `O funil "${funnel.name}" foi removido.`,
    })
  }

  const handleToggleFunnelActive = (funnelId: string) => {
    setLocalFunnels((prev) => prev.map((f) => (f.id === funnelId ? { ...f, isActive: !f.isActive } : f)))
  }

  const handleSaveFunnel = () => {
    if (!funnelName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do funil é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (funnelColumns.length === 0) {
      toast({
        title: "Erro",
        description: "O funil deve ter pelo menos uma etapa.",
        variant: "destructive",
      })
      return
    }

    const funnelData: Funnel = {
      id: editingFunnel?.id || `funnel_${Date.now()}`,
      name: funnelName,
      description: funnelDescription,
      category: funnelCategory,
      icon: funnelIcon,
      columns: funnelColumns.map((col, index) => ({
        ...col,
        order: index,
        visible: true,
      })),
      isActive: editingFunnel?.isActive ?? true,
      createdAt: editingFunnel?.createdAt || new Date().toISOString(),
    }

    if (editingFunnel) {
      setLocalFunnels((prev) => prev.map((f) => (f.id === editingFunnel.id ? funnelData : f)))
      toast({
        title: "Funil atualizado",
        description: `O funil "${funnelData.name}" foi atualizado com sucesso.`,
      })
    } else {
      setLocalFunnels((prev) => [...prev, funnelData])
      toast({
        title: "Funil criado",
        description: `O funil "${funnelData.name}" foi criado com sucesso.`,
      })
    }

    setShowCreateDialog(false)
  }

  const handleApplyTemplate = (template: FunnelTemplate) => {
    const newFunnel: Funnel = {
      id: `funnel_${Date.now()}`,
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      columns: template.columns.map((col) => ({
        ...col,
        visible: true,
      })),
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    setLocalFunnels((prev) => [...prev, newFunnel])
    toast({
      title: "Template aplicado",
      description: `O funil "${newFunnel.name}" foi criado a partir do template.`,
    })
  }

  const addColumn = () => {
    const newColumn = {
      id: `step_${Date.now()}`,
      name: "Nova Etapa",
      color: availableColors[funnelColumns.length % availableColors.length],
      order: funnelColumns.length,
      description: "",
    }
    setFunnelColumns((prev) => [...prev, newColumn])
  }

  const removeColumn = (columnId: string) => {
    setFunnelColumns((prev) => prev.filter((col) => col.id !== columnId))
  }

  const updateColumn = (columnId: string, updates: Partial<(typeof funnelColumns)[0]>) => {
    setFunnelColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, ...updates } : col)))
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(funnelColumns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFunnelColumns(items.map((item, index) => ({ ...item, order: index })))
  }

  const getIcon = (iconId: string) => {
    const iconData = availableIcons.find((icon) => icon.id === iconId)
    return iconData ? iconData.icon : Target
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciador de Funis</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="funnels">Meus Funis</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="funnels" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Funis Personalizados</h3>
                <p className="text-sm text-muted-foreground">Gerencie seus funis de vendas personalizados</p>
              </div>
              <Button onClick={handleCreateFunnel}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Funil
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localFunnels.map((funnel) => {
                const IconComponent = getIcon(funnel.icon)
                return (
                  <Card key={funnel.id} className={`${!funnel.isActive ? "opacity-60" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{funnel.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{funnel.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={funnel.isActive}
                            onCheckedChange={() => handleToggleFunnelActive(funnel.id)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{funnel.description}</p>

                      <div className="flex flex-wrap gap-1">
                        {funnel.columns.slice(0, 4).map((column) => (
                          <Badge
                            key={column.id}
                            variant="outline"
                            style={{ borderColor: column.color, color: column.color }}
                          >
                            {column.name}
                          </Badge>
                        ))}
                        {funnel.columns.length > 4 && (
                          <Badge variant="outline">+{funnel.columns.length - 4} mais</Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">{funnel.columns.length} etapas</span>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditFunnel(funnel)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicateFunnel(funnel)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFunnel(funnel.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => onSave(localFunnels)}>Salvar Alterações</Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Templates Predefinidos</h3>
              <p className="text-sm text-muted-foreground">Use templates prontos para acelerar a criação de funis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funnelTemplates.map((template) => {
                const IconComponent = getIcon(template.icon)
                return (
                  <Card key={template.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <IconComponent className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{template.category}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{template.description}</p>

                      <div className="flex flex-wrap gap-1">
                        {template.columns.map((column) => (
                          <Badge
                            key={column.id}
                            variant="outline"
                            style={{ borderColor: column.color, color: column.color }}
                          >
                            {column.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">{template.columns.length} etapas</span>
                        <Button size="sm" onClick={() => handleApplyTemplate(template)}>
                          Usar Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de Criação/Edição */}
        {showCreateDialog && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFunnel ? "Editar Funil" : "Criar Novo Funil"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="funnel-name">Nome do Funil</Label>
                    <Input
                      id="funnel-name"
                      value={funnelName}
                      onChange={(e) => setFunnelName(e.target.value)}
                      placeholder="Ex: Vendas B2B"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funnel-category">Categoria</Label>
                    <Input
                      id="funnel-category"
                      value={funnelCategory}
                      onChange={(e) => setFunnelCategory(e.target.value)}
                      placeholder="Ex: Vendas, Marketing, Suporte"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funnel-description">Descrição</Label>
                  <Textarea
                    id="funnel-description"
                    value={funnelDescription}
                    onChange={(e) => setFunnelDescription(e.target.value)}
                    placeholder="Descreva o propósito deste funil..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {availableIcons.map((iconOption) => {
                      const IconComponent = iconOption.icon
                      return (
                        <Button
                          key={iconOption.id}
                          variant={funnelIcon === iconOption.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFunnelIcon(iconOption.id)}
                          className="flex flex-col items-center p-3 h-auto"
                        >
                          <IconComponent className="h-4 w-4 mb-1" />
                          <span className="text-xs">{iconOption.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Etapas do Funil */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Etapas do Funil</Label>
                      <p className="text-sm text-muted-foreground">Defina as etapas do seu processo de vendas</p>
                    </div>
                    <Button onClick={addColumn} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="columns">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {funnelColumns.map((column, index) => (
                            <Draggable key={column.id} draggableId={column.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center space-x-3 p-3 border rounded-lg bg-white"
                                >
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </div>

                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <Input
                                        value={column.name}
                                        onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                                        placeholder="Nome da etapa"
                                      />
                                    </div>

                                    <div>
                                      <Select
                                        value={column.color}
                                        onValueChange={(color) => updateColumn(column.id, { color })}
                                      >
                                        <SelectTrigger>
                                          <div className="flex items-center space-x-2">
                                            <div
                                              className="w-4 h-4 rounded-full"
                                              style={{ backgroundColor: column.color }}
                                            />
                                            <SelectValue />
                                          </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableColors.map((color) => (
                                            <SelectItem key={color} value={color}>
                                              <div className="flex items-center space-x-2">
                                                <div
                                                  className="w-4 h-4 rounded-full"
                                                  style={{ backgroundColor: color }}
                                                />
                                                <span>{color}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Input
                                        value={column.description || ""}
                                        onChange={(e) => updateColumn(column.id, { description: e.target.value })}
                                        placeholder="Descrição (opcional)"
                                      />
                                    </div>
                                  </div>

                                  {funnelColumns.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeColumn(column.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveFunnel}>{editingFunnel ? "Atualizar Funil" : "Criar Funil"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
