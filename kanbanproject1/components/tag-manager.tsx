"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit2, Save, X, Tag as TagIcon } from "lucide-react"
import { useApiTags } from "@/hooks/use-api-tags"
import type { Tag } from "@/lib/api/tags-api"

export type { Tag } from "@/lib/api/tags-api"
export type TagType = Tag

type TagManagerProps = {
  open: boolean
  onClose: () => void
}

const predefinedColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#6b7280", // gray
  "#374151", // dark gray
]

export default function TagManager({ open, onClose }: TagManagerProps) {
  const { toast } = useToast()
  const { tags, fetchTags, createTag, updateTag, deleteTag } = useApiTags()
  const [isCreating, setIsCreating] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [newTag, setNewTag] = useState({
    name: "",
    color: predefinedColors[0],
    description: "",
  })

  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open, fetchTags])

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da tag é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      await createTag({
        name: newTag.name.trim(),
        color: newTag.color,
        description: newTag.description.trim() || undefined,
      })

      setNewTag({ name: "", color: predefinedColors[0], description: "" })
      setIsCreating(false)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleUpdateTag = async (tagId: string, updates: Partial<Tag>) => {
    try {
      await updateTag(tagId, updates)
      setEditingTag(null)
    } catch (error) {
       // Error handling is done in the hook
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tag?")) return
    try {
      await deleteTag(tagId)
    } catch (error) {
       // Error handling is done in the hook
    }
  }

  const handleClose = () => {
    setIsCreating(false)
    setEditingTag(null)
    setNewTag({ name: "", color: predefinedColors[0], description: "" })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Central de Tags
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new tag section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{isCreating ? "Nova Tag" : "Criar Tag"}</CardTitle>
            </CardHeader>
            <CardContent>
              {!isCreating ? (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Nova Tag
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tagName">Nome da Tag *</Label>
                      <Input
                        id="tagName"
                        placeholder="Nome da tag"
                        value={newTag.name}
                        onChange={(e) => setNewTag((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cor</Label>
                      <div className="flex flex-wrap gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${
                              newTag.color === color ? "border-gray-900" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewTag((prev) => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagDescription">Descrição (opcional)</Label>
                    <Input
                      id="tagDescription"
                      placeholder="Descrição da tag"
                      value={newTag.description}
                      onChange={(e) => setNewTag((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div>
                      <Badge style={{ backgroundColor: newTag.color, color: "white" }}>
                        {newTag.name || "Nome da tag"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateTag}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Tag
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false)
                        setNewTag({ name: "", color: predefinedColors[0], description: "" })
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags Existentes ({tags.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TagIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tag criada ainda</p>
                  <p className="text-sm">Crie sua primeira tag para organizar seus leads</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tags.map((tag) => (
                    <TagItem
                      key={tag.id}
                      tag={tag}
                      isEditing={editingTag === tag.id}
                      onEdit={() => setEditingTag(tag.id)}
                      onSave={(updates) => handleUpdateTag(tag.id, updates)}
                      onCancel={() => setEditingTag(null)}
                      onDelete={() => handleDeleteTag(tag.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TagItem({
  tag,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  tag: TagType
  isEditing: boolean
  onEdit: () => void
  onSave: (updates: Partial<TagType>) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [editData, setEditData] = useState({
    name: tag.name,
    color: tag.color,
    description: tag.description || "",
  })

  const handleSave = () => {
    if (!editData.name.trim()) return
    onSave({
      name: editData.name.trim(),
      color: editData.color,
      description: editData.description.trim() || undefined,
    })
  }

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={editData.name} onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 ${
                    editData.color === color ? "border-gray-900" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setEditData((prev) => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input
            value={editData.description}
            onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição da tag"
          />
        </div>

        <div className="flex items-center justify-between">
          <Badge style={{ backgroundColor: editData.color, color: "white" }}>{editData.name}</Badge>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Badge style={{ backgroundColor: tag.color, color: "white" }}>{tag.name}</Badge>
        {tag.description && <span className="text-sm text-muted-foreground">{tag.description}</span>}
        <span className="text-xs text-muted-foreground">
          Criada em {new Date(tag.createdAt).toLocaleDateString("pt-BR")}
        </span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
