"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useApiMessageTemplates } from "@/hooks/use-api-message-templates"
import type { MessageTemplate, MessageTemplateType } from "@/lib/api/message-templates-api"
import { MessageTemplatePreview } from "@/components/message-template-preview"
import { MessageTemplateEditor } from "@/components/message-template-editor"
import type { Draft } from "@/components/message-template-draft"
import { cloneTemplate, newDraft } from "@/components/message-template-draft"
import { Copy, Image as ImageIcon, List, Plus, Search, Trash2, Type as TypeIcon, Video } from "lucide-react"

export default function MessageTemplatesManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const { templates, isLoading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useApiMessageTemplates()

  const [query, setQuery] = useState("")
  const [filterType, setFilterType] = useState<MessageTemplateType | "all">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [activeButtonsStepId, setActiveButtonsStepId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open) fetchTemplates()
  }, [open, fetchTemplates])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setFilterType("all")
      setSelectedId(null)
      setDraft(null)
      setActiveButtonsStepId(undefined)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false
      if (!q) return true
      return t.name.toLowerCase().includes(q)
    })
  }, [templates, query, filterType])

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedId) || null, [templates, selectedId])

  const startNew = (type: MessageTemplateType) => {
    const d = newDraft(type)
    setDraft(d)
    setSelectedId(null)
    if (type === "buttons") {
      const stepId = d.content?.startStepId || d.content?.steps?.[0]?.id
      setActiveButtonsStepId(stepId)
    } else {
      setActiveButtonsStepId(undefined)
    }
  }

  const startEdit = (t: MessageTemplate) => {
    const d = cloneTemplate(t)
    setDraft(d)
    setSelectedId(t.id)
    if (t.type === "buttons") {
      const stepId = d.content?.startStepId || d.content?.steps?.[0]?.id
      setActiveButtonsStepId(stepId)
    } else {
      setActiveButtonsStepId(undefined)
    }
  }

  const handleDuplicate = async (t: MessageTemplate) => {
    try {
      const d = cloneTemplate(t)
      const created = await createTemplate({ name: `${d.name} (cópia)`, type: d.type, content: d.content })
      startEdit(created)
    } catch {
      return
    }
  }

  const handleDelete = async (t: MessageTemplate) => {
    const ok = confirm(`Excluir o template "${t.name}"?`)
    if (!ok) return
    try {
      await deleteTemplate(t.id)
      if (selectedId === t.id) {
        setSelectedId(null)
        setDraft(null)
      }
    } catch {
      return
    }
  }

  const handleSave = async (nextDraft: Draft) => {
    try {
      if (!nextDraft.id) {
        const created = await createTemplate({ name: nextDraft.name.trim(), type: nextDraft.type, content: nextDraft.content })
        startEdit(created)
      } else {
        const updated = await updateTemplate(nextDraft.id, {
          name: nextDraft.name.trim(),
          type: nextDraft.type,
          content: nextDraft.content,
        })
        startEdit(updated)
      }
    } catch {
      return
    }
  }

  const previewType: MessageTemplateType = draft?.type || "text"
  const previewContent = draft?.content || { text: "" }
  const activePreviewStepId =
    previewType === "buttons" ? String(activeButtonsStepId || previewContent?.startStepId || previewContent?.steps?.[0]?.id || "") : undefined

  const typeIcon = (type: MessageTemplateType) => {
    if (type === "text") return <TypeIcon className="h-4 w-4" />
    if (type === "image") return <ImageIcon className="h-4 w-4" />
    if (type === "video") return <Video className="h-4 w-4" />
    return <List className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Templates de Mensagens</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-4 h-full min-h-0">
          <Card className="h-full overflow-hidden">
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input className="pl-9" placeholder="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="buttons">Botões</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => startNew("text")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => startNew("text")} className="gap-2">
                  <TypeIcon className="h-4 w-4" />
                  Texto
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => startNew("image")} className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Imagem
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => startNew("video")} className="gap-2">
                  <Video className="h-4 w-4" />
                  Vídeo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => startNew("buttons")} className="gap-2">
                  <List className="h-4 w-4" />
                  Botões
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(90vh-180px)]">
              <div className="p-4 space-y-2">
                {filtered.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">Nenhum template encontrado.</div>
                ) : (
                  filtered.map((t) => {
                    const isActive = t.id === selectedId
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        className={`w-full text-left rounded-lg border px-3 py-3 transition-colors cursor-pointer ${
                          isActive ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"
                        }`}
                        onClick={() => startEdit(t)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            startEdit(t)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-sm line-clamp-1">{t.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Atualizado: {new Date(t.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <Badge variant="secondary" className="capitalize flex items-center gap-1">
                            {typeIcon(t.type)}
                            {t.type}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDuplicate(t)
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDelete(t)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </Card>

          <Card className="h-full overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <MessageTemplateEditor
                  draft={draft}
                  selectedTemplate={selectedTemplate}
                  isLoading={isLoading}
                  activeButtonsStepId={activeButtonsStepId}
                  onActiveButtonsStepIdChange={setActiveButtonsStepId}
                  onDraftChange={setDraft}
                  onSave={handleSave}
                  onCancel={() => null}
                  onValidationError={(message) =>
                    toast({ title: "Erro", description: message, variant: "destructive" })
                  }
                />
              </div>
            </ScrollArea>
          </Card>

          <Card className="h-full overflow-hidden">
            <MessageTemplatePreview
              type={previewType}
              content={previewContent}
              activeStepId={activePreviewStepId}
              onStepChange={(stepId) => setActiveButtonsStepId(stepId)}
            />
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
