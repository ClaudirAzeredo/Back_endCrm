"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { automationsApi, type Automation } from "@/lib/api/automations-api"
import { useApiMessageTemplates } from "@/hooks/use-api-message-templates"
import { usersApi } from "@/lib/api/users-api"
import { useApiAuth } from "@/hooks/use-api-auth"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Target,
  Users,
  Briefcase,
  Heart,
  Star,
  TrendingUp,
  Building,
  Handshake,
  GripVertical,
  X,
  CheckSquare,
  ArrowRightLeft,
} from "lucide-react"

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
    actions?: any[]
    automationId?: string
  }>
  isActive: boolean
  createdAt: string
}

type StageAction = {
  id: string
  type: "whatsapp" | "task" | "move_lead"
  
  // WhatsApp specific
  template?: string
  recipients?: "lead_contact"
  variables?: Record<string, string>
  waitForResponse?: boolean
  responseTimeout?: number
  responseTargetColumnId?: string
  onNoResponseNext?: { kind: "action"; actionId: string } | { kind: "stage"; columnId: string; startActionId?: string } | null

  // Task specific
  title?: string
  description?: string
  priority?: "low" | "medium" | "high" | "urgent"
  dueInMinutes?: number

  // Move Lead specific
  targetFunnelId?: string
  targetColumnId?: string
  assignTo?: string

  // Common
  enabled: boolean
  customName?: string
  mode: "automatic"
  delayConfig?: { value: number; unit: "minutes" | "hours" | "days" }
  next?: { kind: "action"; actionId: string } | { kind: "stage"; columnId: string; startActionId?: string } | null
}

type FunnelTemplate = {
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
  }>
}

interface FunnelManagerProps {
  funnels: Funnel[]
  checkHasLeads?: (funnelId: string) => Promise<boolean>
  onSave: (funnels: Funnel[]) => void
  onClose: () => void
}

// Templates predefinidos
const funnelTemplates: FunnelTemplate[] = [
  {
    id: "template1",
    name: "Vendas B2B Tradicional",
    description: "Funil clássico para vendas corporativas",
    category: "Vendas",
    icon: "briefcase",
    columns: [
      { id: "lead", name: "Lead", color: "#64748b", order: 0, description: "Novos contatos identificados" },
      {
        id: "qualificado",
        name: "Qualificado",
        color: "#3b82f6",
        order: 1,
        description: "Leads com potencial confirmado",
      },
      { id: "proposta", name: "Proposta", color: "#f59e0b", order: 2, description: "Proposta comercial enviada" },
      { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3, description: "Em processo de negociação" },
      { id: "fechamento", name: "Fechamento", color: "#10b981", order: 4, description: "Venda concluída" },
      { id: "perdido", name: "Perdido", color: "#ef4444", order: 5, description: "Oportunidade perdida" },
    ],
  },
  {
    id: "template2",
    name: "Vendas B2C Rápidas",
    description: "Funil otimizado para vendas diretas ao consumidor",
    category: "Vendas",
    icon: "users",
    columns: [
      { id: "interesse", name: "Interesse", color: "#64748b", order: 0, description: "Cliente demonstrou interesse" },
      {
        id: "contato",
        name: "Primeiro Contato",
        color: "#3b82f6",
        order: 1,
        description: "Primeiro contato realizado",
      },
      { id: "apresentacao", name: "Apresentação", color: "#f59e0b", order: 2, description: "Produto apresentado" },
      { id: "fechamento", name: "Fechamento", color: "#10b981", order: 3, description: "Venda finalizada" },
      { id: "perdido", name: "Perdido", color: "#ef4444", order: 4, description: "Não converteu" },
    ],
  },
  {
    id: "template3",
    name: "Parcerias Estratégicas",
    description: "Desenvolvimento de parcerias comerciais",
    category: "Parcerias",
    icon: "handshake",
    columns: [
      { id: "prospeccao", name: "Prospecção", color: "#64748b", order: 0, description: "Identificação de parceiros" },
      {
        id: "contato_inicial",
        name: "Contato Inicial",
        color: "#3b82f6",
        order: 1,
        description: "Primeiro contato estabelecido",
      },
      { id: "avaliacao", name: "Avaliação", color: "#f59e0b", order: 2, description: "Avaliação mútua de fit" },
      { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3, description: "Termos sendo negociados" },
      { id: "acordo", name: "Acordo", color: "#10b981", order: 4, description: "Parceria estabelecida" },
      { id: "rejeitado", name: "Rejeitado", color: "#ef4444", order: 5, description: "Parceria não estabelecida" },
    ],
  },
  {
    id: "template4",
    name: "Atendimento ao Cliente",
    description: "Gestão de tickets de suporte",
    category: "Suporte",
    icon: "heart",
    columns: [
      { id: "aberto", name: "Aberto", color: "#64748b", order: 0, description: "Ticket criado" },
      { id: "em_andamento", name: "Em Andamento", color: "#3b82f6", order: 1, description: "Sendo analisado" },
      { id: "aguardando", name: "Aguardando Cliente", color: "#f59e0b", order: 2, description: "Aguardando resposta" },
      { id: "resolvido", name: "Resolvido", color: "#10b981", order: 3, description: "Problema solucionado" },
      { id: "fechado", name: "Fechado", color: "#6b7280", order: 4, description: "Ticket finalizado" },
    ],
  },
  {
    id: "template5",
    name: "Recrutamento",
    description: "Processo seletivo de candidatos",
    category: "RH",
    icon: "star",
    columns: [
      { id: "candidatura", name: "Candidatura", color: "#64748b", order: 0, description: "Candidato se inscreveu" },
      { id: "triagem", name: "Triagem", color: "#3b82f6", order: 1, description: "Análise inicial do perfil" },
      {
        id: "entrevista",
        name: "Entrevista",
        color: "#f59e0b",
        order: 2,
        description: "Entrevista agendada/realizada",
      },
      { id: "teste", name: "Teste Técnico", color: "#8b5cf6", order: 3, description: "Avaliação técnica" },
      { id: "aprovado", name: "Aprovado", color: "#10b981", order: 4, description: "Candidato selecionado" },
      { id: "reprovado", name: "Reprovado", color: "#ef4444", order: 5, description: "Candidato não selecionado" },
    ],
  },
]

// Cores disponíveis
const availableColors = [
  "#64748b",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
]

// Ícones disponíveis
const availableIcons = [
  { id: "target", name: "Alvo", icon: Target },
  { id: "users", name: "Usuários", icon: Users },
  { id: "briefcase", name: "Maleta", icon: Briefcase },
  { id: "heart", name: "Coração", icon: Heart },
  { id: "star", name: "Estrela", icon: Star },
  { id: "trending-up", name: "Crescimento", icon: TrendingUp },
  { id: "building", name: "Prédio", icon: Building },
  { id: "handshake", name: "Aperto de Mão", icon: Handshake },
]

export default function FunnelManager({ funnels, checkHasLeads, onSave, onClose }: FunnelManagerProps) {
  const [localFunnels, setLocalFunnels] = useState<Funnel[]>(funnels)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null)
  const [activeTab, setActiveTab] = useState("funnels")

  const { templates, fetchTemplates } = useApiMessageTemplates()
  const { user: currentUser } = useApiAuth()
  const [availableUsers, setAvailableUsers] = useState<any[]>([])

  useEffect(() => {
    fetchTemplates()
    usersApi.list().then(setAvailableUsers).catch(() => setAvailableUsers([]))
  }, [fetchTemplates])

  // Estados para criação/edição
  const [funnelName, setFunnelName] = useState("")
  const [funnelDescription, setFunnelDescription] = useState("")
  const [funnelCategory, setFunnelCategory] = useState("")
  const [funnelIcon, setFunnelIcon] = useState("target")
  const [funnelColumns, setFunnelColumns] = useState<
    Array<{
      id: string
      name: string
      color: string
      order: number
      description?: string
      actions?: StageAction[]
      automationId?: string
    }>
  >([])

  const [showStageActionDialog, setShowStageActionDialog] = useState(false)
  const [stageActionColumnId, setStageActionColumnId] = useState<string | null>(null)
  const [editingStageActionId, setEditingStageActionId] = useState<string | null>(null)
  const [stageActionDraft, setStageActionDraft] = useState<StageAction>({
    id: "",
    type: "whatsapp",
    template: "",
    recipients: "lead_contact",
    variables: {},
    enabled: true,
    mode: "automatic",
    waitForResponse: true,
    responseTimeout: 24 * 60,
    responseTargetColumnId: "",
    onNoResponseNext: null,
    next: null,
  })

  const automationNameFor = (funnelId: string, columnId: string) => `stage_flow:${funnelId}:${columnId}`

  const getColumnName = (columnId: string) => {
    const local = funnelColumns.find((c) => c.id === columnId)
    if (local) return local.name
    
    // Search in all funnels
    for (const f of localFunnels) {
      const c = f.columns.find((col) => col.id === columnId)
      if (c) return `${f.name} > ${c.name}`
    }

    return "Etapa não encontrada"
  }

  const getActionLabel = (columnId: string, actionId: string) => {
    const col = funnelColumns.find((c) => c.id === columnId)
    const actions = Array.isArray(col?.actions) ? col!.actions! : []
    const idx = actions.findIndex((a) => a.id === actionId)
    const action = actions[idx]
    if (action && action.customName) return action.customName
    const n = idx >= 0 ? idx + 1 : 0
    const stageName = col?.name || "Etapa"
    
    let typeLabel = "Ação"
    if (action) {
      if (action.type === "whatsapp") typeLabel = "WhatsApp"
      else if (action.type === "task") typeLabel = "Tarefa"
      else if (action.type === "move_lead") typeLabel = "Transferir"
    }

    return n > 0 ? `${stageName} / ${typeLabel} ${n}` : `${stageName} / ${typeLabel}`
  }

  const encodeNoResponseTarget = (t: StageAction["onNoResponseNext"], currentColumnId: string) => {
    if (!t) return "next"
    if (t.kind === "action") return `action:${t.actionId}`
    if (t.startActionId) return `stage:${t.columnId}:action:${t.startActionId}`
    return `stage:${t.columnId}`
  }

  const decodeNoResponseTarget = (value: string): StageAction["onNoResponseNext"] => {
    if (!value || value === "next") return null
    if (value.startsWith("action:")) {
      return { kind: "action", actionId: value.slice("action:".length) }
    }
    if (value.startsWith("stage:")) {
      const parts = value.split(":")
      const columnId = parts[1]
      const actionIdx = parts.findIndex((p) => p === "action")
      if (actionIdx >= 0 && parts[actionIdx + 1]) {
        return { kind: "stage", columnId, startActionId: parts[actionIdx + 1] }
      }
      return { kind: "stage", columnId }
    }
    return null
  }

  const openNewStageAction = (columnId: string) => {
    setStageActionColumnId(columnId)
    setEditingStageActionId(null)
    setStageActionDraft({
      id: `act_${Date.now()}`,
      type: "whatsapp",
      template: "",
      recipients: "lead_contact",
      variables: {},
      enabled: true,
      mode: "automatic",
      waitForResponse: true,
      responseTimeout: 24 * 60,
      responseTargetColumnId: "",
      onNoResponseNext: null,
      next: null,
    })
    setShowStageActionDialog(true)
  }

  const openEditStageAction = (columnId: string, action: StageAction) => {
    setStageActionColumnId(columnId)
    setEditingStageActionId(action.id)
    setStageActionDraft({
      id: action.id,
      type: action.type || "whatsapp",
      template: action.template || "",
      recipients: "lead_contact",
      variables: action.variables || {},
      enabled: action.enabled ?? true,
      mode: "automatic",
      delayConfig: action.delayConfig,
      next: action.next ?? null,
      waitForResponse: action.waitForResponse ?? false,
      responseTimeout: action.responseTimeout ?? 24 * 60,
      responseTargetColumnId: action.responseTargetColumnId || "",
      onNoResponseNext: action.onNoResponseNext ?? null,
      customName: action.customName || "",
      // Task fields
      title: action.title || "",
      description: action.description || "",
      priority: action.priority || "medium",
      dueInMinutes: action.dueInMinutes || 60,
      // Move Lead fields
      targetFunnelId: action.targetFunnelId || "",
      targetColumnId: action.targetColumnId || "",
      assignTo: action.assignTo || "",
    })
    setShowStageActionDialog(true)
  }

  const upsertStageAction = () => {
    if (!stageActionColumnId) return
    
    // Validation
    if (stageActionDraft.type === "whatsapp" && !stageActionDraft.template?.trim()) {
      toast({ title: "Erro", description: "A mensagem/template do WhatsApp é obrigatória.", variant: "destructive" })
      return
    }
    if (stageActionDraft.type === "task" && !stageActionDraft.title?.trim()) {
      toast({ title: "Erro", description: "O título da tarefa é obrigatório.", variant: "destructive" })
      return
    }
    if (stageActionDraft.type === "move_lead") {
      if (!stageActionDraft.targetFunnelId && !stageActionDraft.targetColumnId && !stageActionDraft.assignTo) {
         toast({ title: "Erro", description: "Selecione um destino (Funil, Etapa ou Usuário) para transferir.", variant: "destructive" })
         return
      }
    }

    if (stageActionDraft.type === "whatsapp" && stageActionDraft.waitForResponse && !stageActionDraft.responseTargetColumnId) {
      toast({ title: "Erro", description: "Selecione a etapa de destino (Responde).", variant: "destructive" })
      return
    }

    setFunnelColumns((prev) =>
      prev.map((c) => {
        if (c.id !== stageActionColumnId) return c
        const actions = Array.isArray(c.actions) ? [...c.actions] : []
        const idx = actions.findIndex((a) => a.id === stageActionDraft.id)
        if (idx >= 0) actions[idx] = stageActionDraft
        else actions.push(stageActionDraft)
        return { ...c, actions }
      }),
    )
    setShowStageActionDialog(false)
    setStageActionColumnId(null)
    setEditingStageActionId(null)
  }

  const removeStageAction = (columnId: string, actionId: string) => {
    setFunnelColumns((prev) =>
      prev.map((c) => {
        if (c.id !== columnId) return c
        return { ...c, actions: (c.actions || []).filter((a) => a.id !== actionId) }
      }),
    )
  }

  const hydrateStageActionsFromApi = async (funnel: Funnel) => {
    try {
      const cols = funnel.columns || []
      const results = await Promise.all(
        cols.map(async (col) => {
          try {
            const autos = await automationsApi.getAutomations({ columnId: col.id })
            const name = automationNameFor(funnel.id, col.id)
            const found = autos.find((a) => a?.name === name && a?.trigger === "on_enter")
            if (!found) return { columnId: col.id, actions: undefined, automationId: undefined }
            const actions = Array.isArray(found.actions) ? found.actions : []
            return { columnId: col.id, actions, automationId: found.id }
          } catch {
            return { columnId: col.id, actions: undefined, automationId: undefined }
          }
        }),
      )
      setFunnelColumns((prev) =>
        prev.map((c) => {
          const r = results.find((x) => x.columnId === c.id)
          if (!r) return c
          if (!r.actions) return { ...c, automationId: r.automationId || c.automationId }
          return { ...c, actions: r.actions as any, automationId: r.automationId || c.automationId }
        }),
      )
    } catch {}
  }

  const persistStageAutomations = async (funnelsToPersist: Funnel[]) => {
    const targets: Array<{ funnelId: string; columnId: string; actions: any[]; automationId?: string }> = []
    for (const f of funnelsToPersist) {
      const cols = f.columns || []
      for (const col of cols) {
        const actions = Array.isArray((col as any).actions) ? ((col as any).actions as any[]) : []
        if (actions.length === 0) continue
        targets.push({ funnelId: f.id, columnId: col.id, actions, automationId: (col as any).automationId })
      }
    }
    if (targets.length === 0) return

    for (const t of targets) {
      const name = automationNameFor(t.funnelId, t.columnId)
      const payload: any = {
        name,
        columnId: t.columnId,
        trigger: "on_enter",
        actions: t.actions,
        active: true,
        delay: 0,
        funnelId: t.funnelId,
      }
      try {
        let idToUpdate: string | undefined = t.automationId
        if (!idToUpdate) {
          const existing = await automationsApi.getAutomations({ columnId: t.columnId })
          const found = existing.find((a) => a?.name === name && a?.trigger === "on_enter")
          if (found?.id) idToUpdate = found.id
        }

        if (idToUpdate) {
          await automationsApi.updateAutomation(idToUpdate, payload)
        } else {
          const created = await automationsApi.createAutomation(payload)
          idToUpdate = (created as any)?.id
        }

        setLocalFunnels((prev) =>
          prev.map((f) => {
            if (f.id !== t.funnelId) return f
            return {
              ...f,
              columns: f.columns.map((c) =>
                c.id === t.columnId ? ({ ...c, automationId: idToUpdate } as any) : c,
              ),
            }
          }),
        )
      } catch {}
    }
  }

  const handleCreateFunnel = () => {
    setFunnelName("")
    setFunnelDescription("")
    setFunnelCategory("")
    setFunnelIcon("target")
    setFunnelColumns([{ id: "step1", name: "Nova Etapa", color: "#64748b", order: 0, description: "" }])
    setEditingFunnel(null)
    setShowCreateDialog(true)
  }

  const handleEditFunnel = (funnel: Funnel) => {
    setFunnelName(funnel.name)
    setFunnelDescription(funnel.description)
    setFunnelCategory(funnel.category)
    setFunnelIcon(funnel.icon)
    setFunnelColumns(funnel.columns.map((col) => ({ ...col })))
    setEditingFunnel(funnel)
    setShowCreateDialog(true)
    void hydrateStageActionsFromApi(funnel)
  }

  const handleDuplicateFunnel = (funnel: Funnel) => {
    const newFunnel: Funnel = {
      ...funnel,
      id: `funnel_${Date.now()}`,
      name: `${funnel.name} (Cópia)`,
      createdAt: new Date().toISOString(),
    }
    setLocalFunnels((prev) => [...prev, newFunnel])
    toast({
      title: "Funil duplicado",
      description: `O funil "${newFunnel.name}" foi criado com sucesso.`,
    })
  }

  const handleDeleteFunnel = async (funnelId: string) => {
    const funnel = localFunnels.find((f) => f.id === funnelId)
    if (!funnel) return

    if (checkHasLeads) {
      try {
        const hasLeads = await checkHasLeads(funnelId)
        if (hasLeads) {
          toast({
            title: "Operação não permitida",
            description: `O funil "${funnel.name}" não pode ser excluído pois contém leads.`,
            variant: "destructive",
          })
          return
        }
      } catch (error) {
        console.error("Failed to check leads", error)
        toast({
          title: "Erro ao verificar leads",
          description: "Não foi possível verificar se existem leads neste funil.",
          variant: "destructive",
        })
        return
      }
    }

    setLocalFunnels((prev) => prev.filter((f) => f.id !== funnelId))
    toast({
      title: "Funil excluído",
      description: `O funil "${funnel.name}" foi removido.`,
    })
  }

  const handleToggleFunnelActive = (funnelId: string) => {
    setLocalFunnels((prev) => prev.map((f) => (f.id === funnelId ? { ...f, isActive: !f.isActive } : f)))
  }

  const handleSaveFunnel = () => {
    if (!funnelName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do funil é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (funnelColumns.length === 0) {
      toast({
        title: "Erro",
        description: "O funil deve ter pelo menos uma etapa.",
        variant: "destructive",
      })
      return
    }

    const funnelData: Funnel = {
      id: editingFunnel?.id || `funnel_${Date.now()}`,
      name: funnelName,
      description: funnelDescription,
      category: funnelCategory,
      icon: funnelIcon,
      columns: funnelColumns.map((col, index) => ({
        ...col,
        order: index,
        visible: true,
      })),
      isActive: editingFunnel?.isActive ?? true,
      createdAt: editingFunnel?.createdAt || new Date().toISOString(),
    }

    if (editingFunnel) {
      setLocalFunnels((prev) => prev.map((f) => (f.id === editingFunnel.id ? funnelData : f)))
      toast({
        title: "Funil atualizado",
        description: `O funil "${funnelData.name}" foi atualizado com sucesso.`,
      })
    } else {
      setLocalFunnels((prev) => [...prev, funnelData])
      toast({
        title: "Funil criado",
        description: `O funil "${funnelData.name}" foi criado com sucesso.`,
      })
    }

    setShowCreateDialog(false)
  }

  const handleApplyTemplate = (template: FunnelTemplate) => {
    const newFunnel: Funnel = {
      id: `funnel_${Date.now()}`,
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      columns: template.columns.map((col) => ({
        ...col,
        visible: true,
      })),
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    setLocalFunnels((prev) => [...prev, newFunnel])
    toast({
      title: "Template aplicado",
      description: `O funil "${newFunnel.name}" foi criado a partir do template.`,
    })
  }

  const addColumn = () => {
    const newColumn = {
      id: `step_${Date.now()}`,
      name: "Nova Etapa",
      color: availableColors[funnelColumns.length % availableColors.length],
      order: funnelColumns.length,
      description: "",
    }
    setFunnelColumns((prev) => [...prev, newColumn])
  }

  const removeColumn = (columnId: string) => {
    setFunnelColumns((prev) => prev.filter((col) => col.id !== columnId))
  }

  const updateColumn = (columnId: string, updates: Partial<(typeof funnelColumns)[0]>) => {
    setFunnelColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, ...updates } : col)))
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(funnelColumns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFunnelColumns(items.map((item, index) => ({ ...item, order: index })))
  }

  const getIcon = (iconId: string) => {
    const iconData = availableIcons.find((icon) => icon.id === iconId)
    return iconData ? iconData.icon : Target
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciador de Funis</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="funnels">Meus Funis</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="funnels" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Funis Personalizados</h3>
                <p className="text-sm text-muted-foreground">Gerencie seus funis de vendas personalizados</p>
              </div>
              <Button onClick={handleCreateFunnel}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Funil
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localFunnels.map((funnel) => {
                const IconComponent = getIcon(funnel.icon)
                return (
                  <Card key={funnel.id} className={`${!funnel.isActive ? "opacity-60" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{funnel.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{funnel.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={funnel.isActive}
                            onCheckedChange={() => handleToggleFunnelActive(funnel.id)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{funnel.description}</p>

                      <div className="flex flex-wrap gap-1">
                        {funnel.columns.slice(0, 4).map((column) => (
                          <Badge
                            key={column.id}
                            variant="outline"
                            style={{ borderColor: column.color, color: column.color }}
                          >
                            {column.name}
                          </Badge>
                        ))}
                        {funnel.columns.length > 4 && (
                          <Badge variant="outline">+{funnel.columns.length - 4} mais</Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">{funnel.columns.length} etapas</span>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditFunnel(funnel)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicateFunnel(funnel)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFunnel(funnel.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  onSave(localFunnels)
                  try {
                    await persistStageAutomations(localFunnels)
                    toast({ title: "Ações por etapa salvas", description: "As automações por etapa foram atualizadas." })
                  } catch {
                    toast({ title: "Erro", description: "Falha ao salvar automações por etapa.", variant: "destructive" })
                  }
                }}
              >
                Salvar Alterações
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Templates Predefinidos</h3>
              <p className="text-sm text-muted-foreground">Use templates prontos para acelerar a criação de funis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funnelTemplates.map((template) => {
                const IconComponent = getIcon(template.icon)
                return (
                  <Card key={template.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <IconComponent className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{template.category}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{template.description}</p>

                      <div className="flex flex-wrap gap-1">
                        {template.columns.map((column) => (
                          <Badge
                            key={column.id}
                            variant="outline"
                            style={{ borderColor: column.color, color: column.color }}
                          >
                            {column.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">{template.columns.length} etapas</span>
                        <Button size="sm" onClick={() => handleApplyTemplate(template)}>
                          Usar Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de Criação/Edição */}
        {showCreateDialog && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFunnel ? "Editar Funil" : "Criar Novo Funil"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="funnel-name">Nome do Funil</Label>
                    <Input
                      id="funnel-name"
                      value={funnelName}
                      onChange={(e) => setFunnelName(e.target.value)}
                      placeholder="Ex: Vendas B2B"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funnel-category">Categoria</Label>
                    <Input
                      id="funnel-category"
                      value={funnelCategory}
                      onChange={(e) => setFunnelCategory(e.target.value)}
                      placeholder="Ex: Vendas, Marketing, Suporte"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funnel-description">Descrição</Label>
                  <Textarea
                    id="funnel-description"
                    value={funnelDescription}
                    onChange={(e) => setFunnelDescription(e.target.value)}
                    placeholder="Descreva o propósito deste funil..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {availableIcons.map((iconOption) => {
                      const IconComponent = iconOption.icon
                      return (
                        <Button
                          key={iconOption.id}
                          variant={funnelIcon === iconOption.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFunnelIcon(iconOption.id)}
                          className="flex flex-col items-center p-3 h-auto"
                        >
                          <IconComponent className="h-4 w-4 mb-1" />
                          <span className="text-xs">{iconOption.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Etapas do Funil */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Etapas do Funil</Label>
                      <p className="text-sm text-muted-foreground">Defina as etapas do seu processo de vendas</p>
                    </div>
                    <Button onClick={addColumn} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="columns">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {funnelColumns.map((column, index) => (
                            <Draggable key={column.id} draggableId={column.id} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} className="space-y-2">
                                  <div className="flex items-center space-x-3 p-3 border rounded-lg bg-white">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                      <div>
                                        <Input
                                          value={column.name}
                                          onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                                          placeholder="Nome da etapa"
                                        />
                                      </div>

                                      <div>
                                        <Select value={column.color} onValueChange={(color) => updateColumn(column.id, { color })}>
                                          <SelectTrigger>
                                            <div className="flex items-center space-x-2">
                                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color }} />
                                              <SelectValue />
                                            </div>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableColors.map((color) => (
                                              <SelectItem key={color} value={color}>
                                                <div className="flex items-center space-x-2">
                                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                                                  <span>{color}</span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Input
                                          value={column.description || ""}
                                          onChange={(e) => updateColumn(column.id, { description: e.target.value })}
                                          placeholder="Descrição (opcional)"
                                        />
                                      </div>
                                    </div>

                                    {funnelColumns.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeColumn(column.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>

                                  <div className="pl-7 space-y-2">
                                    {(column.actions || []).length > 0 && (
                                      <div className="space-y-2">
                                        {(column.actions || []).map((a, ai) => (
                                          <Card key={a.id} className="border-l-4" style={{ borderLeftColor: column.color }}>
                                            <CardContent className="p-3 flex items-start justify-between gap-3">
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <Badge variant="outline">
                                                    {a.type === "task" ? "Tarefa" : 
                                                     a.type === "move_lead" ? "Transferir" : "WhatsApp"}
                                                  </Badge>
                                                  <span className="text-sm font-medium">Ação {ai + 1}</span>
                                                  {a.type === "whatsapp" && (
                                                    a.waitForResponse ? (
                                                      <Badge className="bg-green-100 text-green-800">Responde → {getColumnName(a.responseTargetColumnId || "")}</Badge>
                                                    ) : (
                                                      <Badge variant="secondary">Sem espera</Badge>
                                                    )
                                                  )}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate mt-1">
                                                  {a.type === "task" ? `Tarefa: ${a.title}` :
                                                   a.type === "move_lead" ? `Mover para: ${getColumnName(a.targetColumnId || "")}` :
                                                   a.template}
                                                </div>
                                                {a.waitForResponse ? (
                                                  <div className="text-xs text-muted-foreground mt-1">
                                                    {(() => {
                                                      const t = a.onNoResponseNext
                                                      if (!t) return "Não responde → próxima ação"
                                                      if (t.kind === "action") return `Não responde → ${getActionLabel(column.id, t.actionId)}`
                                                      if (t.startActionId) return `Não responde → ${getActionLabel(t.columnId, t.startActionId)}`
                                                      return `Não responde → ${getColumnName(t.columnId)}`
                                                    })()}
                                                  </div>
                                                ) : null}
                                              </div>
                                              <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEditStageAction(column.id, a)}>
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-red-600 hover:text-red-700"
                                                  onClick={() => removeStageAction(column.id, a.id)}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex">
                                      <Button variant="outline" size="sm" onClick={() => openNewStageAction(column.id)} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Adicionar ação
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>

                <Dialog open={showStageActionDialog} onOpenChange={setShowStageActionDialog}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{editingStageActionId ? "Editar ação" : "Adicionar ação"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto px-1">
                      
                      {/* Action Name */}
                      <div className="space-y-2">
                        <Label>Nome da Ação (Opcional)</Label>
                        <Input
                          value={stageActionDraft.customName || ""}
                          onChange={(e) => setStageActionDraft({ ...stageActionDraft, customName: e.target.value })}
                          placeholder="Ex: Envio de Saudação"
                        />
                      </div>

                      {/* Action Type Selection */}
                      <div className="space-y-2">
                        <Label>Tipo de Ação</Label>
                        <Select
                          value={stageActionDraft.type}
                          onValueChange={(value: any) => setStageActionDraft({ ...stageActionDraft, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Enviar WhatsApp
                              </div>
                            </SelectItem>
                            <SelectItem value="task">
                              <div className="flex items-center gap-2">
                                <CheckSquare className="h-4 w-4" />
                                Criar Tarefa
                              </div>
                            </SelectItem>
                            <SelectItem value="move_lead">
                              <div className="flex items-center gap-2">
                                <ArrowRightLeft className="h-4 w-4" />
                                Transferir Lead
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* WhatsApp Config */}
                      {stageActionDraft.type === "whatsapp" && (
                        <>
                          <div className="space-y-2">
                            <Label>Template de Mensagem</Label>
                             <Select
                                value={""}
                                onValueChange={(value) => {
                                  const selected = templates.find(t => t.id === value)
                                  if (selected) {
                                      let content = ""
                                      if (typeof selected.content === 'string') content = selected.content
                                      else if (selected.content?.text) content = selected.content.text
                                      else content = JSON.stringify(selected.content)
                                      
                                      setStageActionDraft({ ...stageActionDraft, template: content })
                                      toast({ description: "Template carregado para a mensagem." })
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Carregar do template..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {templates.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Mensagem (WhatsApp)</Label>
                            <Textarea
                              value={stageActionDraft.template}
                              onChange={(e) => setStageActionDraft({ ...stageActionDraft, template: e.target.value })}
                              placeholder="Digite a mensagem..."
                              rows={5}
                            />
                            <p className="text-xs text-muted-foreground">
                              Você pode selecionar um template acima ou digitar manualmente.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Esperar resposta</Label>
                              <div className="flex items-center gap-2 h-10">
                                <Switch
                                  checked={!!stageActionDraft.waitForResponse}
                                  onCheckedChange={(checked) =>
                                    setStageActionDraft({
                                      ...stageActionDraft,
                                      waitForResponse: checked,
                                      responseTargetColumnId: checked ? stageActionDraft.responseTargetColumnId : "",
                                    })
                                  }
                                />
                                <span className="text-sm text-muted-foreground">Responde → mover etapa</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Tempo limite (minutos)</Label>
                              <Input
                                type="number"
                                value={stageActionDraft.responseTimeout ?? 0}
                                onChange={(e) =>
                                  setStageActionDraft({
                                    ...stageActionDraft,
                                    responseTimeout: e.target.value ? Number(e.target.value) : 0,
                                  })
                                }
                                placeholder="1440"
                                disabled={!stageActionDraft.waitForResponse}
                              />
                            </div>
                          </div>

                          {stageActionDraft.waitForResponse && (
                            <div className="space-y-2">
                              <Label>Se responder, mover para</Label>
                              <Select
                                value={stageActionDraft.responseTargetColumnId || ""}
                                onValueChange={(value) => setStageActionDraft({ ...stageActionDraft, responseTargetColumnId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a etapa..." />
                                </SelectTrigger>
                                <SelectContent>
                                {funnelColumns
                                  .map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                              </Select>

                              <div className="space-y-2 pt-2">
                                <Label>Se não responder, ir para</Label>
                                <Select
                                  value={encodeNoResponseTarget(stageActionDraft.onNoResponseNext ?? null, stageActionColumnId || "")}
                                  onValueChange={(value) =>
                                    setStageActionDraft({
                                      ...stageActionDraft,
                                      onNoResponseNext: decodeNoResponseTarget(value),
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um destino..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="next">Próxima ação (mesma etapa)</SelectItem>

                                    {(() => {
                                      const current = funnelColumns.find((c) => c.id === stageActionColumnId)
                                      const currentActions = Array.isArray(current?.actions) ? current!.actions! : []
                                      const otherInStage = currentActions
                                        .filter((a) => a.id !== stageActionDraft.id)
                                        .map((a) => (
                                          <SelectItem key={`action:${a.id}`} value={`action:${a.id}`}>
                                            Ação desta etapa: {getActionLabel(stageActionColumnId || "", a.id)}
                                          </SelectItem>
                                        ))
                                      if (otherInStage.length === 0) return null
                                      return otherInStage
                                    })()}

                                    {funnelColumns.map((c) => (
                                      <SelectItem key={`stage:${c.id}`} value={`stage:${c.id}`}>
                                        Etapa: {c.name}
                                      </SelectItem>
                                    ))}

                                    {funnelColumns
                                      .filter((c) => c.id !== stageActionColumnId)
                                      .flatMap((c) => {
                                        const actions = Array.isArray(c.actions) ? c.actions : []
                                        return actions
                                          .filter((a) => a.id !== stageActionDraft.id)
                                          .map((a) => (
                                            <SelectItem key={`stage:${c.id}:action:${a.id}`} value={`stage:${c.id}:action:${a.id}`}>
                                              Ação em outra etapa: {getActionLabel(c.id, a.id)}
                                            </SelectItem>
                                          ))
                                      })}
                                  </SelectContent>
                                </Select>
                                <div className="text-xs text-muted-foreground">
                                  Você pode continuar na sequência, pular para outra etapa, ou iniciar uma ação específica de outra etapa.
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Task Config */}
                      {stageActionDraft.type === "task" && (
                        <>
                          <div className="space-y-2">
                            <Label>Título da Tarefa</Label>
                            <Input
                              value={stageActionDraft.title || ""}
                              onChange={(e) => setStageActionDraft({ ...stageActionDraft, title: e.target.value })}
                              placeholder="Ex: Ligar para cliente"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                              value={stageActionDraft.description || ""}
                              onChange={(e) => setStageActionDraft({ ...stageActionDraft, description: e.target.value })}
                              placeholder="Detalhes da tarefa..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Prioridade</Label>
                              <Select
                                value={stageActionDraft.priority || "medium"}
                                onValueChange={(value: any) => setStageActionDraft({ ...stageActionDraft, priority: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Baixa</SelectItem>
                                  <SelectItem value="medium">Média</SelectItem>
                                  <SelectItem value="high">Alta</SelectItem>
                                  <SelectItem value="urgent">Urgente</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Prazo (minutos após criação)</Label>
                              <Input
                                type="number"
                                value={stageActionDraft.dueInMinutes || 60}
                                onChange={(e) => setStageActionDraft({ ...stageActionDraft, dueInMinutes: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Move Lead Config */}
                      {stageActionDraft.type === "move_lead" && (
                        <>
                           <div className="space-y-2">
                            <Label>Transferir para outro Funil?</Label>
                            <Select
                              value={stageActionDraft.targetFunnelId || "same"}
                              onValueChange={(value) => setStageActionDraft({ ...stageActionDraft, targetFunnelId: value === "same" ? "" : value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o funil..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="same">Mesmo Funil</SelectItem>
                                {localFunnels.filter(f => f.id !== editingFunnel?.id).map(f => (
                                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Etapa de Destino</Label>
                            <Select
                              value={stageActionDraft.targetColumnId || ""}
                              onValueChange={(value) => setStageActionDraft({ ...stageActionDraft, targetColumnId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a etapa..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  const targetFunnel = stageActionDraft.targetFunnelId 
                                    ? localFunnels.find(f => f.id === stageActionDraft.targetFunnelId)
                                    : editingFunnel
                                  
                                  const columns = stageActionDraft.targetFunnelId 
                                    ? targetFunnel?.columns || []
                                    : funnelColumns

                                  return columns.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.name}
                                    </SelectItem>
                                  ))
                                })()}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Transferir Responsável (Opcional)</Label>
                            <Select
                              value={stageActionDraft.assignTo || ""}
                              onValueChange={(value) => setStageActionDraft({ ...stageActionDraft, assignTo: value === "no_change" ? "" : value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Manter responsável atual" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no_change">Manter responsável atual</SelectItem>
                                {availableUsers.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={stageActionDraft.enabled}
                            onCheckedChange={(enabled) => setStageActionDraft({ ...stageActionDraft, enabled })}
                          />
                          <Label>Habilitada</Label>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowStageActionDialog(false)
                              setStageActionColumnId(null)
                              setEditingStageActionId(null)
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={upsertStageAction}>Salvar</Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveFunnel}>{editingFunnel ? "Atualizar Funil" : "Criar Funil"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
