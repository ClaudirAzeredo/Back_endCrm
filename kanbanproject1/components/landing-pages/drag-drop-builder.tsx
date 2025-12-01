"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import {
  Type,
  ImageIcon,
  Square,
  Trash2,
  Eye,
  Save,
  Plus,
  GripVertical,
  Settings,
  FileText,
  Tag,
  X,
} from "lucide-react"
import type { LandingPage, LandingPageElement, FormField, FieldType } from "@/lib/types/landing-page"
import { formatCPF, formatCNPJ } from "@/lib/input-formatters"

interface DragDropBuilderProps {
  landingPage?: LandingPage
  onSave: (landingPage: Omit<LandingPage, "id" | "createdAt" | "updatedAt">) => void
  onClose: () => void
}

const availableElements = [
  { id: "heading", type: "heading" as const, icon: Type, label: "Título" },
  { id: "text", type: "text" as const, icon: Type, label: "Texto" },
  { id: "button", type: "button" as const, icon: Square, label: "Botão" },
  { id: "image", type: "image" as const, icon: ImageIcon, label: "Imagem" },
  { id: "form", type: "form" as const, icon: FileText, label: "Formulário" },
]

export default function DragDropBuilder({ landingPage, onSave, onClose }: DragDropBuilderProps) {
  const [name, setName] = useState(landingPage?.name || "")
  const [funnelId, setFunnelId] = useState(landingPage?.funnelId || "")
  const [stageId, setStageId] = useState(landingPage?.stageId || "")
  const [tagIds, setTagIds] = useState<string[]>(landingPage?.tagIds || [])
  const [funnels, setFunnels] = useState<any[]>([])
  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [elements, setElements] = useState<LandingPageElement[]>(landingPage?.elements || [])
  const [selectedElement, setSelectedElement] = useState<LandingPageElement | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState(landingPage?.backgroundColor || "#ffffff")

  useEffect(() => {
    const currentUserStr = localStorage.getItem("unicrm_auth")
    if (currentUserStr) {
      const authData = JSON.parse(currentUserStr)
      const currentUser = authData.user

      const companyKey = `${currentUser.companyId}_funnels`
      const storedFunnels = localStorage.getItem(companyKey)
      if (storedFunnels) {
        const parsedFunnels = JSON.parse(storedFunnels)
        setFunnels(Array.isArray(parsedFunnels) ? parsedFunnels.filter((f: any) => f.isActive) : [])
      }

      const tagsKey = `${currentUser.companyId}_tags`
      const storedTags = localStorage.getItem(tagsKey)
      if (storedTags) {
        const parsedTags = JSON.parse(storedTags)
        setAvailableTags(Array.isArray(parsedTags) ? parsedTags : [])
      }
    }
  }, [])

  const handleDragEnd = (result: any) => {
    const { source, destination, draggableId } = result

    if (!destination) return

    if (source.droppableId === "sidebar" && destination.droppableId === "canvas") {
      const elementType = draggableId.replace("sidebar-", "") as LandingPageElement["type"]
      const newElement: LandingPageElement = {
        id: `element-${Date.now()}`,
        type: elementType,
        content: getDefaultContent(elementType),
        styles: getDefaultStyles(elementType),
        order: destination.index,
        formFields: elementType === "form" ? getDefaultFormFields() : undefined,
      }

      const newElements = [...elements]
      newElements.splice(destination.index, 0, newElement)
      setElements(newElements.map((el, idx) => ({ ...el, order: idx })))
      return
    }

    if (source.droppableId === "canvas" && destination.droppableId === "canvas") {
      const newElements = Array.from(elements)
      const [removed] = newElements.splice(source.index, 1)
      newElements.splice(destination.index, 0, removed)
      setElements(newElements.map((el, idx) => ({ ...el, order: idx })))
    }
  }

  const getDefaultContent = (type: LandingPageElement["type"]): string => {
    switch (type) {
      case "heading":
        return "Título Principal"
      case "text":
        return "Adicione seu texto aqui"
      case "button":
        return "Clique Aqui"
      case "image":
        return "/abstract-hero.png"
      case "form":
        return "Formulário de Captura"
      default:
        return ""
    }
  }

  const getDefaultStyles = (type: LandingPageElement["type"]) => {
    switch (type) {
      case "heading":
        return { fontSize: "48px", fontWeight: "bold", color: "#1a1a1a", textAlign: "center" }
      case "text":
        return { fontSize: "18px", color: "#4a5568", textAlign: "center", lineHeight: "1.6" }
      case "button":
        return {
          backgroundColor: "#14b8a6",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontSize: "18px",
          fontWeight: "600",
        }
      case "image":
        return { width: "100%", maxWidth: "600px", borderRadius: "8px" }
      case "form":
        return { backgroundColor: "#ffffff", padding: "32px", borderRadius: "12px", maxWidth: "500px" }
      default:
        return {}
    }
  }

  const getDefaultFormFields = (): FormField[] => {
    return [
      {
        id: `field-${Date.now()}-1`,
        type: "text",
        label: "Nome",
        placeholder: "Seu nome completo",
        required: true,
        order: 0,
      },
      {
        id: `field-${Date.now()}-2`,
        type: "email",
        label: "E-mail",
        placeholder: "seu@email.com",
        required: true,
        order: 1,
      },
      {
        id: `field-${Date.now()}-3`,
        type: "phone",
        label: "Telefone",
        placeholder: "(00) 00000-0000",
        required: true,
        order: 2,
        countryCode: "BR",
      },
    ]
  }

  const updateElement = (id: string, updates: Partial<LandingPageElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)))
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates })
    }
  }

  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id))
    if (selectedElement?.id === id) {
      setSelectedElement(null)
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert("Por favor, adicione um nome para a landing page")
      return
    }

    if (!funnelId || !stageId) {
      alert("Por favor, selecione um funil e uma etapa")
      return
    }

    onSave({
      name,
      funnelId,
      stageId,
      tagIds,
      elements,
      backgroundColor,
      leads: landingPage?.leads || [],
    })
  }

  const selectedFunnel = funnels.find((f) => f.id === funnelId)
  const availableStages = selectedFunnel?.columns || []

  const toggleTag = (tagId: string) => {
    if (tagIds.includes(tagId)) {
      setTagIds(tagIds.filter((id) => id !== tagId))
    } else {
      setTagIds([...tagIds, tagId])
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Criar Landing Page</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Editor" : "Preview"}
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {showPreview ? (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <PreviewLandingPage elements={elements} backgroundColor={backgroundColor} />
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-[250px_1fr_300px] h-full">
                {/* Sidebar - Available Elements */}
                <div className="border-r p-4 overflow-auto bg-gray-50">
                  <h3 className="font-semibold mb-4">Elementos</h3>
                  <Droppable droppableId="sidebar" isDropDisabled={true}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {availableElements.map((element, index) => (
                          <Draggable key={element.id} draggableId={`sidebar-${element.type}`} index={index}>
                            {(provided, snapshot) => (
                              <>
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`cursor-move hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? "opacity-50" : ""
                                  }`}
                                >
                                  <CardContent className="p-3 flex items-center gap-2">
                                    <element.icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{element.label}</span>
                                  </CardContent>
                                </Card>
                                {snapshot.isDragging && (
                                  <Card className="cursor-move">
                                    <CardContent className="p-3 flex items-center gap-2">
                                      <element.icon className="h-4 w-4" />
                                      <span className="text-sm font-medium">{element.label}</span>
                                    </CardContent>
                                  </Card>
                                )}
                              </>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <div className="mt-6 space-y-4">
                    <div>
                      <Label>Nome da Landing Page</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Campanha Black Friday"
                      />
                    </div>
                    <div>
                      <Label>Funil</Label>
                      <Select
                        value={funnelId}
                        onValueChange={(value) => {
                          setFunnelId(value)
                          setStageId("")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um funil" />
                        </SelectTrigger>
                        <SelectContent>
                          {funnels.map((funnel) => (
                            <SelectItem key={funnel.id} value={funnel.id}>
                              {funnel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Etapa do Funil</Label>
                      <Select value={stageId} onValueChange={setStageId} disabled={!funnelId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma etapa" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStages.map((stage: any) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4" />
                        Tags Automáticas
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Leads desta LP receberão estas tags automaticamente
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Nenhuma tag disponível</p>
                        ) : (
                          availableTags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant={tagIds.includes(tag.id) ? "default" : "outline"}
                              className="cursor-pointer"
                              style={{
                                backgroundColor: tagIds.includes(tag.id) ? tag.color : "transparent",
                                borderColor: tag.color,
                                color: tagIds.includes(tag.id) ? "#ffffff" : tag.color,
                              }}
                              onClick={() => toggleTag(tag.id)}
                            >
                              {tag.name}
                              {tagIds.includes(tag.id) && <X className="h-3 w-3 ml-1" />}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Cor de Fundo</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canvas - Drop Zone */}
                <div className="p-6 overflow-auto bg-white">
                  <div className="max-w-4xl mx-auto">
                    <Droppable droppableId="canvas">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`min-h-[600px] border-2 border-dashed rounded-lg p-6 transition-colors ${
                            snapshot.isDraggingOver ? "border-teal-500 bg-teal-50" : "border-gray-300"
                          }`}
                          style={{ backgroundColor }}
                        >
                          {elements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                              <Plus className="h-12 w-12 mb-4" />
                              <p className="text-lg font-medium">Arraste elementos aqui</p>
                              <p className="text-sm">Comece arrastando elementos da barra lateral</p>
                            </div>
                          ) : (
                            elements.map((element, index) => (
                              <Draggable key={element.id} draggableId={element.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`group relative mb-4 ${
                                      selectedElement?.id === element.id ? "ring-2 ring-teal-500 rounded" : ""
                                    }`}
                                    onClick={() => setSelectedElement(element)}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
                                    >
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    {element.type === "image" ? (
                                      <ResizableElement
                                        element={element}
                                        isSelected={selectedElement?.id === element.id}
                                        onUpdate={(updates) => updateElement(element.id, updates)}
                                      >
                                        <ElementRenderer element={element} />
                                      </ResizableElement>
                                    ) : (
                                      <ElementRenderer element={element} />
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>

                {/* Properties Panel */}
                <div className="border-l p-4 overflow-auto bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Propriedades</h3>
                    {selectedElement && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteElement(selectedElement.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {selectedElement ? (
                    <ElementProperties
                      element={selectedElement}
                      onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                    />
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Settings className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Selecione um elemento para editar</p>
                    </div>
                  )}
                </div>
              </div>
            </DragDropContext>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ElementRenderer({ element }: { element: LandingPageElement }) {
  const commonStyles = {
    ...element.styles,
    margin: "0 auto",
  }

  const [formValues, setFormValues] = useState<Record<string, string>>({})

  const handleInputChange = (fieldId: string, value: string, fieldType: FieldType) => {
    let formattedValue = value

    if (fieldType === "cpf") {
      formattedValue = formatCPF(value)
    } else if (fieldType === "cnpj") {
      formattedValue = formatCNPJ(value)
    }

    setFormValues({ ...formValues, [fieldId]: formattedValue })
  }

  const handlePhoneChange = (fieldId: string, value: string) => {
    setFormValues({ ...formValues, [fieldId]: value })
  }

  const getAlignmentStyles = (textAlign?: string) => {
    switch (textAlign) {
      case "left":
        return { display: "flex", justifyContent: "flex-start" }
      case "right":
        return { display: "flex", justifyContent: "flex-end" }
      case "center":
      default:
        return { display: "flex", justifyContent: "center" }
    }
  }

  switch (element.type) {
    case "heading":
      return <h1 style={commonStyles}>{element.content}</h1>
    case "text":
      return <p style={commonStyles}>{element.content}</p>
    case "button":
      return (
        <div style={{ textAlign: element.styles.textAlign || "center" }}>
          <button style={commonStyles}>{element.content}</button>
        </div>
      )
    case "image":
      return (
        <div style={getAlignmentStyles(element.styles.textAlign as string)}>
          <img src={element.content || "/placeholder.svg"} alt="Landing page" style={commonStyles} />
        </div>
      )
    case "form":
      return (
        <div style={{ ...commonStyles, display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>{element.content}</h3>
          {element.formFields?.map((field) => (
            <div key={field.id}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                {field.label} {field.required && <span style={{ color: "red" }}>*</span>}
              </label>
              {field.type === "phone" ? (
                <PhoneInputComponent
                  value={formValues[field.id] || ""}
                  onChange={(value) => handlePhoneChange(field.id, value)}
                  placeholder={field.placeholder}
                  defaultCountry={(field.countryCode || "BR").toLowerCase()}
                  disabled
                />
              ) : field.type === "cpf" || field.type === "cnpj" ? (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={formValues[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value, field.type)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "16px",
                  }}
                />
              ) : (
                <input
                  type={field.type === "email" ? "email" : "text"}
                  placeholder={field.placeholder}
                  value={formValues[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value, field.type)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "16px",
                  }}
                />
              )}
            </div>
          ))}
          <button
            style={{
              backgroundColor: "#14b8a6",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
            }}
          >
            Enviar
          </button>
        </div>
      )
    default:
      return null
  }
}

function ElementProperties({
  element,
  onUpdate,
}: {
  element: LandingPageElement
  onUpdate: (updates: Partial<LandingPageElement>) => void
}) {
  const addFormField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "Novo Campo",
      placeholder: "Digite aqui...",
      required: false,
      order: element.formFields?.length || 0,
    }
    onUpdate({ formFields: [...(element.formFields || []), newField] })
  }

  const updateFormField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedFields = element.formFields?.map((field) => (field.id === fieldId ? { ...field, ...updates } : field))
    onUpdate({ formFields: updatedFields })
  }

  const deleteFormField = (fieldId: string) => {
    const updatedFields = element.formFields?.filter((field) => field.id !== fieldId)
    onUpdate({ formFields: updatedFields })
  }

  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="content">Conteúdo</TabsTrigger>
        <TabsTrigger value="style">Estilo</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="space-y-4">
        {element.type === "image" ? (
          <div>
            <Label>URL da Imagem</Label>
            <Input
              value={element.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="https://..."
            />
          </div>
        ) : element.type === "form" ? (
          <div className="space-y-4">
            <div>
              <Label>Título do Formulário</Label>
              <Input value={element.content} onChange={(e) => onUpdate({ content: e.target.value })} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Campos do Formulário</Label>
                <Button size="sm" variant="outline" onClick={addFormField}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>

              {element.formFields?.map((field, index) => (
                <Card key={field.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Campo {index + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFormField(field.id)}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: FieldType) => updateFormField(field.id, { type: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {field.type === "phone" && (
                      <div>
                        <Label className="text-xs">País</Label>
                        <Select
                          value={field.countryCode || "BR"}
                          onValueChange={(value) => updateFormField(field.id, { countryCode: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.name} ({country.dialCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        className="h-8"
                        value={field.label}
                        onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        className="h-8"
                        value={field.placeholder}
                        onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) => updateFormField(field.id, { required: checked as boolean })}
                      />
                      <label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                        Campo obrigatório
                      </label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <Label>Texto</Label>
            {element.type === "text" ? (
              <Textarea value={element.content} onChange={(e) => onUpdate({ content: e.target.value })} rows={4} />
            ) : (
              <Input value={element.content} onChange={(e) => onUpdate({ content: e.target.value })} />
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="style" className="space-y-4">
        {element.type === "image" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 mb-2">
              💡 Dica: Clique na imagem no canvas e arraste as alças azuis para redimensionar manualmente
            </p>
          </div>
        )}

        <div>
          <Label>Largura</Label>
          <Input
            value={element.styles.width || ""}
            onChange={(e) => onUpdate({ styles: { ...element.styles, width: e.target.value } })}
            placeholder="Ex: 100%, 500px, auto"
          />
        </div>

        <div>
          <Label>Altura</Label>
          <Input
            value={element.styles.height || ""}
            onChange={(e) => onUpdate({ styles: { ...element.styles, height: e.target.value } })}
            placeholder="Ex: 300px, auto"
          />
        </div>

        {element.type !== "image" && element.type !== "form" && (
          <>
            <div>
              <Label>Tamanho da Fonte</Label>
              <Input
                value={element.styles.fontSize || ""}
                onChange={(e) => onUpdate({ styles: { ...element.styles, fontSize: e.target.value } })}
                placeholder="16px"
              />
            </div>
            <div>
              <Label>Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={element.styles.color || "#000000"}
                  onChange={(e) => onUpdate({ styles: { ...element.styles, color: e.target.value } })}
                  className="w-16 h-10"
                />
                <Input
                  value={element.styles.color || ""}
                  onChange={(e) => onUpdate({ styles: { ...element.styles, color: e.target.value } })}
                  placeholder="#000000"
                />
              </div>
            </div>
          </>
        )}

        {element.type === "button" && (
          <>
            <div>
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={element.styles.backgroundColor || "#14b8a6"}
                  onChange={(e) => onUpdate({ styles: { ...element.styles, backgroundColor: e.target.value } })}
                  className="w-16 h-10"
                />
                <Input
                  value={element.styles.backgroundColor || ""}
                  onChange={(e) => onUpdate({ styles: { ...element.styles, backgroundColor: e.target.value } })}
                  placeholder="#14b8a6"
                />
              </div>
            </div>
            <div>
              <Label>Padding</Label>
              <Input
                value={element.styles.padding || ""}
                onChange={(e) => onUpdate({ styles: { ...element.styles, padding: e.target.value } })}
                placeholder="16px 32px"
              />
            </div>
            <div>
              <Label>Border Radius</Label>
              <Input
                value={element.styles.borderRadius || ""}
                onChange={(e) => onUpdate({ styles: { ...element.styles, borderRadius: e.target.value } })}
                placeholder="8px"
              />
            </div>
          </>
        )}

        {element.type === "form" && (
          <>
            <div>
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={element.styles.backgroundColor || "#ffffff"}
                  onChange={(e) => onUpdate({ styles: { ...element.styles, backgroundColor: e.target.value } })}
                  className="w-16 h-10"
                />
                <Input
                  value={element.styles.backgroundColor || ""}
                  onChange={(e) => onUpdate({ styles: { ...element.styles, backgroundColor: e.target.value } })}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div>
              <Label>Padding</Label>
              <Input
                value={element.styles.padding || ""}
                onChange={(e) => onUpdate({ styles: { ...element.styles, padding: e.target.value } })}
                placeholder="32px"
              />
            </div>
            <div>
              <Label>Border Radius</Label>
              <Input
                value={element.styles.borderRadius || ""}
                onChange={(e) => onUpdate({ styles: { ...element.styles, borderRadius: e.target.value } })}
                placeholder="12px"
              />
            </div>
          </>
        )}

        {element.type !== "form" && (
          <div>
            <Label>Alinhamento</Label>
            <div className="grid grid-cols-3 gap-2">
              {["left", "center", "right"].map((align) => (
                <Button
                  key={align}
                  variant={element.styles.textAlign === align ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdate({ styles: { ...element.styles, textAlign: align } })}
                >
                  {align === "left" ? "←" : align === "center" ? "↔" : "→"}
                </Button>
              ))}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

function PreviewLandingPage({
  elements,
  backgroundColor,
}: {
  elements: LandingPageElement[]
  backgroundColor: string
}) {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {elements.map((element) => (
          <ElementRenderer key={element.id} element={element} />
        ))}

        {/* Lead Capture Form */}
        <div className="mt-12 p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Cadastre-se</h3>
          <div className="space-y-4">
            <Input placeholder="Nome completo" />
            <Input type="email" placeholder="E-mail" />
            <Input type="tel" placeholder="Telefone" />
            <Button className="w-full bg-teal-600 hover:bg-teal-700">Enviar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const COUNTRY_CODES = [
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  // Add more country codes as needed
]

function ResizableElement({
  element,
  isSelected,
  onUpdate,
  children,
}: {
  element: LandingPageElement
  isSelected: boolean
  onUpdate: (updates: Partial<LandingPageElement>) => void
  children: React.ReactNode
}) {
  const [isResizing, setIsResizing] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: Number.parseInt(element.styles.width as string) || 600,
    height: Number.parseInt(element.styles.height as string) || 400,
  })
  const [aspectRatio, setAspectRatio] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (element.type === "image" && element.content) {
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        setAspectRatio(ratio)

        // Initialize dimensions if not set
        if (!element.styles.width && !element.styles.height) {
          const maxWidth = 600
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            width = maxWidth
            height = width / ratio
          }

          setDimensions({ width, height })
          onUpdate({
            styles: {
              ...element.styles,
              width: `${width}px`,
              height: `${height}px`,
            },
          })
        }
      }
      img.src = element.content
    }
  }, [element.content])

  // Update dimensions when styles change
  useEffect(() => {
    const width = Number.parseInt(element.styles.width as string) || 600
    const height = Number.parseInt(element.styles.height as string) || 400
    setDimensions({ width, height })
    if (aspectRatio === 1 && width && height) {
      setAspectRatio(width / height)
    }
  }, [element.styles.width, element.styles.height])

  const handleResizeStart = (e: React.MouseEvent, corner: "se" | "sw" | "ne" | "nw") => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      let deltaX = moveEvent.clientX - startX
      let deltaY = moveEvent.clientY - startY

      // Adjust delta based on corner direction
      if (corner === "sw" || corner === "nw") {
        deltaX = -deltaX
      }
      if (corner === "nw" || corner === "ne") {
        deltaY = -deltaY
      }

      // Use the larger delta to maintain aspect ratio smoothly
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY * aspectRatio

      const newWidth = Math.max(100, startWidth + delta)
      const newHeight = newWidth / aspectRatio

      setDimensions({ width: Math.round(newWidth), height: Math.round(newHeight) })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      onUpdate({
        styles: {
          ...element.styles,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        },
      })
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        display: "inline-block",
      }}
    >
      {children}

      {isSelected && (
        <>
          {/* Bottom-right corner */}
          <div
            className="absolute -bottom-3 -right-3 w-10 h-10 bg-blue-500 border-4 border-white rounded-full cursor-se-resize z-20 shadow-lg hover:scale-125 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, "se")}
            title="Arraste para redimensionar"
          />
          {/* Bottom-left corner */}
          <div
            className="absolute -bottom-3 -left-3 w-10 h-10 bg-blue-500 border-4 border-white rounded-full cursor-sw-resize z-20 shadow-lg hover:scale-125 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
            title="Arraste para redimensionar"
          />
          {/* Top-right corner */}
          <div
            className="absolute -top-3 -right-3 w-10 h-10 bg-blue-500 border-4 border-white rounded-full cursor-ne-resize z-20 shadow-lg hover:scale-125 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
            title="Arraste para redimensionar"
          />
          {/* Top-left corner */}
          <div
            className="absolute -top-3 -left-3 w-10 h-10 bg-blue-500 border-4 border-white rounded-full cursor-nw-resize z-20 shadow-lg hover:scale-125 transition-transform"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
            title="Arraste para redimensionar"
          />

          {/* Dimension display during resize */}
          {isResizing && (
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-xl whitespace-nowrap font-semibold z-30">
              {dimensions.width} × {dimensions.height}px
            </div>
          )}

          {/* Selection border */}
          <div className="absolute inset-0 border-2 border-blue-400 pointer-events-none rounded" />
        </>
      )}
    </div>
  )
}
