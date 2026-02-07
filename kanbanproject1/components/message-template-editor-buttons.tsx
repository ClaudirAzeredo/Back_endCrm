"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, GitFork, Plus, Trash2, Video } from "lucide-react"
import type { Draft } from "@/components/message-template-draft"
import { insertAtCursor } from "@/components/message-template-draft"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export function MessageTemplateEditorButtons({
  draft,
  activeStepId,
  onActiveStepIdChange,
  onDraftChange,
  registerInsertHandler,
}: {
  draft: Draft
  activeStepId: string | undefined
  onActiveStepIdChange: (stepId: string | undefined) => void
  onDraftChange: (next: Draft) => void
  registerInsertHandler: (fn: ((token: string) => void) | null) => void
}) {
  const steps: any[] = Array.isArray(draft.content?.steps) ? draft.content.steps : []
  const activeStep = useMemo(() => steps.find((s) => s.id === activeStepId) || steps[0], [steps, activeStepId])
  const activeButtons: any[] = Array.isArray(activeStep?.buttons) ? activeStep.buttons : []
  const textRef = useRef<HTMLTextAreaElement | null>(null)
  const activeText = String(activeStep?.text || "")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const buttonFileInputRef = useRef<HTMLInputElement | null>(null)
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const [uploadingButtonId, setUploadingButtonId] = useState<string | null>(null)

  // Find parent step (the step that links to the current step) to allow "Back" navigation
  const parentStep = useMemo(() => {
    if (!activeStep) return undefined
    return steps.find((s) => Array.isArray(s.buttons) && s.buttons.some((b: any) => b.nextStepId === activeStep.id))
  }, [steps, activeStep])

  const updateStep = (stepId: string, patch: any) => {
    const nextSteps = steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s))
    onDraftChange({ ...draft, content: { ...draft.content, steps: nextSteps } })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeStep) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      updateStep(activeStep.id, { mediaDataUrl: dataUrl, mediaUrl: "" })
    }
    reader.readAsDataURL(file)
  }

  const handleButtonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingButtonId) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      updateButton(uploadingButtonId, { feedbackMediaDataUrl: dataUrl, feedbackMediaUrl: "" })
      setUploadingButtonId(null)
    }
    reader.readAsDataURL(file)
  }

  const triggerButtonUpload = (btnId: string) => {
    setUploadingButtonId(btnId)
    setTimeout(() => buttonFileInputRef.current?.click(), 0)
  }

  const addStep = () => {
    const stepId = `step_${Date.now()}`
    const nextSteps = [...steps, { id: stepId, title: `Nova etapa ${steps.length + 1}`, text: "", buttons: [] }]
    onDraftChange({ ...draft, content: { ...draft.content, steps: nextSteps } })
    onActiveStepIdChange(stepId)
  }

  const removeActiveStep = () => {
    if (!activeStep) return
    if (steps.length <= 1) {
      alert("Você não pode remover a única etapa.")
      return
    }
    const ok = confirm(`Remover a etapa "${activeStep.title}" e todos os seus botões?`)
    if (!ok) return

    // Unlink from parent buttons
    const nextStepsUnlinked = steps.map(s => ({
        ...s,
        buttons: (s.buttons || []).map((b: any) => b.nextStepId === activeStep.id ? { ...b, nextStepId: "" } : b)
    }))
    
    const nextSteps = nextStepsUnlinked.filter((s) => s.id !== activeStep.id)
    
    // Determine fallback step
    const fallbackId = parentStep?.id || nextSteps[0]?.id

    onDraftChange({
      ...draft,
      content: { ...draft.content, steps: nextSteps, startStepId: draft.content?.startStepId === activeStep.id ? fallbackId : draft.content?.startStepId },
    })
    onActiveStepIdChange(fallbackId)
  }

  const addButton = () => {
    if (!activeStep) return
    const buttonId = `btn_${Date.now()}`
    updateStep(activeStep.id, { buttons: [...activeButtons, { id: buttonId, label: "", nextStepId: "" }] })
  }

  const updateButton = (buttonId: string, patch: any) => {
    if (!activeStep) return
    updateStep(activeStep.id, { buttons: activeButtons.map((b) => (b.id === buttonId ? { ...b, ...patch } : b)) })
  }

  const removeButton = (buttonId: string) => {
    if (!activeStep) return
    updateStep(activeStep.id, { buttons: activeButtons.filter((b) => b.id !== buttonId) })
  }

  const handleActionChange = (buttonId: string, value: string, buttonLabel: string) => {
    if (value === "create_new_step") {
      const newStepId = `step_${Date.now()}`
      // Create intelligent title based on button label
      const newTitle = buttonLabel ? `Opção "${buttonLabel}"` : `Nova Etapa ${steps.length + 1}`
      
      const newStep = {
        id: newStepId,
        title: newTitle,
        text: "",
        buttons: []
      }
      
      // Update buttons first
      const updatedButtons = activeButtons.map(b => b.id === buttonId ? { ...b, nextStepId: newStepId } : b)
      
      // Update steps list: update current step with new button link, AND add the new step
      const nextSteps = steps.map(s => s.id === activeStep.id ? { ...s, buttons: updatedButtons } : s)
      const finalSteps = [...nextSteps, newStep]

      onDraftChange({ ...draft, content: { ...draft.content, steps: finalSteps } })
      
      // Auto-navigate to the new step to continue flow
      setTimeout(() => onActiveStepIdChange(newStepId), 50)
    } else {
      updateButton(buttonId, { nextStepId: value === "no_step" ? "" : value })
    }
  }

  if (!activeStep) {
    return <div className="text-sm text-muted-foreground">Crie uma etapa para começar.</div>
  }

  const isStartStep = draft.content?.startStepId === activeStep.id || steps[0]?.id === activeStep.id

  return (
    <div className="space-y-6">
      {/* Header de Navegação */}
      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
            {parentStep && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onActiveStepIdChange(parentStep.id)} title="Voltar para etapa anterior">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            )}
            <div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{activeStep.title}</span>
                    {isStartStep && <Badge variant="outline" className="text-[10px] h-5">Início</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                    {parentStep ? `Vindo de: ${parentStep.title}` : "Ponto de partida do fluxo"}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
             {!isStartStep && (
                <Button type="button" variant="ghost" size="sm" onClick={removeActiveStep} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir etapa
                </Button>
             )}
             {/* Fallback para navegação manual se necessário */}
             <Select value={activeStep.id} onValueChange={onActiveStepIdChange}>
                <SelectTrigger className="w-[30px] h-[30px] p-0 border-none shadow-none focus:ring-0">
                   <GitFork className="h-4 w-4 text-muted-foreground" />
                </SelectTrigger>
                <SelectContent align="end">
                   <SelectGroup>
                      <SelectLabel>Navegar para etapa</SelectLabel>
                      {steps.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                   </SelectGroup>
                </SelectContent>
             </Select>
        </div>
      </div>

      {/* Editor da Etapa */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Título da Etapa (Interno)</Label>
          <Input 
            value={String(activeStep.title || "")} 
            onChange={(e) => updateStep(activeStep.id, { title: e.target.value })} 
            placeholder="Ex: Menu Principal"
          />
        </div>

        <div className="space-y-2">
            <Label>Mídia (Opcional)</Label>
            <div className="flex flex-col gap-3 p-3 border rounded-md bg-muted/20">
                <Select 
                    value={activeStep.mediaType || "none"} 
                    onValueChange={(v) => updateStep(activeStep.id, { mediaType: v })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tipo de Mídia" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                    </SelectContent>
                </Select>

                {activeStep.mediaType && activeStep.mediaType !== "none" && (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input 
                                placeholder={activeStep.mediaType === "image" ? "URL da Imagem (https://...)" : "URL do Vídeo (https://...)"}
                                value={String(activeStep.mediaUrl || "")}
                                onChange={(e) => updateStep(activeStep.id, { mediaUrl: e.target.value, mediaDataUrl: "" })}
                                className="flex-1"
                            />
                            <div className="relative">
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={activeStep.mediaType === "image" ? "image/*" : "video/*"}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Upload
                                </Button>
                            </div>
                        </div>
                        
                        {(activeStep.mediaUrl || activeStep.mediaDataUrl) && (
                            <div className="relative w-full h-32 bg-black/5 rounded-md overflow-hidden flex items-center justify-center border">
                                {activeStep.mediaType === "image" ? (
                                    <img 
                                        src={activeStep.mediaDataUrl || activeStep.mediaUrl} 
                                        alt="Preview" 
                                        className="h-full object-contain"
                                    />
                                ) : (
                                    <video 
                                        src={activeStep.mediaDataUrl || activeStep.mediaUrl} 
                                        controls 
                                        className="h-full max-w-full"
                                    />
                                )}
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => updateStep(activeStep.id, { mediaUrl: "", mediaDataUrl: "" })}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-2">
          <Label>Mensagem para o usuário *</Label>
          <Textarea
            ref={(el) => {
              textRef.current = el
            }}
            value={activeText}
            className="min-h-[120px]"
            placeholder="Ex: Olá! Selecione para onde você quer ser direcionado:"
            onFocus={(e) => {
              activeInputRef.current = e.target
              registerInsertHandler((token) => {
                const next = insertAtCursor(activeText, e.target, token)
                updateStep(activeStep.id, { text: next })
              })
            }}
            onBlur={() => {
                registerInsertHandler(null)
                // Don't clear activeInputRef immediately if we want to support click-to-insert without keeping focus, 
                // but usually the handler is nulled on blur so it won't be called anyway.
            }}
            onChange={(e) => updateStep(activeStep.id, { text: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      {/* Lista de Botões */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Botões de Opção</Label>
          <Button type="button" size="sm" onClick={addButton} variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Opção
          </Button>
        </div>

        <div className="space-y-4">
          {activeButtons.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
              Esta etapa ainda não tem opções.<br/>
              Adicione botões para criar caminhos no fluxo.
            </div>
          ) : (
            activeButtons.map((b, index) => (
              <Card key={b.id} className="p-4 relative group">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" 
                    onClick={() => removeButton(b.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

                <div className="grid grid-cols-1 gap-4">
                    {/* Linha 1: Rótulo e Ação Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Texto do Botão</Label>
                            <Input 
                                value={String(b.label || "")} 
                                onChange={(e) => updateButton(b.id, { label: e.target.value })} 
                                placeholder={`Opção ${index + 1}`}
                                onFocus={(e) => {
                                    activeInputRef.current = e.target
                                    registerInsertHandler((token) => {
                                        // Use current value from ref or event target to ensure freshness?
                                        // b.label comes from closure, might be slightly stale if typing fast and not re-rendered?
                                        // Actually controlled input updates state -> re-render -> new closure. It should be fine.
                                        // But safer to read from e.target (which is activeInputRef.current)
                                        const el = activeInputRef.current
                                        if (el) {
                                            const currentVal = el.value
                                            const next = insertAtCursor(currentVal, el as any, token)
                                            updateButton(b.id, { label: next })
                                        }
                                    })
                                }}
                                onBlur={() => registerInsertHandler(null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Ação ao clicar</Label>
                            <Select
                                value={b.nextStepId || "no_step"}
                                onValueChange={(v) => handleActionChange(b.id, v, b.label)}
                            >
                                <SelectTrigger className={!b.nextStepId ? "text-muted-foreground" : "font-medium"}>
                                    <SelectValue placeholder="O que acontece depois?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Ações Rápidas</SelectLabel>
                                        <SelectItem value="create_new_step" className="text-blue-500 focus:text-blue-600 font-medium">
                                            + Nova Etapa (Mensagem ou Menu)
                                        </SelectItem>
                                        <SelectItem value="no_step">
                                            Encerrar fluxo (Nenhuma ação)
                                        </SelectItem>
                                    </SelectGroup>
                                    <Separator className="my-1" />
                                    <SelectGroup>
                                        <SelectLabel>Ir para etapa existente...</SelectLabel>
                                        {steps.filter(s => s.id !== activeStep.id).map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.title}
                                            </SelectItem>
                                        ))}
                                        {steps.length <= 1 && (
                                            <div className="px-2 py-1 text-xs text-muted-foreground">Nenhuma outra etapa criada.</div>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Linha 2: Mensagem intermediária (Opcional) */}
                    <div className="space-y-3 pt-2 border-t border-dashed">
                         <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">
                                Mensagem de Resposta (Feedback)
                            </Label>
                         </div>
                         
                         {/* Tipo de Mídia da Resposta */}
                         <div className="space-y-2">
                             <div className="flex gap-2">
                                <Select 
                                    value={b.feedbackMediaType || "none"} 
                                    onValueChange={(v) => updateButton(b.id, { feedbackMediaType: v })}
                                >
                                    <SelectTrigger className="h-8 text-xs w-[140px]">
                                        <SelectValue placeholder="Tipo Mídia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Apenas Texto</SelectItem>
                                        <SelectItem value="image">Com Imagem</SelectItem>
                                        <SelectItem value="video">Com Vídeo</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input 
                                    value={String(b.feedbackText || "")}
                                    onChange={(e) => updateButton(b.id, { feedbackText: e.target.value })}
                                    placeholder="Ex: Aguarde, estou verificando..."
                                    className="text-sm h-8 flex-1"
                                    onFocus={(e) => {
                                        activeInputRef.current = e.target
                                        registerInsertHandler((token) => {
                                            const el = activeInputRef.current
                                            if (el) {
                                                const currentVal = el.value
                                                const next = insertAtCursor(currentVal, el as any, token)
                                                updateButton(b.id, { feedbackText: next })
                                            }
                                        })
                                    }}
                                    onBlur={() => registerInsertHandler(null)}
                                />
                             </div>

                             {/* Upload de Mídia se selecionado */}
                             {b.feedbackMediaType && b.feedbackMediaType !== "none" && (
                                <div className="flex gap-2 items-center bg-muted/20 p-2 rounded">
                                     <Input 
                                        placeholder={b.feedbackMediaType === "image" ? "URL da Imagem" : "URL do Vídeo"}
                                        value={String(b.feedbackMediaUrl || "")}
                                        onChange={(e) => updateButton(b.id, { feedbackMediaUrl: e.target.value, feedbackMediaDataUrl: "" })}
                                        className="h-8 text-xs flex-1"
                                     />
                                     <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        className="h-8"
                                        onClick={() => triggerButtonUpload(b.id)}
                                     >
                                        Upload
                                     </Button>
                                     
                                     {(b.feedbackMediaUrl || b.feedbackMediaDataUrl) && (
                                         <div className="h-8 w-8 relative rounded overflow-hidden border">
                                            {b.feedbackMediaType === "image" ? (
                                                <img src={b.feedbackMediaDataUrl || b.feedbackMediaUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <Video className="w-4 h-4 m-auto mt-2 text-muted-foreground" />
                                            )}
                                         </div>
                                     )}
                                </div>
                             )}
                         </div>
                    </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Hidden inputs for uploads */}
      <Input
          ref={buttonFileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleButtonFileUpload}
      />

      <div className="text-xs text-muted-foreground mt-6 bg-blue-500/10 p-3 rounded border border-blue-500/20">
        <strong>Dica:</strong> Ao selecionar "+ Nova lista de botões", você será levado automaticamente para criar as opções da próxima etapa. Use o botão "Voltar" no topo para retornar aqui.
      </div>
    </div>
  )
}
