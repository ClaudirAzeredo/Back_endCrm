"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import type { Tag as TagType } from "@/lib/api/tags-api"
import type { AudienceComputed, AudienceState, Funnel, LeadLimitMode, LeadOrder, TagMode } from "./mass-action-types"

const toggle = (arr: string[], value: string) => {
  const s = new Set(arr)
  if (s.has(value)) s.delete(value)
  else s.add(value)
  return Array.from(s)
}

export function MassActionAudienceStep({
  funnels,
  availableTags,
  state,
  computed,
  onChange,
  onNext,
  onReset,
}: {
  funnels: Funnel[]
  availableTags: TagType[]
  state: AudienceState
  computed: AudienceComputed
  onChange: (patch: Partial<AudienceState>) => void
  onNext: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Funis</Label>
          <ScrollArea className="h-40 rounded-md border p-2">
            <div className="space-y-2">
              {funnels
                .filter((f) => f.isActive !== false)
                .map((f) => (
                  <label key={f.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={state.funnelIds.includes(f.id)}
                      onCheckedChange={() => onChange({ funnelIds: toggle(state.funnelIds, f.id) })}
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-2">
          <Label>Etapas</Label>
          <ScrollArea className="h-40 rounded-md border p-2">
            <div className="space-y-2">
              {computed.availableStages.length === 0 ? (
                <div className="text-sm text-muted-foreground">Selecione ao menos 1 funil.</div>
              ) : (
                computed.availableStages.map((s) => (
                  <label key={`${s.id}_${s.funnelName}`} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={state.stageIds.includes(s.id)}
                      onCheckedChange={() => onChange({ stageIds: toggle(state.stageIds, s.id) })}
                    />
                    <span className="truncate">{s.title}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {s.funnelName}
                    </Badge>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="text-xs text-muted-foreground">Deixe vazio para considerar todas as etapas.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Data inicial</Label>
          <Input type="date" value={state.dateStart} onChange={(e) => onChange({ dateStart: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Data final</Label>
          <Input type="date" value={state.dateEnd} onChange={(e) => onChange({ dateEnd: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Lógica de tags</Label>
          <Select value={state.tagMode} onValueChange={(v) => onChange({ tagMode: v as TagMode })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Contém todas as tags</SelectItem>
              <SelectItem value="any">Contém pelo menos uma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <ScrollArea className="h-32 rounded-md border p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableTags.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={state.tagIds.includes(t.id)} onCheckedChange={() => onChange({ tagIds: toggle(state.tagIds, t.id) })} />
                <span className="truncate">{t.name}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
        <div className="text-xs text-muted-foreground">Deixe vazio para considerar todas as tags.</div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Quantidade de leads</Label>
          <Select value={state.leadLimitMode} onValueChange={(v) => onChange({ leadLimitMode: v as LeadLimitMode })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os filtrados</SelectItem>
              <SelectItem value="custom">Quantidade personalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            type="number"
            min={1}
            disabled={state.leadLimitMode !== "custom"}
            value={state.customLeadLimit}
            onChange={(e) => onChange({ customLeadLimit: Number(e.target.value || 0) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Ordem</Label>
          <Select value={state.leadOrder} onValueChange={(v) => onChange({ leadOrder: v as LeadOrder })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oldest">Mais antigos primeiro</SelectItem>
              <SelectItem value="newest">Mais recentes primeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="text-sm">
            {computed.isLeadsLoading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando leads…
              </span>
            ) : (
              <span>
                Total de leads encontrados: <span className="font-semibold">{computed.filteredCount}</span>
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Alvo do disparo: <span className="font-medium text-foreground">{computed.targetLeadCount}</span> leads
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onReset}>
          Limpar
        </Button>
        <Button onClick={onNext} disabled={state.funnelIds.length === 0 || computed.targetLeadCount === 0}>
          Próximo
        </Button>
      </div>
    </div>
  )
}

