import type { MessageTemplate } from "@/lib/api/message-templates-api"

export type MassActionLead = {
  id: string
  title: string
  client: string
  status: string
  funnelId?: string
  createdAt: string
  tags?: string[]
  assignedTo?: { id: string; name: string } | undefined
  people?: Array<{ id: string; name: string; phone?: string | undefined }>
  clientPhone?: string | undefined
}

export function normalizePhoneToE164Like(raw: string): string | null {
  const digits = String(raw || "")
    .replace(/\D/g, "")
    .trim()

  if (!digits) return null

  if (digits.length < 10) return null
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`
  }
  if (digits.length === 12 || digits.length === 13) {
    if (digits.startsWith("55")) return `+${digits}`
    return null
  }
  if (digits.length >= 14 && digits.length <= 15) {
    if (digits.startsWith("55")) return `+${digits}`
    return null
  }
  return null
}

export function extractUniquePhonesFromLead(lead: MassActionLead): string[] {
  const out: string[] = []
  const seen = new Set<string>()

  const push = (value?: string | null) => {
    if (!value) return
    const norm = normalizePhoneToE164Like(value)
    if (!norm) return
    if (seen.has(norm)) return
    seen.add(norm)
    out.push(norm)
  }

  push(lead.clientPhone)
  for (const p of lead.people || []) push(p.phone)

  return out
}

export function resolveTemplateVariables(
  raw: string,
  data: {
    nome?: string
    empresa?: string
    etapa_funil?: string
    vendedor?: string
    tags?: string
  },
): string {
  let out = String(raw || "")

  const map: Record<string, string> = {
    "{nome}": data.nome || "",
    "{empresa}": data.empresa || "",
    "{etapa_funil}": data.etapa_funil || "",
    "{vendedor}": data.vendedor || "",
    "{tags}": data.tags || "",
    "[NOME_LEAD]": data.nome || "",
    "[PRIMEIRO_NOME_LEAD]": (data.nome || "").split(" ").filter(Boolean)[0] || "",
    "[RAZAO_SOCIAL]": data.empresa || "",
    "[NOME_MINHA_EMPRESA]": "",
    "[TAGS]": data.tags || "",
  }

  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v)
  }

  return out
}

export function renderTemplateAsText(
  template: MessageTemplate,
  ctx: {
    lead: MassActionLead
    stageName?: string
    tagsText?: string
  },
): string {
  const nome = ctx.lead.title || ctx.lead.client
  const empresa = ctx.lead.client
  const etapa_funil = ctx.stageName || ctx.lead.status
  const vendedor = ctx.lead.assignedTo?.name || ""
  const tags = ctx.tagsText || ""

  const vars = { nome, empresa, etapa_funil, vendedor, tags }
  const t = template.type
  const c = template.content

  if (t === "text") {
    return resolveTemplateVariables(String(c?.text || ""), vars)
  }

  if (t === "image" || t === "video") {
    const caption = resolveTemplateVariables(String(c?.caption || ""), vars)
    const media = String(c?.mediaUrl || c?.mediaDataUrl || "").trim()
    if (media && caption) return `${caption}\n\n${media}`
    if (caption) return caption
    return media
  }

  if (t === "buttons") {
    const steps: Array<any> = Array.isArray(c?.steps) ? c.steps : []
    const startId = c?.startStepId || steps[0]?.id
    const step = steps.find((s) => s.id === startId) || steps[0]
    const text = resolveTemplateVariables(String(step?.text || ""), vars)
    const buttons = Array.isArray(step?.buttons) ? step.buttons : []
    const buttonsText = buttons
      .map((b: any, i: number) => {
        const label = String(b?.label || "").trim()
        return label ? `${i + 1}) ${label}` : ""
      })
      .filter(Boolean)
      .join("\n")

    if (buttonsText) return `${text}\n\n${buttonsText}`
    return text
  }

  return ""
}

