"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import type { MessageTemplate } from "@/lib/api/message-templates-api"
import { renderTemplateAsText, type MassActionLead } from "@/lib/mass-action-utils"

export function MassActionReviewStep({
  template,
  sampleLead,
  totalsLeadCount,
  totalsItemCount,
  computedMinDelay,
  isSending,
  lastJobId,
  onOpenLogs,
  onBack,
  onConfirm,
}: {
  template: MessageTemplate
  sampleLead: MassActionLead
  totalsLeadCount: number
  totalsItemCount: number
  computedMinDelay: number
  isSending: boolean
  lastJobId: string | null
  onOpenLogs: (jobId?: string) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (isSending) return
    setConfirmed(false)
  }, [isSending, template.id])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Confirmação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              Você está prestes a disparar mensagens para <span className="font-semibold">{totalsLeadCount}</span> leads.
              Deseja continuar?
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Mensagens estimadas</div>
                <div className="text-lg font-semibold">{totalsItemCount}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Ritmo</div>
                <div className="text-lg font-semibold">~{Math.floor(60000 / Math.max(1, computedMinDelay))}/min</div>
              </div>
            </div>

            {lastJobId && (
              <div className="rounded-md border p-3 flex items-center justify-between">
                <div className="text-sm">
                  Job: <span className="font-mono text-xs">{lastJobId}</span>
                </div>
                <Button variant="outline" onClick={() => onOpenLogs(lastJobId)}>
                  Ver logs
                </Button>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(Boolean(v))} />
              <span>Confirmo que revisei o preview e aceito disparar em lote.</span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pré-visualização (exemplo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">Modelo: {template.name}</div>
            <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {renderTemplateAsText(template, { lead: sampleLead, stageName: "Prospecção", tagsText: "SaaS, Imobiliário" })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} disabled={isSending}>
          Voltar
        </Button>
        <Button onClick={onConfirm} disabled={isSending || totalsItemCount <= 0 || !confirmed}>
          {isSending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Disparando…
            </span>
          ) : (
            "Confirmar disparo"
          )}
        </Button>
      </div>
    </div>
  )
}
