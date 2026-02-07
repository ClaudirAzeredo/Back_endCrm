"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Circle, FileText, Image as ImageIcon, Video } from "lucide-react"

interface FlowNodeProps {
  stepId: string
  steps: any[]
  depth?: number
  onStepClick?: (stepId: string) => void
  activeStepId?: string
  visited?: Set<string>
}

export function MessageTemplateFlowDiagram({ 
  stepId, 
  steps, 
  depth = 0,
  onStepClick,
  activeStepId,
  visited = new Set()
}: FlowNodeProps) {
  const step = steps.find(s => s.id === stepId)
  if (!step) return null

  // Prevent infinite loops
  if (visited.has(stepId)) {
      return (
        <div className="flex items-center gap-2 p-2 rounded-md border border-dashed text-xs text-muted-foreground bg-muted/10">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Retorno para: {step.title}</span>
        </div>
      )
  }

  const newVisited = new Set(visited)
  newVisited.add(stepId)

  const isSelected = step.id === activeStepId

  return (
    <div className="flex flex-col items-start">
      {/* Node Representation */}
      <div 
        className={`
          flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-all
          ${isSelected ? "bg-primary/10 border-primary ring-1 ring-primary" : "bg-card border-border hover:bg-accent"}
          ${depth === 0 ? "mb-4" : "my-2"}
        `}
        onClick={() => onStepClick?.(step.id)}
        style={{ minWidth: "200px" }}
      >
        <div className="flex-1">
          <div className="font-semibold truncate max-w-[180px]">{step.title}</div>
          <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{step.text}</div>
          {step.mediaType && step.mediaType !== "none" && (
             <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-500">
                {step.mediaType === "image" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                Mídia anexada
             </div>
          )}
        </div>
        {isSelected && <Circle className="h-2 w-2 text-primary fill-primary" />}
      </div>

      {/* Children (Buttons -> Next Steps) */}
      {Array.isArray(step.buttons) && step.buttons.length > 0 && (
        <div className="pl-6 border-l-2 border-dashed border-muted-foreground/20 ml-4 space-y-2">
           {step.buttons.map((btn: any) => {
             const nextStep = steps.find(s => s.id === btn.nextStepId)
             return (
               <div key={btn.id} className="relative pt-2">
                 {/* Connection Line */}
                 <div className="absolute top-[22px] -left-6 w-6 h-[1px] bg-dashed bg-muted-foreground/20 border-t border-dashed border-muted-foreground/40" />
                 
                 {/* Button Label */}
                 <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] h-5 px-1 font-normal bg-muted/50">
                        {btn.label}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                 </div>

                 {/* Recursive Child or End State */}
                 {nextStep ? (
                   <MessageTemplateFlowDiagram 
                      stepId={nextStep.id} 
                      steps={steps} 
                      depth={depth + 1} 
                      onStepClick={onStepClick}
                      activeStepId={activeStepId}
                      visited={newVisited}
                   />
                 ) : (
                   <div className="p-2 rounded border border-dashed text-[10px] text-muted-foreground bg-muted/10 min-w-[150px]">
                      {btn.nextStepId ? "Etapa não encontrada" : "Fim do fluxo"}
                   </div>
                 )}
               </div>
             )
           })}
        </div>
      )}
    </div>
  )
}
