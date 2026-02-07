"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Megaphone, ShieldAlert } from "lucide-react"

import { useApiMessageTemplates } from "@/hooks/use-api-message-templates"
import type { MassActionAssistantBaseProps, StepId } from "@/components/mass-action/mass-action-types"
import { MassActionAudienceStep } from "@/components/mass-action/mass-action-audience-step"
import { MassActionTemplateStep } from "@/components/mass-action/mass-action-template-step"
import { MassActionReviewStep } from "@/components/mass-action/mass-action-review-step"
import { useMassActionAssistant } from "@/hooks/use-mass-action-assistant"

export default function MassActionAssistantDialog({
  open,
  onOpenChange,
  initialFunnelId,
  funnels,
  availableTags,
  onOpenTemplates,
  onOpenLogs,
}: MassActionAssistantBaseProps) {
  const { templates, isLoading: isTemplatesLoading, fetchTemplates } = useApiMessageTemplates()
  const assistant = useMassActionAssistant({ open, initialFunnelId, funnels, availableTags, templates })

  useEffect(() => {
    if (!open) return
    fetchTemplates()
  }, [open, fetchTemplates])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) assistant.resetFlow()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Ação em Massa
          </DialogTitle>
          <DialogDescription>Filtre leads, selecione um modelo e confirme o disparo.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Configuração</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={assistant.step} onValueChange={(v) => assistant.setStep(v as StepId)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="publico">Público</TabsTrigger>
                  <TabsTrigger value="modelo" disabled={!assistant.canGoPublico}>
                    Modelo
                  </TabsTrigger>
                  <TabsTrigger value="revisao" disabled={!assistant.canGoPublico || !assistant.canGoModelo}>
                    Revisão
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="publico" className="mt-4">
                  <MassActionAudienceStep
                    funnels={funnels}
                    availableTags={availableTags}
                    state={assistant.audience}
                    computed={{
                      availableStages: assistant.availableStages,
                      isLeadsLoading: assistant.isLeadsLoading,
                      filteredCount: assistant.filteredLeads.length,
                      targetLeadCount: assistant.totals.leadCount,
                      estimatedItemCount: assistant.totals.itemsCount,
                    }}
                    onChange={(patch) => assistant.setAudience((prev) => ({ ...prev, ...patch }))}
                    onReset={assistant.resetFlow}
                    onNext={() => assistant.setStep("modelo")}
                  />
                </TabsContent>

                <TabsContent value="modelo" className="mt-4">
                  <MassActionTemplateStep
                    model={{
                      templateId: assistant.model.templateId,
                      selectedTemplate: templates.find((t) => t.id === assistant.model.templateId) || null,
                      activeFlowStepId: assistant.model.activeFlowStepId,
                    }}
                    templateComputed={{ templates, isTemplatesLoading }}
                    throttling={{
                      delayMs: assistant.delayMs,
                      maxPerMinute: assistant.maxPerMinute,
                      maxPerHour: assistant.maxPerHour,
                      computedMinDelay: assistant.computedMinDelay,
                      showRiskWarning: assistant.showRiskWarning,
                    }}
                    onChangeModel={(patch) => assistant.setModel((prev) => ({ ...prev, ...patch }))}
                    onChangeThrottling={(patch) => {
                      if (typeof patch.delayMs === "number") assistant.setDelayMs(patch.delayMs)
                      if (typeof patch.maxPerMinute === "number") assistant.setMaxPerMinute(patch.maxPerMinute)
                      if (typeof patch.maxPerHour === "number") assistant.setMaxPerHour(patch.maxPerHour)
                    }}
                    onOpenTemplates={onOpenTemplates}
                    onBack={() => assistant.setStep("publico")}
                    onNext={() => assistant.setStep("revisao")}
                  />
                </TabsContent>

                <TabsContent value="revisao" className="mt-4">
                  {assistant.model.selectedTemplate ? (
                    <MassActionReviewStep
                      template={assistant.model.selectedTemplate}
                      sampleLead={assistant.sampleLead}
                      totalsLeadCount={assistant.totals.leadCount}
                      totalsItemCount={assistant.totals.itemsCount}
                      computedMinDelay={assistant.computedMinDelay}
                      isSending={assistant.isSending}
                      lastJobId={assistant.lastJobId}
                      onOpenLogs={onOpenLogs}
                      onBack={() => assistant.setStep("modelo")}
                      onConfirm={async () => {
                        try {
                          const jobId = await assistant.runMassAction()
                          if (jobId) onOpenLogs(jobId)
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    />
                  ) : null}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Leads filtrados</div>
                <div className="text-lg font-semibold">{assistant.filteredLeads.length}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Leads no alvo</div>
                <div className="text-lg font-semibold">{assistant.totals.leadCount}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Mensagens estimadas</div>
                <div className="text-lg font-semibold">{assistant.totals.itemsCount}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Números inválidos são ignorados e números duplicados por lead são removidos automaticamente.
              </div>
              {assistant.showRiskWarning ? (
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Recomendação</AlertTitle>
                  <AlertDescription>Comece com poucos leads e aumente gradualmente.</AlertDescription>
                </Alert>
              ) : null}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => onOpenLogs()}>
                  Ver logs
                </Button>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
