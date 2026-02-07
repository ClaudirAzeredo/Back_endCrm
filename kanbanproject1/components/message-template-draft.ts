import type { MessageTemplate, MessageTemplateType } from "@/lib/api/message-templates-api"

export type Draft = {
  id?: string
  name: string
  type: MessageTemplateType
  content: any
}

export function newDraft(type: MessageTemplateType): Draft {
  if (type === "buttons") {
    const stepId = `step_${Date.now()}`
    return {
      name: "",
      type,
      content: {
        steps: [
          {
            id: stepId,
            title: "Início",
            text: "",
            buttons: [],
          },
        ],
        startStepId: stepId,
      },
    }
  }

  if (type === "image" || type === "video") {
    return { name: "", type, content: { mediaDataUrl: "", mediaUrl: "", caption: "" } }
  }

  return { name: "", type, content: { text: "" } }
}

export function cloneTemplate(t: MessageTemplate): Draft {
  return { id: t.id, name: t.name, type: t.type, content: JSON.parse(JSON.stringify(t.content ?? {})) }
}

export function insertAtCursor(text: string, textarea: HTMLTextAreaElement | null, token: string) {
  if (!textarea) return text + token
  const start = textarea.selectionStart ?? text.length
  const end = textarea.selectionEnd ?? text.length
  return text.slice(0, start) + token + text.slice(end)
}

export function isValidDraft(draft: Draft) {
  if (!draft.name.trim()) return false

  if (draft.type === "text") {
    return String(draft.content?.text || "").trim().length > 0
  }

  if (draft.type === "image" || draft.type === "video") {
    const hasMedia = Boolean(String(draft.content?.mediaDataUrl || "").trim() || String(draft.content?.mediaUrl || "").trim())
    return hasMedia
  }

  if (draft.type === "buttons") {
    const steps: any[] = Array.isArray(draft.content?.steps) ? draft.content.steps : []
    if (steps.length === 0) return false
    return String(steps[0]?.text || "").trim().length > 0
  }

  return true
}

