"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Trash2,
  MessageSquare,
  CheckSquare,
  Mail,
  Bell,
  Zap,
  Play,
  Pause,
  Copy,
  Edit,
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"

// Tipos para automações
type AutomationTrigger = "on_enter" | "on_exit" | "on_time_spent" | "on_deadline" | "on_response" | "on_no_response"

type ActionMode = "automatic" | "manual"

type ActionDelay = {
  value: number
  unit: "minutes" | "hours" | "days"
}

type FlowTarget =
  | { kind: "action"; actionId: string }
  | { kind: "stage"; columnId: string }
  | null

type ActionMeta = {
  id?: string
  mode?: ActionMode
  enabled?: boolean
  customName?: string
  delayConfig?: ActionDelay
  next?: FlowTarget
}

type ConditionalAction = {
  condition: "response_received" | "no_response" | "time_elapsed"
  timeLimit?: number
  targetColumnId?: string
  action: AutomationAction
}

type WhatsAppAction = {
  type: "whatsapp"
  template: string
  recipients: "assigned" | "all_members" | "custom" | "lead_contact"
  customRecipients?: string[]
  variables: Record<string, string>
  waitForResponse?: boolean
  responseTimeout?: number
  onResponse?: ConditionalAction
  onNoResponse?: ConditionalAction
}

type TaskAction = {
  type: "task"
  title: string
  description: string
  assignTo: "project_owner" | "column_responsible" | "custom"
  customAssignee?: string
  dueDate?: string
  priority: "low" | "medium" | "high"
}

type EmailAction = {
  type: "email"
  subject: string
  template: string
  recipients: "assigned" | "all_members" | "custom"
  customRecipients?: string[]
  waitForResponse?: boolean
  responseTimeout?: number
  onResponse?: ConditionalAction
  onNoResponse?: ConditionalAction
}

type NotificationAction = {
  type: "notification"
  title: string
  message: string
  recipients: "assigned" | "all_members" | "custom"
  customRecipients?: string[]
}

type MoveLeadAction = {
  type: "move_lead"
  targetColumnId: string
  delay?: number
}

type TransferCommandAction = {
  type: "transfer_command"
  transferType: "funnel_and_stage" | "user_only"
  targetFunnelId?: string
  targetStageId?: string
  userTransferOption: "keep_same" | "transfer_to_specific" | "transfer_to_user"
  targetUserId?: string
}

type BatchTransferAction = {
  type: "batch_transfer"
  targetFunnelId?: string
  targetStageId?: string
  batchSize: number
  intervalValue: number
  intervalUnit: "minutes" | "hours" | "days"
  totalLeads?: number
  userTransferOption: "keep_same" | "transfer_to_specific"
  targetUserId?: string
}

type AutomationAction =
  | (WhatsAppAction & ActionMeta)
  | (TaskAction & ActionMeta)
  | (EmailAction & ActionMeta)
  | (NotificationAction & ActionMeta)
  | (MoveLeadAction & ActionMeta)
  | (TransferCommandAction & ActionMeta)
  | (BatchTransferAction & ActionMeta)
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
  isConditional?: boolean
  conditionalFlow?: {
    timeLimit: number
    onSuccess: { targetColumnId: string; actions: AutomationAction[] }
    onFailure: { targetColumnId: string; actions: AutomationAction[] }
  }
}

type KanbanAutomationsProps = {
  columns: Array<{ id: string; name: string; color: string }>
  automations: Automation[]
  onSave: (automations: Automation[]) => void
  onClose: () => void
}

const whatsappTemplates = [
  {
    id: "first_contact",
    name: "Primeiro Contato",
    template:
      "Olá {client_name}! 👋\n\nObrigado pelo seu interesse em nossos serviços!\n\nGostaria de agendar uma conversa para entender melhor suas necessidades?\n\nResponda este WhatsApp e vamos conversar! 😊",
  },
  {
    id: "follow_up",
    name: "Follow-up",
    template:
      "Oi {client_name}! 📞\n\nVi que você demonstrou interesse em nossos serviços.\n\nTem alguns minutinhos para conversarmos hoje?\n\nPosso te ligar ou prefere que continuemos por aqui?",
  },
  {
    id: "proposal_sent",
    name: "Proposta Enviada",
    template:
      "Olá {client_name}! 📋\n\nEnviei a proposta personalizada para seu projeto.\n\nDá uma olhada e me fala o que achou!\n\nTem alguma dúvida ou ajuste que gostaria de fazer?",
  },
  {
    id: "deadline_reminder",
    name: "Lembrete de Prazo",
    template:
      "Oi {client_name}! ⏰\n\nSó lembrando que nossa proposta tem validade até {deadline}.\n\nQuer que a gente converse hoje para fechar?\n\nEstou aqui para esclarecer qualquer dúvida! 😊",
  },
  {
    id: "no_response_follow",
    name: "Sem Resposta - Follow-up",
    template:
      "Oi {client_name}! 🤔\n\nNotei que não conseguimos conversar ainda.\n\nAinda tem interesse no projeto? \n\nSe mudou de ideia, sem problemas! Só me avisa para eu não te incomodar mais 😊",
  },
]

export default function KanbanAutomations({ columns, automations, onSave, onClose }: KanbanAutomationsProps) {
  const [localAutomations, setLocalAutomations] = useState<Automation[]>([...automations])
  const [selectedColumn, setSelectedColumn] = useState<string>(columns[0]?.id || "")
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)

  const columnAutomations = localAutomations.filter((auto) => auto.columnId === selectedColumn)

  const addAutomation = () => {
    const newAutomation: Automation = {
      id: `auto_${Date.now()}`,
      name: "Nova Automação",
      columnId: selectedColumn,
      trigger: "on_enter",
      actions: [],
      active: true,
    }
    setEditingAutomation(newAutomation)
  }

  const addConditionalAutomation = () => {
    const newAutomation: Automation = {
      id: `auto_${Date.now()}`,
      name: "Automação com Gatilho",
      columnId: selectedColumn,
      trigger: "on_enter",
      actions: [],
      active: true,
      isConditional: true,
      conditionalFlow: {
        timeLimit: 24,
        onSuccess: { targetColumnId: "", actions: [] },
        onFailure: { targetColumnId: "", actions: [] },
      },
    }
    setEditingAutomation(newAutomation)
  }

  const saveAutomation = (automation: Automation) => {
    if (localAutomations.find((a) => a.id === automation.id)) {
      setLocalAutomations((prev) => prev.map((a) => (a.id === automation.id ? automation : a)))
    } else {
      setLocalAutomations((prev) => [...prev, automation])
    }
    setEditingAutomation(null)
  }

  const removeAutomation = (automationId: string) => {
    setLocalAutomations((prev) => prev.filter((a) => a.id !== automationId))
  }

  const toggleAutomation = (automationId: string) => {
    setLocalAutomations((prev) => prev.map((a) => (a.id === automationId ? { ...a, active: !a.active } : a)))
  }

  const duplicateAutomation = (automation: Automation) => {
    const duplicated: Automation = {
      ...automation,
      id: `auto_${Date.now()}`,
      name: `${automation.name} (Cópia)`,
    }
    setLocalAutomations((prev) => [...prev, duplicated])
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Automações Inteligentes do Pipeline
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium mb-3">Etapas do Pipeline</h3>
            {columns.map((column) => (
              <Button
                key={column.id}
                variant={selectedColumn === column.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedColumn(column.id)}
              >
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: column.color }} />
                {column.name}
                <Badge variant="secondary" className="ml-auto">
                  {localAutomations.filter((a) => a.columnId === column.id).length}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Automações - {columns.find((c) => c.id === selectedColumn)?.name}</h3>
              <div className="flex gap-2">
                <Button onClick={addAutomation} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Automação Simples
                </Button>
                <Button onClick={addConditionalAutomation} size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Automação com Gatilho
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {columnAutomations.map((automation) => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  columns={columns}
                  onEdit={() => setEditingAutomation(automation)}
                  onToggle={() => toggleAutomation(automation.id)}
                  onDuplicate={() => duplicateAutomation(automation)}
                  onDelete={() => removeAutomation(automation.id)}
                />
              ))}

              {columnAutomations.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Nenhuma automação configurada</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie automações inteligentes para esta etapa e otimize seu pipeline
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={addAutomation} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Automação Simples
                      </Button>
                      <Button onClick={addConditionalAutomation}>
                        <Clock className="h-4 w-4 mr-2" />
                        Com Gatilho
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {editingAutomation && (
          <AutomationEditor
            automation={editingAutomation}
            columns={columns}
            onSave={saveAutomation}
            onClose={() => setEditingAutomation(null)}
          />
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(localAutomations)}>Salvar Automações</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AutomationCard({
  automation,
  columns,
  onEdit,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  automation: Automation
  columns: Array<{ id: string; name: string; color: string }>
  onEdit: () => void
  onToggle: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const getTriggerLabel = (trigger: AutomationTrigger) => {
    const labels = {
      on_enter: "Ao entrar na etapa",
      on_exit: "Ao sair da etapa",
      on_time_spent: "Após tempo na etapa",
      on_deadline: "Próximo ao prazo",
      on_response: "Ao receber resposta",
      on_no_response: "Sem resposta",
    }
    return labels[trigger]
  }

  const getActionIcon = (type: string) => {
    const icons = {
      whatsapp: <MessageSquare className="h-4 w-4" />,
      task: <CheckSquare className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      notification: <Bell className="h-4 w-4" />,
      move_lead: <ArrowRight className="h-4 w-4" />,
      transfer_command: <RefreshCw className="h-4 w-4" />,
    }
    return icons[type as keyof typeof icons]
  }

  const getColumnName = (columnId: string) => {
    return columns.find((c) => c.id === columnId)?.name || "Etapa não encontrada"
  }

  const getActionDescription = (action: AutomationAction) => {
    if (action.customName) {
      return action.customName
    }
    switch (action.type) {
      case "whatsapp":
        const recipientText =
          action.recipients === "assigned"
            ? "responsável"
            : action.recipients === "all_members"
              ? "todos os membros"
              : action.recipients === "lead_contact"
                ? "contato principal do lead"
                : "destinatários personalizados"
        return `Enviar WhatsApp para ${recipientText}`
      case "task":
        return `Criar tarefa: ${action.title}`
      case "email":
        return `Enviar email: ${action.subject}`
      case "notification":
        return `Notificação: ${action.title}`
      case "move_lead":
        const targetColumn = columns.find((c) => c.id === action.targetColumnId)
        return `Mover lead para: ${targetColumn?.name || "Etapa não encontrada"}`
      case "transfer_command":
        if (action.transferType === "user_only") {
          return "Transferir lead para outro usuário"
        } else {
          return "Transferir lead para outro funil/etapa"
        }
      case "batch_transfer":
        return "Transferência em lote"
      default:
        return "Ação desconhecida"
    }
  }

  return (
    <Card className={`${automation.active ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{automation.name}</h4>
              {automation.isConditional && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Gatilho
                </Badge>
              )}
              {automation.active ? (
                <Badge className="bg-green-100 text-green-800">Ativa</Badge>
              ) : (
                <Badge variant="secondary">Inativa</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {getTriggerLabel(automation.trigger)}
              {automation.delay && ` (${automation.delay} min de atraso)`}
            </p>

            {automation.isConditional && automation.conditionalFlow && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Fluxo Condicional ({automation.conditionalFlow.timeLimit}h)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Resposta → {getColumnName(automation.conditionalFlow.onSuccess.targetColumnId)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Sem resposta → {getColumnName(automation.conditionalFlow.onFailure.targetColumnId)}</span>
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const normalized = (automation.actions || []).map((a: any, idx: number) => ({
                ...a,
                id: a.id || `legacy_${idx}`,
                mode: a.mode || (a.type === "manual" ? "manual" : "automatic"),
                enabled: typeof a.enabled === "boolean" ? a.enabled : true,
                next: a.next ?? null,
              }))
              const manualActions = normalized.filter((a: any) => a.enabled && (a.mode || "automatic") === "manual")
              const autoActions = normalized.filter((a: any) => a.enabled && (a.mode || "automatic") === "automatic" && a.type !== "manual")
              const byId = new Map<string, any>()
              normalized.forEach((a: any) => byId.set(a.id, a))
              const nextLabel = (a: any) => {
                if (!a.next) return "Encerrar"
                if (a.next.kind === "stage") return `Etapa: ${getColumnName(a.next.columnId)}`
                const target = byId.get(a.next.actionId)
                return target ? `Ação: ${target.type}` : "Ação: (removida)"
              }

              return (
                <div className="space-y-2">
                  {autoActions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Fluxo automático</div>
                      <div className="space-y-1">
                        {autoActions.map((a: any) => (
                          <div key={a.id} className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getActionIcon(a.type)}
                              <span>{getActionDescription(a)}</span>
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="secondary" className="text-xs">
                              {nextLabel(a)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {manualActions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Ações manuais (sem setas)</div>
                      <div className="flex flex-wrap gap-1">
                        {manualActions.map((a: any) => (
                          <Badge key={a.id} variant="outline" className="flex items-center gap-1">
                            {getActionIcon(a.type)}
                            <span>{getActionDescription(a)}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onToggle}>
              {automation.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AutomationEditor({
  automation,
  columns,
  onSave,
  onClose,
}: {
  automation: Automation
  columns: Array<{ id: string; name: string; color: string }>
  onSave: (automation: Automation) => void
  onClose: () => void
}) {
  const [localAutomation, setLocalAutomation] = useState<Automation>({ ...automation })
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null)

  const hasWhatsAppAction = localAutomation.actions.some((action) => action.type === "whatsapp")

  const addAction = (action: AutomationAction) => {
    const withMeta: AutomationAction = {
      enabled: true,
      mode: "automatic",
      id: (action as any).id || `act_${Date.now()}`,
      ...(action as any),
    }

    if (editingActionIndex !== null) {
      const newActions = [...localAutomation.actions]
      newActions[editingActionIndex] = withMeta
      setLocalAutomation({ ...localAutomation, actions: newActions })
    } else {
      setLocalAutomation({
        ...localAutomation,
        actions: [...localAutomation.actions, withMeta],
      })
    }
    setShowActionDialog(false)
    setEditingActionIndex(null)
  }

  const removeAction = (index: number) => {
    setLocalAutomation({
      ...localAutomation,
      actions: localAutomation.actions.filter((_, i) => i !== index),
    })
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {localAutomation.isConditional ? (
              <>
                <Clock className="h-5 w-5 mr-2" />
                Automação com Gatilho
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Automação Simples
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da Automação</Label>
              <Input
                value={localAutomation.name}
                onChange={(e) => setLocalAutomation({ ...localAutomation, name: e.target.value })}
                placeholder="Nome da automação"
              />
            </div>
            <div>
              <Label>Etapa</Label>
              <Select
                value={localAutomation.columnId}
                onValueChange={(value) => setLocalAutomation({ ...localAutomation, columnId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: column.color }} />
                        {column.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasWhatsAppAction && (
            <div className="flex items-center space-x-2">
              <Switch
                checked={localAutomation.isConditional}
                onCheckedChange={(checked) =>
                  setLocalAutomation({
                    ...localAutomation,
                    isConditional: checked,
                    conditionalFlow: checked
                      ? {
                          timeLimit: 24,
                          onSuccess: { targetColumnId: "", actions: [] },
                          onFailure: { targetColumnId: "", actions: [] },
                        }
                      : undefined,
                  })
                }
              />
              <Label>Automação com gatilho de tempo e resposta (WhatsApp)</Label>
            </div>
          )}

          {hasWhatsAppAction && localAutomation.isConditional && localAutomation.conditionalFlow && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Configuração do Gatilho
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tempo limite para resposta (horas)</Label>
                  <Input
                    type="number"
                    value={localAutomation.conditionalFlow.timeLimit}
                    onChange={(e) =>
                      setLocalAutomation({
                        ...localAutomation,
                        conditionalFlow: {
                          ...localAutomation.conditionalFlow!,
                          timeLimit: Number(e.target.value),
                        },
                      })
                    }
                    placeholder="24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tempo que o lead tem para responder antes da ação alternativa
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Label className="text-green-800 font-medium">Se RESPONDER</Label>
                    <Select
                      value={localAutomation.conditionalFlow.onSuccess.targetColumnId}
                      onValueChange={(value) =>
                        setLocalAutomation({
                          ...localAutomation,
                          conditionalFlow: {
                            ...localAutomation.conditionalFlow!,
                            onSuccess: {
                              ...localAutomation.conditionalFlow!.onSuccess,
                              targetColumnId: value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Mover para etapa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: column.color }} />
                              {column.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Label className="text-red-800 font-medium">Se NÃO RESPONDER</Label>
                    <Select
                      value={localAutomation.conditionalFlow.onFailure.targetColumnId}
                      onValueChange={(value) =>
                        setLocalAutomation({
                          ...localAutomation,
                          conditionalFlow: {
                            ...localAutomation.conditionalFlow!,
                            onFailure: {
                              ...localAutomation.conditionalFlow!.onFailure,
                              targetColumnId: value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Mover para etapa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: column.color }} />
                              {column.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quando executar</Label>
              <Select
                value={localAutomation.trigger}
                onValueChange={(value: AutomationTrigger) => setLocalAutomation({ ...localAutomation, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_enter">Ao entrar na etapa</SelectItem>
                  <SelectItem value="on_exit">Ao sair da etapa</SelectItem>
                  <SelectItem value="on_time_spent">Após tempo na etapa</SelectItem>
                  <SelectItem value="on_deadline">Próximo ao prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Atraso inicial (minutos)</Label>
              <Input
                type="number"
                value={localAutomation.delay || ""}
                onChange={(e) =>
                  setLocalAutomation({
                    ...localAutomation,
                    delay: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Ações da Etapa</Label>
              <Button onClick={() => setShowActionDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ação
              </Button>
            </div>

            <div className="space-y-2">
              {localAutomation.actions.map((action, index) => (
                <ActionCard
                  key={index}
                  action={action}
                  columns={columns}
                  onEdit={() => {
                    setEditingActionIndex(index)
                    setShowActionDialog(true)
                  }}
                  onDelete={() => removeAction(index)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={localAutomation.active}
              onCheckedChange={(active) => setLocalAutomation({ ...localAutomation, active })}
            />
            <Label>Automação ativa</Label>
          </div>
        </div>

        {showActionDialog && (
          <ActionEditor
            action={editingActionIndex !== null ? localAutomation.actions[editingActionIndex] : null}
            columns={columns}
            availableActions={localAutomation.actions}
            onSave={addAction}
            onClose={() => {
              setShowActionDialog(false)
              setEditingActionIndex(null)
            }}
          />
        )}

        <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(localAutomation)}>Salvar Automação</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ActionCard({
  action,
  columns,
  onEdit,
  onDelete,
}: {
  action: AutomationAction
  columns: Array<{ id: string; name: string; color: string }>
  onEdit: () => void
  onDelete: () => void
}) {
  const getActionIcon = (type: string) => {
    const icons = {
      whatsapp: <MessageSquare className="h-4 w-4" />,
      task: <CheckSquare className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      notification: <Bell className="h-4 w-4" />,
      move_lead: <ArrowRight className="h-4 w-4" />,
      transfer_command: <RefreshCw className="h-4 w-4" />,
    }
    return icons[type as keyof typeof icons]
  }

  const getActionDescription = (action: AutomationAction) => {
    switch (action.type) {
      case "whatsapp":
        return `WhatsApp: ${action.template.substring(0, 50)}...`
      case "task":
        return `Tarefa: ${action.title}`
      case "email":
        return `Email: ${action.subject}`
      case "notification":
        return `Notificação: ${action.title}`
      case "move_lead":
        const targetColumn = columns.find((c) => c.id === action.targetColumnId)
        return `Mover para: ${targetColumn?.name || "Etapa não encontrada"}`
      case "transfer_command":
        return "Transferir lead"
      case "batch_transfer":
        return "Transferência em lote"
      case "manual":
        return "Ação manual (pausa o fluxo)"
      default:
        return "Ação desconhecida"
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getActionIcon(action.type)}
          <span className="text-sm">{getActionDescription(action)}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionEditor({
  action,
  columns,
  availableActions,
  onSave,
  onClose,
}: {
  action: AutomationAction | null
  columns: Array<{ id: string; name: string; color: string }>
  availableActions: AutomationAction[]
  onSave: (action: AutomationAction) => void
  onClose: () => void
}) {
  const [actionType, setActionType] = useState<string>(action?.type || "whatsapp")
  const [actionData, setActionData] = useState<Record<string, any>>(action || {})

  const handleSave = () => {
    let variables: Record<string, string> | undefined
    if (typeof actionData.variablesText === "string" && actionData.variablesText.trim()) {
      try { variables = JSON.parse(actionData.variablesText) } catch { variables = undefined }
    }
    let customRecipients: string[] | undefined
    if (actionData.recipients === "custom" && typeof actionData.customRecipientsText === "string") {
      customRecipients = actionData.customRecipientsText
        .split(/[,;\s]+/)
        .map((s: string) => s.replace(/[^0-9]/g, ""))
        .filter((s: string) => s.length > 0)
    }
    const base: any = { ...actionData }
    if (variables) base.variables = variables
    if (customRecipients) base.customRecipients = customRecipients
    delete base.variablesText
    delete base.customRecipientsText

    const newAction: AutomationAction = {
      id: actionData.id || `act_${Date.now()}`,
      enabled: typeof actionData.enabled === "boolean" ? actionData.enabled : true,
      mode: (actionData.mode as ActionMode) || (actionType === "manual" ? "manual" : "automatic"),
      delayConfig: actionData.delayConfig,
      next: actionData.next,
      type: actionType as any,
      ...base,
    } as any
    onSave(newAction)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Ação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tipo de Ação</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="task">Tarefa</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="notification">Notificação</SelectItem>
                <SelectItem value="move_lead">Mover Lead</SelectItem>
                <SelectItem value="transfer_command">Transferir Lead</SelectItem>
                <SelectItem value="batch_transfer">Disparo Automático em Lote</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nome da Ação (Opcional)</Label>
            <Input
              value={actionData.customName || ""}
              onChange={(e) => setActionData({ ...actionData, customName: e.target.value })}
              placeholder="Ex: Envio de Saudação"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Modo</Label>
              <Select
                value={actionData.mode || (actionType === "manual" ? "manual" : "automatic")}
                onValueChange={(value) => setActionData({ ...actionData, mode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automática</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Delay</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={actionData.delayConfig?.value ?? ""}
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      delayConfig: {
                        value: e.target.value ? Number(e.target.value) : 0,
                        unit: actionData.delayConfig?.unit || "minutes",
                      },
                    })
                  }
                  placeholder="0"
                />
                <Select
                  value={actionData.delayConfig?.unit || "minutes"}
                  onValueChange={(unit) =>
                    setActionData({
                      ...actionData,
                      delayConfig: {
                        value: actionData.delayConfig?.value || 0,
                        unit,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Habilitada</Label>
              <div className="h-10 flex items-center">
                <Switch checked={actionData.enabled ?? true} onCheckedChange={(enabled) => setActionData({ ...actionData, enabled })} />
              </div>
            </div>
          </div>

          {(actionData.mode || (actionType === "manual" ? "manual" : "automatic")) === "automatic" && actionType !== "manual" && (
            <div className="space-y-2">
              <Label>Próximo no fluxo automático</Label>
              <Select
                value={
                  actionData.next?.kind === "action"
                    ? `action:${actionData.next.actionId}`
                    : actionData.next?.kind === "stage"
                      ? `stage:${actionData.next.columnId}`
                      : "none"
                }
                onValueChange={(value) => {
                  if (value === "none") {
                    setActionData({ ...actionData, next: null })
                    return
                  }
                  const [kind, id] = value.split(":")
                  if (kind === "action") {
                    setActionData({ ...actionData, next: { kind: "action", actionId: id } })
                  } else {
                    setActionData({ ...actionData, next: { kind: "stage", columnId: id } })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Definir próximo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Encerrar fluxo</SelectItem>
                  {availableActions
                    .filter((a) => a.id && a.id !== actionData.id && (a.mode || "automatic") === "automatic" && a.type !== "manual")
                    .map((a) => (
                      <SelectItem key={a.id} value={`action:${a.id}`}>
                        Próxima ação: {a.type}
                      </SelectItem>
                    ))}
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={`stage:${c.id}`}>
                      Mover para etapa: {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Esse vínculo desenha a seta e controla a execução do fluxo.</p>
            </div>
          )}

          {actionType === "whatsapp" && (
            <>
              <div>
                <Label>Template</Label>
                <Input
                  value={actionData.template || ""}
                  onChange={(e) => setActionData({ ...actionData, template: e.target.value })}
                  placeholder="Mensagem WhatsApp"
                />
              </div>
              <div>
                <Label>Destinatários</Label>
                <Select
                  value={actionData.recipients || "assigned"}
                  onValueChange={(value) => setActionData({ ...actionData, recipients: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Responsável</SelectItem>
                    <SelectItem value="all_members">Todos os membros</SelectItem>
                    <SelectItem value="lead_contact">Contato principal</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {actionData.recipients === "custom" && (
                <div>
                  <Label>Números (separados por vírgula)</Label>
                  <Input
                    value={actionData.customRecipientsText || ""}
                    onChange={(e) => setActionData({ ...actionData, customRecipientsText: e.target.value })}
                    placeholder="5541999999999, 5511999999999"
                  />
                </div>
              )}
              <div>
                <Label>Variáveis do Template (JSON)</Label>
                <Input
                  value={actionData.variablesText || ""}
                  onChange={(e) => setActionData({ ...actionData, variablesText: e.target.value })}
                  placeholder='{"client_name":"Marcio"}'
                />
              </div>
            </>
          )}

          {actionType === "task" && (
            <>
              <div>
                <Label>Título da Tarefa</Label>
                <Input
                  value={actionData.title || ""}
                  onChange={(e) => setActionData({ ...actionData, title: e.target.value })}
                  placeholder="Título"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={actionData.description || ""}
                  onChange={(e) => setActionData({ ...actionData, description: e.target.value })}
                  placeholder="Descrição"
                />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={actionData.priority || "medium"}
                  onValueChange={(value) => setActionData({ ...actionData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {actionType === "email" && (
            <>
              <div>
                <Label>Assunto</Label>
                <Input
                  value={actionData.subject || ""}
                  onChange={(e) => setActionData({ ...actionData, subject: e.target.value })}
                  placeholder="Assunto do email"
                />
              </div>
              <div>
                <Label>Template</Label>
                <Input
                  value={actionData.template || ""}
                  onChange={(e) => setActionData({ ...actionData, template: e.target.value })}
                  placeholder="Corpo do email"
                />
              </div>
            </>
          )}

          {actionType === "notification" && (
            <>
              <div>
                <Label>Título</Label>
                <Input
                  value={actionData.title || ""}
                  onChange={(e) => setActionData({ ...actionData, title: e.target.value })}
                  placeholder="Título da notificação"
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Input
                  value={actionData.message || ""}
                  onChange={(e) => setActionData({ ...actionData, message: e.target.value })}
                  placeholder="Mensagem"
                />
              </div>
            </>
          )}

          {actionType === "move_lead" && (
            <div>
              <Label>Mover para Etapa</Label>
              <Select
                value={actionData.targetColumnId || ""}
                onValueChange={(value) => setActionData({ ...actionData, targetColumnId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: column.color }} />
                        {column.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === "batch_transfer" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Configuração de Transferência em Lote</h3>
                <p className="text-sm text-blue-800">
                  Processa leads em grupos (lotes) com intervalo de tempo entre cada processamento. Ideal para
                  distribuir carga e evitar picos de atividade.
                </p>
              </div>

              <div>
                <Label className="font-medium">Transferir para Etapa</Label>
                <Select
                  value={actionData.targetStageId || ""}
                  onValueChange={(value) => setActionData({ ...actionData, targetStageId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a etapa de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: column.color }} />
                          {column.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Etapa para a qual os leads serão transferidos automaticamente
                </p>
              </div>

              <div>
                <Label className="font-medium">Tamanho do Lote</Label>
                <Input
                  type="number"
                  value={actionData.batchSize || 5}
                  onChange={(e) => setActionData({ ...actionData, batchSize: Number(e.target.value) })}
                  placeholder="Quantidade de leads por lote"
                  min="1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quantos leads serão processados em cada lote. Ex: 5 leads a cada intervalo
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Intervalo entre Lotes</Label>
                  <Input
                    type="number"
                    value={actionData.intervalValue || 1}
                    onChange={(e) => setActionData({ ...actionData, intervalValue: Number(e.target.value) })}
                    placeholder="Valor"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tempo de espera entre cada lote</p>
                </div>
                <div>
                  <Label className="font-medium">Unidade de Tempo</Label>
                  <Select
                    value={actionData.intervalUnit || "hours"}
                    onValueChange={(value) => setActionData({ ...actionData, intervalUnit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                      <SelectItem value="days">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Minutos, horas ou dias entre cada lote</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Total de Leads a Processar (opcional)</Label>
                <Input
                  type="number"
                  value={actionData.totalLeads || ""}
                  onChange={(e) =>
                    setActionData({ ...actionData, totalLeads: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="Deixe em branco para processar todos os leads"
                  min="1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe em branco para processar todos os leads disponíveis, ou especifique um número máximo
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Exemplo:</strong> Com tamanho de lote 5, intervalo 1 hora e total 50 leads, o sistema
                  processará 5 leads a cada hora até completar os 50 leads (10 horas no total).
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Ação</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
