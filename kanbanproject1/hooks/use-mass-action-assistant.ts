"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { leadsApi, type Lead as ApiLead } from "@/lib/api/leads-api"
import { apiClient } from "@/lib/api-client"
import { getCurrentUser } from "@/lib/storage"
import type { Tag as TagType } from "@/lib/api/tags-api"
import type { MessageTemplate } from "@/lib/api/message-templates-api"
import { extractUniquePhonesFromLead, renderTemplateAsText, type MassActionLead } from "@/lib/mass-action-utils"
import type { AudienceState, Funnel, ModelState, StepId } from "@/components/mass-action/mass-action-types"

function convertApiLead(apiLead: ApiLead): MassActionLead {
  return {
    id: apiLead.id,
    title: apiLead.title,
    client: apiLead.client,
    clientPhone: apiLead.clientPhone,
    status: apiLead.status,
    funnelId: apiLead.funnelId,
    createdAt: apiLead.createdAt,
    tags: apiLead.tags || [],
    assignedTo: apiLead.assignedTo ? { id: apiLead.assignedTo.id, name: apiLead.assignedTo.name } : undefined,
    people: (apiLead.people || []).map((p) => ({ id: p.id, name: p.name, phone: p.phone })),
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

function toIsoDay(val: string) {
  const v = String(val || "").trim()
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function useMassActionAssistant({
  open,
  initialFunnelId,
  funnels,
  availableTags,
  templates,
}: {
  open: boolean
  initialFunnelId: string
  funnels: Funnel[]
  availableTags: TagType[]
  templates: MessageTemplate[]
}) {
  const [step, setStep] = useState<StepId>("publico")
  const [audience, setAudience] = useState<AudienceState>({
    funnelIds: [],
    stageIds: [],
    dateStart: "",
    dateEnd: "",
    tagIds: [],
    tagMode: "any",
    leadLimitMode: "all",
    customLeadLimit: 100,
    leadOrder: "oldest",
  })
  const [model, setModel] = useState<ModelState>({ templateId: "", selectedTemplate: null, activeFlowStepId: undefined })
  const [delayMs, setDelayMs] = useState<number>(1200)
  const [maxPerMinute, setMaxPerMinute] = useState<number>(30)
  const [maxPerHour, setMaxPerHour] = useState<number>(900)

  const [leadsByFunnel, setLeadsByFunnel] = useState<Record<string, MassActionLead[]>>({})
  const [isLeadsLoading, setIsLeadsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [lastJobId, setLastJobId] = useState<string | null>(null)
  const fetchAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) return
    setStep("publico")
    setAudience((prev) => ({
      ...prev,
      funnelIds: prev.funnelIds.length ? prev.funnelIds : initialFunnelId ? [initialFunnelId] : [],
    }))
  }, [open, initialFunnelId])

  const stageNameById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const f of funnels) {
      for (const c of f.columns || []) m[c.id] = (c as any).name || (c as any).title || "Sem nome"
    }
    return m
  }, [funnels])

  const selectedFunnels = useMemo(
    () => funnels.filter((f) => audience.funnelIds.includes(f.id)),
    [funnels, audience.funnelIds],
  )

  const availableStages = useMemo(() => {
    const out: Array<{ id: string; title: string; funnelName: string }> = []
    for (const f of selectedFunnels) {
      for (const c of f.columns || []) out.push({ id: c.id, title: (c as any).name || (c as any).title || "Sem nome", funnelName: f.name })
    }
    return out
  }, [selectedFunnels])

  useEffect(() => {
    if (!open) return
    const missing = audience.funnelIds.filter((id) => !leadsByFunnel[id])
    if (missing.length === 0) return

    fetchAbortRef.current?.abort()
    const ac = new AbortController()
    fetchAbortRef.current = ac
    setIsLeadsLoading(true)

    ;(async () => {
      try {
        const loaded: Record<string, MassActionLead[]> = {}
        for (const fid of missing) {
          if (ac.signal.aborted) return
          const apiLeads = await leadsApi.getLeads({ funnelId: fid })
          loaded[fid] = (Array.isArray(apiLeads) ? apiLeads : []).map(convertApiLead)
        }
        if (ac.signal.aborted) return
        setLeadsByFunnel((prev) => ({ ...prev, ...loaded }))
      } finally {
        if (!ac.signal.aborted) setIsLeadsLoading(false)
      }
    })()
  }, [open, audience.funnelIds, leadsByFunnel])

  const allSelectedLeads = useMemo(() => {
    const seen = new Set<string>()
    const out: MassActionLead[] = []
    for (const fid of audience.funnelIds) {
      for (const l of leadsByFunnel[fid] || []) {
        if (seen.has(l.id)) continue
        seen.add(l.id)
        out.push(l)
      }
    }
    return out
  }, [audience.funnelIds, leadsByFunnel])

  const filteredLeads = useMemo(() => {
    const startIso = toIsoDay(audience.dateStart)
    const endIso = toIsoDay(audience.dateEnd)
    const selectedTagSet = new Set(audience.tagIds)
    const tagNamesById = new Map(availableTags.map((t) => [t.id, t.name]))

    return allSelectedLeads.filter((l) => {
      if (audience.stageIds.length > 0 && !audience.stageIds.includes(l.status)) return false

      if (startIso && String(l.createdAt || "") < startIso) return false
      if (endIso) {
        const endPlus = new Date(endIso)
        endPlus.setHours(23, 59, 59, 999)
        if (String(l.createdAt || "") > endPlus.toISOString()) return false
      }

      if (selectedTagSet.size > 0) {
        const leadTags = new Set<string>()
        for (const t of l.tags || []) {
          leadTags.add(String(t))
          const nm = tagNamesById.get(String(t))
          if (nm) leadTags.add(nm)
        }

        if (audience.tagMode === "all") {
          for (const t of selectedTagSet) if (!leadTags.has(t)) return false
        } else {
          let ok = false
          for (const t of selectedTagSet) {
            if (leadTags.has(t)) {
              ok = true
              break
            }
          }
          if (!ok) return false
        }
      }

      return true
    })
  }, [allSelectedLeads, audience.dateEnd, audience.dateStart, audience.stageIds, audience.tagIds, audience.tagMode, availableTags])

  const orderedLeads = useMemo(() => {
    const sorted = [...filteredLeads].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")))
    if (audience.leadOrder === "newest") sorted.reverse()
    return sorted
  }, [filteredLeads, audience.leadOrder])

  const limitedLeads = useMemo(() => {
    if (audience.leadLimitMode === "all") return orderedLeads
    const n = Math.max(0, Math.min(Number(audience.customLeadLimit || 0), orderedLeads.length))
    return orderedLeads.slice(0, n)
  }, [audience.customLeadLimit, audience.leadLimitMode, orderedLeads])

  useEffect(() => {
    const sel = templates.find((t) => t.id === model.templateId) || null
    setModel((prev) => ({ ...prev, selectedTemplate: sel }))
  }, [model.templateId, templates])

  const totals = useMemo(() => {
    const leadCount = limitedLeads.length
    let itemsCount = 0
    for (const l of limitedLeads) itemsCount += extractUniquePhonesFromLead(l).length
    return { leadCount, itemsCount }
  }, [limitedLeads])

  const computedMinDelay = useMemo(() => {
    const rateDelay = maxPerMinute > 0 ? Math.ceil(60000 / maxPerMinute) : 60000
    const hourDelay = maxPerHour > 0 ? Math.ceil(3600000 / maxPerHour) : 3600000
    return Math.max(0, Math.max(delayMs, rateDelay, hourDelay))
  }, [delayMs, maxPerHour, maxPerMinute])

  const showRiskWarning = useMemo(() => {
    if (totals.itemsCount > 500) return true
    if (maxPerMinute > 60) return true
    if (maxPerHour > 1500) return true
    if (computedMinDelay < 800) return true
    return false
  }, [computedMinDelay, maxPerHour, maxPerMinute, totals.itemsCount])

  const resetFlow = () => {
    setStep("publico")
    setAudience((prev) => ({
      ...prev,
      stageIds: [],
      dateStart: "",
      dateEnd: "",
      tagIds: [],
      tagMode: "any",
      leadLimitMode: "all",
      customLeadLimit: 100,
      leadOrder: "oldest",
    }))
    setDelayMs(1200)
    setMaxPerMinute(30)
    setMaxPerHour(900)
    setModel({ templateId: "", selectedTemplate: null, activeFlowStepId: undefined })
    setLastJobId(null)
    setIsSending(false)
  }

  const sampleLead: MassActionLead = limitedLeads[0] || {
    id: "sample",
    title: "João da Silva",
    client: "Empresa Exemplo LTDA",
    status: "Prospecção",
    createdAt: new Date().toISOString(),
    funnelId: audience.funnelIds[0],
    tags: [],
  }

  const runMassAction = async () => {
    if (!model.selectedTemplate) return
    setIsSending(true)
    const me = getCurrentUser()
    const idempotencyKey = `${Date.now()}_${Math.random().toString(16).slice(2)}`
    const tagNamesById = new Map(availableTags.map((t) => [t.id, t.name]))

    const targets = limitedLeads
      .map((l) => ({ lead: l, phones: extractUniquePhonesFromLead(l) }))
      .filter((t) => t.phones.length > 0)

    const created = await fetch("/api/mass-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        createdBy: { id: me?.id, name: me?.name, email: me?.email },
        templateId: model.selectedTemplate.id,
        templateSnapshot: model.selectedTemplate,
        filterPayload: { ...audience },
        throttling: { delayMs, maxPerMinute, maxPerHour, computedMinDelay },
        idempotencyKey,
        targets: targets.map((t) => ({ leadId: t.lead.id, phones: t.phones })),
      }),
    })
    if (!created.ok) {
      const err = await created.json().catch(() => ({}))
      throw new Error(err.error || "Falha ao criar job")
    }
    const { id: jobId } = (await created.json()) as { id: string }
    setLastJobId(jobId)

    await fetch(`/api/mass-actions/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "running" }),
    })

    const itemsRes = await fetch(`/api/mass-actions/${jobId}/items?limit=500&offset=0`)
    const items = (await itemsRes.json()) as Array<{ id: string; leadId: string; phone: string }>
    const leadById = new Map(limitedLeads.map((l) => [l.id, l]))

    for (const it of items) {
      const lead = leadById.get(it.leadId)
      if (!lead) continue
      const tagsText = (lead.tags || [])
        .map((t) => tagNamesById.get(String(t)) || String(t))
        .filter(Boolean)
        .join(", ")
      const stageName = stageNameById[String(lead.status)]
      const message = renderTemplateAsText(model.selectedTemplate, { lead, stageName, tagsText })

      try {
        await apiClient.post("/whatsapp/send-message", { contactId: it.phone, message, timestamp: new Date().toISOString() })
        await fetch(`/api/mass-actions/${jobId}/items`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: it.id, status: "sent", sentAt: new Date().toISOString() }),
        })
      } catch (e: any) {
        await fetch(`/api/mass-actions/${jobId}/items`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: it.id, status: "failed", errorMessage: e?.message || "Falha ao enviar" }),
        })
      }
      await sleep(computedMinDelay)
    }

    await fetch(`/api/mass-actions/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    })

    setIsSending(false)
    return jobId
  }

  const canGoPublico = audience.funnelIds.length > 0 && totals.leadCount > 0
  const canGoModelo = !!model.selectedTemplate

  return {
    step,
    setStep,
    audience,
    setAudience,
    model,
    setModel,
    delayMs,
    setDelayMs,
    maxPerMinute,
    setMaxPerMinute,
    maxPerHour,
    setMaxPerHour,
    availableStages,
    isLeadsLoading,
    filteredLeads,
    totals,
    computedMinDelay,
    showRiskWarning,
    sampleLead,
    isSending,
    lastJobId,
    resetFlow,
    runMassAction,
    canGoPublico,
    canGoModelo,
  }
}
