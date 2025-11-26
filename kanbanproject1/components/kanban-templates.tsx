"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, ShoppingCart, TrendingUp, Home, Shield, Briefcase, Eye, Check, Zap } from "lucide-react"

// Tipos
type KanbanTemplate = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  columns: Array<{
    id: string
    name: string
    color: string
    order: number
  }>
  customFields: Array<{
    id: string
    name: string
    type: string
    options?: string[]
    visible: boolean
  }>
}

type KanbanTemplatesProps = {
  onApplyTemplate: (template: KanbanTemplate) => void
  onClose: () => void
}

// Templates predefinidos para CRM de Leads
const leadTemplates: KanbanTemplate[] = [
  {
    id: "sales_classic",
    name: "Pipeline de Vendas Clássico",
    description: "Pipeline tradicional para vendas B2B com foco em qualificação e fechamento",
    icon: <TrendingUp className="h-5 w-5" />,
    category: "Vendas",
    columns: [
      { id: "lead", name: "Leads", color: "#64748b", order: 0 },
      { id: "qualificado", name: "Qualificados", color: "#3b82f6", order: 1 },
      { id: "proposta", name: "Proposta", color: "#f59e0b", order: 2 },
      { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3 },
      { id: "fechado", name: "Fechado", color: "#10b981", order: 4 },
      { id: "perdido", name: "Perdidos", color: "#ef4444", order: 5 },
    ],
    customFields: [
      {
        id: "priority",
        name: "Prioridade",
        type: "select",
        options: ["Baixa", "Média", "Alta", "Urgente"],
        visible: true,
      },
      { id: "leadValue", name: "Valor Estimado", type: "number", visible: true },
      { id: "closeDate", name: "Data Prevista", type: "date", visible: true },
      {
        id: "leadSource",
        name: "Origem",
        type: "select",
        options: ["Website", "Indicação", "Google Ads", "LinkedIn"],
        visible: true,
      },
    ],
  },
  {
    id: "saas_sales",
    name: "Vendas SaaS",
    description: "Pipeline otimizado para vendas de software como serviço com trial e onboarding",
    icon: <Zap className="h-5 w-5" />,
    category: "SaaS",
    columns: [
      { id: "trial", name: "Trial", color: "#64748b", order: 0 },
      { id: "mql", name: "MQL", color: "#3b82f6", order: 1 },
      { id: "sql", name: "SQL", color: "#f59e0b", order: 2 },
      { id: "oportunidade", name: "Oportunidade", color: "#8b5cf6", order: 3 },
      { id: "cliente", name: "Cliente", color: "#10b981", order: 4 },
      { id: "churn", name: "Churn", color: "#ef4444", order: 5 },
    ],
    customFields: [
      { id: "trialDays", name: "Dias de Trial", type: "number", visible: true },
      { id: "mrr", name: "MRR Estimado", type: "number", visible: true },
      {
        id: "planType",
        name: "Tipo de Plano",
        type: "select",
        options: ["Básico", "Pro", "Enterprise"],
        visible: true,
      },
      {
        id: "companySize",
        name: "Tamanho da Empresa",
        type: "select",
        options: ["1-10", "11-50", "51-200", "200+"],
        visible: true,
      },
    ],
  },
  {
    id: "real_estate",
    name: "Imobiliário",
    description: "Pipeline especializado para corretores e imobiliárias",
    icon: <Home className="h-5 w-5" />,
    category: "Imobiliário",
    columns: [
      { id: "lead", name: "Lead", color: "#64748b", order: 0 },
      { id: "visita", name: "Visita Agendada", color: "#3b82f6", order: 1 },
      { id: "interessado", name: "Interessado", color: "#f59e0b", order: 2 },
      { id: "proposta", name: "Proposta", color: "#8b5cf6", order: 3 },
      { id: "contrato", name: "Contrato", color: "#06b6d4", order: 4 },
      { id: "vendido", name: "Vendido", color: "#10b981", order: 5 },
      { id: "perdido", name: "Perdido", color: "#ef4444", order: 6 },
    ],
    customFields: [
      {
        id: "propertyType",
        name: "Tipo de Imóvel",
        type: "select",
        options: ["Casa", "Apartamento", "Terreno", "Comercial"],
        visible: true,
      },
      { id: "budget", name: "Orçamento", type: "number", visible: true },
      { id: "location", name: "Localização", type: "text", visible: true },
      {
        id: "financing",
        name: "Financiamento",
        type: "select",
        options: ["À vista", "Financiado", "FGTS"],
        visible: true,
      },
    ],
  },
  {
    id: "insurance",
    name: "Seguros",
    description: "Pipeline para corretores de seguros com foco em cotações e apólices",
    icon: <Shield className="h-5 w-5" />,
    category: "Seguros",
    columns: [
      { id: "prospect", name: "Prospect", color: "#64748b", order: 0 },
      { id: "cotacao", name: "Cotação", color: "#3b82f6", order: 1 },
      { id: "analise", name: "Análise", color: "#f59e0b", order: 2 },
      { id: "aprovado", name: "Aprovado", color: "#8b5cf6", order: 3 },
      { id: "apolice", name: "Apólice Emitida", color: "#10b981", order: 4 },
      { id: "rejeitado", name: "Rejeitado", color: "#ef4444", order: 5 },
    ],
    customFields: [
      {
        id: "insuranceType",
        name: "Tipo de Seguro",
        type: "select",
        options: ["Auto", "Vida", "Residencial", "Empresarial"],
        visible: true,
      },
      { id: "premium", name: "Prêmio Anual", type: "number", visible: true },
      { id: "coverage", name: "Cobertura", type: "number", visible: true },
      {
        id: "riskProfile",
        name: "Perfil de Risco",
        type: "select",
        options: ["Baixo", "Médio", "Alto"],
        visible: true,
      },
    ],
  },
  {
    id: "consulting",
    name: "Consultoria",
    description: "Pipeline para empresas de consultoria e serviços profissionais",
    icon: <Briefcase className="h-5 w-5" />,
    category: "Consultoria",
    columns: [
      { id: "consulta", name: "Consulta Inicial", color: "#64748b", order: 0 },
      { id: "descoberta", name: "Descoberta", color: "#3b82f6", order: 1 },
      { id: "proposta", name: "Proposta", color: "#f59e0b", order: 2 },
      { id: "negociacao", name: "Negociação", color: "#8b5cf6", order: 3 },
      { id: "contrato", name: "Contrato Assinado", color: "#10b981", order: 4 },
      { id: "perdido", name: "Perdido", color: "#ef4444", order: 5 },
    ],
    customFields: [
      {
        id: "serviceType",
        name: "Tipo de Serviço",
        type: "select",
        options: ["Estratégia", "Processos", "TI", "RH", "Financeiro"],
        visible: true,
      },
      { id: "projectValue", name: "Valor do Projeto", type: "number", visible: true },
      { id: "duration", name: "Duração (meses)", type: "number", visible: true },
      { id: "complexity", name: "Complexidade", type: "select", options: ["Baixa", "Média", "Alta"], visible: true },
    ],
  },
  {
    id: "ecommerce_b2b",
    name: "E-commerce B2B",
    description: "Pipeline para vendas B2B de e-commerce e marketplace",
    icon: <ShoppingCart className="h-5 w-5" />,
    category: "E-commerce",
    columns: [
      { id: "visitante", name: "Visitante", color: "#64748b", order: 0 },
      { id: "cadastrado", name: "Cadastrado", color: "#3b82f6", order: 1 },
      { id: "cotacao", name: "Cotação", color: "#f59e0b", order: 2 },
      { id: "pedido", name: "Pedido", color: "#8b5cf6", order: 3 },
      { id: "pagamento", name: "Pagamento", color: "#06b6d4", order: 4 },
      { id: "entregue", name: "Entregue", color: "#10b981", order: 5 },
      { id: "cancelado", name: "Cancelado", color: "#ef4444", order: 6 },
    ],
    customFields: [
      { id: "orderValue", name: "Valor do Pedido", type: "number", visible: true },
      {
        id: "paymentMethod",
        name: "Forma de Pagamento",
        type: "select",
        options: ["Boleto", "Cartão", "PIX", "Transferência"],
        visible: true,
      },
      { id: "deliveryTime", name: "Prazo de Entrega", type: "number", visible: true },
      {
        id: "customerType",
        name: "Tipo de Cliente",
        type: "select",
        options: ["Novo", "Recorrente", "VIP"],
        visible: true,
      },
    ],
  },
]

export default function KanbanTemplates({ onApplyTemplate, onClose }: KanbanTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<KanbanTemplate | null>(null)
  const [activeCategory, setActiveCategory] = useState("all")

  // Obter categorias únicas
  const categories = ["all", ...Array.from(new Set(leadTemplates.map((t) => t.category)))]

  // Filtrar templates por categoria
  const filteredTemplates =
    activeCategory === "all" ? leadTemplates : leadTemplates.filter((t) => t.category === activeCategory)

  const handleApplyTemplate = (template: KanbanTemplate) => {
    onApplyTemplate(template)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Templates de Pipeline de Leads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros por categoria */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="Vendas">Vendas</TabsTrigger>
              <TabsTrigger value="SaaS">SaaS</TabsTrigger>
              <TabsTrigger value="Imobiliário">Imobiliário</TabsTrigger>
              <TabsTrigger value="Seguros">Seguros</TabsTrigger>
              <TabsTrigger value="Consultoria">Consultoria</TabsTrigger>
              <TabsTrigger value="E-commerce">E-commerce</TabsTrigger>
            </TabsList>

            <TabsContent value={activeCategory} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onView={() => setSelectedTemplate(template)}
                    onApply={() => handleApplyTemplate(template)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground">Tente selecionar uma categoria diferente.</p>
            </div>
          )}
        </div>

        {/* Modal de visualização do template */}
        {selectedTemplate && (
          <TemplatePreview
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onApply={() => {
              handleApplyTemplate(selectedTemplate)
              setSelectedTemplate(null)
            }}
          />
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente do card de template
function TemplateCard({
  template,
  onView,
  onApply,
}: {
  template: KanbanTemplate
  onView: () => void
  onApply: () => void
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {template.icon}
            <CardTitle className="text-lg">{template.name}</CardTitle>
          </div>
          <Badge variant="secondary">{template.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{template.description}</p>

        {/* Preview das colunas */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">ETAPAS DO PIPELINE:</p>
          <div className="flex flex-wrap gap-1">
            {template.columns.slice(0, 4).map((column) => (
              <Badge key={column.id} variant="outline" className="text-xs">
                {column.name}
              </Badge>
            ))}
            {template.columns.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{template.columns.length - 4}
              </Badge>
            )}
          </div>
        </div>

        {/* Campos personalizados */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">CAMPOS PERSONALIZADOS:</p>
          <div className="flex flex-wrap gap-1">
            {template.customFields.slice(0, 3).map((field) => (
              <Badge key={field.id} variant="secondary" className="text-xs">
                {field.name}
              </Badge>
            ))}
            {template.customFields.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.customFields.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1 bg-transparent">
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button size="sm" onClick={onApply} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Usar Template
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de preview do template
function TemplatePreview({
  template,
  onClose,
  onApply,
}: {
  template: KanbanTemplate
  onClose: () => void
  onApply: () => void
}) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center flex-wrap gap-2">
            {template.icon}
            <span className="ml-2">{template.name}</span>
            <Badge variant="secondary" className="ml-2">
              {template.category}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">{template.description}</p>

          <div>
            <h3 className="font-medium mb-3">Etapas do Pipeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {template.columns
                .sort((a, b) => a.order - b.order)
                .map((column) => (
                  <div key={column.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
                    <span className="text-sm font-medium truncate">{column.name}</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Campos Personalizados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {template.customFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium truncate block">{field.name}</span>
                    <p className="text-xs text-muted-foreground capitalize">{field.type}</p>
                  </div>
                  {field.options && (
                    <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                      {field.options.length} opções
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fluxo do Pipeline */}
          <div>
            <h3 className="font-medium mb-3">Fluxo do Pipeline</h3>
            <div className="flex flex-wrap items-center gap-2">
              {template.columns
                .sort((a, b) => a.order - b.order)
                .map((column, index) => (
                  <div key={column.id} className="flex items-center gap-2">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
                      <span className="text-sm font-medium whitespace-nowrap">{column.name}</span>
                    </div>
                    {index < template.columns.length - 1 && (
                      <div className="text-muted-foreground flex-shrink-0">→</div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onApply}>
            <Check className="h-4 w-4 mr-2" />
            Usar Este Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
