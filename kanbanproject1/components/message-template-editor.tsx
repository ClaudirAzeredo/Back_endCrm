"use client"

import { useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { MessageTemplate, MessageTemplateType } from "@/lib/api/message-templates-api"
import type { Draft } from "@/components/message-template-draft"
import { insertAtCursor, isValidDraft, newDraft } from "@/components/message-template-draft"
import { MessageTemplateEditorButtons } from "@/components/message-template-editor-buttons"
import { Save, X } from "lucide-react"

const variableTokens = [
  "[NOME_LEAD]",
  "[PRIMEIRO_NOME_LEAD]",
  "[RAZAO_SOCIAL]",
  "[NOME_MINHA_EMPRESA]",
  "[TAGS]",
] as const

export function MessageTemplateEditor({
  draft,
  selectedTemplate,
  isLoading,
  activeButtonsStepId,
  onActiveButtonsStepIdChange,
  onDraftChange,
  onSave,
  onCancel,
  onValidationError,
}: {
  draft: Draft | null
  selectedTemplate: MessageTemplate | null
  isLoading: boolean
  activeButtonsStepId: string | undefined
  onActiveButtonsStepIdChange: (stepId: string | undefined) => void
  onDraftChange: (next: Draft | null) => void
  onSave: (draft: Draft) => void
  onCancel: () => void
  onValidationError: (message: string) => void
}) {
  const textRef = useRef<HTMLTextAreaElement | null>(null)
  const captionRef = useRef<HTMLTextAreaElement | null>(null)
  const insertHandlerRef = useRef<((token: string) => void) | null>(null)

  const canSave = useMemo(() => (draft ? isValidDraft(draft) : false), [draft])

  const setInsertHandler = (fn: ((token: string) => void) | null) => {
    insertHandlerRef.current = fn
  }

  if (!draft) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Selecione um template na lista ou crie um novo.
      </div>
    )
  }

  const setType = (next: MessageTemplateType) => {
    const keepName = draft.name
    const nextDraft = newDraft(next)
    nextDraft.name = keepName
    nextDraft.id = draft.id
    onDraftChange(nextDraft)
    if (next === "buttons") {
      const stepId = nextDraft.content?.startStepId || nextDraft.content?.steps?.[0]?.id
      onActiveButtonsStepIdChange(stepId)
    } else {
      onActiveButtonsStepIdChange(undefined)
    }
  }

  const onInsertToken = (token: string) => {
    if (insertHandlerRef.current) {
      insertHandlerRef.current(token)
      return
    }

    if (draft.type === "text") {
      onDraftChange({ ...draft, content: { ...draft.content, text: String(draft.content?.text || "") + token } })
    }
  }

  const validateAndSave = () => {
    if (!draft.name.trim()) {
      onValidationError("Nome do template é obrigatório")
      return
    }
    if (!isValidDraft(draft)) {
      onValidationError("Preencha os campos obrigatórios do tipo escolhido")
      return
    }
    onSave(draft)
  }

  const renderTypeEditor = () => {
    if (draft.type === "text") {
      const value = String(draft.content?.text || "")
      return (
        <div className="space-y-2">
          <Label>Editor de Mensagem *</Label>
          <Textarea
            ref={(el) => {
              textRef.current = el
            }}
            value={value}
            className="min-h-[200px]"
            onFocus={() =>
              setInsertHandler((token) => {
                const next = insertAtCursor(value, textRef.current, token)
                onDraftChange({ ...draft, content: { ...draft.content, text: next } })
              })
            }
            onBlur={() => setInsertHandler(null)}
            onChange={(e) => onDraftChange({ ...draft, content: { ...draft.content, text: e.target.value } })}
          />
        </div>
      )
    }

    if (draft.type === "image" || draft.type === "video") {
      const isImage = draft.type === "image"
      const mediaUrl = String(draft.content?.mediaUrl || "")
      const caption = String(draft.content?.caption || "")

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Upload de {isImage ? "Imagem" : "Vídeo"}</Label>
              <Input
                type="file"
                accept={isImage ? "image/*" : "video/*"}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const maxBytes = isImage ? 1_500_000 : 6_000_000
                  if (file.size > maxBytes) {
                    onValidationError(`Arquivo muito grande. Limite: ${isImage ? "1.5MB" : "6MB"}`)
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    const dataUrl = String(reader.result || "")
                    onDraftChange({ ...draft, content: { ...draft.content, mediaDataUrl: dataUrl } })
                  }
                  reader.readAsDataURL(file)
                }}
              />
              <div className="text-xs text-muted-foreground">Ou informe uma URL para a mídia</div>
            </div>
            <div className="space-y-2">
              <Label>URL da Mídia</Label>
              <Input
                value={mediaUrl}
                placeholder="https://..."
                onChange={(e) => onDraftChange({ ...draft, content: { ...draft.content, mediaUrl: e.target.value } })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Legenda (opcional)</Label>
            <Textarea
              ref={(el) => {
                captionRef.current = el
              }}
              value={caption}
              onFocus={() =>
                setInsertHandler((token) => {
                  const next = insertAtCursor(caption, captionRef.current, token)
                  onDraftChange({ ...draft, content: { ...draft.content, caption: next } })
                })
              }
              onBlur={() => setInsertHandler(null)}
              onChange={(e) => onDraftChange({ ...draft, content: { ...draft.content, caption: e.target.value } })}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDraftChange({ ...draft, content: { ...draft.content, mediaDataUrl: "" } })}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar upload
            </Button>
          </div>

          <Separator />
          <div className="text-xs text-muted-foreground">Upload salva a mídia como data URL.</div>
        </div>
      )
    }

    if (draft.type === "buttons") {
      return (
        <MessageTemplateEditorButtons
          draft={draft}
          activeStepId={activeButtonsStepId}
          onActiveStepIdChange={onActiveButtonsStepIdChange}
          onDraftChange={(next) => onDraftChange(next)}
          registerInsertHandler={setInsertHandler}
        />
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Template *</Label>
          <Input value={draft.name} onChange={(e) => onDraftChange({ ...draft, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Tipo do Modelo</Label>
          <Select value={draft.type} onValueChange={(v) => setType(v as MessageTemplateType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Modelo de Texto</SelectItem>
              <SelectItem value="image">Modelo de Imagem</SelectItem>
              <SelectItem value="video">Modelo de Vídeo</SelectItem>
              <SelectItem value="buttons">Modelo de Lista de Botões</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Variáveis</Label>
        <div className="flex flex-wrap gap-2">
          {variableTokens.map((token) => (
            <Button key={token} type="button" variant="outline" size="sm" onClick={() => onInsertToken(token)}>
              {token}
            </Button>
          ))}
        </div>
      </div>

      {renderTypeEditor()}

      <div className="flex gap-2 pt-2">
        <Button onClick={validateAndSave} disabled={isLoading || !canSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Template
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (selectedTemplate) {
              onDraftChange({
                id: selectedTemplate.id,
                name: selectedTemplate.name,
                type: selectedTemplate.type,
                content: JSON.parse(JSON.stringify(selectedTemplate.content ?? {})),
              })
            } else {
              onDraftChange(null)
            }
            onCancel()
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

