"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Clock,
  User,
  Search,
  QrCode,
  Smartphone,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { loadFromStorage, saveToStorage } from "@/lib/storage"
import { ZApiProvider, type ZApiConfig } from "@/lib/whatsapp-api"

type WhatsAppMessage = {
  id: string
  text: string
  timestamp: string
  isFromClient: boolean
  status: "sent" | "delivered" | "read"
  leadId?: string
}

type WhatsAppConversation = {
  id: string
  contactName: string
  contactPhone: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  leadId?: string
  messages: WhatsAppMessage[]
}

interface WhatsAppIntegrationProps {
  open: boolean
  onClose: () => void
}

export default function WhatsAppIntegration({ open, onClose }: WhatsAppIntegrationProps) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [provider, setProvider] = useState<ZApiProvider | null>(null)

  useEffect(() => {
    // Load conversations from storage
    const storedConversations = loadFromStorage("whatsapp_conversations", [])
    setConversations(storedConversations)

    // Check connection status
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    const config = loadFromStorage("whatsapp_config", null)

    if (!config || config.provider !== "z-api") {
      setConnectionStatus("disconnected")
      return
    }

    // Check if there's a saved instance
    const userId = loadFromStorage("current_user_id", "default_user")
    const savedInstance = localStorage.getItem(`zapi_instance_${userId}`)

    if (savedInstance) {
      const instance = JSON.parse(savedInstance)

      if (instance.status === "connected") {
        setConnectionStatus("connected")
      } else {
        setConnectionStatus("disconnected")
      }
    }
  }

  const generateQRCode = async () => {
    setIsGeneratingQR(true)
    setConnectionStatus("connecting")

    try {
      // Load Z-Api configuration
      const config = loadFromStorage("whatsapp_config", null)

      if (!config) {
        toast({
          title: "Configuração Necessária",
          description: "Preencha os dados da instância do WhatsApp.",
          variant: "destructive",
        })
        setConnectionStatus("disconnected")
        setIsGeneratingQR(false)
        return
      }

      // If ApiKey is not provided, require instanceId and instanceToken
      const hasInstanceCreds = Boolean(config.instanceId && config.instanceToken)
      if (!config.apiKey && !hasInstanceCreds) {
        toast({
          title: "Dados da Instância Necessários",
          description:
            "Informe o ID e o Token da instância (ou use ApiKey para criar automaticamente).",
          variant: "destructive",
        })
        setConnectionStatus("disconnected")
        setIsGeneratingQR(false)
        return
      }

      // Primeiro verificar status da conexão
      const statusData = await apiClient.get<any>("/whatsapp/status")
      
      // Se já estiver conectado, não gerar QR
      if (statusData.connected) {
        setConnectionStatus("connected")
        setQrCode(null)
        saveToStorage(true, "whatsapp_connected")
        setIsGeneratingQR(false)
        return
      }

      // Se não estiver conectado, gerar QR Code
      const rawText = await apiClient.getText("/whatsapp/qr")
      console.log("[QR RAW TEXT RECEIVED]", rawText)
      let base64
      if (rawText.trim().startsWith("{")) {
        const data = JSON.parse(rawText)
        throw new Error(data.error || "Erro inesperado ao gerar QR")
      } else {
        base64 = rawText.trim()
      }
      if (!base64) {
        throw new Error("QR Code vazio ou inválido retornado pelo backend")
      }
      setQrCode(`data:image/png;base64,${base64}`)

      // Get or create client ID
      const userId = loadFromStorage("current_user_id", "default_user")

      const zapiConfig: ZApiConfig = {
        ...config,
        provider: "z-api",
        clientId: userId,
      }

      // Create Z-Api provider
      const zapiProvider = new ZApiProvider(zapiConfig)
      setProvider(zapiProvider)

      // Setup callbacks
      zapiProvider.onQRCodeGenerated((qr) => {
        console.log("[v0] QR Code received via callback")
        setQrCode(qr)
        setIsGeneratingQR(false)
      })

      zapiProvider.onStatusChanged((status) => {
        console.log("[v0] Status changed:", status)

        if (status === "connected") {
          setConnectionStatus("connected")
          setQrCode(null)
          saveToStorage(true, "whatsapp_connected")

          toast({
            title: "WhatsApp Conectado!",
            description: "Seu WhatsApp foi conectado com sucesso.",
          })
        }
      })

      // Initialize provider
      await zapiProvider.initialize()
      
      setIsGeneratingQR(false)
    } catch (error) {
      console.error("[v0] Error generating QR Code:", error)

      toast({
        title: "Erro ao Gerar QR Code",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })

      setConnectionStatus("disconnected")
      setIsGeneratingQR(false)
    }
  }

  const handleDisconnect = async () => {
    if (provider) {
      await provider.disconnect()
    }

    setConnectionStatus("disconnected")
    setQrCode(null)
    setProvider(null)
    saveToStorage(false, "whatsapp_connected")

    toast({
      title: "WhatsApp Desconectado",
      description: "Sua conexão com WhatsApp foi removida.",
    })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: WhatsAppMessage = {
      id: `msg_${Date.now()}`,
      text: newMessage,
      timestamp: new Date().toISOString(),
      isFromClient: false,
      status: "sent",
      leadId: selectedConversation.leadId,
    }

    // Update conversation
    const updatedConversation = {
      ...selectedConversation,
      lastMessage: newMessage,
      lastMessageTime: new Date().toISOString(),
      messages: [...selectedConversation.messages, message],
    }

    setConversations((prev) => prev.map((conv) => (conv.id === selectedConversation.id ? updatedConversation : conv)))
    setSelectedConversation(updatedConversation)
    setNewMessage("")

    saveToStorage(
      conversations.map((conv) => (conv.id === selectedConversation.id ? updatedConversation : conv)),
      "whatsapp_conversations",
    )

    // Send via Z-Api if connected
    if (provider && connectionStatus === "connected") {
      provider
        .sendMessage(selectedConversation.contactPhone, newMessage)
        .then(() => {
          console.log("[v0] Message sent via Z-Api")
        })
        .catch((error) => {
          console.error("[v0] Error sending message:", error)
        })
    }

    // Simulate message delivery
    setTimeout(() => {
      const deliveredMessage = { ...message, status: "delivered" as const }
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                messages: conv.messages.map((msg) => (msg.id === message.id ? deliveredMessage : msg)),
              }
            : conv,
        ),
      )
    }, 1000)
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) || conv.contactPhone.includes(searchTerm),
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp - UniCRM
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 mt-4">
          {connectionStatus === "disconnected" ? (
            <div className="flex items-center justify-center h-full">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <CardTitle>Conectar WhatsApp</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-left">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Integração Z-Api</p>
                        <p>Cada cliente conecta seu próprio número de WhatsApp de forma independente e segura.</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground">
                    Clique no botão abaixo para gerar seu QR Code exclusivo e conectar seu WhatsApp.
                  </p>

                  <Button onClick={generateQRCode} disabled={isGeneratingQR} className="w-full">
                    {isGeneratingQR ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Gerando QR Code...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : connectionStatus === "connecting" && qrCode ? (
            <div className="flex items-center justify-center h-full">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <CardTitle>Escaneie o QR Code</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
                    {qrCode ? (
                      <img
                        src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                        alt="QR Code WhatsApp"
                        className="w-64 h-64"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-gray-500 text-sm">QR Code inválido</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Como conectar:</p>
                    <ol className="text-sm text-muted-foreground text-left space-y-1 pl-4">
                      <li>1. Abra o WhatsApp no seu celular</li>
                      <li>2. Toque em Menu (⋮) ou Configurações</li>
                      <li>3. Selecione "Dispositivos conectados"</li>
                      <li>4. Toque em "Conectar um dispositivo"</li>
                      <li>5. Aponte a câmera para este código</li>
                    </ol>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    Aguardando conexão...
                  </div>
                  <Button variant="outline" onClick={() => setConnectionStatus("disconnected")} className="w-full">
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex h-full gap-4">
              {/* Lista de Conversas */}
              <div className="w-1/3 border-r">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Conectado
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleDisconnect}>
                      Desconectar
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar conversas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <ScrollArea className="h-full">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma conversa encontrada</p>
                      <p className="text-sm mt-2">As conversas aparecerão aqui quando você receber mensagens</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium truncate">{conversation.contactName}</h4>
                              <span className="text-xs text-gray-500">
                                {new Date(conversation.lastMessageTime).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-400">{conversation.contactPhone}</span>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-green-500 text-white text-xs">{conversation.unreadCount}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Área de Conversa */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Header da Conversa */}
                    <div className="p-4 border-b flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedConversation.contactName}</h3>
                        <p className="text-sm text-gray-500">{selectedConversation.contactPhone}</p>
                      </div>
                    </div>

                    {/* Mensagens */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {selectedConversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isFromClient ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.isFromClient ? "bg-gray-100 text-gray-900" : "bg-green-500 text-white"
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {!message.isFromClient && getStatusIcon(message.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Input de Mensagem */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite sua mensagem..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione uma conversa para começar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
