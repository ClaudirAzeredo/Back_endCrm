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
import { apiClient, API_BASE_URL } from "@/lib/api-client"
import { Power } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useWhatsappSse, type WhatsAppEvent } from "@/hooks/use-whatsapp-sse"
import { WhatsAppPresenceIndicator, type ChatPresenceData } from "@/components/whatsapp-presence-indicator"
import { WhatsAppStatusMonitor } from "@/components/whatsapp-status-monitor"
import { WhatsAppMessageStatus, type MessageStatusData } from "@/components/whatsapp-message-status"

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
  const [chatPresenceMap, setChatPresenceMap] = useState<Map<string, ChatPresenceData>>(new Map())
  const [messageStatusMap, setMessageStatusMap] = useState<Map<string, MessageStatusData>>(new Map())
  const [showStatusMonitor, setShowStatusMonitor] = useState(false)

  // UI overrides to persist local actions between refreshes
  const [readContacts, setReadContacts] = useState<Set<string>>(new Set())
  const [deletedContacts, setDeletedContacts] = useState<Set<string>>(new Set())

  const READ_STORAGE_KEY = "unicrm_chat_read_contacts"
  const DELETED_STORAGE_KEY = "unicrm_chat_deleted_contacts"
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<WhatsAppContact | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [loadedMessagesCount, setLoadedMessagesCount] = useState(50) // Initial number of messages to load

  // QR Code auto-generation states and refs
  const hasRequestedQrRef = useRef(false) // evita múltiplas requisições concorrentes

  const LOCAL_KEY = "unicrm_whatsapp_config"
  const CONNECTED_STORAGE_KEY = "whatsapp_connected"

  // Initialize WhatsApp SSE connection
  const sse = useWhatsappSse({
    apiBase: API_BASE_URL,
    clientKey: loadFromStorage("clientKey", "")
  })

  // Start SSE connection when connected to WhatsApp
  useEffect(() => {
    if (isConnected) {
      sse.start()
    } else {
      sse.stop()
    }
  }, [isConnected, sse])

  // Process chat presence events from SSE
  useEffect(() => {
    if (sse.lastChatPresence) {
      const event = sse.lastChatPresence
      const phone = event.payload.phone || event.payload.contactId
      if (phone) {
        setChatPresenceMap(prev => {
          const newMap = new Map(prev)
          newMap.set(phone, {
            phone,
            status: event.payload.status || "UNAVAILABLE",
            lastSeen: event.payload.lastSeen,
            instanceId: event.payload.instanceId
          })
          return newMap
        })
      }
    }
  }, [sse.lastChatPresence])

  // Process message status events from SSE
  useEffect(() => {
    if (sse.lastMessageStatus) {
      const event = sse.lastMessageStatus
      const phone = event.payload.phone || event.payload.contactId
      if (phone) {
        setMessageStatusMap(prev => {
          const newMap = new Map(prev)
          newMap.set(phone, {
            phone,
            status: event.payload.status || "SENT",
            ids: event.payload.ids || [],
            instanceId: event.payload.instanceId,
            isGroup: event.payload.isGroup,
            momment: event.payload.momment
          })
          return newMap
        })
      }
    }
  }, [sse.lastMessageStatus])

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

    // Load local overrides for read/deleted
    try {
      if (typeof window !== "undefined") {
        const rawRead = localStorage.getItem(READ_STORAGE_KEY)
        if (rawRead) {
          const arr = JSON.parse(rawRead)
          if (Array.isArray(arr)) setReadContacts(new Set(arr))
        }
        const rawDeleted = localStorage.getItem(DELETED_STORAGE_KEY)
        if (rawDeleted) {
          const arr2 = JSON.parse(rawDeleted)
          if (Array.isArray(arr2)) setDeletedContacts(new Set(arr2))
        }
      }
    } catch {}

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

  // Status polling para conectar apenas durante processo de conexão manual
  useEffect(() => {
    // Clear existing status poll
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current)
      statusPollRef.current = null
    }

    // Start status polling only when connecting
    if (connectionStatus === "connecting") {
      statusPollRef.current = window.setInterval(async () => {
        try {
          const status = await apiClient.get<any>("/whatsapp/status")
          const connected = Boolean(status?.connected)
          const smartphoneConnected = Boolean(status?.smartphoneConnected)
          const session = Boolean(status?.session)
          const sessionActive = Boolean(status?.sessionActive)

          console.log("[v0] Status check:", { connected, smartphoneConnected, session, sessionActive })

          if (connected && (smartphoneConnected || session || sessionActive)) {
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
            try { localStorage.setItem(CONNECTED_STORAGE_KEY, "true") } catch {}
            await loadContacts()
            await loadConversations()
          }
        } catch (error) {
          console.error("[v0] Status polling error:", error)
          // Only set to disconnected if we're not already trying to connect
          if (connectionStatus !== "connecting") {
            setConnectionStatus("disconnected")
            setIsConnected(false)
            try { localStorage.setItem(CONNECTED_STORAGE_KEY, "false") } catch {}
          }
        }
      }, 8000)
    }

    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current)
        statusPollRef.current = null
      }
    }
  }, [connectionStatus, isConnected])

  // Desativado: não gerar QR automaticamente e não revalidar estado ao mudar connectionStatus
  useEffect(() => {}, [connectionStatus])

  // Verificação inicial de conexão ao montar (valida uma única vez; depois confia no storage)
  useEffect(() => {
    const initStatus = async () => {
      try {
        // Trust local storage if marked connected
        const localConnected = (() => {
          try { return localStorage.getItem(CONNECTED_STORAGE_KEY) === "true" } catch { return false }
        })()
        if (localConnected) {
          setConnectionStatus("connected")
          setIsConnected(true)
          await loadContacts()
          await loadConversations()
          return
        }

        // Single backend validation when not yet validated
        const status = await apiClient.get<any>("/whatsapp/status")
        const connected = Boolean(status?.connected || status?.sessionActive)
        if (connected) {
          setConnectionStatus("connected")
          setIsConnected(true)
          try { localStorage.setItem(CONNECTED_STORAGE_KEY, "true") } catch {}
          await loadContacts()
          await loadConversations()
        } else {
          setConnectionStatus("disconnected")
          setIsConnected(false)
          try { localStorage.setItem(CONNECTED_STORAGE_KEY, "false") } catch {}
        }
      } catch (e) {
        console.error("[v0] init status error:", e)
      }
    }
    initStatus()
  }, [])

  const generateQRCode = async () => {
    try {
      setIsGeneratingQR(true)
      setConnectionStatus("connecting")
      setConnectionError(null) // Limpar erro anterior
      const url = `${API_BASE_URL}/whatsapp/qr/image?ts=${Date.now()}`
      setQrCode(url)
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
        const sessionActive = Boolean(status?.sessionActive)
        if (connected && (smartphoneConnected || session || sessionActive)) {
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
    }, 5000)
  }

  // Função para gerar QR automaticamente (sem interação do usuário)
  const generateQr = async () => {
    console.log("[v0] generateQr() chamado - isGeneratingQR:", isGeneratingQR, "hasRequestedQrRef:", hasRequestedQrRef.current)
    if (isGeneratingQR || hasRequestedQrRef.current) return
    
    setIsGeneratingQR(true)
    hasRequestedQrRef.current = true
    
    try {
      console.log("[v0] Gerando QR via backend...")
      const url = `${API_BASE_URL}/whatsapp/qr/image?ts=${Date.now()}`
      setQrCode(url)
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

    // Read/Unread filter (respect local overrides)
    if (filters.readStatus.length > 0) {
      const isRead = getUnreadCount(contact) === 0
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

  // Sort contacts by last message time (most recent first)
  const sortContactsByLastMessage = (contacts: WhatsAppContact[]): WhatsAppContact[] => {
    return [...contacts].sort((a, b) => {
      const convA = getConversation(a.id)
      const convB = getConversation(b.id)
      
      const timeA = convA?.lastMessage?.timestamp || 0
      const timeB = convB?.lastMessage?.timestamp || 0
      
      return new Date(timeB).getTime() - new Date(timeA).getTime()
    })
  }

  const filteredContacts = sortContactsByLastMessage(
    contacts.filter(
      (contact) => {
        const nameMatch = contact.name.toLowerCase().includes(searchTerm.toLowerCase())
        const phoneMatch = contact.phone.toLowerCase().includes(searchTerm.toLowerCase())
        
        // Search in message content
        const conversation = getConversation(contact.id)
        const messageMatch = conversation?.messages?.some(message => 
          message.content.toLowerCase().includes(searchTerm.toLowerCase())
        ) || false
        
        // Exclude deleted locally
        const notDeleted = !deletedContacts.has(contact.id)
        return notDeleted && (nameMatch || phoneMatch || messageMatch) && applyFilters(contact)
      }
    )
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

  // Send message with auto-scroll
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !activeContact) return

    try {
      const sentMessage = await whatsappService.sendMessage(activeContact.id, messageInput)
      if (sentMessage) {
        setMessageInput("")
        await loadConversations()
        console.log("[v0] Message sent successfully")
        
        // Auto-scroll to bottom after sending message
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
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

  // Get last message time for contact with relative formatting
  const getLastMessageTime = (contact: WhatsAppContact): string => {
    const conversation = getConversation(contact.id)
    if (!conversation?.lastMessage) return ""

    const messageDate = new Date(conversation.lastMessage.timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - messageDate.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) {
      return "agora"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`
    } else if (diffInDays === 1) {
      return "ontem"
    } else if (diffInDays < 7) {
      return `${diffInDays} dias atrás`
    } else {
      return messageDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    }
  }

  // Get unread count for contact
  const getUnreadCount = (contact: WhatsAppContact): number => {
    const conversation = getConversation(contact.id)
    if (readContacts.has(contact.id)) return 0
    return conversation?.unreadCount || 0
  }

  // Open conversation and mark as read
  const openConversation = async (contact: WhatsAppContact) => {
    setActiveContact(contact)
    setReadContacts(prev => {
      const next = new Set(prev)
      next.add(contact.id)
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(next)))
        }
      } catch {}
      return next
    })
    // Optimistically mark as read in UI
    setConversations(prev => {
      const next = new Map(prev)
      const conv = next.get(contact.id)
      if (conv) {
        next.set(contact.id, { ...conv, unreadCount: 0 })
      }
      return next
    })
    // Notify backend to mark chat as read
    try {
      const phone = (contact.phone || contact.id || "").replace(/\D/g, "")
      if (phone) {
        await apiClient.post("/whatsapp/modify-chat", { phone, action: "read" })
      }
    } catch {}
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

  // Delete conversation function
  const deleteConversation = async (contact: WhatsAppContact) => {
    try {
      // Mark as deleted locally (persist across refreshes)
      setDeletedContacts(prev => {
        const next = new Set(prev)
        next.add(contact.id)
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(Array.from(next)))
          }
        } catch {}
        return next
      })

      // Clear active contact if it's the deleted one
      if (activeContact?.id === contact.id) {
        setActiveContact(null)
      }

      // Notify backend (if supported) to delete chat
      try {
        const phone = (contact.phone || contact.id || "").replace(/\D/g, "")
        if (phone) {
          await apiClient.post("/whatsapp/modify-chat", { phone, action: "delete" })
        }
      } catch {}

      console.log("[v0] Conversation marked deleted:", contact.id)
    } catch (error) {
      console.error("[v0] Error deleting conversation:", error)
    }
  }

  // Archive conversation function
  const archiveConversation = async (contact: WhatsAppContact) => {
    try {
      // Update conversation status to archived
      setConversations(prev => {
        const newMap = new Map(prev)
        const conversation = newMap.get(contact.id)
        if (conversation) {
          newMap.set(contact.id, { ...conversation, status: "arquivado" })
        }
        return newMap
      })
      
      console.log("[v0] Conversation archived:", contact.id)
    } catch (error) {
      console.error("[v0] Error archiving conversation:", error)
    }
  }

  // Load more messages for lazy loading
  const loadMoreMessages = () => {
    setIsLoadingMessages(true)
    setTimeout(() => {
      setLoadedMessagesCount(prev => prev + 50)
      setIsLoadingMessages(false)
    }, 500)
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
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r flex flex-col h-full min-h-0 bg-gradient-to-b from-white to-gray-50">
        {/* Enhanced Header with UniCRM Identity */}
        <div className="p-4 border-b bg-gradient-to-r from-green-50 to-blue-50 shadow-sm border-green-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg md:text-xl text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Conversas
            </h2>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:h-10 md:w-10"
                onClick={() => setShowStatusMonitor(true)}
                title="Monitor de Status WhatsApp"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
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
          {/* Enhanced Search Bar with UniCRM Styling */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-green-500" />
            <Input
              placeholder="Pesquisar por nome, número ou mensagem..."
              className="pl-10 pr-4 py-3 text-sm border-2 border-green-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-green-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Enhanced Tabs with UniCRM Colors */}
        <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-2 mx-4 mt-3 mb-2 bg-green-50 p-1 rounded-lg border border-green-100">
            <TabsTrigger value="all" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all">
              Todos
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all">
              <MessageSquare className="h-4 w-4 mr-1 inline" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 h-full min-h-0 overflow-y-auto">
            <TabsContent value="all" className="m-0">
              {(() => {
                const dedup = Array.from(new Map(filteredContacts.map(c => [c.id, c])).values())
                const sorted = dedup.sort((a, b) => {
                  const ta = getConversation(a.id)?.lastMessage?.timestamp || 0
                  const tb = getConversation(b.id)?.lastMessage?.timestamp || 0
                  return tb - ta
                })
                return sorted.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  lastMessage={getLastMessage(contact)}
                  lastMessageTime={getLastMessageTime(contact)}
                  unreadCount={getUnreadCount(contact)}
                  isActive={activeContact?.id === contact.id}
                  onClick={() => openConversation(contact)}
                  presenceData={chatPresenceMap.get(contact.phone)}
                  onDelete={(contact) => {
                    setContactToDelete(contact)
                    setShowDeleteConfirm(true)
                  }}
                  onArchive={archiveConversation}
                />
              ))
              })()}
            </TabsContent>

            <TabsContent value="whatsapp" className="m-0">
              {(() => {
                const dedup = Array.from(new Map(filteredContacts.map(c => [c.id, c])).values())
                const sorted = dedup.sort((a, b) => {
                  const ta = getConversation(a.id)?.lastMessage?.timestamp || 0
                  const tb = getConversation(b.id)?.lastMessage?.timestamp || 0
                  return tb - ta
                })
                return sorted.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  lastMessage={getLastMessage(contact)}
                  lastMessageTime={getLastMessageTime(contact)}
                  unreadCount={getUnreadCount(contact)}
                  isActive={activeContact?.id === contact.id}
                  onClick={() => openConversation(contact)}
                  presenceData={chatPresenceMap.get(contact.phone)}
                  onDelete={(contact) => {
                    setContactToDelete(contact)
                    setShowDeleteConfirm(true)
                  }}
                  onArchive={archiveConversation}
                />
              ))
              })()}
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
                  <WhatsAppPresenceIndicator 
                    phone={activeContact.phone} 
                    presenceData={chatPresenceMap.get(activeContact.phone)}
                    className="flex-shrink-0"
                  />
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
              {(() => {
                const conv = getConversation(activeContact.id)
                const list = conv?.messages || []
                const uniq = Array.from(new Map(list.map(m => [m.id, m])).values())
                
                // Implement lazy loading - show only recent messages
                const displayMessages = uniq.slice(-loadedMessagesCount)
                
                return (
                  <>
                    {displayMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.isFromMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-lg p-2 md:p-3 text-sm md:text-base ${
                            message.isFromMe ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div className={`flex items-center justify-between mt-1 ${
                            message.isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            <p className="text-xs">
                              {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {message.isFromMe && (
                              <WhatsAppMessageStatus 
                                messageId={message.id}
                                statusData={messageStatusMap.get(activeContact.phone)}
                                className="ml-2"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Load more messages button */}
                    {uniq.length > loadedMessagesCount && (
                      <div className="flex justify-center py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMoreMessages}
                          disabled={isLoadingMessages}
                          className="text-xs"
                        >
                          {isLoadingMessages ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Carregando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Carregar mais mensagens
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
            <div ref={messagesEndRef} />
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
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Bem-vindo ao Chat UniCRM</h3>
            <p className="text-gray-600 mb-4">
              Selecione uma conversa ao lado ou crie uma nova para começar a atender seus clientes
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowNewConversation(true)}
              className="bg-white border-green-200 text-green-700 hover:bg-green-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conversa
            </Button>
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

      <Dialog open={showStatusMonitor} onOpenChange={setShowStatusMonitor}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Monitor de Status WhatsApp</DialogTitle>
            <DialogDescription>
              Visualize em tempo real o status de presença e mensagens dos contatos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <WhatsAppStatusMonitor 
              sse={sse}
              presenceData={Array.from(chatPresenceMap.values())}
              messageStatusData={Array.from(messageStatusMap.values())}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusMonitor(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (contactToDelete) {
                  deleteConversation(contactToDelete)
                  setShowDeleteConfirm(false)
                  setContactToDelete(null)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Enhanced Contact item component with delete/archive actions
function ContactItem({
  contact,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isActive,
  onClick,
  presenceData,
  onDelete,
  onArchive,
}: {
  contact: WhatsAppContact
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isActive: boolean
  onClick: () => void
  presenceData?: ChatPresenceData
  onDelete?: (contact: WhatsAppContact) => void
  onArchive?: (contact: WhatsAppContact) => void
}) {
  return (
    <div className={`
      p-4 cursor-pointer transition-all duration-200 ease-in-out group
      ${isActive 
        ? "bg-green-50 border-l-4 border-green-500 shadow-sm" 
        : "hover:bg-gray-50"
      }
      border-b border-gray-100 last:border-b-0
    `} onClick={onClick}>
      <div className="flex items-center gap-3">
        {/* Enhanced Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 rounded-full">
            <AvatarImage 
              src={contact.avatar || "/placeholder.svg"} 
              alt={contact.name} 
              className="object-cover"
            />
            <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
              {contact.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <WhatsAppPresenceIndicator 
            phone={contact.phone} 
            presenceData={presenceData}
            className="absolute -bottom-1 -right-1"
          />
        </div>
        
        {/* Enhanced Contact Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className={`font-semibold truncate ${
              isActive ? "text-gray-900" : "text-gray-800"
            }`}>
              {contact.name}
            </h4>
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {lastMessageTime}
            </span>
          </div>
          
          <div className="flex justify-between items-start mb-1">
            <p className={`text-sm truncate ${
              unreadCount > 0 
                ? "text-gray-900 font-medium" 
                : "text-gray-600"
            }`}>
              {lastMessage}
            </p>
            {unreadCount > 0 && (
              <Badge className="ml-2 flex-shrink-0 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center">
            <span className="text-xs text-gray-500">{contact.phone}</span>
            <MessageSquare className="h-3 w-3 ml-2 text-green-500 flex-shrink-0" />
          </div>
        </div>
        
        {/* Action Buttons */}
        {(onDelete || onArchive) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onArchive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive(contact)
                }}
                title="Arquivar conversa"
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(contact)
                }}
                title="Excluir conversa"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
