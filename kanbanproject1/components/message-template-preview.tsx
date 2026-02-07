"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Smartphone, Workflow } from "lucide-react"
import type { MessageTemplateType } from "@/lib/api/message-templates-api"
import { MessageTemplateFlowDiagram } from "@/components/message-template-flow-diagram"

const sampleValues: Record<string, string> = {
  "[NOME_LEAD]": "João da Silva",
  "[PRIMEIRO_NOME_LEAD]": "João",
  "[RAZAO_SOCIAL]": "Empresa Exemplo LTDA",
  "[NOME_MINHA_EMPRESA]": "UniCRM",
  "[TAGS]": "Imobiliário, SaaS",
  "{nome}": "João da Silva",
  "{empresa}": "Empresa Exemplo LTDA",
  "{etapa_funil}": "Prospecção",
  "{vendedor}": "Maria Oliveira",
}

function resolveText(raw: string) {
  let out = raw
  for (const [k, v] of Object.entries(sampleValues)) {
    out = out.split(k).join(v)
  }
  return out
}

export function MessageTemplatePreview({
  type,
  content,
  activeStepId,
  onStepChange,
}: {
  type: MessageTemplateType
  content: any
  activeStepId?: string
  onStepChange?: (stepId: string) => void
}) {
  const [viewMode, setViewMode] = useState<"preview" | "diagram">("preview")

  const renderBubbleText = (text: string) => (
    <div className="text-sm whitespace-pre-wrap leading-relaxed">{resolveText(text || "")}</div>
  )

  const renderButtons = (buttons: Array<{ id: string; label: string; nextStepId?: string }>) => (
    <div className="mt-2 space-y-2">
      {buttons.map((b) => (
        <button
          key={b.id}
          type="button"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
          onClick={() => {
            if (b.nextStepId && onStepChange) onStepChange(b.nextStepId)
          }}
        >
          {b.label}
        </button>
      ))}
    </div>
  )

  const renderMedia = (mediaType: string, mediaUrl: string) => {
    if (!mediaType || mediaType === "none") return null
    
    if (!mediaUrl) {
       return (
          <div className="w-full rounded-md border border-white/10 bg-white/5 h-40 flex items-center justify-center text-xs text-white/60 mb-2">
            Mídia não carregada
          </div>
       )
    }

    if (mediaType === "image") {
        return <img src={mediaUrl} alt="Media" className="w-full rounded-md object-cover max-h-56 mb-2" />
    }
    if (mediaType === "video") {
        return <video src={mediaUrl} controls className="w-full rounded-md max-h-56 mb-2" />
    }
    return null
  }

  let bubble: React.ReactNode = null
  if (type === "text") {
    bubble = renderBubbleText(String(content?.text || ""))
  }
  if (type === "image" || type === "video") {
    const mediaSrc = content?.mediaDataUrl || content?.mediaUrl
    const caption = String(content?.caption || "")
    bubble = (
      <div className="space-y-2">
        {renderMedia(type, mediaSrc)}
        {caption ? renderBubbleText(caption) : null}
      </div>
    )
  }
  if (type === "buttons") {
    const steps: Array<any> = Array.isArray(content?.steps) ? content.steps : []
    const step = steps.find((s) => s.id === activeStepId) || steps[0]
    const text = String(step?.text || "")
    const buttons = Array.isArray(step?.buttons) ? step.buttons : []
    const mediaType = step?.mediaType || "none"
    const mediaSrc = step?.mediaDataUrl || step?.mediaUrl || ""

    bubble = (
      <div>
        {renderMedia(mediaType, mediaSrc)}
        {renderBubbleText(text)}
        {renderButtons(buttons)}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
           <div className="text-sm font-medium">Preview</div>
           <Badge variant="secondary" className="capitalize">
             {type}
           </Badge>
        </div>
        {type === "buttons" && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                <Button 
                    variant={viewMode === "preview" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setViewMode("preview")}
                    title="Visualizar no Celular"
                >
                    <Smartphone className="h-3 w-3" />
                </Button>
                <Button 
                    variant={viewMode === "diagram" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setViewMode("diagram")}
                    title="Visualizar Fluxograma"
                >
                    <Workflow className="h-3 w-3" />
                </Button>
            </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-[linear-gradient(180deg,rgba(17,24,39,0.35),rgba(2,6,23,0.35))] p-4 relative">
        {viewMode === "diagram" && type === "buttons" ? (
             <div className="min-w-full min-h-full p-4 bg-background/95 rounded-md shadow-sm overflow-auto">
                 <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Estrutura do Fluxo</h3>
                 <MessageTemplateFlowDiagram 
                    stepId={content?.startStepId || content?.steps?.[0]?.id}
                    steps={content?.steps || []}
                    onStepClick={onStepChange}
                    activeStepId={activeStepId}
                 />
             </div>
        ) : (
            <div className="max-w-[280px] ml-auto">
            <div className="rounded-2xl rounded-tr-md bg-emerald-600/90 text-white p-3 shadow">
                {bubble}
            </div>
            <div className="mt-1 text-[10px] text-white/60 text-right">12:34</div>
            </div>
        )}
      </div>

      <div className="px-4 py-3 border-t text-xs text-muted-foreground">
        {viewMode === "diagram" 
            ? "Clique em uma etapa para editá-la." 
            : "Variáveis no preview usam valores de exemplo."
        }
      </div>
    </div>
  )
}
