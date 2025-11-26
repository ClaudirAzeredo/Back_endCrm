"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, AlertCircle, CheckCircle2, X } from "lucide-react"
import * as XLSX from "xlsx"

type ImportedLead = {
  title: string
  client: string
  clientEmail?: string
  clientPhone?: string
  cnpj?: string
  source: string
  priority?: string
  estimatedValue?: number
  expectedCloseDate?: string
  notes?: string
  tags?: string[]
}

type ImportLeadsDialogProps = {
  open: boolean
  onClose: () => void
  onImport: (leads: ImportedLead[], funnelId: string, stageId: string) => void
  columns: Array<{ id: string; name: string }>
  funnels: Array<{ id: string; name: string; columns: Array<{ id: string; name: string }> }>
}

export default function ImportLeadsDialog({ open, onClose, onImport, columns, funnels }: ImportLeadsDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ImportedLead[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [step, setStep] = useState<"config" | "upload" | "preview" | "confirm">("config")

  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("")
  const [selectedStageId, setSelectedStageId] = useState<string>("")

  const selectedFunnel = funnels.find((f) => f.id === selectedFunnelId)
  const funnelStages = selectedFunnel?.columns || []

  const downloadTemplate = () => {
    const templateData = [
      {
        "Nome do Lead": "Exemplo Lead 1",
        "Cliente/Empresa": "Empresa XYZ",
        Email: "contato@empresa.com",
        Telefone: "+55 11 99999-0000",
        CNPJ: "12.345.678/0001-90",
        Tags: "tag1, tag2",
        Origem: "Website",
        Prioridade: "Alta",
        "Valor Estimado": "5000",
        "Data Esperada": "2025-12-31",
        Notas: "Lead qualificado",
      },
      {
        "Nome do Lead": "Exemplo Lead 2",
        "Cliente/Empresa": "Empresa ABC",
        Email: "vendas@empresa.com",
        Telefone: "+55 11 88888-0000",
        CNPJ: "98.765.432/0001-10",
        Tags: "tag3",
        Origem: "Indicação",
        Prioridade: "Média",
        "Valor Estimado": "3000",
        "Data Esperada": "2025-11-30",
        Notas: "Aguardando retorno",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads")

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 20 }, // Nome do Lead
      { wch: 20 }, // Cliente/Empresa
      { wch: 25 }, // Email
      { wch: 18 }, // Telefone
      { wch: 18 }, // CNPJ
      { wch: 15 }, // Tags
      { wch: 15 }, // Origem
      { wch: 12 }, // Prioridade
      { wch: 15 }, // Valor Estimado
      { wch: 15 }, // Data Esperada
      { wch: 25 }, // Notas
    ]

    const timestamp = new Date().toISOString().split("T")[0]
    XLSX.writeFile(workbook, `template-leads-${timestamp}.xlsx`)

    toast({
      title: "Template baixado",
      description: "O arquivo de template foi baixado com sucesso.",
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    parseExcelFile(selectedFile)
  }

  const parseExcelFile = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const requiredColumns = [
          "Nome do Lead",
          "Cliente/Empresa",
          "Email",
          "Telefone",
          "CNPJ",
          "Tags",
          "Origem",
          "Prioridade",
          "Valor Estimado",
          "Data Esperada",
          "Notas",
        ]

        // Get the actual columns from the first row
        const firstRow = jsonData[0] as any
        if (!firstRow) {
          toast({
            title: "Arquivo vazio",
            description: "O arquivo não contém dados para importar.",
            variant: "destructive",
          })
          return
        }

        const actualColumns = Object.keys(firstRow)

        // Check if all required columns are present
        const missingColumns = requiredColumns.filter((col) => !actualColumns.includes(col))
        if (missingColumns.length > 0) {
          toast({
            title: "Colunas obrigatórias ausentes",
            description: `As seguintes colunas estão faltando: ${missingColumns.join(", ")}. Por favor, use o template fornecido.`,
            variant: "destructive",
          })
          setFile(null)
          return
        }

        // Check for extra columns with content
        const extraColumns = actualColumns.filter((col) => !requiredColumns.includes(col))
        if (extraColumns.length > 0) {
          // Check if any of the extra columns have content
          const hasContentInExtraColumns = jsonData.some((row: any) => {
            return extraColumns.some((col) => {
              const value = row[col]
              return value !== undefined && value !== null && value.toString().trim() !== ""
            })
          })

          if (hasContentInExtraColumns) {
            toast({
              title: "Colunas não permitidas com conteúdo",
              description: `As seguintes colunas não são permitidas e contêm dados: ${extraColumns.join(", ")}. Por favor, use apenas as colunas do template.`,
              variant: "destructive",
            })
            setFile(null)
            return
          }
        }

        const importedLeads: ImportedLead[] = []
        const newErrors: string[] = []

        jsonData.forEach((row: any, index: number) => {
          const rowNumber = index + 2 // +2 because of header and 0-based index

          const estimatedValue = row["Valor Estimado"] ? Number.parseFloat(row["Valor Estimado"]) : undefined

          if (row["Valor Estimado"] && isNaN(estimatedValue)) {
            newErrors.push(`Linha ${rowNumber}: Valor Estimado deve ser um número válido`)
            return
          }

          const tagsString = row["Tags"]?.toString().trim() || ""
          const tags = tagsString
            ? tagsString
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean)
            : []

          const lead: ImportedLead = {
            title: row["Nome do Lead"]?.toString().trim() || "Lead sem nome",
            client: row["Cliente/Empresa"]?.toString().trim() || "Cliente não informado",
            clientEmail: row["Email"]?.toString().trim() || undefined,
            clientPhone: row["Telefone"]?.toString().trim() || undefined,
            cnpj: row["CNPJ"]?.toString().trim() || undefined,
            source: row["Origem"]?.toString().trim() || "Importação",
            priority: row["Prioridade"]?.toString().trim() || "medium",
            estimatedValue: estimatedValue,
            expectedCloseDate: row["Data Esperada"]?.toString().trim() || undefined,
            notes: row["Notas"]?.toString().trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
          }

          importedLeads.push(lead)
        })

        if (importedLeads.length === 0 && newErrors.length === 0) {
          newErrors.push("Nenhum lead válido encontrado no arquivo")
        }

        setErrors(newErrors)
        setPreviewData(importedLeads)
        setStep("preview")
      } catch (error) {
        console.error("[v0] Error parsing Excel file:", error)
        toast({
          title: "Erro ao processar arquivo",
          description: "Não foi possível ler o arquivo Excel. Verifique o formato.",
          variant: "destructive",
        })
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleImport = () => {
    if (!selectedFunnelId || !selectedStageId) {
      toast({
        title: "Configuração incompleta",
        description: "Selecione o funil e a etapa para importar os leads",
        variant: "destructive",
      })
      return
    }

    if (previewData.length === 0) {
      toast({
        title: "Nenhum lead para importar",
        description: "Selecione um arquivo com leads válidos",
        variant: "destructive",
      })
      return
    }

    onImport(previewData, selectedFunnelId, selectedStageId)

    toast({
      title: "Leads importados com sucesso!",
      description: `${previewData.length} leads foram adicionados ao pipeline.`,
    })

    // Reset state
    setFile(null)
    setPreviewData([])
    setErrors([])
    setStep("config")
    setSelectedFunnelId("")
    setSelectedStageId("")
    onClose()
  }

  const handleClose = () => {
    setFile(null)
    setPreviewData([])
    setErrors([])
    setStep("config")
    setSelectedFunnelId("")
    setSelectedStageId("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Importe leads em lote usando um arquivo Excel. Baixe o template para ver o formato esperado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === "config" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecione o Funil</label>
                <Select
                  value={selectedFunnelId}
                  onValueChange={(value) => {
                    setSelectedFunnelId(value)
                    setSelectedStageId("") // Reset stage when funnel changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um funil..." />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFunnelId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecione a Etapa</label>
                  <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma etapa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {funnelStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button
                  onClick={() => setStep("upload")}
                  disabled={!selectedFunnelId || !selectedStageId}
                  className="flex-1"
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold mb-2">Selecione um arquivo Excel</h3>
                <p className="text-sm text-gray-600 mb-4">Arraste e solte ou clique para selecionar</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button onClick={() => fileInputRef.current?.click()} className="mb-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>

                {file && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-800">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null)
                        setPreviewData([])
                        setErrors([])
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadTemplate} className="flex-1 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">Erros encontrados:</h4>
                      <ul className="space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-700">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Preview: {previewData.length} lead(s) para importar</h4>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {previewData.map((lead, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium">{lead.title}</h5>
                            <p className="text-sm text-gray-600">{lead.client}</p>
                          </div>
                          {lead.priority && (
                            <Badge
                              className={
                                lead.priority === "urgent"
                                  ? "bg-red-100 text-red-800"
                                  : lead.priority === "high"
                                    ? "bg-orange-100 text-orange-800"
                                    : lead.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-blue-100 text-blue-800"
                              }
                            >
                              {lead.priority === "urgent"
                                ? "Urgente"
                                : lead.priority === "high"
                                  ? "Alta"
                                  : lead.priority === "medium"
                                    ? "Média"
                                    : "Baixa"}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {lead.clientEmail && (
                            <div>
                              <span className="text-gray-600">Email:</span> {lead.clientEmail}
                            </div>
                          )}
                          {lead.clientPhone && (
                            <div>
                              <span className="text-gray-600">Telefone:</span> {lead.clientPhone}
                            </div>
                          )}
                          {lead.cnpj && (
                            <div>
                              <span className="text-gray-600">CNPJ:</span> {lead.cnpj}
                            </div>
                          )}
                          {lead.estimatedValue && (
                            <div>
                              <span className="text-gray-600">Valor:</span> R${" "}
                              {lead.estimatedValue.toLocaleString("pt-BR")}
                            </div>
                          )}
                          {lead.source && (
                            <div>
                              <span className="text-gray-600">Origem:</span> {lead.source}
                            </div>
                          )}
                        </div>

                        {lead.tags && lead.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {lead.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>

            {step === "upload" && (
              <Button onClick={() => fileInputRef.current?.click()} disabled={!file}>
                Próximo
              </Button>
            )}

            {step === "preview" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null)
                    setPreviewData([])
                    setErrors([])
                    setStep("upload")
                  }}
                >
                  Voltar
                </Button>
                <Button onClick={handleImport} disabled={previewData.length === 0 || errors.length > 0}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Importar {previewData.length} Lead(s)
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
