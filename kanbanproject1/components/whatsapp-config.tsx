"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Settings, Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { type WhatsAppAPIConfig, type ZApiConfig, whatsappService } from "@/lib/whatsapp-api"
import { API_BASE_URL } from "@/lib/api-client"
import { apiClient } from "@/lib/api-client"
const LOCAL_KEY = "unicrm_whatsapp_config"

type WhatsAppConfigProps = {
  onClose: () => void
}

type ConfigState = WhatsAppAPIConfig & Partial<ZApiConfig>

export default function WhatsAppConfig({ onClose }: WhatsAppConfigProps) {
  const defaultBase = `${API_BASE_URL}/whatsapp`
  const defaultWebhook = `${API_BASE_URL}/whatsapp/webhook`
  const ZAPI_BASE = "https://api.z-api.io"

  const [config, setConfig] = useState<WhatsAppAPIConfig>({
    provider: "custom",
    apiKey: "",
    webhookUrl: defaultWebhook,
    customEndpoint: defaultBase,
    customHeaders: {},
  })

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [customHeadersText, setCustomHeadersText] = useState("")
  const [isCreatingInstance, setIsCreatingInstance] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
const [qrCode, setQrCode] = useState<string | null>(null)
const [isGeneratingQr, setIsGeneratingQr] = useState(false)
const [statusDetails, setStatusDetails] = useState<any | null>(null)
const [instanceUrlInput, setInstanceUrlInput] = useState("")
const [connectedFlag, setConnectedFlag] = useState(false)

  // Extrai instanceId e token quando o usuário cola a URL completa da instância Z-API
  const parseZapiInstanceUrl = (raw?: string) => {
    if (!raw) return null
    const text = raw.trim()
    const re = /^https?:\/\/[^/]+\/instances\/([^/]+)\/token\/([^/?#]+)\/?$/i
    const match = text.match(re)
    if (!match) return null
    return { instanceId: match[1], instanceToken: match[2] }
  }

  useEffect(() => {
    // Load saved configuration from backend per tenant
    ;(async () => {
      try {
        const safe = await apiClient.get<any>("/whatsapp/config")
        if (safe) {
          const mapped: ConfigState = {
            provider: (safe.provider as any) || "custom",
            apiKey: "", // not returned by backend (encrypted), keep empty
            webhookUrl: safe.webhookUrl || defaultWebhook,
            customEndpoint: safe.baseUrl || defaultBase,
            clientId: safe.clientId || undefined,
            instanceId: safe.instanceId || undefined,
          }
          setCustomHeadersText(JSON.stringify({}, null, 2))
          const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY) : null
          const local = raw ? JSON.parse(raw) : null
          const merged = {
            ...mapped,
            apiKey: local?.apiKey || mapped.apiKey,
            instanceToken: local?.instanceToken || undefined,
            webhookUrl: local?.webhookUrl || mapped.webhookUrl,
            customEndpoint: local?.customEndpoint || mapped.customEndpoint,
            clientId: local?.clientId || mapped.clientId,
            instanceId: local?.instanceId || mapped.instanceId,
          }
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(merged))
          }
          // Ensure UI fields reflect merged values (including secrets from local storage)
          setConfig(merged)
          setConnectedFlag(Boolean(safe.connected))
        }
      } catch (error) {
        console.error("[v0] Error loading backend config:", error)
      }
    })()
  }, [])

  const saveConfig = async () => {
    try {
      // Normalização para Z-API: garantir base raiz e extrair ID/Token se necessário
      let baseUrl = config.customEndpoint || ZAPI_BASE
      if (config.provider === "z-api") {
        const parsedFromBase = parseZapiInstanceUrl(instanceUrlInput || baseUrl)
        if (parsedFromBase) {
          baseUrl = ZAPI_BASE
          setConfig({
            ...config,
            provider: "z-api" as const,
            customEndpoint: ZAPI_BASE,
            instanceId: parsedFromBase.instanceId,
            instanceToken: parsedFromBase.instanceToken,
          } as ZApiConfig)
        } else if (/\/instances\//i.test(baseUrl) || /\/token\//i.test(baseUrl) || /\/api\/whatsapp/i.test(baseUrl)) {
          // Avisa usuário e corrige automaticamente
          alert("A URL Base da Z-API deve ser apenas https://api.z-api.io. Corrigi automaticamente.")
          baseUrl = ZAPI_BASE
        }

        // Validação obrigatória quando usando domínio remoto (dev.uniconnectcrm.com.br)
        const isRemoteDev = API_BASE_URL.startsWith("https://dev.uniconnectcrm.com.br")
        const parsedFromInput = parseZapiInstanceUrl(instanceUrlInput || "")
        const finalInstanceId = (config as any).instanceId || parsedFromInput?.instanceId || ""
        const finalInstanceToken = (config as any).instanceToken || parsedFromInput?.instanceToken || ""
        if (isRemoteDev && (finalInstanceId.trim() === "" || finalInstanceToken.trim() === "")) {
          alert("Para salvar no domínio dev.uniconnectcrm.com.br, informe 'instanceId' e 'instanceToken' da Z-API (cole a URL completa da instância).")
          return
        }
      }
      const body = {
        connected: Boolean(connectedFlag),
        baseUrl,
        instanceId: (config as any).instanceId || parseZapiInstanceUrl(instanceUrlInput || "")?.instanceId || "",
        token: (config as any).instanceToken || parseZapiInstanceUrl(instanceUrlInput || "")?.instanceToken || "",
        webhookUrl: config.webhookUrl || defaultWebhook,
      }
      if (!body.baseUrl || !body.instanceId || !body.token || !body.webhookUrl) {
        alert("Preencha baseUrl, instanceId, token e webhookUrl.")
        return
      }
      await apiClient.post("/whatsapp/config", body)
      console.log("[v0] WhatsApp configuration saved to backend")
      alert("Configuração salva com sucesso.")

      // Persist minimal usable config to local storage for front-end provider
      setConnectedFlag(Boolean(body.connected))
    } catch (error) {
      console.error("[v0] Error saving backend config:", error)
      alert("Erro ao salvar configuração no servidor.")
      return
    }
  }

  const testConnection = async () => {
    setIsConnecting(true)
    setConnectionError(null)
    setQrCode(null)

    try {
      const status = await apiClient.get<any>("/whatsapp/status")
      setIsConnected(Boolean(status?.connected))
      // Sempre exibir o objeto completo para diagnóstico, mesmo sem "details"
      setStatusDetails(status?.details ?? status ?? null)
      if (!status?.connected && status?.requiresInstance) {
        setConnectionError("Instância não configurada. Crie a instância e gere o QR.")
      } else if (!status?.connected && status?.details) {
        setConnectionError("Desconectado. Gere o QR para conectar.")
      }
      console.log("[v0] Status:", status)
    } catch (error: any) {
      setConnectionError(error?.message || "Erro ao verificar status.")
      // Exibir o conteúdo retornado do erro para diagnóstico
      setStatusDetails(error?.data || { error: error?.message || "unknown" })
      setIsConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      await whatsappService.disconnect()
      setIsConnected(false)
      console.log("[v0] WhatsApp disconnected")
    } catch (error) {
      console.error("[v0] Error disconnecting:", error)
    }
  }

  const getProviderDescription = (provider: string) => {
    const descriptions = {
      "z-api": "Z-Api - Integração oficial com WhatsApp Business",
      "whatsapp-web-js": "Biblioteca JavaScript para WhatsApp Web",
      baileys: "Biblioteca TypeScript para WhatsApp Business API",
      twilio: "API do Twilio para WhatsApp Business",
      "meta-business": "Meta Business API (WhatsApp Business)",
      custom: "API personalizada ou webhook customizado",
    }
    return descriptions[provider as keyof typeof descriptions] || "Provedor personalizado"
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Configuração da API do WhatsApp
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="test">
              <Zap className="h-4 w-4 mr-2" />
              Teste de Conexão
            </TabsTrigger>
            <TabsTrigger value="examples">
              <AlertCircle className="h-4 w-4 mr-2" />
              Exemplos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Provedor da API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo de Provedor</Label>
                  <Select
                    value={config.provider}
                    onValueChange={(value) => setConfig({ ...config, provider: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="z-api">Z-Api (Recomendado)</SelectItem>
                      <SelectItem value="custom">API Personalizada</SelectItem>
                      <SelectItem value="whatsapp-web-js">WhatsApp Web JS</SelectItem>
                      <SelectItem value="baileys">Baileys</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="meta-business">Meta Business API</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">{getProviderDescription(config.provider)}</p>
                </div>

                {config.provider === "z-api" && (
                  <>
                    <div>
                      <Label>URL da Instância (opcional)</Label>
                      <Input
                        value={instanceUrlInput}
                        onChange={(e) => {
                          const val = e.target.value
                          setInstanceUrlInput(val)
                          const parsed = parseZapiInstanceUrl(val)
                          if (parsed) {
                            setConfig({
                              ...config,
                              provider: "z-api" as const,
                              customEndpoint: ZAPI_BASE,
                              instanceId: parsed.instanceId,
                              instanceToken: parsed.instanceToken,
                            } as any)
                          }
                        }}
                        placeholder="Cole aqui: https://api.z-api.io/instances/ID/token/TOKEN"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Cole a URL completa da instância e eu extraio ID e Token automaticamente.
                      </p>
                    </div>
                    <div>
                      <Label>Conectado</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={connectedFlag}
                          onChange={(e) => setConnectedFlag(e.target.checked)}
                        />
                        <span className="text-sm text-muted-foreground">Marcar como conectado</span>
                      </div>
                    </div>
                    <div>
                      <Label>Token da API Z-Api (opcional)</Label>
                      <Input
                        type="password"
                        value={config.apiKey || ""}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        placeholder="Client-Token (se sua conta usar)"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Se sua conta não usa Client-Token, deixe em branco e informe o ID e o Token da instância.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>ID da Instância (opcional)</Label>
                        <Input
                          value={(config as any).instanceId || ""}
                          onChange={(e) => {
                            const val = e.target.value.trim()
                            const parsed = parseZapiInstanceUrl(val)
                            if (parsed) {
                              setConfig({
                                ...config,
                                provider: "z-api" as const,
                                customEndpoint: ZAPI_BASE,
                                instanceId: parsed.instanceId,
                                instanceToken: parsed.instanceToken,
                              } as any)
                            } else {
                              setConfig({ ...config, instanceId: val } as any)
                            }
                          }}
                          placeholder="Ex.: 12345 (ou cole a URL completa da instância)"
                        />
                        <p className="text-sm text-muted-foreground mt-1">Use uma instância existente ou deixe em branco para criar.</p>
                      </div>
                      <div>
                        <Label>Token da Instância (opcional)</Label>
                        <Input
                          type="password"
                          value={(config as any).instanceToken || ""}
                          onChange={(e) => {
                            const val = e.target.value.trim()
                            const parsed = parseZapiInstanceUrl(val)
                            if (parsed) {
                              setConfig({
                                ...config,
                                provider: "z-api" as const,
                                customEndpoint: ZAPI_BASE,
                                instanceId: parsed.instanceId,
                                instanceToken: parsed.instanceToken,
                              } as any)
                            } else {
                              setConfig({ ...config, instanceToken: val } as any)
                            }
                          }}
                          placeholder="Token da instância (ou cole a URL completa)"
                        />
                        <p className="text-sm text-muted-foreground mt-1">Necessário se você já possui uma instância ativa.</p>
                      </div>
                    </div>

                    {/* Opções avançadas removidas para simplificar: Client-Token e criação de instância não são necessários */}
                  </>
                )}

                {config.provider !== "z-api" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Chave da API</Label>
                        <Input
                          type="password"
                          value={config.apiKey || ""}
                          onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                          placeholder="Sua chave de API"
                        />
                      </div>
                      <div>
                        <Label>ID do Número de Telefone</Label>
                        <Input
                          value={config.phoneNumberId || ""}
                          onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                          placeholder="ID do número (se aplicável)"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Endpoint Personalizado</Label>
                      <Input
                        value={config.customEndpoint || ""}
                        onChange={(e) => setConfig({ ...config, customEndpoint: e.target.value })}
                        placeholder="https://sua-api.com/whatsapp"
                      />
                      <p className="text-sm text-muted-foreground mt-1">URL base da sua API personalizada</p>
                    </div>

                    <div>
                      <Label>URL do Webhook</Label>
                      <Input
                        value={config.webhookUrl || ""}
                        onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                        placeholder="https://sua-api.com/webhook/whatsapp"
                      />
                      <p className="text-sm text-muted-foreground mt-1">URL para receber mensagens em tempo real</p>
                    </div>

                    <div>
                      <Label>Headers Personalizados (JSON)</Label>
                      <Textarea
                        value={customHeadersText}
                        onChange={(e) => setCustomHeadersText(e.target.value)}
                        placeholder='{\n  "X-Custom-Header": "valor",\n  "Authorization": "Bearer token"\n}'
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Headers adicionais para as requisições da API
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Status da Conexão
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Desconectado
                      </>
                    )}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{connectionError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={testConnection} disabled={isConnecting} className="flex-1">
                    {isConnecting ? "Conectando..." : "Testar Conexão"}
                  </Button>

                  {isConnected && (
                    <Button onClick={disconnect} variant="outline" className="flex-1 bg-transparent">
                      Desconectar
                    </Button>
                  )}
                  {!isConnected && config.provider === "z-api" && (
                    <Button
                      onClick={async () => {
                        setIsGeneratingQr(true)
                        setConnectionError(null)
                        setQrCode(null)
                        try {
                          // Primeiro verificar status para garantir que podemos gerar QR
                          const status = await apiClient.get<any>("/whatsapp/status")
                          if (!status?.connected) {
                            const rawText = await apiClient.getText("/whatsapp/qr")
                            console.log("[QR RAW TEXT RECEIVED]", rawText)
                            const trimmed = rawText.trim()
                            if (trimmed.startsWith("{")) {
                              const data = JSON.parse(trimmed)
                              setConnectionError(data.error || "Erro inesperado ao gerar QR")
                              return
                            }
                            if (!trimmed) {
                              setConnectionError("QR Code vazio ou inválido retornado pelo backend")
                              return
                            }
                            setQrCode(trimmed.startsWith("data:image") ? trimmed : `data:image/png;base64,${trimmed}`)
                          } else {
                            setConnectionError("Já conectado. Não é necessário gerar QR.")
                          }
                        } catch (err: any) {
                          console.error("[v0] Erro ao gerar QR:", err)
                          setConnectionError(err?.message || "Erro ao gerar QR.")
                        } finally {
                          setIsGeneratingQr(false)
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={isGeneratingQr}
                    >
                      {isGeneratingQr ? "Gerando QR..." : "Gerar QR"}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
<h4 className="font-medium">Teste de Conexão (via backend):</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• GET /api/whatsapp/status</li>
                    <li>• POST /api/whatsapp/qr</li>
                  </ul>
{qrCode && (
                    <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
                      <p className="text-sm mb-2">Escaneie o QR abaixo no WhatsApp:</p>
                      {qrCode ? (
                        <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
                      ) : (
                        <div className="w-64 h-64 bg-gray-200 rounded flex items-center justify-center">
                          <p className="text-gray-500 text-sm">QR Code inválido</p>
                        </div>
                      )}
                    </div>
)}

{/* Status detalhado da Instância */}
<div className="mt-4 border rounded p-3 bg-muted/30">
  <h4 className="font-medium mb-2">Status detalhado</h4>
  {statusDetails ? (
    <>
      <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64 p-2 bg-background border rounded">
        {JSON.stringify(statusDetails, null, 2)}
      </pre>
      <button
        className="mt-2 text-sm px-3 py-1 border rounded hover:bg-muted"
        onClick={() => navigator.clipboard.writeText(JSON.stringify(statusDetails, null, 2))}
      >
        Copiar JSON
      </button>
    </>
  ) : (
    <p className="text-sm text-muted-foreground">Nenhum detalhe disponível. Execute "Testar Conexão".</p>
  )}
  <p className="text-xs text-muted-foreground mt-2">Exibe a resposta completa da Z-API para diagnóstico.</p>
  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exemplos de Configuração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <h4 className="font-medium mb-2 text-green-800">Z-Api (Recomendado)</h4>
                    <pre className="text-sm text-green-700">
                      {`{
  "provider": "z-api",
  "apiKey": "seu-token-zapi",
  "webhookUrl": "https://seu-dominio.com/webhook/zapi"
}`}
                    </pre>
                    <p className="text-xs text-green-600 mt-2">
                      Cada cliente terá sua própria instância e QR Code para conectar
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">API Personalizada</h4>
                    <pre className="text-sm text-gray-600">
                      {`{
  "provider": "custom",
  "customEndpoint": "https://sua-api.com/whatsapp",
  "apiKey": "sua-chave-secreta",
  "webhookUrl": "https://sua-api.com/webhook",
  "customHeaders": {
    "X-API-Version": "v1",
    "Content-Type": "application/json"
  }
}`}
                    </pre>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Meta Business API</h4>
                    <pre className="text-sm text-blue-600">
                      {`{
  "provider": "meta-business",
  "accessToken": "seu-access-token",
  "phoneNumberId": "123456789",
  "webhookUrl": "https://sua-api.com/webhook/meta"
}`}
                    </pre>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-2">Twilio</h4>
                    <pre className="text-sm text-green-600">
                      {`{
  "provider": "twilio",
  "apiKey": "seu-account-sid",
  "customEndpoint": "https://api.twilio.com/2010-04-01",
  "customHeaders": {
    "Authorization": "Basic base64(sid:token)"
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Estrutura da API Esperada</h4>
                  <p className="text-sm text-yellow-700 mb-2">Sua API deve implementar os seguintes endpoints:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>
                      • <code>GET /contacts</code> - Lista de contatos
                    </li>
                    <li>
                      • <code>GET /conversations</code> - Lista de conversas
                    </li>
                    <li>
                      • <code>GET /messages/:contactId</code> - Mensagens de um contato
                    </li>
                    <li>
                      • <code>POST /send-message</code> - Enviar mensagem
                    </li>
                    <li>
                      • <code>POST /mark-read</code> - Marcar como lida
                    </li>
                    <li>
                      • <code>GET /events</code> - Server-Sent Events para tempo real
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={saveConfig}>Salvar Configuração</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
