import { API_BASE_URL, apiClient } from "./api-client"

export interface WhatsAppContact {
  id: string
  name: string
  phone: string
  avatar?: string
  isOnline: boolean
  lastSeen?: Date
}

export interface WhatsAppMessage {
  id: string
  contactId: string
  content: string
  timestamp: Date
  isFromMe: boolean
  messageType: "text" | "image" | "document" | "audio" | "video"
  status: "sent" | "delivered" | "read" | "failed"
  mediaUrl?: string
}

export interface WhatsAppConversation {
  contactId: string
  messages: WhatsAppMessage[]
  unreadCount: number
  lastMessage?: WhatsAppMessage
  status?: "em_atendimento" | "encerrado" | "aguardando"
  tags?: string[]
  queueId?: string
  assignedUserId?: string
  isRead?: boolean
}

// API Configuration interface - supports multiple WhatsApp APIs
export interface WhatsAppAPIConfig {
  provider: "whatsapp-web-js" | "baileys" | "twilio" | "meta-business" | "custom" | "z-api"
  apiKey?: string
  webhookUrl?: string
  phoneNumberId?: string
  accessToken?: string
  customEndpoint?: string
  customHeaders?: Record<string, string>
}

// Z-Api specific configuration and instance management
export interface ZApiConfig extends WhatsAppAPIConfig {
  provider: "z-api"
  instanceId?: string
  instanceToken?: string
  clientId?: string
  zapiBaseUrl?: string
}

export interface ZApiInstance {
  instanceId: string
  instanceToken: string
  status: "connected" | "disconnected" | "qrcode"
  qrCode?: string
  phone?: string
  clientId: string
}

// Abstract WhatsApp API class for extensibility
export abstract class WhatsAppAPIProvider {
  protected config: WhatsAppAPIConfig

  constructor(config: WhatsAppAPIConfig) {
    this.config = config
  }

  abstract initialize(): Promise<void>
  abstract sendMessage(contactId: string, message: string): Promise<WhatsAppMessage>
  abstract getContacts(): Promise<WhatsAppContact[]>
  abstract getConversations(): Promise<WhatsAppConversation[]>
  abstract getMessages(contactId: string): Promise<WhatsAppMessage[]>
  abstract markAsRead(contactId: string, messageId: string): Promise<void>
  abstract onMessageReceived(callback: (message: WhatsAppMessage) => void): void
  abstract onContactStatusChanged(callback: (contact: WhatsAppContact) => void): void
  abstract disconnect(): Promise<void>
}

// Generic API Provider for custom integrations
export class GenericWhatsAppProvider extends WhatsAppAPIProvider {
  private messageCallback?: (message: WhatsAppMessage) => void
  private contactCallback?: (contact: WhatsAppContact) => void
  private eventSource?: EventSource

  async initialize(): Promise<void> {
    console.log("[v0] Initializing Generic WhatsApp Provider with config:", this.config.provider)

    // Setup webhook listener for real-time messages
    if (this.config.webhookUrl) {
      this.setupWebhookListener()
    }

    // Setup Server-Sent Events for real-time updates
    if (this.config.customEndpoint) {
      this.setupSSEConnection()
    }
  }

  private setupWebhookListener(): void {
    // This would be handled by your backend webhook endpoint
    console.log("[v0] Webhook listener setup for:", this.config.webhookUrl)
  }

  private setupSSEConnection(): void {
    if (this.config.customEndpoint) {
      this.eventSource = new EventSource(`${this.config.customEndpoint}/events`)

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "message" && this.messageCallback) {
            this.messageCallback(data.message)
          } else if (data.type === "contact_status" && this.contactCallback) {
            this.contactCallback(data.contact)
          }
        } catch (error) {
          console.error("[v0] Error parsing SSE data:", error)
        }
      }
    }
  }

  async sendMessage(contactId: string, message: string): Promise<WhatsAppMessage> {
    const endpoint = `${this.config.customEndpoint}/send-message`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.config.customHeaders || {}),
    }

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contactId,
        message,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      id: result.messageId || `msg_${Date.now()}`,
      contactId,
      content: message,
      timestamp: new Date(),
      isFromMe: true,
      messageType: "text",
      status: "sent",
    }
  }

  async getContacts(): Promise<WhatsAppContact[]> {
    const endpoint = `${this.config.customEndpoint}/contacts`
    const headers: Record<string, string> = {
      ...this.config.customHeaders,
    }

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
    }

    try {
      const response = await fetch(endpoint, { headers })

      if (!response.ok) {
        console.warn("[v0] Failed to fetch contacts, returning empty array")
        return []
      }

      const data = await response.json()
      return data.contacts || []
    } catch (error) {
      console.error("[v0] Error fetching contacts:", error)
      return []
    }
  }

  async getConversations(): Promise<WhatsAppConversation[]> {
    const endpoint = `${this.config.customEndpoint}/conversations`
    const headers: Record<string, string> = {
      ...this.config.customHeaders,
    }

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
    }

    try {
      const response = await fetch(endpoint, { headers })

      if (!response.ok) {
        console.warn("[v0] Failed to fetch conversations, returning empty array")
        return []
      }

      const data = await response.json()
      return data.conversations || []
    } catch (error) {
      console.error("[v0] Error fetching conversations:", error)
      return []
    }
  }

  async getMessages(contactId: string): Promise<WhatsAppMessage[]> {
    const endpoint = `${this.config.customEndpoint}/messages/${contactId}`
    const headers: Record<string, string> = {
      ...this.config.customHeaders,
    }

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
    }

    try {
      const response = await fetch(endpoint, { headers })

      if (!response.ok) {
        console.warn(`[v0] Failed to fetch messages for contact ${contactId}, returning empty array`)
        return []
      }

      const data = await response.json()
      return data.messages || []
    } catch (error) {
      console.error("[v0] Error fetching messages:", error)
      return []
    }
  }

  async markAsRead(contactId: string, messageId: string): Promise<void> {
    const endpoint = `${this.config.customEndpoint}/mark-read`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.config.customHeaders || {}),
    }

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
    }

    try {
      await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ contactId, messageId }),
      })
    } catch (error) {
      console.error("[v0] Error marking message as read:", error)
    }
  }

  onMessageReceived(callback: (message: WhatsAppMessage) => void): void {
    this.messageCallback = callback
  }

  onContactStatusChanged(callback: (contact: WhatsAppContact) => void): void {
    this.contactCallback = callback
  }

  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }
    console.log("[v0] WhatsApp provider disconnected")
  }
}

export class ZApiProvider extends WhatsAppAPIProvider {
  private messageCallback?: (message: WhatsAppMessage) => void
  private contactCallback?: (contact: WhatsAppContact) => void
  private qrCodeCallback?: (qrCode: string) => void
  private statusCallback?: (status: string) => void
  private instanceId?: string
  private instanceToken?: string
  private clientId: string
  private baseUrl: string

  constructor(config: ZApiConfig) {
    super(config)
    this.instanceId = config.instanceId
    this.instanceToken = config.instanceToken
    this.clientId = config.clientId || `client_${Date.now()}`
    this.baseUrl = config.zapiBaseUrl || config.customEndpoint || "https://api.z-api.io"
    if (this.baseUrl.includes("/instances/")) {
      try {
        const u = new URL(this.baseUrl)
        this.baseUrl = `${u.protocol}//${u.host}`
      } catch {
        this.baseUrl = this.baseUrl.split("/instances/")[0]
      }
    }
  }

  async initialize(): Promise<void> {
    console.log("[v0] Initializing Z-Api Provider for client:", this.clientId)

    // If no instance exists, create one
    if (!this.instanceId || !this.instanceToken) {
      await this.createOrGetInstance()
    } else {
      // Check existing instance status
      await this.checkInstanceStatus()
    }
  }

  private async createOrGetInstance(): Promise<void> {
    try {
      // Try to load instance from backend config first (multi-tenant safe)
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { API_BASE_URL } = require("@/lib/api-client")
        if (API_BASE_URL) {
          const res = await fetch(`${API_BASE_URL}/whatsapp/config`)
          if (res.ok) {
            const safe = await res.json()
            const fromBackendId = safe?.instanceId
            const fromBackendToken = safe?.instanceToken
            if (fromBackendId && fromBackendToken) {
              this.instanceId = fromBackendId
              this.instanceToken = fromBackendToken
              localStorage.setItem(
                `zapi_instance_${this.clientId}`,
                JSON.stringify({ instanceId: this.instanceId, instanceToken: this.instanceToken, status: "disconnected", clientId: this.clientId }),
              )
              console.log("[v0] Using instance from backend config:", this.instanceId)
              await this.checkInstanceStatus()
              return
            }
          }
        }
      } catch {}
      // Check if instance already exists for this client
      const savedInstance = localStorage.getItem(`zapi_instance_${this.clientId}`)

      if (savedInstance) {
        const instance: ZApiInstance = JSON.parse(savedInstance)
        this.instanceId = instance.instanceId
        this.instanceToken = instance.instanceToken
        console.log("[v0] Using existing Z-Api instance:", this.instanceId)

        await this.checkInstanceStatus()
        return
      }

      // Do NOT auto-create instance: require manual ID/TOKEN
      throw new Error(
        "Instância Z-API não encontrada. Informe manualmente 'instanceId' e 'instanceToken' na configuração do WhatsApp (cole a URL completa da instância para autoextrair).",
      )
    } catch (error) {
      console.error("[v0] Error creating Z-Api instance:", error)
      throw error
    }
  }

  async generateQRCode(): Promise<string> {
    if (!this.instanceId || !this.instanceToken) {
      throw new Error("Instance not initialized")
    }

    try {
      console.log("[v0] Generating QR Code via backend for instance:", this.instanceId)
      // Prefer PNG bytes endpoint and return its URL (works in <img src>)
      const qrUrl = `${API_BASE_URL}/whatsapp/qr/image?ts=${Date.now()}`

      // Fire-and-forget status polling
      this.startStatusPolling()

      console.log("[v0] QR Code URL generated:", qrUrl)
      return qrUrl
    } catch (error) {
      console.error("[v0] Error generating QR Code via backend:", error)
      throw error
    }
  }

  private startStatusPolling(): void {
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.checkInstanceStatus()

        if (status === "connected") {
          clearInterval(pollInterval)

          if (this.statusCallback) {
            this.statusCallback("connected")
          }

          // Update saved instance
          const savedInstance = localStorage.getItem(`zapi_instance_${this.clientId}`)
          if (savedInstance) {
            const instance: ZApiInstance = JSON.parse(savedInstance)
            instance.status = "connected"
            localStorage.setItem(`zapi_instance_${this.clientId}`, JSON.stringify(instance))
          }

          // Setup webhook listener
          await this.setupWebhook()
        }
      } catch (error) {
        console.error("[v0] Error polling status:", error)
      }
    }, 3000) // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  private async checkInstanceStatus(): Promise<string> {
    if (!this.instanceId || !this.instanceToken) {
      return "disconnected"
    }

    try {
      // Use backend endpoint instead of direct Z-API call
      const data = await apiClient.get<any>("/whatsapp/status")
      const status = data.connected === true ? "connected" : "disconnected"

      console.log("[v0] Instance status from backend:", status)
      return status
    } catch (error) {
      console.error("[v0] Error checking status via backend:", error)
      return "disconnected"
    }
  }

  private async setupWebhook(): Promise<void> {
    if (!this.config.webhookUrl || !this.instanceId || !this.instanceToken) {
      return
    }

    try {
      const isHttps = /^https:/i.test(this.config.webhookUrl)
      if (!isHttps) {
        console.warn("[v0] Webhook URL must be HTTPS for Z-API; skipping setup:", this.config.webhookUrl)
        return
      }

      // Use backend endpoint instead of direct Z-API call
      const response = await fetch("/api/whatsapp/setup-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        },
        body: JSON.stringify({
          webhookUrl: this.config.webhookUrl,
          events: ["message", "status"]
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.warn("[v0] Backend webhook setup failed:", response.status, error)
      } else {
        console.log("[v0] Webhook configured successfully via backend")
      }
    } catch (error) {
      console.error("[v0] Error setting up webhook via backend:", error)
    }
  }

  async sendMessage(contactId: string, message: string): Promise<WhatsAppMessage> {
    if (!this.instanceId || !this.instanceToken) {
      throw new Error("Instance not initialized")
    }

    try {
      // Use backend endpoint instead of direct Z-API call
      const response = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        },
        body: JSON.stringify({
          contactId: contactId.replace(/\D/g, ""),
          message: message,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Backend send message failed:", error)
        throw new Error(`Send message failed: ${response.status}`)
      }

      const result = await response.json()
      return {
        id: result.messageId || `msg_${Date.now()}`,
        contactId: contactId.replace(/\D/g, ""),
        content: message,
        timestamp: new Date(),
        isFromMe: true,
        messageType: "text",
        status: "sent",
      }
    } catch (error) {
      console.error("[v0] Error sending message via backend:", error)
      throw error
    }
  }

  async getContacts(): Promise<WhatsAppContact[]> {
    if (!this.instanceId || !this.instanceToken) {
      return []
    }

    try {
      const status = await this.checkInstanceStatus()
      if (status !== "connected") return []
      
      // Use backend endpoint instead of direct Z-API call
      const response = await fetch("/api/whatsapp/contacts", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        }
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Backend contacts error:", error)
        return []
      }

      const data = await response.json()
      return data.contacts || []
    } catch (error) {
      console.error("[v0] Error fetching contacts via backend:", error)
      return []
    }
  }

  async getConversations(): Promise<WhatsAppConversation[]> {
    if (!this.instanceId || !this.instanceToken) {
      return []
    }

    try {
      const status = await this.checkInstanceStatus()
      if (status !== "connected") return []
      
      // Use backend endpoint instead of direct Z-API call
      const response = await fetch("/api/whatsapp/conversations", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        }
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Backend conversations error:", error)
        return []
      }

      const data = await response.json()
      return data.conversations || []
    } catch (error) {
      console.error("[v0] Error fetching conversations via backend:", error)
      return []
    }
  }

  async getMessages(contactId: string): Promise<WhatsAppMessage[]> {
    if (!this.instanceId || !this.instanceToken) {
      return []
    }

    try {
      // Use backend endpoint instead of direct Z-API call
      const response = await fetch(`/api/whatsapp/messages/${encodeURIComponent(contactId)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        }
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Backend messages error:", error)
        return []
      }

      const data = await response.json()
      return data.messages || []
    } catch (error) {
      console.error("[v0] Error fetching messages via backend:", error)
      return []
    }
  }

  async markAsRead(contactId: string, messageId: string): Promise<void> {
    if (!this.instanceId || !this.instanceToken) {
      return
    }

    try {
      // Use backend endpoint instead of direct Z-API call
      const response = await fetch("/api/whatsapp/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        },
        body: JSON.stringify({
          contactId: contactId.replace(/\D/g, ""),
          messageId: messageId
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Backend mark as read failed:", error)
      } else {
        console.log("[v0] Message marked as read via backend")
      }
    } catch (error) {
      console.error("[v0] Error marking message as read via backend:", error)
    }
  }

  onMessageReceived(callback: (message: WhatsAppMessage) => void): void {
    this.messageCallback = callback
  }

  onContactStatusChanged(callback: (contact: WhatsAppContact) => void): void {
    this.contactCallback = callback
  }

  onQRCodeGenerated(callback: (qrCode: string) => void): void {
    this.qrCodeCallback = callback
  }

  onStatusChanged(callback: (status: string) => void): void {
    this.statusCallback = callback
  }

  async disconnect(): Promise<void> {
    if (this.instanceId && this.instanceToken) {
      try {
        // Use backend endpoint instead of direct Z-API call
        const response = await fetch("/api/whatsapp/disconnect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
          },
          body: JSON.stringify({})
        })

        if (!response.ok) {
          const error = await response.text()
          console.error("[v0] Backend disconnect failed:", error)
          throw new Error(`Disconnect failed: ${response.status}`)
        }

        const result = await response.json()
        console.log("[v0] WhatsApp disconnected via backend:", result)

        // Clear saved instance
        localStorage.removeItem(`zapi_instance_${this.clientId}`)

      } catch (error) {
        console.error("[v0] Error disconnecting via backend:", error)
        throw error
      }
    }
  }

  async getInstanceStatus(): Promise<string> {
    return await this.checkInstanceStatus()
  }

  async generatePhoneCode(phone: string): Promise<string> {
    if (!this.instanceId || !this.instanceToken) {
      throw new Error("Instance not initialized")
    }
    
    try {
      // Use backend endpoint instead of direct Z-API call
      const response = await fetch("/api/whatsapp/generate-phone-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, "")
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Backend phone code generation failed:", error)
        throw new Error(`Phone code generation failed: ${response.status}`)
      }

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.code || data.qrcode || data.base64 || ""
      } catch {
        return text
      }
    } catch (error) {
      console.error("[v0] Error generating phone code via backend:", error)
      throw error
    }
  }

  async disconnectInstance(): Promise<boolean> {
    if (!this.instanceId || !this.instanceToken) return false
    
    try {
      // Use backend endpoint instead of direct Z-API call
      const response = await fetch("/api/whatsapp/disconnect-instance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Backend disconnect instance failed:", error)
        return false
      }

      console.log("[v0] Instance disconnected via backend")
      return true
    } catch (error) {
      console.error("[v0] Error disconnecting instance via backend:", error)
      return false
    }
  }

  async restartInstance(): Promise<boolean> {
    if (!this.instanceId || !this.instanceToken) return false
    
    try {
      // Use backend endpoint instead of direct Z-API call
      const response = await fetch("/api/whatsapp/restart-instance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("unicrm_access_token")}`
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Backend restart instance failed:", error)
        return false
      }

      console.log("[v0] Instance restarted via backend")
      return true
    } catch (error) {
      console.error("[v0] Error restarting instance via backend:", error)
      return false
    }
  }
}

// WhatsApp Service Manager
export class WhatsAppService {
  private provider: WhatsAppAPIProvider | null = null
  private contacts: WhatsAppContact[] = []
  private conversations: Map<string, WhatsAppConversation> = new Map()
  private messageListeners: ((message: WhatsAppMessage) => void)[] = []
  private contactListeners: ((contact: WhatsAppContact) => void)[] = []

  private async ensureProviderInitialized(): Promise<boolean> {
    if (this.provider) return true
    try {
      if (typeof window !== "undefined") {
        const keys = ["unicrm_whatsapp_config", "whatsapp_config"]
        for (const k of keys) {
          const raw = localStorage.getItem(k)
          if (raw) {
            const cfg = JSON.parse(raw)
            if (cfg && cfg.provider) {
              await this.initialize(cfg as WhatsAppAPIConfig)
              return true
            }
          }
        }
      }
    } catch {}
    return false
  }

  async initialize(config: WhatsAppAPIConfig): Promise<void> {
    console.log("[v0] Initializing WhatsApp service with provider:", config.provider)

    // Create provider based on configuration
    switch (config.provider) {
      case "z-api":
        this.provider = new ZApiProvider(config as ZApiConfig)
        break
      case "custom":
      case "whatsapp-web-js":
      case "baileys":
      case "twilio":
      case "meta-business":
        this.provider = new GenericWhatsAppProvider(config)
        break
      default:
        throw new Error(`Unsupported WhatsApp provider: ${config.provider}`)
    }

    const provider = this.provider
    await provider.initialize()

    if (!provider || this.provider !== provider) {
      return
    }

    provider.onMessageReceived((message) => {
      this.handleNewMessage(message)
    })

    provider.onContactStatusChanged((contact) => {
      this.handleContactStatusChange(contact)
    })

    // Load initial data
    await this.loadContacts()
    await this.loadConversations()
  }

  private async loadContacts(): Promise<void> {
    if (!this.provider) return

    try {
      const fetched = await this.provider.getContacts()
      let contacts = Array.isArray(fetched) ? fetched : []
      if (contacts.length === 0) {
        try {
          const convs = await this.provider.getConversations()
          const byId = new Map<string, WhatsAppContact>()
          convs.forEach((c) => {
            const id = (c.contactId || "").replace(/\D/g, "")
            if (!id) return
            if (!byId.has(id)) {
              byId.set(id, {
                id,
                name: id,
                phone: id,
                isOnline: true,
                lastSeen: new Date(),
              } as WhatsAppContact)
            }
          })
          contacts = Array.from(byId.values())
        } catch {}
      }
      if (contacts.length > 0) {
        const merged = new Map<string, WhatsAppContact>()
        ;[...this.contacts, ...contacts].forEach((c) => merged.set(c.id, c))
        this.contacts = Array.from(merged.values())
      }
      console.log("[v0] Loaded contacts:", this.contacts.length)
    } catch (error) {
      console.error("[v0] Error loading contacts:", error)
    }
  }

  private async loadConversations(): Promise<void> {
    if (!this.provider) return

    try {
      const fromProvider = await this.provider.getConversations()
      const providerConvs = Array.isArray(fromProvider) ? fromProvider : []
      let backendConvs: WhatsAppConversation[] = []
      try {
        const api = API_BASE_URL
        if (api) {
          const res = await fetch(`${api}/whatsapp/conversations`)
          if (res.ok) {
            const data = await res.json()
            const convs = Array.isArray(data?.conversations) ? data.conversations : []
            backendConvs = convs.map((c: any) => ({
              contactId: String(c.contactId || "").replace(/\D/g, ""),
              messages: Array.isArray(c.messages)
                ? c.messages.map((m: any) => ({
                    id: String(m.id || `msg_${Date.now()}`),
                    contactId: String(m.contactId || "").replace(/\D/g, ""),
                    content: String(m.content || ""),
                    timestamp: new Date(String(m.timestamp || new Date().toISOString())),
                    isFromMe: Boolean(m.isFromMe),
                    messageType: (m.messageType as any) || "text",
                    status: (m.status as any) || "received",
                  }))
                : [],
              unreadCount: Number(c.unreadCount || 0),
              lastMessage: c.lastMessage
                ? {
                    id: String(c.lastMessage.id || `msg_${Date.now()}`),
                    contactId: String(c.lastMessage.contactId || "").replace(/\D/g, ""),
                    content: String(c.lastMessage.content || ""),
                    timestamp: new Date(String(c.lastMessage.timestamp || new Date().toISOString())),
                    isFromMe: Boolean(c.lastMessage.isFromMe),
                    messageType: (c.lastMessage.messageType as any) || "text",
                    status: (c.lastMessage.status as any) || "received",
                  }
                : undefined,
            }))
          }
        }
      } catch {}
      const merged = new Map<string, WhatsAppConversation>()
      ;[...providerConvs, ...backendConvs].forEach((conv) => {
        const existing = merged.get(conv.contactId)
        if (!existing) {
          merged.set(conv.contactId, conv)
        } else {
          const byId = new Map<string, WhatsAppMessage>()
          ;(existing.messages || []).forEach((m) => byId.set(m.id, m))
          ;(conv.messages || []).forEach((m) => byId.set(m.id, m))
          existing.messages = Array.from(byId.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          existing.lastMessage = existing.messages[existing.messages.length - 1] || existing.lastMessage
          existing.unreadCount = existing.messages.filter((m) => !m.isFromMe).length
          merged.set(conv.contactId, existing)
        }
      })
      merged.forEach((v, k) => this.conversations.set(k, v))
      console.log("[v0] Loaded conversations:", merged.size)
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
    }
  }

  private handleNewMessage(message: WhatsAppMessage): void {
    console.log("[v0] New message received:", message)

    // Update conversation
    const conversation = this.conversations.get(message.contactId) || {
      contactId: message.contactId,
      messages: [],
      unreadCount: 0,
    }

    conversation.messages.push(message)
    conversation.lastMessage = message

    if (!message.isFromMe) {
      conversation.unreadCount++
    }

    this.conversations.set(message.contactId, conversation)

    // Notify listeners
    this.messageListeners.forEach((listener) => listener(message))
  }

  private handleContactStatusChange(contact: WhatsAppContact): void {
    console.log("[v0] Contact status changed:", contact)

    // Update contact in list
    const index = this.contacts.findIndex((c) => c.id === contact.id)
    if (index >= 0) {
      this.contacts[index] = contact
    } else {
      this.contacts.push(contact)
    }

    // Notify listeners
    this.contactListeners.forEach((listener) => listener(contact))
  }

  async sendMessage(contactId: string, message: string): Promise<WhatsAppMessage | null> {
    if (!this.provider) {
      try {
        const raw = typeof window !== "undefined" ? (localStorage.getItem("unicrm_whatsapp_config") || localStorage.getItem("whatsapp_config")) : null
        if (raw) {
          const cfg = JSON.parse(raw)
          await this.initialize(cfg)
        } else {
          console.error("[v0] WhatsApp provider not initialized")
          return null
        }
      } catch (e) {
        console.error("[v0] Failed to auto-initialize WhatsApp provider:", e)
        return null
      }
    }

    try {
      if (!this.provider) {
        console.error("[v0] WhatsApp provider not initialized")
        return null
      }
      const sentMessage = await this.provider.sendMessage(contactId, message)
      try {
        const api = API_BASE_URL
        if (api) {
          await fetch(`${api}/whatsapp/send-message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactId: contactId, message, timestamp: new Date().toISOString() }),
          })
        }
      } catch {}
      this.handleNewMessage(sentMessage)
      return sentMessage
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      return null
    }
  }

  getContacts(): WhatsAppContact[] {
    return this.contacts ? [...this.contacts] : []
  }

  getConversation(contactId: string): WhatsAppConversation | null {
    return this.conversations.get(contactId) || null
  }

  getAllConversations(): WhatsAppConversation[] {
    return Array.from(this.conversations.values())
  }

  createContact(phone: string, name?: string): WhatsAppContact {
    const digits = (phone || "").replace(/\D/g, "")
    const contact: WhatsAppContact = {
      id: digits,
      name: name?.trim() || digits,
      phone: digits,
      avatar: undefined,
      isOnline: true,
      lastSeen: new Date(),
    }
    // Add or update contact list
    const index = this.contacts.findIndex((c) => c.id === contact.id)
    if (index >= 0) {
      this.contacts[index] = contact
    } else {
      this.contacts.push(contact)
    }
    // Ensure conversation exists
    if (!this.conversations.has(digits)) {
      this.conversations.set(digits, { contactId: digits, messages: [], unreadCount: 0 })
    }
    // Notify listeners
    this.contactListeners.forEach((listener) => listener(contact))
    return contact
  }

  async markAsRead(contactId: string, messageId: string): Promise<void> {
    if (!this.provider) return

    try {
      await this.provider.markAsRead(contactId, messageId)

      // Update local conversation
      const conversation = this.conversations.get(contactId)
      if (conversation) {
        conversation.unreadCount = 0
        this.conversations.set(contactId, conversation)
      }
    } catch (error) {
      console.error("[v0] Error marking message as read:", error)
    }
  }

  async disconnectInstance(): Promise<boolean> {
    if (!this.provider) {
      const okInit = await this.ensureProviderInitialized()
      if (!okInit) return false
    }
    if (this.provider instanceof ZApiProvider) {
      const ok = await this.provider.disconnectInstance()
      try { await (this.provider as ZApiProvider).getInstanceStatus() } catch {}
      return ok
    }
    return false
  }

  async restartInstance(): Promise<boolean> {
    if (!this.provider) {
      const okInit = await this.ensureProviderInitialized()
      if (!okInit) return false
    }
    if (this.provider instanceof ZApiProvider) {
      const ok = await this.provider.restartInstance()
      try { await (this.provider as ZApiProvider).getInstanceStatus() } catch {}
      return ok
    }
    return false
  }

  async generatePhoneCode(phone: string): Promise<string> {
    if (!this.provider) return ""
    if (this.provider instanceof ZApiProvider) {
      return await this.provider.generatePhoneCode(phone)
    }
    return ""
  }

  async refreshMessages(contactId: string): Promise<WhatsAppMessage[]> {
    if (!this.provider) return []
    try {
      const candidates: string[] = (() => {
        const digits = (contactId || "").replace(/\D/g, "")
        const set = new Set<string>()
        set.add(digits)
        if (digits.length === 11 && !digits.startsWith("55")) set.add(`55${digits}`)
        if (digits.startsWith("55") && digits.length > 11) set.add(digits.slice(2))
        return Array.from(set)
      })()

      const providerMsgsArr: WhatsAppMessage[][] = []
      for (const cand of candidates) {
        try {
          const msgs = await this.provider.getMessages(cand)
          if (Array.isArray(msgs) && msgs.length > 0) providerMsgsArr.push(msgs)
        } catch {}
      }
      const providerMsgs: WhatsAppMessage[] = ([] as WhatsAppMessage[]).concat(...providerMsgsArr)

      let backendMsgs: WhatsAppMessage[] = []
      try {
        const api = API_BASE_URL
        if (api) {
          for (const cand of candidates) {
            const res = await fetch(`${api}/whatsapp/messages/${cand}`)
            if (res.ok) {
              const data = await res.json()
              const backend = Array.isArray(data?.messages) ? data.messages : []
              const mapped = backend.map((m: any) => ({
                id: String(m.id || `msg_${Date.now()}`),
                contactId: String(m.contactId || "").replace(/\D/g, ""),
                content: String(m.content || ""),
                timestamp: new Date(String(m.timestamp || new Date().toISOString())),
                isFromMe: Boolean(m.isFromMe),
                messageType: (m.messageType as any) || "text",
                status: (m.status as any) || "received",
              }))
              backendMsgs = backendMsgs.concat(mapped)
            }
          }
        }
      } catch {}
      const existing = this.conversations.get(contactId) || { contactId, messages: [], unreadCount: 0 }
      const byId = new Map<string, WhatsAppMessage>()
      const push = (m: WhatsAppMessage) => {
        const k = `${m.id}|${m.timestamp instanceof Date ? m.timestamp.getTime() : new Date(m.timestamp).getTime()}`
        byId.set(k, m)
      }
      ;(existing.messages || []).forEach(push)
      ;(providerMsgs || []).forEach(push)
      ;(backendMsgs || []).forEach(push)
      const combined = Array.from(byId.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      if (combined.length > 0) {
        const byId = new Map<string, WhatsAppMessage>()
        combined.forEach((m) => byId.set(m.id, m))
        existing.messages = Array.from(byId.values())
        existing.lastMessage = existing.messages[existing.messages.length - 1] || existing.lastMessage
        existing.unreadCount = existing.messages.filter((m) => !m.isFromMe).length
      }
      this.conversations.set(contactId, existing as WhatsAppConversation)
      return existing.messages
    } catch (error) {
      console.error("[v0] Error refreshing messages:", error)
      return []
    }
  }

  onMessageReceived(callback: (message: WhatsAppMessage) => void): void {
    this.messageListeners.push(callback)
  }

  offMessageReceived(callback: (message: WhatsAppMessage) => void): void {
    this.messageListeners = this.messageListeners.filter((cb) => cb !== callback)
  }

  onContactStatusChanged(callback: (contact: WhatsAppContact) => void): void {
    this.contactListeners.push(callback)
  }

  offContactStatusChanged(callback: (contact: WhatsAppContact) => void): void {
    this.contactListeners = this.contactListeners.filter((cb) => cb !== callback)
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect()
      this.provider = null
    }

    this.contacts = []
    this.conversations.clear()
    this.messageListeners = []
    this.contactListeners = []
  }
}

// Global WhatsApp service instance
export const whatsappService = new WhatsAppService()
