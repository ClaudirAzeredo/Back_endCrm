import type { Tag as TagType } from "@/lib/api/tags-api"
import type { MessageTemplate } from "@/lib/api/message-templates-api"
import type { MassActionLead } from "@/lib/mass-action-utils"

export type Funnel = {
  id: string
  name: string
  isActive?: boolean
  columns: Array<{ id: string; title: string }>
}

export type TagMode = "all" | "any"
export type LeadLimitMode = "all" | "custom"
export type LeadOrder = "oldest" | "newest"
export type StepId = "publico" | "modelo" | "revisao"

export type AudienceState = {
  funnelIds: string[]
  stageIds: string[]
  dateStart: string
  dateEnd: string
  tagIds: string[]
  tagMode: TagMode
  leadLimitMode: LeadLimitMode
  customLeadLimit: number
  leadOrder: LeadOrder
}

export type ThrottlingState = {
  delayMs: number
  maxPerMinute: number
  maxPerHour: number
  computedMinDelay: number
  showRiskWarning: boolean
}

export type AudienceComputed = {
  availableStages: Array<{ id: string; title: string; funnelName: string }>
  isLeadsLoading: boolean
  filteredCount: number
  targetLeadCount: number
  estimatedItemCount: number
}

export type ModelState = {
  templateId: string
  selectedTemplate: MessageTemplate | null
  activeFlowStepId?: string
}

export type TemplateComputed = {
  isTemplatesLoading: boolean
  templates: MessageTemplate[]
}

export type ReviewComputed = {
  sampleLead: MassActionLead
  totalsLeadCount: number
  totalsItemCount: number
}

export type MassActionAssistantBaseProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFunnelId: string
  funnels: Funnel[]
  availableTags: TagType[]
  onOpenTemplates: () => void
  onOpenLogs: (jobId?: string) => void
}
