"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Phone,
  Video,
  Paperclip,
  MoreVertical,
  Search,
  Plus,
  MessageSquare,
  Settings,
  QrCode,
  Smartphone,
  RefreshCw,
  Filter,
  X,
  Save,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  whatsappService,
  type WhatsAppContact,
  type WhatsAppMessage,
  type WhatsAppConversation,
} from "@/lib/whatsapp-api"
import WhatsAppConfig from "./whatsapp-config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { loadFromStorage, saveToStorage } from "@/lib/storage"
import { apiClient } from "@/lib/api-client"
import { Power } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type UserRole = "admin" | "client"

const getUserRole = (): UserRole => {
  // In production, this would come from your authentication system
  // For now, we'll check if there's an admin flag in localStorage or environment
  const isAdmin = localStorage.getItem("is_admin") === "true" || process.env.NEXT_PUBLIC_USER_ROLE === "admin"

  return isAdmin ? "admin" : "client"
}

interface ConversationFilters {
  status: string[]
  readStatus: string[]
  queueIds: string[]
  tags: string[]
  assignedUserId: string
}

interface FilterPreset {
  id: string
  name: string
  filters: ConversationFilters
}

export default function ConversationPanel() {
  console.log("[v0] ConversationPanel montado")
  const [activeContact, setActiveContact] = useState<WhatsAppContact | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [conversations, setConversations] = useState<Map<string, WhatsAppConversation>>(new Map())
  const [showConfig, setShowConfig] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected")
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [userRole] = useState<UserRole>(getUserRole())

  const [filters, setFilters] = useState<ConversationFilters>({
    status: [],
    readStatus: [],
    queueIds: [],
    tags: [],
    assignedUserId: "",
  })
  const [availableQueues, setAvailableQueues] = useState<any[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newContactPhone, setNewContactPhone] = useState("")
  const [newContactName, setNewContactName] = useState("")
  const [isEditingContactName, setIsEditingContactName] = useState(false)
  const [editingContactName, setEditingContactName] = useState("")
  const [showPhoneConnect, setShowPhoneConnect] = useState(false)
  const [phoneInput, setPhoneInput] = useState("")
  const [phoneCode, setPhoneCode] = useState<string | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([])
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)
  const [presetName, setPresetName] = useState("")

  // QR Code auto-generation states and refs
  const hasRequestedQrRef = useRef(false) // evita múltiplas requisições concorrentes

  const LOCAL_KEY = "unicrm_whatsapp_config"

  useEffect(() => {
    // Check if WhatsApp service is configured
    const savedConfig = localStorage.getItem(LOCAL_KEY) || localStorage.getItem("whatsapp_config")
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        initializeWhatsApp(config)
      } catch (error) {
        console.error("[v0] Error loading WhatsApp config:", error)
      }
    }

    const isWhatsAppConnected = localStorage.getItem("whatsapp_connected") === "true"
    if (isWhatsAppConnected) {
      setConnectionStatus("connected")
      setIsConnected(true)
    } else {
      // Don't auto-connect, let user configure first
      setConnectionStatus("disconnected")
    }

    loadFilterOptions()
    loadFilterPresets()

    // Setup real-time listeners with cleanup
    const messageCb = (message: WhatsAppMessage) => {
      console.log("[v0] New message received in UI:", message)
      loadConversations()
    }
    const contactCb = (contact: WhatsAppContact) => {
      console.log("[v0] Contact status changed in UI:", contact)
      loadContacts()
    }
    whatsappService.onMessageReceived(messageCb)
    whatsappService.onContactStatusChanged(contactCb)

    return () => {
      whatsappService.offMessageReceived(messageCb)
      whatsappService.offContactStatusChanged(contactCb)
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current)
        qrPollRef.current = null
      }
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current)
        statusPollRef.current = null
      }
    }
  }, [])

  const loadFilterOptions = () => {
    // Load queues from storage
    const queues = loadFromStorage("queues", [])
    setAvailableQueues(Array.isArray(queues) ? queues : [])

    // Load users from storage
    const users = loadFromStorage("users", [])
    setAvailableUsers(Array.isArray(users) ? users.filter((u: any) => u.status === "active") : [])

    // Extract unique tags from all conversations
    const allTags = new Set<string>()
    conversations.forEach((conv) => {
      conv.tags?.forEach((tag) => allTags.add(tag))
    })
    setAvailableTags(Array.from(allTags))
  }

  const loadFilterPresets = () => {
    const presets = loadFromStorage("chat_filter_presets", [])
    setFilterPresets(Array.isArray(presets) ? presets : [])
  }

  const saveFilterPreset = () => {
    if (!presetName.trim()) return

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters },
    }

    const updatedPresets = [...filterPresets, newPreset]
    setFilterPresets(updatedPresets)
    saveToStorage(updatedPresets, "chat_filter_presets")
    setActivePresetId(newPreset.id)
    setPresetName("")
    setShowSavePresetDialog(false)
  }

  const loadFilterPreset = (presetId: string) => {
    const preset = filterPresets.find((p) => p.id === presetId)
    if (preset) {
      setFilters(preset.filters)
      setActivePresetId(presetId)
    }
  }

  const deleteFilterPreset = (presetId: string) => {
    const updatedPresets = filterPresets.filter((p) => p.id !== presetId)
    setFilterPresets(updatedPresets)
    saveToStorage(updatedPresets, "chat_filter_presets")
    if (activePresetId === presetId) {
      setActivePresetId(null)
    }
  }

  const qrPollRef = useRef<number | null>(null)
  const statusPollRef = useRef<number | null>(null)

  // Status polling to detect connection changes - only when connecting or connected
  useEffect(() => {
    // Clear existing status poll
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current)
      statusPollRef.current = null
    }

    // Start status polling when connecting or connected
    if (connectionStatus === "connecting" || isConnected) {
      statusPollRef.current = window.setInterval(async () => {
        try {
          const status = await apiClient.get<any>("/whatsapp/status")
          const connected = Boolean(status?.connected)
          const smartphoneConnected = Boolean(status?.smartphoneConnected)
          const session = Boolean(status?.session)
          
          console.log("[v0] Status check:", { connected, smartphoneConnected, session })
          
          if (connected && (smartphoneConnected || session)) {
            // Connected - stop polling and load data
            if (statusPollRef.current) {
              clearInterval(statusPollRef.current)
              statusPollRef.current = null
            }
            if (qrPollRef.current) {
              clearInterval(qrPollRef.current)
              qrPollRef.current = null
            }
            setConnectionStatus("connected")
            setIsConnected(true)
            setQrCode(null)
            await loadContacts()
            await loadConversations()
          }
        } catch (error) {
          console.error("[v0] Status polling error:", error)
          // Only set to disconnected if we're not already trying to connect
          if (connectionStatus !== "connecting") {
            setConnectionStatus("disconnected")
            setIsConnected(false)
          }
        }
      }, 3000)
    }

    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current)
        statusPollRef.current = null
      }
    }
  }, [connectionStatus, isConnected])

  // useEffect que observa `status` e decide gerar QR automaticamente
  useEffect(() => {
    // Função auxiliar para obter status atual
    const checkStatusAndGenerateQr = async () => {
      try {
        const status = await apiClient.get<any>("/whatsapp/status")
        
        // Se já conectado, limpar QR (opcional) e resetar flag
        if (status?.connected) {
          if (qrCode) setQrCode(null)
          hasRequestedQrRef.current = false
          return
        }
        
        // Se NÃO conectado → gerar QR (apenas uma vez)
        if (!status?.connected && !qrCode && !isGeneratingQR) {
          console.log("[v0] Status desconectado - vai chamar generateQr()", {connected: status?.connected, qrCode, isGeneratingQR})
          // pequena espera para evitar disparos imediatos em rápidos polls
          const t = setTimeout(() => {
            generateQr()
          }, 250) // 250ms: evita alguns race-conditions; ajuste se quiser
          return () => clearTimeout(t)
        }
      } catch (error) {
        console.error("[v0] Erro ao verificar status para gerar QR:", error)
      }
    }

    // Executar verificação apenas quando estiver desconectado
    if (connectionStatus === "disconnected" && !isConnected) {
      checkStatusAndGenerateQr()
    }
  }, [connectionStatus, isConnected]) // roda quando status de conexão mudar

  const generateQRCode = async () => {
    try {
      setIsGeneratingQR(true)
      setConnectionStatus("connecting")
      setConnectionError(null) // Limpar erro anterior
      const rawText = await apiClient.getText("/whatsapp/qr")
      const trimmed = rawText.trim()
      let dataUrl
      if (trimmed.startsWith("{")) {
        const data = JSON.parse(trimmed)
        setConnectionError(data.error || "Erro inesperado ao gerar QR")
        setConnectionStatus("disconnected")
        return
      } else {
        if (trimmed.startsWith("data:image")) {
          dataUrl = trimmed
        } else {
          dataUrl = `data:image/png;base64,${trimmed}`
        }
      }
      setQrCode(dataUrl)
    } catch (error) {
      console.error("[v0] Erro ao gerar QR:", error)
      setConnectionStatus("disconnected")
      setConnectionError("Erro ao gerar QR Code. Verifique a configuração.")
    } finally {
      setIsGeneratingQR(false)
    }

    // Poll status até conectar
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current)
    }
    qrPollRef.current = window.setInterval(async () => {
      try {
        const status = await apiClient.get<any>("/whatsapp/status")
        const connected = Boolean(status?.connected)
        const smartphoneConnected = Boolean(status?.smartphoneConnected)
        const session = Boolean(status?.session)
        if (connected && (smartphoneConnected || session)) {
          if (qrPollRef.current) {
            clearInterval(qrPollRef.current)
            qrPollRef.current = null
          }
          setConnectionStatus("connected")
          setIsConnected(true)
          setQrCode(null)
          await loadContacts()
          await loadConversations()
        }
      } catch {}
    }, 3000)
  }

  // Função para gerar QR automaticamente (sem interação do usuário)
  const generateQr = async () => {
    console.log("[v0] generateQr() chamado - isGeneratingQR:", isGeneratingQR, "hasRequestedQrRef:", hasRequestedQrRef.current)
    if (isGeneratingQR || hasRequestedQrRef.current) return
    
    setIsGeneratingQR(true)
    hasRequestedQrRef.current = true
    
    try {
      console.log("[v0] Gerando QR via backend...")
      const rawText2 = await apiClient.getText("/whatsapp/qr")
      const trimmed = rawText2.trim()
      if (trimmed.startsWith("{")) {
        const data = JSON.parse(trimmed)
        setConnectionError(data.error || "Erro inesperado ao gerar QR")
        setConnectionStatus("disconnected")
        hasRequestedQrRef.current = false
        return
      }
      setQrCode(trimmed.startsWith("data:image") ? trimmed : `data:image/png;base64,${trimmed}`)
    } catch (err) {
      console.error("[v0] Erro ao gerar QR:", err)
      console.error("[v0] Tipo do erro:", typeof err)
      console.error("[v0] Mensagem do erro:", (err as any)?.message)
      console.error("[v0] Stack do erro:", (err as any)?.stack)
      hasRequestedQrRef.current = false
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const initializeWhatsApp = async (config: any) => {
    try {
      await whatsappService.initialize(config)
      setIsConnected(true)
      setConnectionStatus("connected")
      await loadContacts()
      await loadConversations()
      console.log("[v0] WhatsApp service initialized successfully")
    } catch (error) {
      console.error("[v0] Failed to initialize WhatsApp service:", error)
      setIsConnected(false)
      setConnectionStatus("disconnected")
    }
  }

  const loadContacts = async () => {
    // Only load contacts if connected
    if (!isConnected) {
      console.log("[v0] Skipping contacts load - not connected")
      return
    }

    try {
      const res = await apiClient.get<any>("/whatsapp/contacts")
      const backendContacts: WhatsAppContact[] = Array.isArray(res?.contacts)
        ? res.contacts.map((c: any) => ({ id: (c.id || c.phone || "").replace(/\D/g, ""), name: c.name || (c.phone || ""), phone: (c.phone || c.id || "").replace(/\D/g, ""), isOnline: true }))
        : []
      if (backendContacts.length > 0) {
        setContacts(backendContacts)
        console.log("[v0] Loaded contacts from backend:", backendContacts.length)
        return
      }
      const loadedContacts = whatsappService.getContacts()
      setContacts(loadedContacts)
      console.log("[v0] Loaded contacts in UI:", loadedContacts.length)
    } catch (error) {
      console.error("[v0] Error loading contacts:", error)
      const loadedContacts = whatsappService.getContacts()
      setContacts(loadedContacts)
    }
  }

  const loadConversations = async () => {
    // Only load conversations if connected
    if (!isConnected) {
      console.log("[v0] Skipping conversations load - not connected")
      return
    }

    try {
      const loadedConversations = whatsappService.getAllConversations()
      const conversationMap = new Map()
      loadedConversations.forEach((conv) => {
        conversationMap.set(conv.contactId, conv)
      })
      setConversations(conversationMap)
      console.log("[v0] Loaded conversations in UI:", loadedConversations.length)

      const allTags = new Set<string>()
      loadedConversations.forEach((conv) => {
        conv.tags?.forEach((tag) => allTags.add(tag))
      })
      setAvailableTags(Array.from(allTags))
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
    }
  }

  const applyFilters = (contact: WhatsAppContact): boolean => {
    const conversation = getConversation(contact.id)
    if (!conversation) return true

    // Status filter
    if (filters.status.length > 0) {
      if (!conversation.status || !filters.status.includes(conversation.status)) {
        return false
      }
    }

    // Read/Unread filter
    if (filters.readStatus.length > 0) {
      const isRead = conversation.unreadCount === 0
      if (filters.readStatus.includes("lido") && !isRead) return false
      if (filters.readStatus.includes("nao_lido") && isRead) return false
    }

    // Queue filter
    if (filters.queueIds.length > 0) {
      if (!conversation.queueId || !filters.queueIds.includes(conversation.queueId)) {
        return false
      }
    }

    // Tags filter
    if (filters.tags.length > 0) {
      if (!conversation.tags || !filters.tags.some((tag) => conversation.tags?.includes(tag))) {
        return false
      }
    }

    // Assigned user filter
    if (filters.assignedUserId && filters.assignedUserId !== "all") {
      if (conversation.assignedUserId !== filters.assignedUserId) {
        return false
      }
    }

    return true
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      (contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.toLowerCase().includes(searchTerm.toLowerCase())) &&
      applyFilters(contact),
  )

  const toggleFilter = (filterType: keyof ConversationFilters, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[filterType] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, [filterType]: newValues }
    })
    setActivePresetId(null)
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      readStatus: [],
      queueIds: [],
      tags: [],
      assignedUserId: "",
    })
    setActivePresetId(null)
  }

  const getActiveFilterCount = (): number => {
    return (
      filters.status.length +
      filters.readStatus.length +
      filters.queueIds.length +
      filters.tags.length +
      (filters.assignedUserId && filters.assignedUserId !== "all" ? 1 : 0)
    )
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      em_atendimento: "Em Atendimento",
      encerrado: "Encerrado",
      aguardando: "Aguardando",
    }
    return labels[status] || status
  }

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !activeContact) return

    try {
      const sentMessage = await whatsappService.sendMessage(activeContact.id, messageInput)
      if (sentMessage) {
        setMessageInput("")
        await loadConversations()
        console.log("[v0] Message sent successfully")
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    }
  }

  // Get conversation for contact
  function getConversation(contactId: string): WhatsAppConversation | null {
    return conversations.get(contactId) || null
  }

  // Get last message for contact
  const getLastMessage = (contact: WhatsAppContact): string => {
    const conversation = getConversation(contact.id)
    return conversation?.lastMessage?.content || "Nenhuma mensagem"
  }

  // Get last message time for contact
  const getLastMessageTime = (contact: WhatsAppContact): string => {
    const conversation = getConversation(contact.id)
    if (!conversation?.lastMessage) return ""

    const messageDate = new Date(conversation.lastMessage.timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return messageDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    } else {
      return messageDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    }
  }

  // Get unread count for contact
  const getUnreadCount = (contact: WhatsAppContact): number => {
    const conversation = getConversation(contact.id)
    return conversation?.unreadCount || 0
  }

  const syncContactsToBackend = async () => {
    if (!isConnected) {
      console.log("[v0] Skipping contacts sync - not connected")
      return
    }

    try {
      const list = whatsappService.getContacts()
      for (const c of list) {
        await apiClient.post("/whatsapp/contact", { phone: c.phone || c.id, name: c.name || c.id })
      }
      await loadContacts()
    } catch (error) {
      console.error("[v0] Error syncing contacts:", error)
    }
  }

  useEffect(() => {
    if (!activeContact || !isConnected) return
    let disposed = false
    const refresh = async () => {
      await whatsappService.refreshMessages(activeContact.id)
      const all = whatsappService.getAllConversations()
      const map = new Map<string, WhatsAppConversation>()
      all.forEach((c) => map.set(c.contactId, c))
      if (!disposed) setConversations(map)
    }
    refresh()
    const interval = setInterval(refresh, 10000)
    return () => {
      disposed = true
      clearInterval(interval)
    }
  }, [activeContact?.id, isConnected])

  if (!isConnected) {
    // Admin view - show configuration option
    return (
      <div className="flex h-[calc(100vh-200px)] md:h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4">
          {connectionStatus === "disconnected" ? (
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <QrCode className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <CardTitle>Conectar WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Para começar a receber mensagens, conecte seu WhatsApp escaneando o código QR.
                </p>
                {connectionError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {connectionError}
                  </div>
                )}
                
                {/* Exibição automática do QR Code */}
                {qrCode ? (
                  <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
                    <p className="text-sm mb-2">Escaneie o QR abaixo no WhatsApp:</p>
                    <img 
                      src={qrCode || ""} 
                      alt="QR Code WhatsApp" 
                      className="w-48 h-48 border rounded-lg mx-auto" 
                    />
                  </div>
                ) : !isGeneratingQR ? (
                  <div className="mt-3 p-3 bg-yellow-50 border rounded-lg">
                    <p className="text-sm text-gray-600">Aguardando geração do QR...</p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-blue-50 border rounded-lg">
                    <p className="text-sm text-blue-600">Gerando QR Code...</p>
                  </div>
                )}
                
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
                <Button variant="outline" onClick={() => setShowConfig(true)} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar API
                </Button>
              </CardContent>
            </Card>
          ) : connectionStatus === "connecting" && qrCode ? (
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Smartphone className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <CardTitle>Escaneie o QR Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-center">
                  {qrCode && (
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="w-48 h-48 border rounded-lg"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Como conectar:</p>
                  <ol className="text-sm text-muted-foreground text-left space-y-1">
                    <li>1. Abra o WhatsApp no seu celular</li>
                    <li>2. Toque em Menu (⋮) e selecione "Dispositivos conectados"</li>
                    <li>3. Toque em "Conectar um dispositivo"</li>
                    <li>4. Aponte a câmera para este código</li>
                  </ol>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Aguardando conexão...
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (qrPollRef.current) { clearInterval(qrPollRef.current); qrPollRef.current = null }
                    setConnectionStatus("disconnected"); setIsGeneratingQR(false)
                  }}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4 border-b-2 border-green-600"></div>
                <CardTitle>Preparando conexão...</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">Aguarde, preparando a conexão com WhatsApp...</p>
              </CardContent>
            </Card>
          )}
        </div>

        {showConfig && <WhatsAppConfig onClose={() => setShowConfig(false)} />}
        <Dialog open={showPhoneConnect} onOpenChange={setShowPhoneConnect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar por telefone</DialogTitle>
              <DialogDescription>Informe o número no formato internacional e gere o código.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label htmlFor="phone-connect">Telefone (DDI+DDD+Número)</Label>
              <Input id="phone-connect" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="5546999046386" />
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    setPhoneError(null)
                    setPhoneLoading(true)
                    setPhoneCode(null)
                    const raw = phoneInput || ""
                    const digits = raw.replace(/\D/g, "")
                    const normalized = digits.length === 11 && !digits.startsWith("55") ? `55${digits}` : digits
                    try {
                      const code = await whatsappService.generatePhoneCode(normalized)
                      setPhoneCode(code || "")
                    } catch (e) {
                      setPhoneError("Falha ao gerar código de telefone")
                    } finally {
                      setPhoneLoading(false)
                    }
                  }}
                  disabled={phoneLoading || !phoneInput.trim()}
                >
                  {phoneLoading ? "Gerando..." : "Gerar código"}
                </Button>
                {phoneCode && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      try { navigator.clipboard.writeText(phoneCode) } catch {}
                    }}
                  >
                    Copiar código
                  </Button>
                )}
              </div>
              {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
              {phoneCode && (
                <div className="p-2 border rounded">
                  <p className="text-sm">Código:</p>
                  <p className="font-mono text-lg">{phoneCode}</p>
                  <p className="text-xs text-muted-foreground mt-2">Insira este código no WhatsApp em “Conectar com número de telefone”.</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowPhoneConnect(false); setPhoneInput(""); setPhoneCode(null); setPhoneError(null); }}>Fechar</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
      {/* Contacts panel */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r flex flex-col max-h-[50vh] md:max-h-none">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm md:text-base">Conversas</h2>
            <div className="flex items-center gap-1">
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
                    <Filter className="h-4 w-4" />
                    {getActiveFilterCount() > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-w-[calc(100vw-2rem)]" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros</h4>
                      <div className="flex items-center gap-1">
                        {getActiveFilterCount() > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setShowSavePresetDialog(true)}>
                            <Save className="h-3 w-3 mr-1" />
                            Salvar
                          </Button>
                        )}
                        {getActiveFilterCount() > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="h-3 w-3 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>

                    {filterPresets.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filtros Salvos</Label>
                        <div className="space-y-1">
                          {filterPresets.map((preset) => (
                            <div
                              key={preset.id}
                              className={`flex items-center justify-between p-2 rounded-md hover:bg-muted/50 ${
                                activePresetId === preset.id ? "bg-muted" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => loadFilterPreset(preset.id)}
                                className="flex-1 text-left text-sm"
                              >
                                {preset.name}
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => deleteFilterPreset(preset.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="space-y-2">
                        {["em_atendimento", "encerrado", "aguardando"].map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={filters.status.includes(status)}
                              onCheckedChange={() => toggleFilter("status", status)}
                            />
                            <label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                              {getStatusLabel(status)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Read/Unread filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Leitura</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="read-lido"
                            checked={filters.readStatus.includes("lido")}
                            onCheckedChange={() => toggleFilter("readStatus", "lido")}
                          />
                          <label htmlFor="read-lido" className="text-sm cursor-pointer">
                            Lido
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="read-nao-lido"
                            checked={filters.readStatus.includes("nao_lido")}
                            onCheckedChange={() => toggleFilter("readStatus", "nao_lido")}
                          />
                          <label htmlFor="read-nao-lido" className="text-sm cursor-pointer">
                            Não Lido
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Queue filter */}
                    {availableQueues.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filas de Atendimento</Label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {availableQueues.map((queue) => (
                            <div key={queue.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`queue-${queue.id}`}
                                checked={filters.queueIds.includes(queue.id)}
                                onCheckedChange={() => toggleFilter("queueIds", queue.id)}
                              />
                              <label
                                htmlFor={`queue-${queue.id}`}
                                className="text-sm cursor-pointer flex items-center gap-2"
                              >
                                <div className={`w-2 h-2 rounded-full ${queue.color}`} />
                                {queue.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags filter */}
                    {availableTags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tags</Label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {availableTags.map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag}`}
                                checked={filters.tags.includes(tag)}
                                onCheckedChange={() => toggleFilter("tags", tag)}
                              />
                              <label htmlFor={`tag-${tag}`} className="text-sm cursor-pointer">
                                {tag}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User filter */}
                    {availableUsers.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Usuário</Label>
                        <Select
                          value={filters.assignedUserId || "all"}
                          onValueChange={(value) => {
                            setFilters((prev) => ({ ...prev, assignedUserId: value }))
                            setActivePresetId(null)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos os usuários" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os usuários</SelectItem>
                            {availableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10"
                    aria-label="Opções do WhatsApp"
                    title="Opções do WhatsApp"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => setShowConfig(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar WhatsApp
                    </Button>
                    <Button variant="outline" onClick={generateQRCode} disabled={isGeneratingQR}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar QR Code
                    </Button>
                    <Button variant="outline" onClick={() => setShowPhoneConnect(true)}>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Conectar por telefone
                    </Button>
                    <Button variant="outline" onClick={async () => { await whatsappService.disconnectInstance(); await loadConversations(); }}>
                      <Power className="h-4 w-4 mr-2" />
                      Desconectar Instância
                    </Button>
                    <Button variant="outline" onClick={async () => { await whatsappService.restartInstance(); await loadConversations(); }}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reiniciar Instância
                    </Button>
                    <Button variant="outline" onClick={syncContactsToBackend}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar Contatos
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mx-3 mt-2">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageSquare className="h-4 w-4 mr-1" />
              WhatsApp - UniCRM
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="all" className="m-0">
              {filteredContacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  lastMessage={getLastMessage(contact)}
                  lastMessageTime={getLastMessageTime(contact)}
                  unreadCount={getUnreadCount(contact)}
                  isActive={activeContact?.id === contact.id}
                  onClick={() => setActiveContact(contact)}
                />
              ))}
            </TabsContent>

            <TabsContent value="whatsapp" className="m-0">
              {filteredContacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  lastMessage={getLastMessage(contact)}
                  lastMessageTime={getLastMessageTime(contact)}
                  unreadCount={getUnreadCount(contact)}
                  isActive={activeContact?.id === contact.id}
                  onClick={() => setActiveContact(contact)}
                />
              ))}
            </TabsContent>
          </ScrollArea>

          <div className="p-3 border-t">
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowNewConversation(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conversa
            </Button>
          </div>
        </Tabs>
      </div>

      {/* Conversation panel */}
      {activeContact ? (
        <div className="flex-1 flex flex-col min-h-[50vh] md:min-h-0">
          <div className="p-2 md:p-3 border-b flex justify-between items-center">
            <div className="flex items-center min-w-0">
              <Avatar className="h-8 w-8 md:h-10 md:w-10 mr-2 md:mr-3 flex-shrink-0">
                <AvatarImage src={activeContact.avatar || "/placeholder.svg"} alt={activeContact.name} />
                <AvatarFallback>{activeContact.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                {isEditingContactName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingContactName}
                      onChange={(e) => setEditingContactName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        const name = editingContactName.trim()
                        const phone = activeContact.phone || activeContact.id
                        if (name) {
                          try { await apiClient.post("/whatsapp/contact", { phone, name }) } catch {}
                          const updated = { ...activeContact, name }
                          setActiveContact(updated)
                          await loadContacts()
                        }
                        setIsEditingContactName(false)
                      }}
                    >
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingContactName(false)}>Cancelar</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm md:text-base truncate">{activeContact.name}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditingContactName(activeContact.name || activeContact.id); setIsEditingContactName(true) }}
                    >
                      Editar
                    </Button>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-xs md:text-sm text-muted-foreground mr-2 truncate">{activeContact.phone}</span>
                  {activeContact.isOnline ? (
                    <span className="text-xs text-green-500 flex items-center flex-shrink-0">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                      <span className="hidden sm:inline">Online</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 hidden sm:inline">Offline</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                <Phone className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
                <Video className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-2 md:p-4">
            <div className="space-y-2 md:space-y-4">
              {getConversation(activeContact.id)?.messages.map((message) => (
                <div key={message.id} className={`flex ${message.isFromMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-lg p-2 md:p-3 text-sm md:text-base ${
                      message.isFromMe ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-2 md:p-3 border-t">
            <form onSubmit={sendMessage} className="flex items-center gap-1 md:gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Digite sua mensagem..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 text-sm md:text-base"
              />
              <Button type="submit" size="icon" className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h3 className="text-base md:text-lg font-medium mb-2">Selecione uma conversa</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Escolha um contato para iniciar ou continuar uma conversa
            </p>
          </div>
        </div>
      )}

      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>Informe o número e, opcionalmente, um nome.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Número (DDI+DDD+Número, apenas dígitos)</Label>
            <Input value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} placeholder="5546999046386" />
            <Label>Nome (opcional)</Label>
            <Input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="Contato" />
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                const raw = (newContactPhone || "")
                const digits = raw.replace(/\D/g, "")
                if (!digits) return
                const normalized = digits.length === 11 && !digits.startsWith("55") ? `55${digits}` : digits
                try {
                  await apiClient.post("/whatsapp/contact", { phone: normalized, name: newContactName })
                } catch {}
                const contact = whatsappService.createContact(normalized, newContactName)
                setActiveContact(contact)
                await loadContacts()
                setShowNewConversation(false)
                setNewContactPhone("")
                setNewContactName("")
              }}
              disabled={!newContactPhone.trim()}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showConfig && <WhatsAppConfig onClose={() => setShowConfig(false)} />}

      <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
            <DialogDescription>
              Dê um nome para este conjunto de filtros para acessá-lo rapidamente no futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Nome do Filtro</Label>
              <Input
                id="preset-name"
                placeholder="Ex: Atendimentos do João"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    saveFilterPreset()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePresetDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveFilterPreset} disabled={!presetName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Contact item component
function ContactItem({
  contact,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isActive,
  onClick,
}: {
  contact: WhatsAppContact
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${isActive ? "bg-muted" : ""}`} onClick={onClick}>
      <div className="flex items-center">
        <div className="relative">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
            <AvatarFallback>{contact.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          {contact.isOnline && (
            <span className="absolute bottom-0 right-2 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h4 className="font-medium truncate">{contact.name}</h4>
            <span className="text-xs text-muted-foreground">{lastMessageTime}</span>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
            {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs text-muted-foreground">{contact.phone}</span>
            <MessageSquare className="h-3 w-3 ml-2 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
