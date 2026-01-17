"use client"

import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react"

export type MessageStatus = "SENT" | "RECEIVED" | "READ" | "READ_BY_ME" | "PLAYED"

export interface MessageStatusData {
  phone: string
  status: MessageStatus
  ids: string[]
  instanceId?: string
  isGroup?: boolean
  momment?: number
}

interface WhatsAppMessageStatusProps {
  messageId: string
  statusData?: MessageStatusData
  className?: string
}

export function WhatsAppMessageStatus({ 
  messageId, 
  statusData,
  className = ""
}: WhatsAppMessageStatusProps) {
  const [status, setStatus] = useState<MessageStatus>("SENT")
  const [isReadByMe, setIsReadByMe] = useState(false)

  useEffect(() => {
    if (statusData && statusData.ids.includes(messageId)) {
      setStatus(statusData.status)
      setIsReadByMe(statusData.status === "READ_BY_ME")
    }
  }, [statusData, messageId])

  const getStatusIcon = () => {
    switch (status) {
      case "SENT":
        return <Check className="h-3 w-3 text-gray-400" />
      case "RECEIVED":
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case "READ":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case "READ_BY_ME":
        return <CheckCheck className="h-3 w-3 text-green-500" />
      case "PLAYED":
        return <CheckCheck className="h-3 w-3 text-green-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "SENT":
        return "Enviada"
      case "RECEIVED":
        return "Recebida"
      case "READ":
        return "Lida"
      case "READ_BY_ME":
        return "Lida por você"
      case "PLAYED":
        return "Reproduzida"
      default:
        return "Pendente"
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center ${className}`}>
            {getStatusIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getStatusText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface MessageStatusListProps {
  statuses: MessageStatusData[]
  className?: string
}

export function MessageStatusList({ statuses, className = "" }: MessageStatusListProps) {
  if (statuses.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-muted-foreground">Status de Mensagens</h4>
      <div className="space-y-1">
        {statuses.map((status) => (
          <div key={`${status.phone}-${status.ids.join(',')}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <WhatsAppMessageStatus 
                messageId={status.ids[0]} 
                statusData={status}
              />
              <span className="text-sm font-medium">
                {status.phone}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {status.ids.length} mensagen{status.ids.length > 1 ? 's' : ''}
              </span>
              <span className="text-xs font-medium">
                {status.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}