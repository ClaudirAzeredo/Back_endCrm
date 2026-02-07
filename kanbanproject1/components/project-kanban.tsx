"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

// Removed duplicate imports for AlertDialog components
// import {
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react" // Added useRef
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { LeadCenterDialog } from "@/components/lead-center-dialog"
import {
  Plus,
  Trash2,
  CheckSquare,
  History,
  Zap,
  Pause,
  Download,
  Layers,
  MoreVertical,
  Users,
  Tag,
  Filter,
  X,
  FileSpreadsheet,
  ArrowRightLeft,
  Megaphone,
  ListChecks,
  LayoutList,
} from "lucide-react"
import { Target, Briefcase, Heart, Star, TrendingUp, Building, Handshake } from "lucide-react"

import { loadFromStorage, saveToStorage, getCurrentUser } from "@/lib/storage"
import { checkPermissionWithToast } from "@/lib/permissions"
import { getAllUsers } from "@/lib/auth"
import { loadSavedFilters, addSavedFilter, deleteSavedFilter, type SavedFilter } from "@/lib/saved-filters"
import { leadsApi, type CreateLeadRequest } from "@/lib/api/leads-api"

// Import components
import CreateLeadDialog from "./create-lead-dialog"
import LeadDetailsDialog from "./lead-details-dialog"
import KanbanSettings from "./kanban-settings"
import KanbanTemplates from "./kanban-templates"
import TemplatesHubDialog from "./templates-hub-dialog"
import MessageTemplatesManager from "./message-templates-manager"
import KanbanAutomations from "./kanban-automations"
import { automationsApi } from "@/lib/api/automations-api"
import { apiClient } from "@/lib/api-client"
import TaskCenter from "./task-center"
import LeadsHistoryDashboard from "./leads-history-dashboard"
import FunnelManager from "./funnel-manager"
import UserManagement from "./user-management"
import TagManager from "./tag-manager"
import QueueManagement from "./queue-management" // Added import for QueueManagement
import MassActionAssistantDialog from "./mass-action-assistant-dialog"
import MassActionLogsDialog from "./mass-action-logs-dialog"
import LandingPagesDashboard from "./landing-pages/landing-pages-dashboard" // Fixed import path to include landing-pages directory
import ImportLeadsDialog from "./import-leads-dialog"
import SavedFilterManager from "./saved-filter-manager"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useApiAuth } from "@/hooks/use-api-auth"
import { useApiTags } from "@/hooks/use-api-tags"
import type { Tag as TagType } from "@/lib/api/tags-api"

// Tipos
type Person = {
  id: string
  name: string
  avatar: string
  phone?: string
  email?: string
}

type Lead = {
  id: string
  title: string
  client: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  source: string
  status: string
  assignedTo?: Person
  people: Person[]
  priority?: string
  estimatedValue?: number
  expectedCloseDate?: string
  notes?: string
  createdAt: string
  funnelId?: string
  currentActionId?: string // Action currently being executed
  tags?: string[] // Added tags field to Lead type
  statusHistory?: Array<{
    status: string
    timestamp: string
    duration?: number
    previousStatus?: string // Added for bulk transfer logging
  }>
  interactions?: Array<{
    id: string
    type: "call" | "email" | "meeting" | "note" | "feedback"
    description: string
    date: string
    createdBy: string
    feedbackType?: "positive" | "negative" | "neutral" | "important"
    rating?: number
  }>
}

type Task = {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  assignedTo?: {
    id: string
    name: string
    avatar: string
  }
  leadId?: string
  clientName?: string
  dueDate?: string
  createdAt: string
  createdBy: "automation" | "manual"
  automationId?: string
  completedAt?: string
  tags?: string[]
  relatedConversations?: string[]
}

type AutomationTrigger = "on_enter" | "on_exit" | "on_time_spent" | "on_deadline" | "on_response" | "on_no_response"

type ActionMode = "automatic" | "manual"

type ActionDelay = {
  value: number
  unit: "minutes" | "hours" | "days"
}

type FlowTarget =
  | { kind: "action"; actionId: string }
  | { kind: "stage"; columnId: string; startActionId?: string }
  | null

type ActionMeta = {
  id?: string
  mode?: ActionMode
  enabled?: boolean
  delayConfig?: ActionDelay
  next?: FlowTarget
  customName?: string
  title?: string
}

type AutomationAction =
  | ({
      type: "whatsapp"
      template: string
      recipients: "assigned" | "all_members" | "custom" | "lead_contact"
      customRecipients?: string[]
      variables: Record<string, string>
      waitForResponse?: boolean
      responseTimeout?: number
      responseTargetColumnId?: string
      onResponseNext?: { kind: "stage"; columnId: string; startActionId?: string } | null
      onNoResponseNext?: { kind: "action"; actionId: string } | { kind: "stage"; columnId: string; startActionId?: string } | null
    } & ActionMeta)
  | ({
      type: "task"
      title: string
      description: string
      assignTo: "project_owner" | "column_responsible" | "custom"
      customAssignee?: string
      dueDate?: string
      priority: "low" | "medium" | "high"
    } & ActionMeta)
  | ({
      type: "email"
      subject: string
      template: string
      recipients: "assigned" | "all_members" | "custom"
      customRecipients?: string[]
      waitForResponse?: boolean
      responseTimeout?: number
    } & ActionMeta)
  | ({
      type: "notification"
      title: string
      message: string
      recipients: "assigned" | "all_members" | "custom"
      customRecipients?: string[]
    } & ActionMeta)
  | ({
      type: "move_lead"
      targetColumnId: string
      delay?: number
    } & ActionMeta)
  | ({
      type: "transfer_command"
      transferType: "funnel_and_stage" | "user_only"
      targetFunnelId?: string
      targetStageId?: string
      userTransferOption: "keep_same" | "transfer_to_specific" | "transfer_to_user"
      targetUserId?: string
    } & ActionMeta)
  | ({
      type: "batch_transfer"
      targetFunnelId?: string
      targetStageId?: string
      batchSize: number
      intervalValue: number
      intervalUnit: "minutes" | "hours" | "days"
      totalLeads?: number
      userTransferOption: "keep_same" | "transfer_to_specific"
      targetUserId?: string
    } & ActionMeta)
  | ({ type: "manual" } & ActionMeta)

type Automation = {
  id: string
  name: string
  columnId: string
  trigger: AutomationTrigger
  conditions?: {
    leadSource?: string[]
    priority?: string[]
    clientType?: string[]
    leadValue?: { min?: number; max?: number }
  }
  actions: AutomationAction[]
  active: boolean
  delay?: number
}

type ManualPauseState = {
  leadId: string
  automationId: string
  columnId: string
  actionId: string
}

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

type KanbanTemplate = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  columns: Array<{
    id: string
    name: string
    color: string
    order: number
  }>
}

type FilterRule = {
  id: string
  field: "user" | "tag" | "priority" | "source"
  value: string
}

type BatchTransferState = {
  automationId: string
  sourceColumnId: string
  sourceFunnelId: string
  targetFunnelId: string
  targetStageId: string
  batchSize: number
  intervalMs: number
  totalLeads?: number
  processedCount: number
  lastExecutionTime: string
  isActive: boolean
  nextExecutionTime?: string // Added to track when next execution should happen
}

const defaultFunnel: Funnel = {
  id: "default-funnel",
  name: "Pipeline de Vendas",
  description: "Funil padrão para gerenciamento de leads",
  category: "Vendas",
  icon: "briefcase",
  columns: [
    { id: "novo", name: "Novos Leads", color: "#64748b", order: 0, visible: true },
    { id: "qualificado", name: "Qualificados", color: "#3b82f6", order: 1, visible: true },
    { id: "proposta", name: "Proposta", color: "#f59e0b", order: 2, visible: true },
    { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3, visible: true },
    { id: "ganho", name: "Ganhos", color: "#10b981", order: 4, visible: true },
    { id: "perdido", name: "Perdidos", color: "#ef4444", order: 5, visible: true },
  ],
  isActive: true,
  createdAt: new Date().toISOString(),
}

const people: Person[] = [
  {
    id: "p1",
    name: "Usuário Padrão",
    avatar: "/placeholder.svg?height=32&width=32",
    phone: "+55 11 99999-0000",
    email: "usuario@empresa.com",
  },
]

// Função para obter ícone
const getIcon = (iconId: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    target: Target,
    users: Users,
    briefcase: Briefcase,
    heart: Heart,
    star: Star,
    "trending-up": TrendingUp,
    building: Building,
    handshake: Handshake,
  }
  return icons[iconId] || Target
}

// Componente principal
export default function LeadKanban() {
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useApiAuth()

  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [filterRules, setFilterRules] = useState<FilterRule[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const { tags: availableTags, fetchTags } = useApiTags()
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])

  const [showSettings, setShowSettings] = useState(false)
  const [templatesDialog, setTemplatesDialog] = useState<null | "hub" | "funnel" | "messages">(null)
  const [showAutomations, setShowAutomations] = useState(false)
  const [showTaskCenter, setShowTaskCenter] = useState(false)
  const [pendingMove, setPendingMove] = useState<{
    draggableId: string
    destinationId: string
    sourceId: string
    actions: any[]
  } | null>(null)
  const [showCreateLead, setShowCreateLead] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showFunnelManager, setShowFunnelManager] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [actionSelectionDialog, setActionSelectionDialog] = useState<{
    isOpen: boolean
    leadId: string
    targetColumnId: string
    sourceColumnId: string
    actions: AutomationAction[]
    automation: Automation
  } | null>(null)

  const [showQueueManagement, setShowQueueManagement] = useState(false)
  const [showLandingPages, setShowLandingPages] = useState(false)
  const [showImportLeads, setShowImportLeads] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Lead | null>(null)

  const [showMassAction, setShowMassAction] = useState(false)
  const [showMassActionLogs, setShowMassActionLogs] = useState(false)
  const [massActionLogsJobId, setMassActionLogsJobId] = useState<string | null>(null)

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showLeadDetails, setShowLeadDetails] = useState(false)
  const [historyPeriod, setHistoryPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d")

  const [automations, setAutomations] = useState<Automation[]>([])
  const [batchTransferStates, setBatchTransferStates] = useState<BatchTransferState[]>([])

  const [pausedManualByLeadId, setPausedManualByLeadId] = useState<Record<string, ManualPauseState>>({})
  const [showManualActionsQueue, setShowManualActionsQueue] = useState(false)
  const [activeManualLeadId, setActiveManualLeadId] = useState<string | null>(null)
  const [manualResumeTarget, setManualResumeTarget] = useState<string>("none")
  const pendingActionTimeoutsRef = useRef<Record<string, any>>({})
  const automationRunTokensRef = useRef<Record<string, string>>({})

  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showLeadCenter, setShowLeadCenter] = useState(false)
  const [exportFilterType, setExportFilterType] = useState<"complete" | "user" | "tag" | "stage">("complete")
  const [exportFilterValue, setExportFilterValue] = useState<string>("")
  // Added state for SavedFilterManager visibility
  const [showSavedFilterManager, setShowSavedFilterManager] = useState(false)

  const [selectedColumn, setSelectedColumn] = useState<Funnel["columns"][0] | null>(null)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")

  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showBulkTransferDialog, setShowBulkTransferDialog] = useState(false)
  const [bulkTransferTargetStage, setBulkTransferTargetStage] = useState<string>("")

  const handleImportLeads = (importedLeads: any[], funnelId: string, stageId: string) => {
    const now = new Date().toISOString()
    console.log(
      `[v0] handleImportLeads called with ${importedLeads.length} leads for funnel ${funnelId}, stage ${stageId}`,
    )
    console.log(`[v0] Current leads in state:`, leads.length)

    const newLeads: Lead[] = importedLeads.map((lead, index) => ({
      ...lead,
      id: `lead_${Date.now()}_${index}`,
      createdAt: now,
      funnelId: funnelId,
      status: stageId,
      statusHistory: [
        {
          status: stageId,
          timestamp: now,
          duration: 0,
        },
      ],
      people: lead.people || [],
      tags: lead.tags || [],
    }))

    console.log(`[v0] Created ${newLeads.length} new lead objects`)
    const updatedLeads = [...leads, ...newLeads]
    console.log(`[v0] Updated leads array length: ${updatedLeads.length}`)

    // Save to storage FIRST before updating state
    const storageKey = `leads_${funnelId}`
    saveToStorage(updatedLeads, storageKey)
    console.log(`[v0] Saved to storage with key: ${storageKey}`)

    // Verify it was saved
    const verifyLoad = loadFromStorage(storageKey, [])
    console.log(
      `[v0] Verification load from storage: ${Array.isArray(verifyLoad) ? verifyLoad.length : "not an array"} leads`,
    )

    // Then update state
    setLeads(updatedLeads)
    console.log(`[v0] State updated with ${updatedLeads.length} leads`)

    setShowImportLeads(false)
    toast({
      title: "Leads importados",
      description: `${newLeads.length} leads foram importados com sucesso.`,
    })
  }

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)

    const storedUsers = loadFromStorage("users", [])
    setAvailableUsers(Array.isArray(storedUsers) ? storedUsers : [])

    // Load funnels
    const storedFunnels = loadFromStorage("funnels", [])
    console.log("[v0] Loading funnels:", storedFunnels)

    if (Array.isArray(storedFunnels) && storedFunnels.length > 0) {
      setFunnels(storedFunnels)
      const activeFunnel = storedFunnels.find((f) => f.isActive) || storedFunnels[0]
      setSelectedFunnelId(activeFunnel?.id || "")
    } else {
      // First time user - create default funnel
      setFunnels([defaultFunnel])
      setSelectedFunnelId(defaultFunnel.id)
      saveToStorage([defaultFunnel], "funnels")
    }

    // Load tasks
    const storedTasks = loadFromStorage("tasks", [])
    setTasks(Array.isArray(storedTasks) ? storedTasks : [])

    ;(async () => {
      try {
        const apiAutos = await automationsApi.getAutomations()
        setAutomations(Array.isArray(apiAutos) ? apiAutos as any : [])
      } catch (e) {
        const storedAutomations = loadFromStorage("automations", [])
        setAutomations(Array.isArray(storedAutomations) ? storedAutomations : [])
      }
    })()

    const storedStates = loadFromStorage("batch_transfer_states", [])
    setBatchTransferStates(Array.isArray(storedStates) ? storedStates : [])
  }, [])

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setCurrentUser(user)
      const loadedFilters = loadSavedFilters(user.companyId)
      setSavedFilters(loadedFilters)
    }
  }, [])

  useEffect(() => {
    // Load users for the responsible user filter
    const users = getAllUsers()
    console.log("[v0] Loading users for filters:", users)
    setAvailableUsers(users)

    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    if (funnels.length > 0) {
      console.log("[v0] Saving funnels:", funnels.length)
      saveToStorage(funnels, "funnels")
    }

    if (tasks.length >= 0) {
      console.log("[v0] Saving tasks:", tasks.length)
      saveToStorage(tasks, "tasks")
    }

    if (automations.length >= 0) {
      console.log("[v0] Saving automations:", automations.length)
      saveToStorage(automations, "automations")
    }
  }, [funnels, tasks, automations])

  useEffect(() => {
    if (selectedFunnelId && !isAuthLoading) {
      // Verificar autenticação antes de carregar leads
      if (!isAuthenticated) {
        console.warn("[v0] Usuário não autenticado, redirecionando para login")
        router.push("/login")
        return
      }
      
      // Carrega leads da API ao invés do storage legado
      ;(async () => {
        try {
          const apiLeads = await leadsApi.getLeads({ funnelId: selectedFunnelId })
          console.log(`[v0] Loading leads from API for funnel ${selectedFunnelId}:`, apiLeads)
          const convertedLeads: Lead[] = (Array.isArray(apiLeads) ? apiLeads : []).map(apiLead => {
            // Normalizar status 'sql' para 'qualificado' para corrigir problema de leads antigos/migrados
            const normalizedStatus = apiLead.status === 'sql' ? 'qualificado' : apiLead.status
            
            return {
            ...apiLead,
            status: normalizedStatus,
            source: apiLead.source || '',
            assignedTo: apiLead.assignedTo ? {
              ...apiLead.assignedTo,
              avatar: apiLead.assignedTo.avatar || ''
            } : undefined,
            people: (apiLead.people || []).map(person => ({
              ...person,
              avatar: person.avatar || ''
            })),
            statusHistory: apiLead.statusHistory?.map(history => ({
              status: history.status,
              timestamp: history.changedAt
            })),
            interactions: apiLead.interactions?.map(interaction => ({
              ...interaction,
              description: interaction.notes,
              createdBy: interaction.user
            }))
          }})
          setLeads(convertedLeads)
        } catch (err) {
          console.error(`[v0] Failed to load leads from API for funnel ${selectedFunnelId}:`, err)
          setLeads([])
        }
      })()
    }
  }, [selectedFunnelId, isAuthenticated, isAuthLoading])

  // Polling for new leads (Notification System)
  useEffect(() => {
    if (!selectedFunnelId || !isAuthenticated) return

    const pollInterval = setInterval(async () => {
      try {
        const apiLeads = await leadsApi.getLeads({ funnelId: selectedFunnelId })
        
        setLeads((currentLeads) => {
          if (!Array.isArray(apiLeads)) return currentLeads

          const currentIds = new Set(currentLeads.map(l => l.id))
          const newLeads = apiLeads.filter(l => !currentIds.has(l.id))
          
          // If no changes in count or identity, skip update to avoid re-renders
          if (newLeads.length === 0 && apiLeads.length === currentLeads.length) {
              return currentLeads
          }

          if (newLeads.length > 0) {
            toast({
              title: "Novos leads!",
              description: `${newLeads.length} novo(s) lead(s) encontrado(s).`,
            })
          }

          // Convert and update state
          return apiLeads.map(apiLead => {
            const normalizedStatus = apiLead.status === 'sql' ? 'qualificado' : apiLead.status
            return {
                ...apiLead,
                status: normalizedStatus,
                source: apiLead.source || '',
                assignedTo: apiLead.assignedTo ? {
                    ...apiLead.assignedTo,
                    avatar: apiLead.assignedTo.avatar || ''
                } : undefined,
                people: (apiLead.people || []).map(person => ({
                    ...person,
                    avatar: person.avatar || ''
                })),
                statusHistory: apiLead.statusHistory?.map(history => ({
                    status: history.status,
                    timestamp: history.changedAt
                })),
                interactions: apiLead.interactions?.map(interaction => ({
                    ...interaction,
                    description: interaction.notes,
                    createdBy: interaction.user
                }))
            }
          })
        })
      } catch (err) {
        console.error("[v0] Polling leads failed", err)
      }
    }, 15000) // Poll every 15 seconds

    return () => clearInterval(pollInterval)
  }, [selectedFunnelId, isAuthenticated, toast])

  const saveLeadsTimeoutRef = useRef<NodeJS.Timeout>()
  // Remove o salvamento em storage legado para evitar avisos depreciação
  // Leads agora são carregados e persistidos via API

  useEffect(() => {
    if (batchTransferStates.length >= 0) {
      saveToStorage(batchTransferStates, "batch_transfer_states")
    }
  }, [batchTransferStates])

  const leadsRef = useRef(leads)
  useEffect(() => {
    leadsRef.current = leads
  }, [leads])

  useEffect(() => {
    // Check for batch transfers periodically
    const checkInterval = setInterval(() => {
      const now = new Date().getTime()
      
      batchTransferStates.forEach(state => {
        if (!state.isActive) return
        const nextExecution = state.nextExecutionTime ? new Date(state.nextExecutionTime).getTime() : 0
        if (now >= nextExecution) {
             executeBatchTransfer(state)
        }
      })

    }, 1000) 

    return () => clearInterval(checkInterval)
  }, [batchTransferStates, leads])


  useEffect(() => {
    const executeImmediatelyIfNeeded = () => {
      automations.forEach((automation) => {
        const batchAction = automation.actions.find((a) => a.type === "batch_transfer")
        if (batchAction && automation.active) {
          // Assuming 'automation.columnId' refers to the source column within its own funnel
          // and the batch transfer moves leads to a different funnel/stage.
          const sourceLeads = leads.filter((l) => l.status === automation.columnId)

          // If there are leads in the source column and no batch transfer is active for this automation
          if (sourceLeads.length > 0) {
            const existingState = batchTransferStates.find((s) => s.automationId === automation.id)
            if (!existingState) {
              // Calculate interval in milliseconds
              let intervalMs = batchAction.intervalValue * 1000
              if (batchAction.intervalUnit === "minutes") {
                intervalMs *= 60
              } else if (batchAction.intervalUnit === "hours") {
                intervalMs *= 60 * 60
              } else if (batchAction.intervalUnit === "days") {
                intervalMs *= 60 * 60 * 24
              }

              const now = new Date()
              const newState: BatchTransferState = {
                automationId: automation.id,
                sourceColumnId: automation.columnId,
                sourceFunnelId: selectedFunnelId, // Set the current funnel as source funnel
                targetFunnelId: batchAction.targetFunnelId || selectedFunnelId,
                targetStageId: batchAction.targetStageId || automation.columnId,
                batchSize: batchAction.batchSize,
                intervalMs,
                totalLeads: batchAction.totalLeads,
                processedCount: 0,
                lastExecutionTime: now.toISOString(),
                isActive: true,
                nextExecutionTime: now.toISOString(), // Execute immediately on first run
              }

              setBatchTransferStates((prev) => [...prev, newState])
            }
          }
        }
      })
    }

    executeImmediatelyIfNeeded()
  }, [automations, leads, selectedFunnelId, batchTransferStates])

  // Funil selecionado
  const selectedFunnel = funnels.find((f) => f.id === selectedFunnelId) || funnels[0]
  const currentColumns = selectedFunnel?.columns || []

  // Helper to check if a column has an active automation
  const hasColumnAutomation = (columnId: string): boolean => {
    return automations.some((auto) => auto.columnId === columnId && auto.active)
  }

  // Função para obter ícone de automação
  const getAutomationIcon = (type: Automation["actions"][number]["type"]) => {
    switch (type) {
      case "whatsapp":
        return "💬" // WhatsApp icon
      case "email":
        return "📧" // Email icon
      case "task":
        return "✅" // Task icon
      case "notification":
        return "🔔" // Notification icon
      case "transfer_command":
        return "➡️" // Transfer icon
      case "batch_transfer":
        return "⏳" // Batch transfer icon
      default:
        return "❓" // Unknown icon
    }
  }

  // Helper function to convert interval to milliseconds
  const convertIntervalToMs = (intervalValue: number, intervalUnit: string): number => {
    let ms = intervalValue * 1000
    if (intervalUnit === "minutes") {
      ms *= 60
    } else if (intervalUnit === "hours") {
      ms *= 60 * 60
    } else if (intervalUnit === "days") {
      ms *= 60 * 60 * 24
    }
    return ms
  }

  const toDelayMs = (cfg?: ActionDelay) => {
    if (!cfg || !cfg.value) return 0
    const base = cfg.value * 1000
    if (cfg.unit === "minutes") return base * 60
    if (cfg.unit === "hours") return base * 60 * 60
    if (cfg.unit === "days") return base * 60 * 60 * 24
    return 0
  }

  const normalizeStageActions = (actions: AutomationAction[]) => {
    return actions.map((a, index) => {
      const mode: ActionMode = (a as any).mode || (a.type === "manual" ? "manual" : "automatic")
      const enabled = typeof (a as any).enabled === "boolean" ? (a as any).enabled : true
      const id = (a as any).id || `legacy_${index}`
      const delayConfig = (a as any).delayConfig
      const next = (a as any).next ?? null
      const onResponseNext = (a as any).onResponseNext ?? null
      const onNoResponseNext = (a as any).onNoResponseNext ?? null
      return { ...a, id, mode, enabled, delayConfig, next, onResponseNext, onNoResponseNext } as any
    })
  }

  const clearPendingAutomation = (leadId: string) => {
    const t = pendingActionTimeoutsRef.current[leadId]
    if (t) {
      clearTimeout(t)
      delete pendingActionTimeoutsRef.current[leadId]
    }
  }

  const getNextByOrder = (actions: any[], currentId: string): FlowTarget => {
    const idx = actions.findIndex((a) => a.id === currentId)
    if (idx < 0) return null
    for (let i = idx + 1; i < actions.length; i++) {
      if (actions[i]?.enabled) {
        return { kind: "action", actionId: actions[i].id }
      }
    }
    return null
  }

  const waitForIncomingWhatsApp = async (
    contactId: string,
    afterIso: string,
    timeoutMs: number,
    runToken: string,
    leadId: string,
  ): Promise<boolean> => {
    const start = Date.now()
    const afterMs = Date.parse(afterIso)
    while (Date.now() - start < timeoutMs) {
      if (automationRunTokensRef.current[leadId] !== runToken) return false
      try {
        const resp = await apiClient.get<{ messages: any[] }>(`/whatsapp/messages/${contactId}`)
        const msgs = Array.isArray(resp?.messages) ? resp.messages : []
        const replied = msgs.some((m: any) => {
          const ts = Date.parse(String(m?.timestamp || ""))
          return ts && ts > afterMs && m?.isFromMe === false
        })
        if (replied) return true
      } catch {
      }
      await new Promise((r) => setTimeout(r, 5000))
    }
    return false
  }

  const pauseAtManualAction = (automation: Automation, lead: Lead, actionId: string) => {
    clearPendingAutomation(lead.id)
    const state: ManualPauseState = {
      leadId: lead.id,
      automationId: automation.id,
      columnId: automation.columnId,
      actionId,
    }
    setPausedManualByLeadId((prev) => ({ ...prev, [lead.id]: state }))
    setActiveManualLeadId(lead.id)
    setManualResumeTarget("none")
    toast({
      title: "Fluxo pausado em ação manual",
      description: `O lead "${lead.title}" está aguardando uma ação do usuário.`,
    })
  }

  const executeSingleAction = async (
    automation: Automation,
    lead: Lead,
    action: any,
    createdBy: "automation" | "manual",
  ): Promise<
    | {
        kind: "whatsapp"
        primaryContactId: string | null
        sentAtIso: string
      }
    | void
  > => {
    const normalizePhone = (raw?: string) => (raw || "").replace(/[^0-9]/g, "")
    const formatTemplate = (template: string, vars: Record<string, string> = {}) => {
      const defaults: Record<string, string> = {
        client_name: lead.client || "",
        company_name: lead.title || "",
        deadline: lead.expectedCloseDate || "",
      }
      const merged = { ...defaults, ...vars }
      return Object.keys(merged).reduce((msg, key) => msg.replace(new RegExp(`\\{${key}\\}`, "g"), merged[key] || ""), template)
    }

    if (action.type === "manual") {
      const nowISO = new Date().toISOString()
      void leadsApi.addInteraction(lead.id, { type: "note", date: nowISO, notes: "Ação manual executada" })
      toast({ title: "Ação manual executada", description: `Ação manual aplicada no lead "${lead.title}".` })
      return
    }

    switch (action.type) {
      case "whatsapp": {
        const tpl = formatTemplate(action.template || "", action.variables || {})
        if (!tpl || !tpl.trim()) return
        const recType = action.recipients || "lead_contact"
        const recipients: string[] = []
        if (recType === "lead_contact") {
          if (lead.clientPhone) recipients.push(normalizePhone(lead.clientPhone))
        } else if (recType === "assigned") {
          if (lead.assignedTo?.phone) recipients.push(normalizePhone(lead.assignedTo.phone))
        } else if (recType === "custom") {
          const list = action.customRecipients || []
          list.forEach((p: string) => recipients.push(normalizePhone(p)))
        } else if (recType === "all_members") {
          (availableUsers || []).forEach((u: any) => {
            if (u?.phone) recipients.push(normalizePhone(u.phone))
          })
        }

        const uniqueRecipients = Array.from(new Set(recipients.filter(Boolean)))
        const sentAtIso = new Date().toISOString()
        for (const phone of uniqueRecipients) {
          if (!phone || phone.length < 10) continue
          try {
            await apiClient.post("/whatsapp/send-message", { contactId: phone, message: tpl, timestamp: sentAtIso })
            const nowISO = new Date().toISOString()
            void leadsApi.addInteraction(lead.id, { type: "note", date: nowISO, notes: `WhatsApp enviado para ${phone}` })
          } catch (err) {
            console.error("[v0] Falha ao enviar WhatsApp via API", err)
            const nowISO = new Date().toISOString()
            void leadsApi.addInteraction(lead.id, { type: "note", date: nowISO, notes: `Falha ao enviar WhatsApp para ${phone}` })
          }
        }
        return { kind: "whatsapp", primaryContactId: uniqueRecipients[0] || null, sentAtIso }
      }

      case "batch_transfer": {
        if (action.targetFunnelId && action.targetStageId) {
          const intervalMs = convertIntervalToMs(action.intervalValue, action.intervalUnit)
          const existingState = batchTransferStates.find((s) => s.automationId === automation.id)
          if (!existingState) {
            const now = new Date()
            const newState: BatchTransferState = {
              automationId: automation.id,
              sourceColumnId: automation.columnId,
              sourceFunnelId: selectedFunnelId,
              targetFunnelId: action.targetFunnelId,
              targetStageId: action.targetStageId,
              batchSize: action.batchSize,
              intervalMs,
              totalLeads: action.totalLeads,
              processedCount: 0,
              lastExecutionTime: now.toISOString(),
              isActive: true,
              nextExecutionTime: now.toISOString(),
            }
            setBatchTransferStates((prev) => [...prev, newState])
            toast({
              title: "Disparo em lote iniciado",
              description: `Processando ${action.batchSize} leads a cada ${action.intervalValue} ${action.intervalUnit === "minutes" ? "minutos" : action.intervalUnit === "hours" ? "horas" : "dias"}`,
            })
          } else {
            setBatchTransferStates((prev) =>
              prev.map((s) => (s.automationId === automation.id ? { ...s, isActive: true, nextExecutionTime: new Date().toISOString() } : s)),
            )
            toast({ title: "Disparo em lote reativado", description: "O processamento em lote foi retomado" })
          }
        }
        return
      }

      case "move_lead": {
        if (!action.targetColumnId) return
        updateLeadStatusHistory(lead.id, action.targetColumnId)
        try {
          const updated = await leadsApi.updateStatus(lead.id, { status: action.targetColumnId })
          setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: updated.status } : l)))
          const fromColumn = currentColumns.find((col) => col.id === automation.columnId)
          const toColumn = currentColumns.find((col) => col.id === action.targetColumnId)
          const now = new Date().toISOString()
          const notes = fromColumn && toColumn ? `Transferência de fase: ${fromColumn.name} → ${toColumn.name}` : `Transferência de fase para ${action.targetColumnId}`
          void leadsApi.addInteraction(lead.id, { type: "note", date: now, notes })
        } catch (err) {
          console.error("[v0] Falha ao persistir status do lead", err)
          toast({ title: "Falha ao atualizar", description: "Não foi possível salvar a mudança de fase no servidor." })
        }
        return
      }

      case "transfer_command": {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        if (action.transferType === "funnel_and_stage") {
          const targetFunnelId = action.targetFunnelId
          const targetStageId = action.targetStageId
          if (targetFunnelId && targetStageId) {
            try {
              const updated = await leadsApi.updateLead(lead.id, { funnelId: targetFunnelId, status: targetStageId })
              setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, funnelId: updated.funnelId, status: updated.status } : l)))
              const targetFunnel = funnels.find((f) => f.id === targetFunnelId)
              const targetStage = targetFunnel?.columns.find((c) => c.id === targetStageId)
              const now = new Date().toISOString()
              const notes = `Transferência de funil/etapa: ${lead.funnelId || "?"} → ${targetFunnelId} | ${lead.status} → ${targetStageId}`
              void leadsApi.addInteraction(lead.id, { type: "note", date: now, notes })
              toast({ title: "Lead transferido", description: `"${lead.title}" foi transferido para ${targetFunnel?.name} - ${targetStage?.name}` })
            } catch (err) {
              console.error("[v0] Falha ao transferir lead via API", err)
              toast({ title: "Falha na transferência", description: "Não foi possível salvar a transferência de funil/etapa no servidor." })
            }
          }
        } else if (action.transferType === "user_only") {
          if (action.targetUserId) {
            const targetUser = availableUsers.find((u) => u.id === action.targetUserId)
            if (targetUser) {
              setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, assignedTo: targetUser } : l)))
              toast({ title: "Responsável alterado", description: `"${lead.title}" foi transferido para ${targetUser.name}` })
            }
          }
        }
        return
      }

      case "task": {
        if (action.title) {
          const newTask: Task = {
            id: `task_${Date.now()}`,
            title: action.title,
            description: action.description || "",
            status: "pending",
            priority: action.priority || "medium",
            assignedTo:
              action.assignTo === "custom" && lead.assignedTo
                ? {
                    id: lead.assignedTo.id,
                    name: lead.assignedTo.name,
                    avatar: lead.assignedTo.avatar || "",
                  }
                : undefined,
            leadId: lead.id,
            clientName: lead.client,
            dueDate: action.dueDate,
            createdAt: new Date().toISOString(),
            createdBy,
            automationId: automation.id,
          }
          setTasks((prev) => [...prev, newTask])
        }
        return
      }

      case "email":
      case "notification": {
        toast({ title: `Ação ${action.type} executada`, description: `Ação de ${action.type} foi acionada para o lead "${lead.title}"` })
        return
      }
    }
  }

  const runStageFlow = async (automation: Automation, lead: Lead, startActionId?: string, bypassDelay?: boolean) => {
    clearPendingAutomation(lead.id)
    const token = `run_${Date.now()}_${Math.random().toString(16).slice(2)}`
    automationRunTokensRef.current[lead.id] = token

    const actions = normalizeStageActions(automation.actions)
    const actionMap = new Map<string, any>()
    actions.forEach((a: any) => actionMap.set(a.id, a))

    const initialId = startActionId || (actions.find((a: any) => a.enabled)?.id as string | undefined)
    if (!initialId) return

    const step = async (actionId: string, bypass?: boolean, visited?: Set<string>) => {
      if (automationRunTokensRef.current[lead.id] !== token) return
      const liveLead = leads.find((l) => l.id === lead.id) || lead
      if (liveLead.status !== automation.columnId) return

      // Update current action in UI
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, currentActionId: actionId } : l)))
      
      // Persist to localStorage (fallback) and Backend
      try {
        // Local storage fallback
        const stored = JSON.parse(localStorage.getItem("lead_current_actions") || "{}")
        stored[lead.id] = actionId
        localStorage.setItem("lead_current_actions", JSON.stringify(stored))
        
        // Backend persistence
        void leadsApi.updateLead(lead.id, { currentActionId: actionId })
      } catch (e) {}

      const localVisited = visited || new Set<string>()
      if (localVisited.has(actionId)) return
      localVisited.add(actionId)

      const action = actionMap.get(actionId)
      if (!action || !action.enabled) return

      if (action.mode === "manual") {
        pauseAtManualAction(automation, liveLead, actionId)
        return
      }

      const delayMs = toDelayMs(action.delayConfig) || (typeof action.delay === "number" ? action.delay * 60 * 1000 : 0)
      if (!bypass && delayMs > 0) {
        pendingActionTimeoutsRef.current[lead.id] = setTimeout(() => {
          void step(actionId, true)
        }, delayMs)
        return
      }

      const execResult = await executeSingleAction(automation, liveLead, action, "automation")

      const applyFlowTarget = async (target: FlowTarget) => {
        if (!target) return
        if (target.kind === "action") {
          await step(target.actionId, false, localVisited)
          return
        }

        updateLeadStatusHistory(liveLead.id, target.columnId)
        try {
          const updated = await leadsApi.updateStatus(liveLead.id, { status: target.columnId })
          setLeads((prev) => prev.map((l) => (l.id === liveLead.id ? { ...l, status: updated.status, currentActionId: undefined } : l)))
          const fromColumn = currentColumns.find((col) => col.id === automation.columnId)
          const toColumn = currentColumns.find((col) => col.id === target.columnId)
          const now = new Date().toISOString()
          const notes =
            fromColumn && toColumn
              ? `Transferência de fase: ${fromColumn.name} → ${toColumn.name}`
              : `Transferência de fase para ${target.columnId}`
          void leadsApi.addInteraction(liveLead.id, { type: "note", date: now, notes })
        } catch (err) {
          console.error("[v0] Falha ao persistir status do lead", err)
          toast({ title: "Falha ao atualizar", description: "Não foi possível salvar a mudança de fase no servidor." })
          return
        }

        const nextAutomation = automations.find((auto) => auto.columnId === target.columnId && auto.active && auto.trigger === "on_enter")
        if (!nextAutomation) return
        await runStageFlow(nextAutomation as any, { ...liveLead, status: target.columnId }, target.startActionId)
      }

      if (action.type === "whatsapp" && action.waitForResponse && execResult && (execResult as any).kind === "whatsapp") {
        const primary = (execResult as any).primaryContactId as string | null
        const sentAtIso = (execResult as any).sentAtIso as string
        const timeoutMin = typeof action.responseTimeout === "number" ? action.responseTimeout : 24 * 60
        const timeoutMs = Math.max(0, timeoutMin) * 60 * 1000
        if (primary && timeoutMs > 0) {
          const responded = await waitForIncomingWhatsApp(primary, sentAtIso, timeoutMs, token, liveLead.id)
          const legacyResponseTarget: FlowTarget = action.responseTargetColumnId
            ? { kind: "stage", columnId: action.responseTargetColumnId }
            : null
          const onResponseTarget: FlowTarget = (action.onResponseNext as any) ?? legacyResponseTarget

          if (responded && onResponseTarget) {
            await applyFlowTarget(onResponseTarget)
            return
          }

          if (!responded && action.onNoResponseNext) {
            await applyFlowTarget(action.onNoResponseNext as any)
            return
          }
        }
      }

      const target: FlowTarget = action.next ?? getNextByOrder(actions, actionId)
      if (!target) {
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, currentActionId: undefined } : l)))
        // Clear from persistence
        try {
          const stored = JSON.parse(localStorage.getItem("lead_current_actions") || "{}")
          if (stored[lead.id]) {
            delete stored[lead.id]
            localStorage.setItem("lead_current_actions", JSON.stringify(stored))
          }
          // Backend clear
          void leadsApi.updateLead(lead.id, { currentActionId: "" })
        } catch (e) {}
        return
      }
      if (target.kind === "stage") {
        updateLeadStatusHistory(liveLead.id, target.columnId)
        try {
          const updated = await leadsApi.updateStatus(liveLead.id, { status: target.columnId })
          // Clear currentActionId on stage change
          void leadsApi.updateLead(liveLead.id, { currentActionId: "" })
          setLeads((prev) => prev.map((l) => (l.id === liveLead.id ? { ...l, status: updated.status, currentActionId: undefined } : l)))
          const fromColumn = currentColumns.find((col) => col.id === automation.columnId)
          const toColumn = currentColumns.find((col) => col.id === target.columnId)
          const now = new Date().toISOString()
          const notes = fromColumn && toColumn ? `Transferência de fase: ${fromColumn.name} → ${toColumn.name}` : `Transferência de fase para ${target.columnId}`
          void leadsApi.addInteraction(liveLead.id, { type: "note", date: now, notes })
        } catch (err) {
          console.error("[v0] Falha ao persistir status do lead", err)
          toast({ title: "Falha ao atualizar", description: "Não foi possível salvar a mudança de fase no servidor." })
        }
        return
      }

      if (target.kind === "action") {
        await step(target.actionId, false, localVisited)
      }
    }

    await step(initialId, bypassDelay)
  }

  const executeAutomationActions = async (automation: Automation, lead: Lead) => {
    await runStageFlow(automation, lead)
  }

  const resolveManualAction = async (decision: "execute" | "ignore") => {
    if (!activeManualLeadId) return
    const pauseState = pausedManualByLeadId[activeManualLeadId]
    if (!pauseState) {
      setActiveManualLeadId(null)
      return
    }

    const lead = leads.find((l) => l.id === pauseState.leadId)
    const automation = automations.find((a) => a.id === pauseState.automationId)
    if (!lead || !automation) {
      setActiveManualLeadId(null)
      setPausedManualByLeadId((prev) => {
        const next = { ...prev }
        delete next[pauseState.leadId]
        return next
      })
      return
    }

    const normalized = normalizeStageActions(automation.actions)
    const action = normalized.find((a: any) => a.id === pauseState.actionId)
    if (decision === "execute" && action) {
      await executeSingleAction(automation, lead, action, "manual")
    }

    setPausedManualByLeadId((prev) => {
      const next = { ...prev }
      delete next[pauseState.leadId]
      return next
    })
    setActiveManualLeadId(null)

    if (manualResumeTarget.startsWith("action:")) {
      const targetActionId = manualResumeTarget.split(":")[1]
      await runStageFlow(automation, lead, targetActionId)
      return
    }

    if (manualResumeTarget.startsWith("stage:")) {
      const targetStageId = manualResumeTarget.split(":")[1]
      updateLeadStatusHistory(lead.id, targetStageId)
      try {
        const updated = await leadsApi.updateStatus(lead.id, { status: targetStageId })
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: updated.status } : l)))
        const fromColumn = currentColumns.find((col) => col.id === lead.status)
        const toColumn = currentColumns.find((col) => col.id === targetStageId)
        const now = new Date().toISOString()
        const notes = fromColumn && toColumn ? `Transferência de fase: ${fromColumn.name} → ${toColumn.name}` : `Transferência de fase para ${targetStageId}`
        void leadsApi.addInteraction(lead.id, { type: "note", date: now, notes })
      } catch (err) {
        console.error("[v0] Falha ao persistir status do lead", err)
        toast({ title: "Falha ao atualizar", description: "Não foi possível salvar a mudança de fase no servidor." })
      }

      const nextAutomation = automations.find((auto) => auto.columnId === targetStageId && auto.active && auto.trigger === "on_enter")
      if (nextAutomation) {
        const delayMin = nextAutomation.delay || 0
        if (delayMin > 0) {
          setTimeout(() => {
            void executeAutomationActions(nextAutomation, { ...lead, status: targetStageId })
          }, delayMin * 60 * 1000)
        } else {
          await executeAutomationActions(nextAutomation, { ...lead, status: targetStageId })
        }
      }
    }
  }

  const executeBatchTransfer = (state: BatchTransferState) => {
    console.log("[v0] Executing batch transfer:", state)

    // Fechar modais/abertos antes de operações críticas para evitar erro de reconciliação
    setShowBulkTransferDialog(false)
    setShowBulkDeleteDialog(false)
    setShowFilterPopover(false)
    setShowExportDialog(false)
    setItemToDelete(null)

    // Buscar leads do estado atual (carregados via API)
    const allLeadsFromState: Lead[] = leads.filter((l: Lead) => l.funnelId === state.sourceFunnelId)
    console.log("[v0] Loaded leads from state:", allLeadsFromState.length, "for funnel:", state.sourceFunnelId)

    const sourceLeads = allLeadsFromState.filter((l: Lead) => l.status === state.sourceColumnId)
    console.log("[v0] Found source leads in column:", sourceLeads.length, "Column ID:", state.sourceColumnId)

    // Calculate how many leads to process
    const remainingLeads = state.totalLeads ? state.totalLeads - state.processedCount : sourceLeads.length
    const leadsToProcess = Math.min(state.batchSize, remainingLeads, sourceLeads.length)

    console.log(
      "[v0] Leads to process:",
      leadsToProcess,
      "Remaining:",
      remainingLeads,
      "Processed so far:",
      state.processedCount,
    )

    if (leadsToProcess === 0) {
      // No more leads to process - stop automation
      console.log("[v0] Batch transfer complete - no more leads to process")
      setBatchTransferStates((prev) =>
        prev.map((s) => (s.automationId === state.automationId ? { ...s, isActive: false } : s)),
      )
      toast({
        title: "Disparo em lote concluído",
        description: `Todos os leads foram processados (${state.processedCount} leads movidos)`,
      })
      return
    }

    // Get the leads to move
    const leadsToMove: Lead[] = (sourceLeads as Lead[]).slice(0, leadsToProcess)

    console.log(
      "[v0] Moving leads:",
      leadsToMove.map((l: Lead) => l.id),
    )

    // Check if moving within the same funnel or to a different funnel
    if (state.sourceFunnelId === state.targetFunnelId) {
      const updatedLeads: Lead[] = allLeadsFromState.map((lead: Lead) => {
        const leadToMove = leadsToMove.find((ltm: any) => ltm.id === lead.id)
        if (leadToMove) {
          // Update status history
          const now = new Date().toISOString()
          const currentHistory = lead.statusHistory || []

          const updatedHistory = currentHistory.map((history: any, index: number) => {
            if (index === currentHistory.length - 1) {
              const duration = Math.floor(
                (new Date(now).getTime() - new Date(history.timestamp).getTime()) / (1000 * 60 * 60 * 24),
              )
              return { ...history, duration: Math.max(duration, 0) }
            }
            return history
          })

          const newHistory = [
            ...updatedHistory,
            {
              status: state.targetStageId,
              timestamp: now,
              duration: 0,
            },
          ]

          const updated = {
            ...lead,
            status: state.targetStageId,
            statusHistory: newHistory,
          }
          return updated
        }
        return lead
      });

      // Persistir via API e registrar interação
      (async () => {
        for (const lead of leadsToMove) {
          try {
            const updated = await leadsApi.updateStatus(lead.id, { status: state.targetStageId })
            const fromStage = currentColumns.find((c) => c.id === state.sourceColumnId)?.name || state.sourceColumnId
            const toStage = currentColumns.find((c) => c.id === state.targetStageId)?.name || state.targetStageId
            const nowISO = new Date().toISOString()
            void leadsApi.addInteraction(lead.id, {
              type: "note",
              date: nowISO,
              notes: `Transferência de fase: ${fromStage} → ${toStage}`,
            })
          } catch (e) {
            console.warn("[v0] Falha ao atualizar status no backend", e)
          }
        }
      })()

      // Atualiza estado local
      if (selectedFunnelId === state.sourceFunnelId) {
        setLeads(updatedLeads)
      }
    } else {
      // Moving to a different funnel
      const updatedLeads: Lead[] = leadsToMove.map((lead: Lead) => {
        const now = new Date().toISOString()
        const currentHistory = lead.statusHistory || []

        const updatedHistory = currentHistory.map((history: any, index: number) => {
          if (index === currentHistory.length - 1) {
            const duration = Math.floor(
              (new Date(now).getTime() - new Date(history.timestamp).getTime()) / (1000 * 60 * 60 * 24),
            )
            return { ...history, duration: Math.max(duration, 0) }
          }
          return history
        })

        const newHistory = [
          ...updatedHistory,
          {
            status: state.targetStageId,
            timestamp: now,
            duration: 0,
          },
        ]

        return {
          ...lead,
          funnelId: state.targetFunnelId,
          status: state.targetStageId,
          statusHistory: newHistory,
        }
      });

      // Persistir via API cada lead transferido e registrar interação
      (async () => {
        for (const moved of updatedLeads) {
          try {
            const updated = await leadsApi.updateLead(moved.id, {
              funnelId: state.targetFunnelId,
              status: state.targetStageId,
            })
            const nowISO = new Date().toISOString()
            void leadsApi.addInteraction(moved.id, {
              type: "note",
              date: nowISO,
              notes: `Transferência de funil/etapa: ${state.sourceFunnelId} → ${state.targetFunnelId} | ${moved.status} → ${state.targetStageId}`,
            })
          } catch (e) {
            console.warn("[v0] Falha ao transferir lead via API", e)
          }
        }
      })()

      // Atualizar estado local
      if (selectedFunnelId === state.sourceFunnelId) {
        setLeads((prev) => prev.filter((l) => !updatedLeads.find((m: any) => m.id === l.id)))
      }
      if (selectedFunnelId === state.targetFunnelId) {
        setLeads((prev) => {
          const remaining = prev.filter((l) => !updatedLeads.find((m: any) => m.id === l.id))
          return [...remaining, ...updatedLeads]
        })
      }
    }

    const newProcessedCount = state.processedCount + leadsToProcess
    const now = new Date()
    const nextExecution = new Date(now.getTime() + state.intervalMs)

    console.log("[v0] Scheduling next execution for:", nextExecution.toISOString())

    setBatchTransferStates((prev) =>
      prev.map((s) =>
        s.automationId === state.automationId
          ? {
              ...s,
              processedCount: newProcessedCount,
              lastExecutionTime: now.toISOString(),
              nextExecutionTime: nextExecution.toISOString(), // Schedule next execution
              isActive: true, // Keep active to continue processing
            }
          : s,
      ),
    )

    toast({
      title: "Lote processado",
      description: `${leadsToProcess} leads movidos. Próximo lote em ${state.intervalMs / 1000 / 60} minutos.`,
    })
  }

  // Função para atualizar histórico de status
  const updateLeadStatusHistory = (leadId: string, newStatus: string) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          const now = new Date().toISOString()
          const currentHistory = lead.statusHistory || []

          // Calcular duração da etapa anterior
          const updatedHistory = currentHistory.map((history, index) => {
            if (index === currentHistory.length - 1) {
              const duration = Math.floor(
                (new Date(now).getTime() - new Date(history.timestamp).getTime()) / (1000 * 60 * 60 * 24),
              )
              return { ...history, duration: Math.max(duration, 0) }
            }
            return history
          })

          // Adicionar nova entrada no histórico
          const newHistory = [
            ...updatedHistory,
            {
              status: newStatus,
              timestamp: now,
              duration: 0,
            },
          ]

          return {
            ...lead,
            status: newStatus,
            statusHistory: newHistory,
          }
        }
        return lead
      }),
    )
  }

  // Funções para gerenciar leads
  const handleCreateLead = async (leadData: Omit<Lead, "id" | "createdAt">) => {
    const payload: CreateLeadRequest = {
      title: leadData.title,
      client: leadData.client,
      clientEmail: leadData.clientEmail,
      clientPhone: leadData.clientPhone,
      clientAddress: leadData.clientAddress,
      clientType: (leadData as any).clientType,
      clientCNPJ: (leadData as any).clientCNPJ,
      source: leadData.source,
      status: leadData.status,
      priority: (leadData.priority as any) || undefined,
      assignedTo: leadData.assignedTo
        ? { id: leadData.assignedTo.id, name: leadData.assignedTo.name, email: leadData.assignedTo.email }
        : undefined,
      people: Array.isArray((leadData as any).people) ? (leadData as any).people : undefined,
      funnelId: selectedFunnelId,
      estimatedValue: leadData.estimatedValue,
      expectedCloseDate: leadData.expectedCloseDate,
      notes: leadData.notes,
      tags: leadData.tags,
      contacts: Array.isArray((leadData as any).contacts)
        ? (leadData as any).contacts.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            isPrincipal: !!c.isPrincipal,
          }))
        : undefined,
    }

    try {
      const created = await leadsApi.createLead(payload)
      console.log("[v0] Lead created via API:", created)
      const convertedLead: Lead = {
        ...created,
        source: created.source || '',
        assignedTo: created.assignedTo ? {
          ...created.assignedTo,
          avatar: created.assignedTo.avatar || ''
        } : undefined,
        people: (created.people || []).map(person => ({
          ...person,
          avatar: person.avatar || ''
        })),
        statusHistory: created.statusHistory?.map(history => ({
          status: history.status,
          timestamp: history.changedAt
        })),
        interactions: created.interactions?.map(interaction => ({
          ...interaction,
          description: interaction.notes,
          createdBy: interaction.user
        }))
      }
      setLeads((prev) => [...prev, convertedLead])
      toast({
        title: "Lead criado com sucesso!",
        description: `O lead "${created.title}" foi adicionado ao pipeline.`,
      })
    } catch (err) {
      console.error("[v0] Failed to create lead via API:", err)
      toast({
        title: "Erro ao criar lead",
        description: "Não foi possível salvar o lead no servidor.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      await leadsApi.deleteLead(leadId)
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId))
      setItemToDelete(null)
      toast({
        title: "Lead excluído",
        description: "O lead foi removido com sucesso",
      })
    } catch (err) {
      console.error("[v0] Failed to delete lead via API:", err)
      toast({
        title: "Erro ao excluir lead",
        description: "Não foi possível remover o lead no servidor.",
        variant: "destructive",
      })
      throw err
    }
  }

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        // Limit to 100 leads
        if (newSet.size < 100) {
          newSet.add(leadId)
        } else {
          toast({
            title: "Limite atingido",
            description: "Você pode selecionar no máximo 100 leads por vez",
            variant: "destructive",
          })
        }
      }
      return newSet
    })
  }

  const handleBulkDelete = () => {
    // Fechar modais/abertos antes de operações críticas para evitar erro de reconciliação
    setShowBulkTransferDialog(false)
    setShowBulkDeleteDialog(false)
    setShowFilterPopover(false)
    setShowExportDialog(false)
    setItemToDelete(null)

    const count = selectedLeads.size
    setLeads((prev) => prev.filter((lead) => !selectedLeads.has(lead.id)))
    setSelectedLeads(new Set())
    toast({
      title: "Leads excluídos",
      description: `${count} leads foram removidos com sucesso`,
    })
  }

  const handleBulkTransfer = () => {
    if (!bulkTransferTargetStage) {
      toast({
        title: "Selecione uma etapa",
        description: "Escolha a etapa de destino para transferir os leads",
        variant: "destructive",
      })
      return
    }

    const count = selectedLeads.size
    const now = new Date().toISOString()

    setLeads((prev) =>
      prev.map((lead) => {
        if (selectedLeads.has(lead.id)) {
          const previousStatus = lead.status
          const previousStatusEntry = lead.statusHistory?.[lead.statusHistory.length - 1]
          const duration = previousStatusEntry
            ? new Date(now).getTime() - new Date(previousStatusEntry.timestamp).getTime()
            : 0

          return {
            ...lead,
            status: bulkTransferTargetStage,
            statusHistory: [
              ...(lead.statusHistory || []),
              {
                status: bulkTransferTargetStage,
                timestamp: now,
                duration,
                previousStatus,
              },
            ],
          }
        }
        return lead
      }),
    )

    setSelectedLeads(new Set())
    setShowBulkTransferDialog(false)
    setBulkTransferTargetStage("")

    const targetColumn = currentColumns.find((col) => col.id === bulkTransferTargetStage)
    toast({
      title: "Leads transferidos",
      description: `${count} leads foram movidos para ${targetColumn?.name || "a etapa selecionada"}`,
    })
  }

  const selectAllLeadsInColumn = (columnId: string) => {
    const columnLeads = getFilteredLeads().filter((lead) => lead.status === columnId)

    const allSelected = columnLeads.every((lead) => selectedLeads.has(lead.id))

    if (allSelected) {
      // Deselect all leads in this column
      setSelectedLeads((prev) => {
        const newSet = new Set(prev)
        columnLeads.forEach((lead) => newSet.delete(lead.id))
        return newSet
      })
      return
    }

    // Select all leads in column (existing logic)
    const leadsToAdd = columnLeads.slice(0, 100 - selectedLeads.size)

    if (columnLeads.length > leadsToAdd.length) {
      toast({
        title: "Limite atingido",
        description: `Apenas ${leadsToAdd.length} leads foram selecionados devido ao limite de 100`,
        variant: "destructive",
      })
    }

    setSelectedLeads((prev) => {
      const newSet = new Set(prev)
      leadsToAdd.forEach((lead) => newSet.add(lead.id))
      return newSet
    })
  }

  const getFilteredLeads = () => {
    return applyFilters(leads)
  }

  const handleCreateTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [...prev, newTask])

    toast({
      title: "Tarefa criada",
      description: `A tarefa "${newTask.title}" foi criada.`,
    })
  }

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
              completedAt: updates.status === "completed" ? new Date().toISOString() : task.completedAt,
            }
          : task,
      ),
    )

    toast({
      title: "Tarefa atualizada",
      description: "A tarefa foi atualizada com sucesso.",
    })
  }

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))

    if (task) {
      toast({
        title: "Tarefa excluída",
        description: `A tarefa "${task.title}" foi removida.`,
      })
    }
  }

  // Função para aplicar template
  const handleApplyTemplate = (template: KanbanTemplate) => {
    // Criar novo funil a partir do template
    const newFunnel: Funnel = {
      id: `funnel-${Date.now()}`,
      name: template.name,
      description: template.description,
      category: template.category,
      icon: String(template.icon),
      columns: template.columns.map((col) => ({
        ...col,
        visible: true,
      })),
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    setFunnels((prev) => [...prev, newFunnel])
    setSelectedFunnelId(newFunnel.id)

    toast({
      title: "Novo funil criado",
      description: `O funil "${template.name}" foi criado a partir do template.`,
    })
    
    setTemplatesDialog(null)
  }

  // Função para abrir detalhes do lead
  const handleOpenLeadDetails = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId)
    if (lead) {
      setSelectedLead(lead)
      setShowLeadDetails(true)
    }
  }

  const handleUserChange = (user: any) => {
    setCurrentUser(user)
    // Optionally refresh data when user changes
    if (user) {
      toast({
        title: "Usuário alterado",
        description: `Logado como ${user.name}`,
      })
    }
  }

  const addFilterRule = () => {
    const newRule: FilterRule = {
      id: `filter_${Date.now()}`,
      field: "user",
      value: "",
    }
    setFilterRules([...filterRules, newRule])
  }

  const updateFilterRule = (id: string, field: "field" | "value", newValue: string) => {
    setFilterRules(filterRules.map((rule) => (rule.id === id ? { ...rule, [field]: newValue } : rule)))
  }

  const removeFilterRule = (id: string) => {
    setFilterRules(filterRules.filter((rule) => rule.id !== id))
  }

  const handleSaveFilter = (name: string) => {
    if (!currentUser) return
    const newFilter = addSavedFilter(name, filterRules, currentUser.companyId, currentUser.id)
    setSavedFilters([...savedFilters, newFilter])
    toast({
      title: "Filtro salvo",
      description: `O filtro "${name}" foi salvo com sucesso.`,
    })
  }

  const handleDeleteSavedFilter = (filterId: string) => {
    if (!currentUser) return
    deleteSavedFilter(filterId, currentUser.companyId)
    setSavedFilters(savedFilters.filter((f) => f.id !== filterId))
    toast({
      title: "Filtro excluído",
      description: "O filtro foi removido com sucesso.",
    })
  }

  const handleApplySavedFilter = (rules: FilterRule[]) => {
    setFilterRules(rules)
    setShowSavedFilterManager(false)
    toast({
      title: "Filtro aplicado",
      description: "O filtro foi aplicado com sucesso.",
    })
  }

  const executeMove = async (draggableId: string, destinationId: string, sourceId: string, startActionId?: string) => {
    const lead = leads.find((l) => l.id === draggableId)
    if (!lead) return

    // Atualizar status e histórico
    updateLeadStatusHistory(draggableId, destinationId)

    // Persistir mudança de status no backend
    try {
      const updated = await leadsApi.updateStatus(draggableId, { status: destinationId })
      // Atualiza estado local com retorno da API
      setLeads((prev) => prev.map((l) => (l.id === draggableId ? { ...l, status: updated.status } : l)))

      // Registrar interação de movimentação de fase
      const fromColumn = currentColumns.find((col) => col.id === sourceId)
      const toColumn = currentColumns.find((col) => col.id === destinationId)
      const now = new Date().toISOString()
      const notes =
        fromColumn && toColumn
          ? `Transferência de fase: ${fromColumn.name} → ${toColumn.name}`
          : `Transferência de fase para ${destinationId}`
      void leadsApi.addInteraction(draggableId, { type: "note", date: now, notes })
    } catch (err) {
      console.error("[v0] Falha ao persistir status do lead", err)
      toast({
        title: "Falha ao atualizar",
        description: "Não foi possível salvar a mudança de fase no servidor.",
      })
    }

    // Executar automações se houver
    const automation = automations.find(
      (auto) => auto.columnId === destinationId && auto.active && auto.trigger === "on_enter",
    )
    if (automation) {
      const delayMin = automation.delay || 0
      const run = async () => {
        await runStageFlow(automation, lead, startActionId)
      }

      if (delayMin > 0) {
        setTimeout(() => {
          void run()
        }, delayMin * 60 * 1000)
      } else {
        await run()
      }

      toast({
        title: "Automação executada",
        description: `Automação "${automation.name}" foi executada para o lead "${lead.title}".`,
      })
    } else {
      // Clear current action if no automation in new stage
      setLeads((prev) => prev.map((l) => (l.id === draggableId ? { ...l, currentActionId: undefined } : l)))
      try {
        const stored = JSON.parse(localStorage.getItem("lead_current_actions") || "{}")
        if (stored[draggableId]) {
          delete stored[draggableId]
          localStorage.setItem("lead_current_actions", JSON.stringify(stored))
        }
        void leadsApi.updateLead(draggableId, { currentActionId: "" })
      } catch (e) {}
    }

    // Toast de movimentação
    const fromColumn = currentColumns.find((col) => col.id === sourceId)
    const toColumn = currentColumns.find((col) => col.id === destinationId)

    if (fromColumn && toColumn) {
      toast({
        title: "Lead movimentado",
        description: `"${lead.title}" foi movido de "${fromColumn.name}" para "${toColumn.name}".`,
      })
    }
  }

  const handleMoveLead = executeMove

  // Manipular o arrastar e soltar
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const lead = leads.find((l) => l.id === draggableId)
    if (!lead) return

    // Check for automation actions in destination
    const automation = automations.find(
      (a) => a.columnId === destination.droppableId && a.active && a.trigger === "on_enter",
    )

    if (automation) {
      const actions = normalizeStageActions(automation.actions)
      const enabledActions = actions.filter((a: any) => a.enabled !== false)

      if (enabledActions.length > 1) {
        // Optimistic update to UI so card doesn't snap back
        setLeads((prev) => prev.map((l) => (l.id === draggableId ? { ...l, status: destination.droppableId } : l)))

        setPendingMove({
          draggableId,
          destinationId: destination.droppableId,
          sourceId: source.droppableId,
          actions: enabledActions,
        })
        return
      }
    }

    await executeMove(draggableId, destination.droppableId, source.droppableId)
  }

  // Contar tarefas por lead
  const getLeadTaskCount = (leadId: string) => {
    return tasks.filter((task) => task.leadId === leadId && task.status !== "completed").length
  }

  const applyFilters = (leads: Lead[]) => {
    let filtered = leads

    console.log("[v0] Filtering leads with rules:", filterRules)
    console.log("[v0] Total leads before filtering:", leads.length)

    filterRules.forEach((rule) => {
      if (!rule.value) return

      switch (rule.field) {
        case "user":
          filtered = filtered.filter((lead) => lead.assignedTo?.id === rule.value)
          console.log("[v0] After user filter:", filtered.length)
          break
        case "tag":
          filtered = filtered.filter((lead) => {
            const hasTag = lead.tags && Array.isArray(lead.tags) && lead.tags.includes(rule.value)
            console.log("[v0] Lead:", lead.title, "Tags:", lead.tags, "Looking for:", rule.value, "Has tag:", hasTag)
            return hasTag
          })
          console.log("[v0] After tag filter:", filtered.length)
          break
        case "priority":
          filtered = filtered.filter((lead) => lead.priority === rule.value)
          console.log("[v0] After priority filter:", filtered.length)
          break
        case "source":
          filtered = filtered.filter((lead) => {
            const normalizeSource = (str: string) =>
              str
                .toLowerCase()
                .replace(/[_\s-]/g, "")
                .trim()

            const leadSource = normalizeSource(lead.source || "")
            const filterSource = normalizeSource(rule.value || "")

            const matches = leadSource.includes(filterSource)

            console.log(
              "[v0] Lead:",
              lead.title,
              "Source:",
              `"${lead.source}"`,
              "Normalized:",
              `"${leadSource}"`,
              "Filter:",
              `"${rule.value}"`,
              "Normalized:",
              `"${filterSource}"`,
              "Matches:",
              matches,
            )

            return matches
          })
          console.log("[v0] After source filter:", filtered.length)
          break
      }
    })

    console.log("[v0] Filtered leads count:", filtered.length)
    return filtered
  }

  const clearFilters = () => {
    setFilterRules([])
    setShowFilterPopover(false)
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos",
    })
  }

  const hasActiveFilters = filterRules.some((rule) => rule.value !== "")

  const availableSources = useMemo(() => {
    const predefinedSources = [
      "Website",
      "Google Ads",
      "Facebook Ads",
      "LinkedIn",
      "Indicação",
      "Telefone",
      "E-mail",
      "Evento",
      "Outros",
    ]

    // Get unique sources from existing leads
    const leadSources = [...new Set(leads.map((lead) => lead.source).filter(Boolean))]

    // Combine and deduplicate
    const allSources = [...new Set([...predefinedSources, ...leadSources])]

    return allSources.sort()
  }, [leads])

  const handleExportToExcel = (filterType: string, filterValue: string) => {
    try {
      // Dynamically import xlsx library
      import("xlsx").then((XLSX) => {
        const wb = XLSX.utils.book_new()

        let filteredLeads = leads
        let exportTitle = selectedFunnel?.name || "Pipeline"

        if (filterType === "user" && filterValue) {
          filteredLeads = leads.filter((lead) => lead.assignedTo?.id === filterValue)
          const user = availableUsers.find((u) => u.id === filterValue)
          exportTitle += ` - ${user?.name || "Usuário"}`
        } else if (filterType === "tag" && filterValue) {
          filteredLeads = leads.filter((lead) => lead.tags && lead.tags.includes(filterValue))
          const tag = availableTags.find((t) => t.id === filterValue)
          exportTitle += ` - Tag ${tag?.name || ""}`
        } else if (filterType === "stage" && filterValue) {
          filteredLeads = leads.filter((lead) => lead.status === filterValue)
          const stage = currentColumns.find((c) => c.id === filterValue)
          exportTitle += ` - ${stage?.name || "Etapa"}`
        }

        // Sheet 1: Leads por Etapa
        const leadsData: any[] = []
        leadsData.push([
          "Etapa",
          "Nome do Lead",
          "Cliente",
          "Email",
          "Telefone",
          "Responsável",
          "Prioridade",
          "Valor Estimado",
          "Data Esperada",
          "Origem",
          "Tags",
          "Data de Criação",
        ])

        currentColumns.forEach((column) => {
          const columnLeads = filteredLeads.filter((lead) => lead.status === column.id)
          columnLeads.forEach((lead) => {
            const leadTags = lead.tags
              ? availableTags
                  .filter((tag) => lead.tags?.includes(tag.id))
                  .map((t) => t.name)
                  .join(", ")
              : ""
            leadsData.push([
              column.name,
              lead.title,
              lead.client,
              lead.clientEmail || "",
              lead.clientPhone || "",
              lead.assignedTo?.name || "",
              lead.priority === "urgent"
                ? "Urgente"
                : lead.priority === "high"
                  ? "Alta"
                  : lead.priority === "medium"
                    ? "Média"
                    : lead.priority === "low"
                      ? "Baixa"
                      : "",
              lead.estimatedValue || 0,
              lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString("pt-BR") : "",
              lead.source,
              leadTags,
              new Date(lead.createdAt).toLocaleDateString("pt-BR"),
            ])
          })
        })

        const ws1 = XLSX.utils.aoa_to_sheet(leadsData)
        ws1["!cols"] = [
          { wch: 15 },
          { wch: 25 },
          { wch: 25 },
          { wch: 30 },
          { wch: 15 },
          { wch: 20 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 30 },
          { wch: 15 },
        ]
        XLSX.utils.book_append_sheet(wb, ws1, "Leads por Etapa")

        // Sheet 2: Estatísticas do Funil
        const statsData: any[] = []
        statsData.push(["Estatísticas do Funil - " + exportTitle])
        statsData.push([])
        statsData.push(["Etapa", "Quantidade de Leads", "Valor Total (R$)", "Valor Médio (R$)"])

        currentColumns.forEach((column) => {
          const columnLeads = filteredLeads.filter((lead) => lead.status === column.id)
          const totalValue = columnLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
          const avgValue = columnLeads.length > 0 ? totalValue / columnLeads.length : 0

          statsData.push([column.name, columnLeads.length, totalValue, avgValue.toFixed(2)])
        })

        statsData.push([])
        statsData.push([
          "Total Geral",
          filteredLeads.length,
          filteredLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
          "",
        ])

        const ws2 = XLSX.utils.aoa_to_sheet(statsData)
        ws2["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(wb, ws2, "Estatísticas")

        // Sheet 3: Resumo por Responsável
        const userStats: any[] = []
        userStats.push(["Resumo por Responsável"])
        userStats.push([])
        userStats.push(["Responsável", "Quantidade de Leads", "Valor Total (R$)"])

        const userMap = new Map<string, { count: number; value: number }>()
        filteredLeads.forEach((lead) => {
          const userName = lead.assignedTo?.name || "Sem responsável"
          const current = userMap.get(userName) || { count: 0, value: 0 }
          userMap.set(userName, {
            count: current.count + 1,
            value: current.value + (lead.estimatedValue || 0),
          })
        })

        userMap.forEach((stats, userName) => {
          userStats.push([userName, stats.count, stats.value])
        })

        const ws3 = XLSX.utils.aoa_to_sheet(userStats)
        ws3["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(wb, ws3, "Por Responsável")

        // Generate file
        const fileName = `Relatorio_${exportTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`
        XLSX.writeFile(wb, fileName)

        toast({
          title: "Relatório exportado",
          description: `O arquivo ${fileName} foi baixado com sucesso.`,
        })

        setShowExportDialog(false)
      })
    } catch (error) {
      console.error("[v0] Error exporting to Excel:", error)
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao gerar o arquivo Excel.",
        variant: "destructive",
      })
    }
  }

  

  if (funnels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎯</div>
          <h2 className="text-2xl font-bold">Bem-vindo ao seu Pipeline de Leads!</h2>
          <p className="text-muted-foreground max-w-md">
            Comece criando seu primeiro funil de vendas para organizar e gerenciar seus leads de forma eficiente.
          </p>
          <Button onClick={() => setShowFunnelManager(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Funil
          </Button>
        </div>
      </div>
    )
  }

  if (showTaskCenter) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Central de Tarefas</h1>
          <Button variant="outline" onClick={() => setShowTaskCenter(false)}>
            Voltar ao Pipeline
          </Button>
        </div>

        <TaskCenter
          tasks={tasks}
          projects={leads.map((l) => ({
            id: l.id,
            title: l.title,
            client: l.client,
            status: l.status,
          }))}
          onUpdateTask={handleUpdateTask as any}
          onCreateTask={handleCreateTask as any}
          onDeleteTask={handleDeleteTask as any}
        />
      </div>
    )
  }

  if (showHistory) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Histórico de Movimentação</h1>
          <Button variant="outline" onClick={() => setShowHistory(false)}>
            Voltar ao Pipeline
          </Button>
        </div>

        <LeadsHistoryDashboard
          leads={leads.map((l) => ({
            id: l.id,
            name: l.client,
            company: l.title,
            status: l.status,
            priority: l.priority as "low" | "medium" | "high" | "urgent",
            source: l.source,
            estimatedValue: l.estimatedValue || 0,
            expectedCloseDate: l.expectedCloseDate || "",
            createdAt: l.createdAt,
            statusHistory: l.statusHistory,
          })) as any}
          columns={currentColumns}
          period={historyPeriod}
          onPeriodChange={setHistoryPeriod}
        />
      </div>
    )
  }

  if (showUserManagement) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowUserManagement(false)}>
            Voltar ao Pipeline
          </Button>
        </div>
        <UserManagement onUserChange={handleUserChange} />
      </div>
    )
  }

  if (showTagManager) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gerenciamento de Tags</h1>
          <Button variant="outline" onClick={() => setShowTagManager(false)}>
            Voltar ao Pipeline
          </Button>
        </div>
        <TagManager open={showTagManager} onClose={() => setShowTagManager(false)} />
      </div>
    )
  }

  if (showQueueManagement) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestão de Filas</h1>
          <Button variant="outline" onClick={() => setShowQueueManagement(false)}>
            Voltar ao Pipeline
          </Button>
        </div>
        <QueueManagement />
      </div>
    )
  }

  // Added condition for showLandingPages
  if (showLandingPages) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <Button variant="outline" onClick={() => setShowLandingPages(false)}>
            Voltar ao Pipeline
          </Button>
        </div>
        <LandingPagesDashboard />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Pipeline de Leads</h1>

          {/* Seletor de Funil */}
          <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar funil" />
            </SelectTrigger>
            <SelectContent>
              {funnels
                .filter((f) => f.isActive)
                .map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(pausedManualByLeadId).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManualActionsQueue(true)}
              className="bg-transparent gap-2"
            >
              <Pause className="h-4 w-4" />
              Ações Manuais
              <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {Object.keys(pausedManualByLeadId).length}
              </Badge>
            </Button>
          )}
          {selectedLeads.size > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLeads(new Set())} className="gap-2">
                <X className="h-4 w-4" />
                Desmarcar todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkTransferDialog(true)}
                className="gap-2 bg-transparent"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transferir {selectedLeads.size}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir {selectedLeads.size}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowLeadCenter(true)} className="bg-transparent">
            <LayoutList className="h-4 w-4 mr-2" />
            Central de Leads
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="bg-transparent">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar
          </Button>

          <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative bg-transparent">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600">
                    {filterRules.filter((r) => r.value).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px]" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Filtros</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar tudo
                    </Button>
                  )}
                </div>

                {filterRules.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum filtro adicionado</p>
                    <p className="text-xs mt-1">Clique em "Adicionar Filtro" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filterRules.map((rule, index) => (
                      <div key={rule.id} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1 space-y-2">
                          <Select
                            value={rule.field}
                            onValueChange={(value) => updateFilterRule(rule.id, "field", value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Usuário Responsável
                                </div>
                              </SelectItem>
                              <SelectItem value="tag">
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  Tag
                                </div>
                              </SelectItem>
                              <SelectItem value="priority">
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4" />
                                  Prioridade
                                </div>
                              </SelectItem>
                              <SelectItem value="source">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Origem
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={rule.value}
                            onValueChange={(value) => updateFilterRule(rule.id, "value", value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione um valor..." />
                            </SelectTrigger>
                            <SelectContent>
                              {rule.field === "user" && (
                                <>
                                  {availableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              {rule.field === "tag" && (
                                <>
                                  {availableTags.map((tag) => (
                                    <SelectItem key={tag.id} value={tag.id}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                        {tag.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              {rule.field === "priority" && (
                                <>
                                  <SelectItem value="urgent">Urgente</SelectItem>
                                  <SelectItem value="high">Alta</SelectItem>
                                  <SelectItem value="medium">Média</SelectItem>
                                  <SelectItem value="low">Baixa</SelectItem>
                                </>
                              )}
                              {rule.field === "source" && (
                                <>
                                  {availableSources.map((source) => (
                                    <SelectItem key={source} value={source}>
                                      {source}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilterRule(rule.id)}
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={addFilterRule} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Filtro
                </Button>

                {/* Added SavedFilterManager component and related buttons */}
                <Button onClick={() => setShowSavedFilterManager(true)} variant="outline" className="w-full">
                  <Layers className="h-4 w-4 mr-2" />
                  Gerenciar Filtros Salvos
                </Button>

                {hasActiveFilters && (
                  <div className="pt-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando <span className="font-semibold text-foreground">{applyFilters(leads).length}</span> de{" "}
                      <span className="font-semibold text-foreground">{leads.length}</span> leads
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Dropdown menu for actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowHistory(true)}>
                <History className="h-4 w-4 mr-2" />
                Histórico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFunnelManager(true)}>
                <Layers className="h-4 w-4 mr-2" />
                Funis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTagManager(true)}>
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowQueueManagement(true)}>
                <Users className="h-4 w-4 mr-2" />
                Filas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLandingPages(true)}>
                <Layers className="h-4 w-4 mr-2" />
                Landing Pages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportLeads(true)}>
                <Download className="h-4 w-4 mr-2" />
                Importar Leads
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setMassActionLogsJobId(null)
                  setShowMassAction(true)
                }}
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Ação em Massa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setMassActionLogsJobId(null)
                  setShowMassActionLogs(true)
                }}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Logs de Disparo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowAutomations(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Automações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTemplatesDialog("hub")}>
                <Download className="h-4 w-4 mr-2" />
                Templates
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (checkPermissionWithToast("usuarios", "Gerenciamento de Usuários")) {
                    setShowUserManagement(true)
                  }
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowCreateLead(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Filter className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-900 font-medium">Filtros ativos:</span>
          <div className="flex flex-wrap gap-2">
            {filterRules
              .filter((r) => r.value)
              .map((rule) => {
                let displayValue = rule.value
                if (rule.field === "user") {
                  displayValue = availableUsers.find((u) => u.id === rule.value)?.name || rule.value
                } else if (rule.field === "tag") {
                  displayValue = availableTags.find((t) => t.id === rule.value)?.name || rule.value
                } else if (rule.field === "priority") {
                  const priorityMap: Record<string, string> = {
                    urgent: "Urgente",
                    high: "Alta",
                    medium: "Média",
                    low: "Baixa",
                  }
                  displayValue = priorityMap[rule.value] || rule.value
                }

                const fieldMap: Record<string, string> = {
                  user: "Usuário",
                  tag: "Tag",
                  priority: "Prioridade",
                  source: "Origem",
                }

                return (
                  <Badge key={rule.id} variant="secondary" className="bg-blue-100 text-blue-800">
                    {fieldMap[rule.field]}: {displayValue}
                  </Badge>
                )
              })}
          </div>
          <span className="text-sm text-blue-700 ml-auto">
            ({applyFilters(leads).length} de {leads.length} leads)
          </span>
        </div>
      )}

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {currentColumns.map((column) => {
          const filteredLeads = applyFilters(leads)
          const count = filteredLeads.filter((lead) => lead.status === column.id).length
          const totalValue = filteredLeads
            .filter((lead) => lead.status === column.id)
            .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)

          return (
            <Card key={column.id}>
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: column.color }} />
                  <p className="text-sm font-medium">{column.name}</p>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">R$ {totalValue.toLocaleString("pt-BR")}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className="grid grid-cols-1 gap-4"
          style={{ gridTemplateColumns: `repeat(${currentColumns.length}, minmax(0, 1fr))` }}
        >
          {currentColumns
            .sort((a, b) => a.order - b.order)
            .map((column) => {
              const filteredLeads = applyFilters(leads)
              const columnLeads = filteredLeads.filter((lead) => lead.status === column.id)
              const hasAutomation = hasColumnAutomation(column.id)

              return (
                <div key={column.id} className="bg-white rounded-lg shadow flex flex-col h-full">
                  <div
                    className="p-4 rounded-t-lg relative flex-shrink-0"
                    style={{ backgroundColor: `${column.color}20`, borderTop: `3px solid ${column.color}` }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate" style={{ color: column.color }}>
                            {column.name}
                          </h3>
                          {hasAutomation && (
                            <div className="flex-shrink-0">
                              <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 block mt-1">{columnLeads.length} leads</span>
                      </div>
                      {/* Added select all button to column header */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {columnLeads.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectAllLeadsInColumn(column.id)}
                            className="h-6 px-2 text-xs"
                            title="Selecionar todos"
                          >
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateLead(true)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="p-2 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto flex-1"
                      >
                        {columnLeads.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <div className="text-4xl mb-2">📋</div>
                            <p className="text-sm">Nenhum lead nesta etapa</p>
                            <Button variant="ghost" size="sm" onClick={() => setShowCreateLead(true)} className="mt-2">
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Lead
                            </Button>
                          </div>
                        ) : (
                          columnLeads.map((lead, index) => {
                            let currentActionName: string | undefined
                            if (lead.currentActionId) {
                              const automation = automations.find((a) => a.columnId === column.id && a.active)
                              if (automation) {
                                const actions = normalizeStageActions(automation.actions)
                                const action = actions.find((a: any) => a.id === lead.currentActionId)
                                if (action) {
                                  currentActionName = action.customName || action.title || action.type
                                }
                              }
                            }
                            return (
                              <LeadCard
                                key={lead.id}
                                lead={lead}
                                index={index}
                                onClick={() => handleOpenLeadDetails(lead.id)}
                                onDelete={() => setItemToDelete(lead)}
                                taskCount={getLeadTaskCount(lead.id)}
                                isSelected={selectedLeads.has(lead.id)}
                                onToggleSelect={() => toggleLeadSelection(lead.id)}
                                availableTags={availableTags}
                                currentActionName={currentActionName}
                              />
                            )
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
        </div>
      </DragDropContext>

      {/* Modais */}
      {showCreateLead && (
        <CreateLeadDialog
          open={showCreateLead}
          people={people}
          columns={currentColumns}
          onClose={() => setShowCreateLead(false)}
          onCreate={handleCreateLead}
        />
      )}

      {showImportLeads && (
        <ImportLeadsDialog
          open={showImportLeads}
          onClose={() => setShowImportLeads(false)}
          onImport={handleImportLeads}
          columns={currentColumns}
          funnels={funnels}
        />
      )}

      <MassActionAssistantDialog
        open={showMassAction}
        onOpenChange={setShowMassAction}
        initialFunnelId={selectedFunnelId}
        funnels={funnels.map(f => ({ ...f, columns: f.columns.map(c => ({ ...c, title: c.name })) }))}
        availableTags={availableTags}
        onOpenTemplates={() => setTemplatesDialog("messages")}
        onOpenLogs={(jobId) => {
          setMassActionLogsJobId(jobId || null)
          setShowMassActionLogs(true)
        }}
      />

      <MassActionLogsDialog
        open={showMassActionLogs}
        onOpenChange={setShowMassActionLogs}
        initialJobId={massActionLogsJobId}
      />

      {/* Modal de confirmação de exclusão */}
      {actionSelectionDialog && (
        <Dialog open={actionSelectionDialog.isOpen} onOpenChange={(open) => {
          if (!open) {
            // Revert optimistic update
            setLeads((prev) => prev.map((l) => (l.id === actionSelectionDialog.leadId ? { ...l, status: actionSelectionDialog.sourceColumnId } : l)))
            setActionSelectionDialog(null)
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Escolha a ação inicial</DialogTitle>
              <DialogDescription>
                Esta etapa tem múltiplas ações. Onde o lead deve entrar?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="grid gap-2">
                {actionSelectionDialog.actions.map((action, idx) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 px-4"
                    onClick={() => {
                      handleMoveLead(
                        actionSelectionDialog.leadId,
                        actionSelectionDialog.targetColumnId,
                        actionSelectionDialog.sourceColumnId,
                        action.id
                      )
                      setActionSelectionDialog(null)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                         {getAutomationIcon(action.type)}
                      </div>
                      <div>
                        <div className="font-medium">{action.customName || action.title || `Ação ${idx + 1}`}</div>
                        <div className="text-xs text-muted-foreground capitalize">{action.type}</div>
                      </div>
                    </div>
                  </Button>
                ))}
               </div>
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => {
                 setLeads((prev) => prev.map((l) => (l.id === actionSelectionDialog.leadId ? { ...l, status: actionSelectionDialog.sourceColumnId } : l)))
                 setActionSelectionDialog(null)
               }}>
                 Cancelar
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {itemToDelete && (
        <Dialog open={true} onOpenChange={() => setItemToDelete(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Tem certeza que deseja excluir o lead <strong>"{itemToDelete.title}"</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Esta ação também removerá todas as tarefas relacionadas e não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setItemToDelete(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteLead(itemToDelete.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Lead
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de seleção de ação inicial */}
      <ActionSelectionDialog
        open={!!pendingMove}
        onOpenChange={(open) => {
          if (!open && pendingMove) {
            // Revert optimistic update on close without selection
            setLeads((prev) =>
              prev.map((l) => (l.id === pendingMove.draggableId ? { ...l, status: pendingMove.sourceId } : l)),
            )
            setPendingMove(null)
          }
        }}
        actions={pendingMove?.actions || []}
        onSelect={(actionId) => {
          if (pendingMove) {
            void executeMove(pendingMove.draggableId, pendingMove.destinationId, pendingMove.sourceId, actionId)
            setPendingMove(null)
          }
        }}
        onCancel={() => {
          if (pendingMove) {
            // Revert optimistic update
            setLeads((prev) =>
              prev.map((l) => (l.id === pendingMove.draggableId ? { ...l, status: pendingMove.sourceId } : l)),
            )
            setPendingMove(null)
          }
        }}
      />

      {/* Modal de detalhes do lead */}
      {showLeadDetails && (
        <LeadDetailsDialog
          lead={selectedLead}
          open={showLeadDetails}
          onClose={() => {
            setShowLeadDetails(false)
            setSelectedLead(null)
          }}
          onUpdate={async (leadId, updates) => {
            // Garante que o funnelId corresponda ao funil atual, já que o status selecionado pertence a este funil
            const finalUpdates = { ...updates, funnelId: selectedFunnelId }

            // Atualiza a lista geral de leads (otimista)
            setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...finalUpdates } : l)))

            // Mantém o modal em sincronia com as mudanças imediatas
            setSelectedLead((prev) => (prev && prev.id === leadId ? { ...prev, ...finalUpdates } : prev))

            try {
              await leadsApi.updateLead(leadId, finalUpdates as any)
              toast({
                title: "Lead atualizado",
                description: "As informações do lead foram atualizadas com sucesso.",
              })
            } catch (error) {
              console.error("Failed to update lead", error)
              toast({
                title: "Erro ao atualizar",
                description: "Não foi possível salvar as alterações no servidor.",
                variant: "destructive",
              })
              // Opcional: Reverter estado aqui se necessário
            }
          }}
          onDelete={(leadId) => {
            handleDeleteLead(leadId)
            setShowLeadDetails(false)
            setSelectedLead(null)
          }}
          columns={currentColumns}
        />
      )}

      {/* Modal do Gerenciador de Funis */}
      {showFunnelManager && (
        <FunnelManager
          funnels={funnels}
          checkHasLeads={async (funnelId) => {
            try {
              const funnelLeads = await leadsApi.getLeads({ funnelId })
              return funnelLeads.length > 0
            } catch (error) {
              console.error("Failed to check leads for funnel", funnelId, error)
              return false // Fail safe? Or throw? Better to assume true to prevent deletion on error?
              // But if we assume true, user can't delete if API fails.
              // Let's assume false (allow deletion) but log error, or maybe rethrow so the component handles it.
              // FunnelManager handles error by showing toast. So I should rethrow.
              throw error
            }
          }}
          onSave={async (newFunnels) => {
            setFunnels(newFunnels)

            try {
              const latest = await automationsApi.getAutomations()
              setAutomations(latest as any)
            } catch {}

            // Se o funil selecionado foi removido, selecionar o primeiro ativo
            if (!newFunnels.find((f) => f.id === selectedFunnelId && f.isActive)) {
              const firstActiveFunnel = newFunnels.find((f) => f.isActive)
              if (firstActiveFunnel) {
                setSelectedFunnelId(firstActiveFunnel.id)
              }
            }

            setShowFunnelManager(false)
            toast({
              title: "Funis atualizados",
              description: "As configurações dos funis foram salvas com sucesso.",
            })
          }}
          onClose={() => setShowFunnelManager(false)}
        />
      )}

      {/* Outros modais existentes */}
      {showSettings && (
        <KanbanSettings
          config={{
            columns: currentColumns,
            customFields: [],
          }}
          onSave={(newConfig) => {
            if (selectedFunnel) {
              const updatedFunnel = {
                ...selectedFunnel,
                columns: newConfig.columns,
              }
              setFunnels((prev) => prev.map((f) => (f.id === selectedFunnelId ? updatedFunnel : f)))
            }
            setShowSettings(false)
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {templatesDialog === "hub" && (
        <TemplatesHubDialog
          onClose={() => setTemplatesDialog(null)}
          onChoose={(choice) => setTemplatesDialog(choice === "funnel" ? "funnel" : "messages")}
        />
      )}

      {templatesDialog === "funnel" && (
        <KanbanTemplates onApplyTemplate={handleApplyTemplate} onClose={() => setTemplatesDialog(null)} />
      )}

      {templatesDialog === "messages" && (
        <MessageTemplatesManager open={true} onClose={() => setTemplatesDialog(null)} />
      )}

      {showAutomations && (
        <KanbanAutomations
          columns={currentColumns}
          automations={automations}
          onSave={async (newAutomations) => {
            try {
              // Upsert via API
              for (const a of newAutomations) {
                const payload = {
                  name: a.name,
                  columnId: a.columnId,
                  trigger: a.trigger as any,
                  actions: a.actions as any,
                  active: a.active,
                  delay: a.delay,
                }
                if (a.id) {
                  await automationsApi.updateAutomation(a.id, payload)
                } else {
                  const created = await automationsApi.createAutomation(payload)
                  a.id = created.id
                }
              }
              const latest = await automationsApi.getAutomations()
              setAutomations(latest as any)
            } catch (e) {
              console.error("[v0] Falha ao salvar automações via API", e)
            }
            setShowAutomations(false)
          }}
          onClose={() => setShowAutomations(false)}
        />
      )}

      <Dialog open={showManualActionsQueue} onOpenChange={setShowManualActionsQueue}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ações manuais pendentes</DialogTitle>
            <DialogDescription>Leads que foram pausados em uma ação manual dentro da etapa.</DialogDescription>
          </DialogHeader>

          {Object.keys(pausedManualByLeadId).length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum lead aguardando ação manual.</div>
          ) : (
            <div className="space-y-2">
              {Object.values(pausedManualByLeadId).map((p) => {
                const lead = leads.find((l) => l.id === p.leadId)
                const automation = automations.find((a) => a.id === p.automationId)
                const action = automation ? normalizeStageActions(automation.actions).find((a: any) => a.id === p.actionId) : null
                return (
                  <div key={p.leadId} className="flex items-center justify-between gap-2 p-3 border rounded-lg">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{lead?.title || p.leadId}</div>
                      <div className="text-xs text-muted-foreground">Ação: {action?.type || "manual"}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveManualLeadId(p.leadId)
                        setShowManualActionsQueue(false)
                      }}
                    >
                      Abrir
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualActionsQueue(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeManualLeadId} onOpenChange={(open) => !open && setActiveManualLeadId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolver ação manual</DialogTitle>
            <DialogDescription>Executar, ignorar e/ou retomar o fluxo automático.</DialogDescription>
          </DialogHeader>

          {(() => {
            if (!activeManualLeadId) return null
            const pauseState = pausedManualByLeadId[activeManualLeadId]
            const lead = pauseState ? leads.find((l) => l.id === pauseState.leadId) : null
            const automation = pauseState ? automations.find((a) => a.id === pauseState.automationId) : null
            const normalized = automation ? normalizeStageActions(automation.actions) : []
            const pausedAction = pauseState ? normalized.find((a: any) => a.id === pauseState.actionId) : null
            const autoActions = normalized.filter((a: any) => a.enabled && (a.mode || "automatic") === "automatic" && a.type !== "manual")
            return (
              <div className="space-y-4">
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="text-sm font-medium">Lead</div>
                  <div className="text-sm">{lead?.title || activeManualLeadId}</div>
                  <div className="text-xs text-muted-foreground mt-1">Ação manual: {pausedAction?.type || "manual"}</div>
                </div>

                <div className="space-y-2">
                  <Label>Retomar em</Label>
                  <Select value={manualResumeTarget} onValueChange={setManualResumeTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um destino..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Parar aqui (sem novas automações)</SelectItem>
                      {autoActions.map((a: any) => (
                        <SelectItem key={a.id} value={`action:${a.id}`}>
                          Ação automática: {a.type}
                        </SelectItem>
                      ))}
                      {currentColumns.map((c) => (
                        <SelectItem key={c.id} value={`stage:${c.id}`}>
                          Etapa do funil: {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )
          })()}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActiveManualLeadId(null)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => void resolveManualAction("ignore")}>Ignorar</Button>
            <Button onClick={() => void resolveManualAction("execute")}>Executar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo de Exportação</Label>
              <RadioGroup
                value={exportFilterType}
                onValueChange={(value: any) => {
                  setExportFilterType(value)
                  setExportFilterValue("")
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="complete" id="complete" />
                  <Label htmlFor="complete" className="font-normal cursor-pointer">
                    Funil Completo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user" className="font-normal cursor-pointer">
                    Leads por Usuário
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tag" id="tag" />
                  <Label htmlFor="tag" className="font-normal cursor-pointer">
                    Leads por Tag
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stage" id="stage" />
                  <Label htmlFor="stage" className="font-normal cursor-pointer">
                    Leads por Etapa
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {exportFilterType === "user" && (
              <div className="space-y-2">
                <Label>Selecionar Usuário</Label>
                <Select value={exportFilterValue} onValueChange={setExportFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um usuário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {exportFilterType === "tag" && (
              <div className="space-y-2">
                <Label>Selecionar Tag</Label>
                <Select value={exportFilterValue} onValueChange={setExportFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {exportFilterType === "stage" && (
              <div className="space-y-2">
                <Label>Selecionar Etapa</Label>
                <Select value={exportFilterValue} onValueChange={setExportFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma etapa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentColumns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                          {column.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleExportToExcel(exportFilterType, exportFilterValue)}
                disabled={exportFilterType !== "complete" && !exportFilterValue}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SavedFilterManager
        open={showSavedFilterManager}
        onClose={() => setShowSavedFilterManager(false)}
        savedFilters={savedFilters}
        currentFilterRules={filterRules}
        onSaveFilter={handleSaveFilter}
        onDeleteFilter={handleDeleteSavedFilter}
        onApplyFilter={handleApplySavedFilter}
        getFieldLabel={(field) => {
          switch (field) {
            case "user":
              return "Usuário"
            case "tag":
              return "Tag"
            case "priority":
              return "Prioridade"
            case "source":
              return "Origem"
            default:
              return field
          }
        }}
        getValueLabel={(field, value) => {
          if (field === "user") {
            const user = availableUsers.find((u) => u.id === value)
            return user?.name || value
          }
          if (field === "tag") {
            const tag = availableTags.find((t) => t.id === value)
            return tag?.name || value
          }
          return value
        }}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedLeads.size} leads. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Excluir {selectedLeads.size} leads
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Transfer Dialog */}
      <Dialog open={showBulkTransferDialog} onOpenChange={setShowBulkTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir leads em massa</DialogTitle>
            <DialogDescription>
              Selecione a etapa de destino para mover {selectedLeads.size} leads selecionados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Etapa de destino</label>
              <Select value={bulkTransferTargetStage} onValueChange={setBulkTransferTargetStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  {currentColumns
                    .filter((col) => col.visible !== false)
                    .map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                          {column.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkTransferDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkTransfer}>Transferir {selectedLeads.size} leads</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showLeadCenter && (
        <LeadCenterDialog
          open={showLeadCenter}
          onOpenChange={setShowLeadCenter}
          onEditLead={(lead) => {
            setShowLeadCenter(false)
            // Se o lead pertencer a outro funil, muda o contexto para esse funil
            if (lead.funnelId && lead.funnelId !== selectedFunnelId) {
              const funnelExists = funnels.find((f) => f.id === lead.funnelId)
              if (funnelExists) {
                setSelectedFunnelId(lead.funnelId)
              }
            }
            setSelectedLead({
              ...lead,
              source: lead.source || "",
              assignedTo: lead.assignedTo ? { ...lead.assignedTo, avatar: lead.assignedTo.avatar || "" } : undefined,
              people: lead.people || []
            })
            setShowLeadDetails(true)
          }}
          onDeleteLead={handleDeleteLead}
          funnels={funnels.map(f => ({
            ...f,
            columns: f.columns.map(c => ({ ...c, visible: c.visible ?? true }))
          }))}
        />
      )}
    </div>
  )
}

function ActionSelectionDialog({
  open,
  onOpenChange,
  actions,
  onSelect,
  onCancel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  actions: any[]
  onSelect: (actionId: string) => void
  onCancel: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecione a Ação Inicial</DialogTitle>
          <DialogDescription>Esta etapa possui múltiplas ações. Escolha por onde o lead deve começar.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="justify-start text-left h-auto py-3"
              onClick={() => onSelect(action.id)}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{action.customName || action.title || action.type}</span>
                <span className="text-xs text-muted-foreground">
                  {action.type === "whatsapp"
                    ? "Mensagem WhatsApp"
                    : action.type === "task"
                      ? "Tarefa"
                      : action.type === "email"
                        ? "E-mail"
                        : action.type}
                </span>
              </div>
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Define the LeadCard component
function LeadCard({
  lead,
  index,
  onClick,
  onDelete,
  taskCount,
  isSelected,
  onToggleSelect,
  availableTags,
  currentActionName,
}: {
  lead: Lead
  index: number
  onClick: () => void
  onDelete: () => void
  taskCount: number
  isSelected: boolean
  onToggleSelect: () => void
  availableTags: TagType[]
  currentActionName?: string
}) {
  const priorityColorMap = {
    urgent: "text-red-600",
    high: "text-orange-600",
    medium: "text-yellow-600",
    low: "text-green-600",
  }

  const assignedUser = lead?.assignedTo
  const leadTags = lead?.tags || []
  const MAX_DISPLAY_TAGS = 2

  const daysSinceCreation = Math.max(0, Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white p-3 mb-2 rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-grab ${
            isSelected ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={onClick}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 mr-2">
              <h4 className="font-medium truncate text-lg" title={lead.title}>
                {lead.title}
              </h4>
              <p className="text-xs text-muted-foreground truncate" title={lead.client}>
                {lead.client}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {taskCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {taskCount}
                </Badge>
              )}
              <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="h-4 w-4" />
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-red-500 hover:bg-red-100 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {lead.estimatedValue != null && (
                <span className="font-semibold text-foreground">R$ {lead.estimatedValue.toLocaleString("pt-BR")}</span>
              )}
              {lead.priority && (
                <span className={`${priorityColorMap[lead.priority as keyof typeof priorityColorMap]} font-medium`}>
                  {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                </span>
              )}
              {daysSinceCreation === 0 ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600 bg-green-50 text-[10px] px-1 py-0 h-5 ml-2"
                >
                  Novo
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground ml-2">{daysSinceCreation}d</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {currentActionName && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 h-5 mr-1 flex items-center gap-1 max-w-[120px]"
                >
                  <Zap className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{currentActionName}</span>
                </Badge>
              )}
              {assignedUser && (
                <img
                  src={assignedUser.avatar || "/placeholder.svg"}
                  alt={assignedUser.name}
                  className="w-6 h-6 rounded-full"
                  title={assignedUser.name}
                />
              )}
              {leadTags.length > 0 && (
                <>
                  {leadTags.slice(0, MAX_DISPLAY_TAGS).map((tagId) => {
                    const tag = availableTags.find((t: any) => t.id === tagId)
                    if (!tag) return null
                    return (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="rounded-full text-xs px-2 py-0.5"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    )
                  })}
                  {leadTags.length > MAX_DISPLAY_TAGS && (
                    <Badge variant="outline" className="rounded-full text-xs px-2 py-0.5">
                      +{leadTags.length - MAX_DISPLAY_TAGS}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
