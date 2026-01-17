"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Wifi, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"
import { useWhatsappSse } from "@/hooks/use-whatsapp-sse"
import { ChatPresenceList, type ChatPresenceData } from "@/components/whatsapp-presence-indicator"
import { MessageStatusList, type MessageStatusData } from "@/components/whatsapp-message-status"
import { API_BASE_URL } from "@/lib/api-client"
import { loadFromStorage } from "@/lib/storage"

interface WhatsAppStatusMonitorProps {
  className?: string
  maxHeight?: string
  showControls?: boolean
  sse?: any
  presenceData?: ChatPresenceData[]
  messageStatusData?: MessageStatusData[]
}

export function WhatsAppStatusMonitor({ 
  className = "", 
  maxHeight = "400px",
  showControls = true,
  sse,
  presenceData,
  messageStatusData
}: WhatsAppStatusMonitorProps) {
  const [clientKey, setClientKey] = useState<string>("")
  const [chatPresences, setChatPresences] = useState<ChatPresenceData[]>([])
  const [messageStatuses, setMessageStatuses] = useState<MessageStatusData[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  // Get client key from storage or generate from current user
  useEffect(() => {
    const userId = loadFromStorage("current_user_id", "default_user")
    const config = loadFromStorage("whatsapp_config", null)
    
    if (config?.instanceId) {
      setClientKey(`instance:${config.instanceId}`)
    } else {
      setClientKey(`instance:${userId}`)
    }
  }, [])

  // Use external SSE if provided, otherwise create internal one
  const sseHook = sse || useWhatsappSse({
    apiBase: API_BASE_URL,
    clientKey
  })

  const { 
    connected, 
    error, 
    start, 
    stop, 
    chatPresenceEvents, 
    messageStatusEvents,
    lastChatPresence,
    lastMessageStatus
  } = sseHook

  // Update connection status
  useEffect(() => {
    setIsConnected(connected)
  }, [connected])

  // Process chat presence events
  useEffect(() => {
    if (presenceData) {
      // Use external data if provided
      setChatPresences(presenceData)
    } else if (lastChatPresence) {
      // Otherwise use internal SSE events
      const presenceData = lastChatPresence.payload
      setChatPresences(prev => {
        const filtered = prev.filter(p => p.phone !== presenceData.phone)
        return [...filtered, presenceData]
      })
    }
  }, [lastChatPresence, presenceData])

  // Process message status events
  useEffect(() => {
    if (messageStatusData) {
      // Use external data if provided
      setMessageStatuses(messageStatusData)
    } else if (lastMessageStatus) {
      // Otherwise use internal SSE events
      const statusData = lastMessageStatus.payload
      setMessageStatuses(prev => {
        // Keep only recent statuses (last 50) to avoid memory issues
        const filtered = prev.filter(s => s.phone !== statusData.phone || !statusData.ids.some((id: string) => s.ids.includes(id)))
        const recent = [...filtered, statusData]
        return recent.slice(-50) // Keep only last 50 statuses
      })
    }
  }, [lastMessageStatus, messageStatusData])

  // Auto-connect on mount
  useEffect(() => {
    if (clientKey) {
      start()
    }
    return () => {
      stop()
    }
  }, [clientKey])

  const clearAll = () => {
    setChatPresences([])
    setMessageStatuses([])
  }

  const getConnectionStatusColor = () => {
    if (error) return "destructive"
    if (connected) return "default"
    return "secondary"
  }

  const getConnectionStatusText = () => {
    if (error) return "Erro na conexão"
    if (connected) return "Conectado"
    return "Desconectado"
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Monitor WhatsApp
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getConnectionStatusColor()}>
              {getConnectionStatusText()}
            </Badge>
            {showControls && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={connected ? stop : start}
                  className="h-8 px-2"
                >
                  {connected ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-8 px-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive mt-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="presence" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presence" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Presença ({chatPresences.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens ({messageStatuses.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="presence" className="mt-4">
            <ScrollArea className="rounded-md border" style={{ maxHeight }}>
              {chatPresences.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum status de presença recebido ainda
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os status aparecerão aqui quando os contatos mudarem de status
                  </p>
                </div>
              ) : (
                <ChatPresenceList presences={chatPresences} />
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="messages" className="mt-4">
            <ScrollArea className="rounded-md border" style={{ maxHeight }}>
              {messageStatuses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum status de mensagem recebido ainda
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os status aparecerão aqui quando as mensagens forem atualizadas
                  </p>
                </div>
              ) : (
                <MessageStatusList statuses={messageStatuses} />
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface WhatsAppStatusSidebarProps {
  className?: string
}

export function WhatsAppStatusSidebar({ className = "" }: WhatsAppStatusSidebarProps) {
  return (
    <div className={className}>
      <WhatsAppStatusMonitor 
        maxHeight="600px"
        showControls={true}
      />
    </div>
  )
}