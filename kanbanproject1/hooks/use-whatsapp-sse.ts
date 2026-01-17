"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export type UseWhatsappSseOptions = {
  apiBase: string
  clientKey?: string
}

export type WhatsAppEvent = {
  type: "message" | "chat_presence" | "message_status"
  payload: any
}

export type UseWhatsappSseResult<T = any> = {
  events: T[]
  lastEvent: T | null
  connected: boolean
  error: string | null
  start: () => void
  stop: () => void
  clear: () => void
  chatPresenceEvents: WhatsAppEvent[]
  messageStatusEvents: WhatsAppEvent[]
  lastChatPresence: WhatsAppEvent | null
  lastMessageStatus: WhatsAppEvent | null
}

function safeBase(apiBase: string) {
  return apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase
}

export function useWhatsappSse<T = any>(opts: UseWhatsappSseOptions): UseWhatsappSseResult<T> {
  const apiBase = safeBase(opts.apiBase || "")
  const clientKey = opts.clientKey || ""
  const [events, setEvents] = useState<T[]>([])
  const [lastEvent, setLastEvent] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatPresenceEvents, setChatPresenceEvents] = useState<WhatsAppEvent[]>([])
  const [messageStatusEvents, setMessageStatusEvents] = useState<WhatsAppEvent[]>([])
  const [lastChatPresence, setLastChatPresence] = useState<WhatsAppEvent | null>(null)
  const [lastMessageStatus, setLastMessageStatus] = useState<WhatsAppEvent | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const stop = useCallback(() => {
    if (esRef.current) {
      try { esRef.current.close() } catch {}
      esRef.current = null
    }
    setConnected(false)
  }, [])

  const start = useCallback(() => {
    setError(null)
    const url = clientKey ? `${apiBase}/whatsapp/stream?clientKey=${encodeURIComponent(clientKey)}` : `${apiBase}/whatsapp/stream`
    const es = new EventSource(url)
    esRef.current = es
    es.addEventListener("open", () => setConnected(true))
    es.addEventListener("error", () => {
      // Silenciar erros de reconexão do SSE para evitar ruído no console
      setConnected(false)
      setError(null)
    })
    es.addEventListener("init", (ev: MessageEvent) => {
      // ignore or log init
    })
    es.addEventListener("message", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        
        // Handle different event types
        if (data.type === "chat_presence") {
          const event: WhatsAppEvent = {
            type: "chat_presence",
            payload: data
          }
          setLastChatPresence(event)
          setChatPresenceEvents(prev => [...prev, event])
        } else if (data.type === "message_status") {
          const event: WhatsAppEvent = {
            type: "message_status",
            payload: data
          }
          setLastMessageStatus(event)
          setMessageStatusEvents(prev => [...prev, event])
        } else {
          // Default message handling (backward compatibility)
          setLastEvent(data as T)
          setEvents(prev => [...prev, data as T])
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error)
      }
    })
  }, [apiBase, clientKey])

  const clear = useCallback(() => {
    setEvents([])
    setLastEvent(null)
    setChatPresenceEvents([])
    setMessageStatusEvents([])
    setLastChatPresence(null)
    setLastMessageStatus(null)
  }, [])

  useEffect(() => {
    return () => { stop() }
  }, [stop])

  return { 
    events, 
    lastEvent, 
    connected, 
    error, 
    start, 
    stop, 
    clear,
    chatPresenceEvents,
    messageStatusEvents,
    lastChatPresence,
    lastMessageStatus
  }
}
