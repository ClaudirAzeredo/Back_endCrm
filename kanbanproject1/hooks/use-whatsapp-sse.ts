"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export type UseWhatsappSseOptions = {
  apiBase: string
  clientKey?: string
}

export type UseWhatsappSseResult<T = any> = {
  events: T[]
  lastEvent: T | null
  connected: boolean
  error: string | null
  start: () => void
  stop: () => void
  clear: () => void
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
    const es = new EventSource(url, { withCredentials: true })
    esRef.current = es
    es.addEventListener("open", () => setConnected(true))
    es.addEventListener("error", () => setError("Conexão SSE falhou"))
    es.addEventListener("init", (ev: MessageEvent) => {
      // ignore or log init
    })
    es.addEventListener("message", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        setLastEvent(data as T)
        setEvents(prev => [...prev, data as T])
      } catch {}
    })
  }, [apiBase, clientKey])

  const clear = useCallback(() => {
    setEvents([])
    setLastEvent(null)
  }, [])

  useEffect(() => {
    return () => { stop() }
  }, [stop])

  return { events, lastEvent, connected, error, start, stop, clear }
}

