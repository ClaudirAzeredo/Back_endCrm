"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye } from "lucide-react"
import type { LandingPage } from "@/lib/types/landing-page"
import { saveLandingPage } from "@/lib/landing-page-storage"

interface LandingPageBuilderProps {
  onBack: () => void
  editingPage?: LandingPage | null
}

export default function LandingPageBuilder({ onBack, editingPage }: LandingPageBuilderProps) {
  const [formData, setFormData] = useState<Partial<LandingPage>>(
    editingPage || {
      name: "",
      title: "",
      subtitle: "",
      description: "",
      buttonText: "Quero saber mais",
      buttonColor: "#8b5cf6",
      backgroundColor: "#000000",
      textColor: "#ffffff",
      funnelStage: "",
    },
  )
  const [showPreview, setShowPreview] = useState(false)

  const handleSave = () => {
    if (!formData.name || !formData.title) {
      alert("Por favor, preencha o nome e título da landing page")
      return
    }

    const landingPage: LandingPage = {
      id: editingPage?.id || `lp-${Date.now()}`,
      name: formData.name!,
      title: formData.title!,
      subtitle: formData.subtitle || "",
      description: formData.description || "",
      buttonText: formData.buttonText || "Quero saber mais",
      buttonColor: formData.buttonColor || "#8b5cf6",
      backgroundColor: formData.backgroundColor || "#000000",
      textColor: formData.textColor || "#ffffff",
      funnelStage: formData.funnelStage,
      createdAt: editingPage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leads: editingPage?.leads || [],
    }

    saveLandingPage(landingPage)
    alert("Landing page salva com sucesso!")
    onBack()
  }

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para edição
          </Button>
        </div>

        <Card className="border-2">
          <CardContent className="p-0">
            <div
              className="min-h-screen flex items-center justify-center p-8"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor,
              }}
            >
              <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl font-bold leading-tight">{formData.title || "Título da Landing Page"}</h1>
                  {formData.subtitle && <p className="text-2xl opacity-90">{formData.subtitle}</p>}
                  {formData.description && (
                    <p className="text-lg opacity-80 max-w-xl mx-auto">{formData.description}</p>
                  )}
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  <Input
                    placeholder="Seu nome"
                    className="h-12 text-lg"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: formData.textColor,
                    }}
                  />
                  <Input
                    placeholder="Seu e-mail"
                    type="email"
                    className="h-12 text-lg"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: formData.textColor,
                    }}
                  />
                  <Input
                    placeholder="Seu telefone"
                    type="tel"
                    className="h-12 text-lg"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: formData.textColor,
                    }}
                  />
                  <Button
                    size="lg"
                    className="w-full h-12 text-lg font-semibold"
                    style={{
                      backgroundColor: formData.buttonColor,
                      color: "#ffffff",
                    }}
                  >
                    {formData.buttonText || "Quero saber mais"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button onClick={handleSave}>Salvar Landing Page</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar Landing Page de Captação</CardTitle>
          <CardDescription>Configure sua landing page para capturar leads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Landing Page *</Label>
              <Input
                id="name"
                placeholder="Ex: Campanha Black Friday"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Nome interno para identificação</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funnelStage">Etapa do Funil</Label>
              <Input
                id="funnelStage"
                placeholder="Ex: Topo do Funil"
                value={formData.funnelStage}
                onChange={(e) => setFormData({ ...formData, funnelStage: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Vincule a uma etapa do seu funil</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título Principal *</Label>
            <Input
              id="title"
              placeholder="Ex: Transforme seu negócio com nossa solução"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              placeholder="Ex: A melhor plataforma para gerenciar seus leads"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva os benefícios e diferenciais da sua oferta..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buttonText">Texto do Botão</Label>
              <Input
                id="buttonText"
                placeholder="Ex: Quero saber mais"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonColor">Cor do Botão</Label>
              <div className="flex gap-2">
                <Input
                  id="buttonColor"
                  type="color"
                  value={formData.buttonColor}
                  onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.buttonColor}
                  onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
