"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldAlert } from "lucide-react"
import { MessageTemplatePreview } from "@/components/message-template-preview"
import type { ModelState, TemplateComputed, ThrottlingState } from "./mass-action-types"

export function MassActionTemplateStep({
  model,
  templateComputed,
  throttling,
  onChangeModel,
  onChangeThrottling,
  onOpenTemplates,
  onBack,
  onNext,
}: {
  model: ModelState
  templateComputed: TemplateComputed
  throttling: ThrottlingState
  onChangeModel: (patch: Partial<ModelState>) => void
  onChangeThrottling: (patch: Partial<ThrottlingState>) => void
  onOpenTemplates: () => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Modelo de mensagem</Label>
          <Select
            value={model.templateId}
            onValueChange={(v) => {
              onChangeModel({ templateId: v, activeFlowStepId: undefined })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={templateComputed.isTemplatesLoading ? "Carregando…" : "Selecione um modelo"} />
            </SelectTrigger>
            <SelectContent>
              {templateComputed.templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onOpenTemplates}>
              Criar novo modelo
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Envio seguro</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Delay (ms)</div>
              <Input
                type="number"
                min={0}
                value={throttling.delayMs}
                onChange={(e) => onChangeThrottling({ delayMs: Number(e.target.value || 0) })}
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Máx./min</div>
              <Input
                type="number"
                min={1}
                value={throttling.maxPerMinute}
                onChange={(e) => onChangeThrottling({ maxPerMinute: Math.max(1, Number(e.target.value || 1)) })}
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Máx./hora</div>
              <Input
                type="number"
                min={1}
                value={throttling.maxPerHour}
                onChange={(e) => onChangeThrottling({ maxPerHour: Math.max(1, Number(e.target.value || 1)) })}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Delay efetivo: <span className="font-medium text-foreground">{throttling.computedMinDelay}ms</span>
          </div>
        </div>
      </div>

      {throttling.showRiskWarning && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Alerta de risco de bloqueio</AlertTitle>
          <AlertDescription>
            Configuração agressiva pode aumentar risco de bloqueio. Reduza o ritmo e valide o conteúdo antes de enviar.
          </AlertDescription>
        </Alert>
      )}

      {model.selectedTemplate && (
        <div className="h-[420px] rounded-md border overflow-hidden">
          <MessageTemplatePreview
            type={model.selectedTemplate.type}
            content={model.selectedTemplate.content}
            activeStepId={model.activeFlowStepId}
            onStepChange={(sid) => onChangeModel({ activeFlowStepId: sid })}
          />
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!model.selectedTemplate}>
          Próximo
        </Button>
      </div>
    </div>
  )
}
