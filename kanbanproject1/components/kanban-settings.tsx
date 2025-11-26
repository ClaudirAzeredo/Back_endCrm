"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Plus, Trash2, GripVertical, Settings, Eye, EyeOff, Save, RotateCcw, Copy } from "lucide-react"

// Tipos
type KanbanColumn = {
  id: string
  name: string
  color: string
  order: number
  visible?: boolean
  limit?: number
}

type CustomField = {
  id: string
  name: string
  type: "text" | "select" | "date" | "number" | "boolean"
  options?: string[]
  required?: boolean
  visible?: boolean
}

type KanbanConfig = {
  columns: KanbanColumn[]
  customFields: CustomField[]
}

type KanbanSettingsProps = {
  config: KanbanConfig
  onSave: (config: KanbanConfig) => void
  onClose: () => void
}

// Cores predefinidas
const predefinedColors = [
  "#64748b", // slate
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
]

export default function KanbanSettings({ config, onSave, onClose }: KanbanSettingsProps) {
  const [localConfig, setLocalConfig] = useState<KanbanConfig>(JSON.parse(JSON.stringify(config)))
  const [activeTab, setActiveTab] = useState("columns")

  // Manipular reordenação de colunas
  const handleColumnReorder = (result: any) => {
    if (!result.destination) return

    const items = Array.from(localConfig.columns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Atualizar a ordem
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }))

    setLocalConfig({
      ...localConfig,
      columns: updatedItems,
    })
  }

  // Adicionar nova coluna
  const addColumn = () => {
    const newColumn: KanbanColumn = {
      id: `col_${Date.now()}`,
      name: "Nova Coluna",
      color: predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
      order: localConfig.columns.length,
      visible: true,
      limit: undefined,
    }

    setLocalConfig({
      ...localConfig,
      columns: [...localConfig.columns, newColumn],
    })
  }

  // Remover coluna
  const removeColumn = (columnId: string) => {
    setLocalConfig({
      ...localConfig,
      columns: localConfig.columns.filter((col) => col.id !== columnId),
    })
  }

  // Atualizar coluna
  const updateColumn = (columnId: string, updates: Partial<KanbanColumn>) => {
    setLocalConfig({
      ...localConfig,
      columns: localConfig.columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col)),
    })
  }

  // Adicionar campo personalizado
  const addCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      name: "Novo Campo",
      type: "text",
      required: false,
      visible: true,
    }

    setLocalConfig({
      ...localConfig,
      customFields: [...localConfig.customFields, newField],
    })
  }

  // Remover campo personalizado
  const removeCustomField = (fieldId: string) => {
    setLocalConfig({
      ...localConfig,
      customFields: localConfig.customFields.filter((field) => field.id !== fieldId),
    })
  }

  // Atualizar campo personalizado
  const updateCustomField = (fieldId: string, updates: Partial<CustomField>) => {
    setLocalConfig({
      ...localConfig,
      customFields: localConfig.customFields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)),
    })
  }

  // Salvar configurações
  const handleSave = () => {
    onSave(localConfig)
  }

  // Resetar para configuração padrão
  const handleReset = () => {
    const defaultConfig: KanbanConfig = {
      columns: [
        { id: "backlog", name: "Backlog", color: "#64748b", order: 0, visible: true },
        { id: "em_andamento", name: "Em Andamento", color: "#3b82f6", order: 1, visible: true },
        { id: "em_revisao", name: "Em Revisão", color: "#f59e0b", order: 2, visible: true },
        { id: "concluido", name: "Concluído", color: "#10b981", order: 3, visible: true },
      ],
      customFields: [
        { id: "priority", name: "Prioridade", type: "select", options: ["Baixa", "Média", "Alta"], visible: true },
        { id: "deadline", name: "Prazo", type: "date", visible: true },
        { id: "budget", name: "Orçamento", type: "number", visible: true },
      ],
    }
    setLocalConfig(defaultConfig)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Personalizar Kanban
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="columns">Colunas</TabsTrigger>
            <TabsTrigger value="fields">Campos</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          {/* Aba de Colunas */}
          <TabsContent value="columns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Gerenciar Colunas</h3>
              <Button onClick={addColumn} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Coluna
              </Button>
            </div>

            <DragDropContext onDragEnd={handleColumnReorder}>
              <Droppable droppableId="columns">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {localConfig.columns
                      .sort((a, b) => a.order - b.order)
                      .map((column, index) => (
                        <Draggable key={column.id} draggableId={column.id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border-l-4"
                              style={{ borderLeftColor: column.color }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                  </div>

                                  <div className="flex-1 grid grid-cols-3 gap-4">
                                    <div>
                                      <Label>Nome da Coluna</Label>
                                      <Input
                                        value={column.name}
                                        onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                                        placeholder="Nome da coluna"
                                      />
                                    </div>

                                    <div>
                                      <Label>Cor</Label>
                                      <div className="flex gap-2 mt-1">
                                        <div
                                          className="w-8 h-8 rounded border cursor-pointer"
                                          style={{ backgroundColor: column.color }}
                                          onClick={() => {
                                            // Aqui você pode implementar um color picker
                                          }}
                                        />
                                        <Select
                                          value={column.color}
                                          onValueChange={(color) => updateColumn(column.id, { color })}
                                        >
                                          <SelectTrigger className="flex-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <div className="grid grid-cols-6 gap-2 p-2">
                                              {predefinedColors.map((color) => (
                                                <SelectItem key={color} value={color}>
                                                  <div
                                                    className="w-6 h-6 rounded border"
                                                    style={{ backgroundColor: color }}
                                                  />
                                                </SelectItem>
                                              ))}
                                            </div>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div>
                                      <Label>Limite de Cards</Label>
                                      <Input
                                        type="number"
                                        value={column.limit || ""}
                                        onChange={(e) =>
                                          updateColumn(column.id, {
                                            limit: e.target.value ? Number.parseInt(e.target.value) : undefined,
                                          })
                                        }
                                        placeholder="Sem limite"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateColumn(column.id, { visible: !column.visible })}
                                    >
                                      {column.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeColumn(column.id)}
                                      disabled={localConfig.columns.length <= 1}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </TabsContent>

          {/* Aba de Campos Personalizados */}
          <TabsContent value="fields" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Campos Personalizados</h3>
              <Button onClick={addCustomField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Campo
              </Button>
            </div>

            <div className="space-y-4">
              {localConfig.customFields.map((field) => (
                <Card key={field.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Nome do Campo</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateCustomField(field.id, { name: e.target.value })}
                          placeholder="Nome do campo"
                        />
                      </div>

                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={field.type}
                          onValueChange={(type: CustomField["type"]) => updateCustomField(field.id, { type })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="select">Seleção</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="boolean">Sim/Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Configurações</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`required-${field.id}`}
                              checked={field.required || false}
                              onCheckedChange={(required) => updateCustomField(field.id, { required })}
                            />
                            <Label htmlFor={`required-${field.id}`} className="text-sm">
                              Obrigatório
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`visible-${field.id}`}
                              checked={field.visible !== false}
                              onCheckedChange={(visible) => updateCustomField(field.id, { visible })}
                            />
                            <Label htmlFor={`visible-${field.id}`} className="text-sm">
                              Visível
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end">
                        <Button variant="ghost" size="icon" onClick={() => removeCustomField(field.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {field.type === "select" && (
                      <div className="mt-4">
                        <Label>Opções (uma por linha)</Label>
                        <Textarea
                          value={field.options?.join("\n") || ""}
                          onChange={(e) =>
                            updateCustomField(field.id, {
                              options: e.target.value.split("\n").filter((opt) => opt.trim()),
                            })
                          }
                          placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                          rows={3}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Aba de Workflow */}
          <TabsContent value="workflow" className="space-y-4">
            <h3 className="text-lg font-medium">Regras de Workflow</h3>
            <Card>
              <CardHeader>
                <CardTitle>Transições Permitidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Configure quais transições entre colunas são permitidas para diferentes tipos de usuários.
                </p>
                <div className="space-y-4">
                  {localConfig.columns.map((column) => (
                    <div key={column.id} className="flex items-center gap-4">
                      <Badge style={{ backgroundColor: column.color, color: "white" }}>{column.name}</Badge>
                      <span className="text-sm text-muted-foreground">pode mover para:</span>
                      <div className="flex gap-2">
                        {localConfig.columns
                          .filter((col) => col.id !== column.id)
                          .map((targetColumn) => (
                            <Badge key={targetColumn.id} variant="outline">
                              {targetColumn.name}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Aparência */}
          <TabsContent value="appearance" className="space-y-4">
            <h3 className="text-lg font-medium">Configurações de Aparência</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Mostrar contador de cards</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Mostrar avatares dos responsáveis</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Compactar visualização</Label>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cores e Temas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tema do kanban</Label>
                    <Select defaultValue="light">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="auto">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Densidade dos cards</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compacto</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="comfortable">Confortável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Duplicar Config
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
