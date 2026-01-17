"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wifi, WifiOff, Circle, Clock, Edit3, Mic } from "lucide-react"

export type ChatPresenceStatus = "UNAVAILABLE" | "AVAILABLE" | "COMPOSING" | "RECORDING" | "PAUSED"

export interface ChatPresenceData {
  phone: string
  status: ChatPresenceStatus
  lastSeen?: number | null
  instanceId?: string
}

interface WhatsAppPresenceIndicatorProps {
  phone: string
  presenceData?: ChatPresenceData
  className?: string
}

export function WhatsAppPresenceIndicator({ 
  phone, 
  presenceData,
  className = "" 
}: WhatsAppPresenceIndicatorProps) {
  const [status, setStatus] = useState<ChatPresenceStatus>("UNAVAILABLE")
  const [lastSeen, setLastSeen] = useState<number | null>(null)

  useEffect(() => {
    if (presenceData) {
      setStatus(presenceData.status)
      setLastSeen(presenceData.lastSeen || null)
    }
  }, [presenceData])

  const getPresenceIcon = () => {
    switch (status) {
      case "AVAILABLE":
        return <Circle className="h-3 w-3 fill-green-500 text-green-500" />
      case "COMPOSING":
        return <Edit3 className="h-3 w-3 text-blue-500 animate-pulse" />
      case "RECORDING":
        return <Mic className="h-3 w-3 text-red-500 animate-pulse" />
      case "PAUSED":
        return <Clock className="h-3 w-3 text-yellow-500" />
      case "UNAVAILABLE":
      default:
        return <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "AVAILABLE":
        return "Online"
      case "COMPOSING":
        return "Digitando..."
      case "RECORDING":
        return "Gravando áudio..."
      case "PAUSED":
        return "Digitando (pausado)"
      case "UNAVAILABLE":
        return lastSeen ? `Visto por último ${formatLastSeen(lastSeen)}` : "Offline"
      default:
        return "Offline"
    }
  }

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "agora"
    if (minutes < 60) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`
    if (hours < 24) return `há ${hours} hora${hours > 1 ? 's' : ''}`
    return `há ${days} dia${days > 1 ? 's' : ''}`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            {getPresenceIcon()}
            <span className="text-xs text-muted-foreground">
              {status === "AVAILABLE" ? "Online" : ""}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getStatusText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ChatPresenceListProps {
  presences: ChatPresenceData[]
  className?: string
}

export function ChatPresenceList({ presences, className = "" }: ChatPresenceListProps) {
  if (presences.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-muted-foreground">Status de Presença</h4>
      <div className="space-y-1">
        {presences.map((presence) => (
          <div key={presence.phone} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <WhatsAppPresenceIndicator 
                phone={presence.phone} 
                presenceData={presence}
              />
              <span className="text-sm font-medium">
                {presence.phone}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {presence.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}