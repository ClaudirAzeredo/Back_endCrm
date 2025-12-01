"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type UseQrOptions = {
  apiBase: string
  token?: string | null
  clientToken?: string | null
  cacheBuster?: boolean
}

export type UseQrResult = {
  src: string | null
  loading: boolean
  error: string | null
  generate: () => Promise<void>
  revoke: () => void
}

function safeApiBase(apiBase: string) {
  if (!apiBase) return ""
  return apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase
}

function cleanBase64(b64raw: string) {
  if (!b64raw) return null
  const comma = b64raw.indexOf(",")
  let raw = comma >= 0 ? b64raw.slice(comma + 1) : b64raw
  raw = raw.replace(/\s+/g, "")
  raw = raw.replace(/[^A-Za-z0-9+/=]/g, "")
  const mod = raw.length % 4
  if (mod !== 0) raw = raw + "=".repeat(4 - mod)
  return raw
}

async function tryFetchPublicImage(imageUrl: string): Promise<boolean> {
  try {
    const resp = await fetch(imageUrl, { method: "GET", credentials: "include" })
    if (!resp.ok) return false
    const ct = resp.headers.get("content-type") || ""
    if (ct.includes("image")) return true
    return false
  } catch {
    return false
  }
}

async function fetchJsonQr(apiBase: string, token?: string | null): Promise<string | null> {
  try {
    const url = `${apiBase}/whatsapp/qr`
    const headers: Record<string, string> = { Accept: "application/json" }
    if (token) headers["Authorization"] = `Bearer ${token}`
    const resp = await fetch(url, { method: "GET", headers, credentials: token ? "omit" : "include" })
    if (!resp.ok) throw new Error(`status ${resp.status}`)
    const json = await resp.json()
    let value: string | null = json?.value || null
    if (!value) return null
    const comma = value.indexOf(",")
    if (comma >= 0) {
      const meta = value.slice(0, comma + 1)
      const raw = value.slice(comma + 1)
      const cleaned = cleanBase64(raw)
      if (!cleaned) return null
      return meta + cleaned
    } else {
      const cleaned = cleanBase64(value)
      if (!cleaned) return null
      return "data:image/png;base64," + cleaned
    }
  } catch {
    return null
  }
}

async function fetchImageBlobAsObjectUrl(apiBase: string, token?: string | null): Promise<string | null> {
  try {
    const url = `${apiBase}/whatsapp/qr/image`
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`
    const resp = await fetch(url, { method: "GET", headers, credentials: token ? "omit" : "include" })
    if (!resp.ok) throw new Error(`status ${resp.status}`)
    const blob = await resp.blob()
    if (!blob) return null
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

function dataUrlToObjectUrl(dataUrl: string): string | null {
  try {
    const idx = dataUrl.indexOf(",")
    const meta = idx >= 0 ? dataUrl.slice(0, idx) : "data:image/png;base64,"
    const raw = idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl
    const cleaned = cleanBase64(raw)
    if (!cleaned) return null
    const bytes = atob(cleaned)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const type = meta.match(/^data:([^;]+);/)?.[1] || "image/png"
    const blob = new Blob([arr], { type })
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

export function useQr(opts: UseQrOptions): UseQrResult {
  const apiBase = safeApiBase(opts.apiBase || "")
  const token = opts.token || null
  const cacheBuster = opts.cacheBuster ?? true
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentObjectUrl = useRef<string | null>(null)

  const revoke = useCallback(() => {
    if (currentObjectUrl.current) {
      try {
        URL.revokeObjectURL(currentObjectUrl.current)
      } catch {}
      currentObjectUrl.current = null
    }
    setSrc(null)
  }, [])

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (currentObjectUrl.current) {
      try { URL.revokeObjectURL(currentObjectUrl.current) } catch {}
      currentObjectUrl.current = null
    }

    try {
      const ts = cacheBuster ? `?ts=${Date.now()}` : ""
      const publicUrl = `${apiBase}/whatsapp/qr/image${ts}`
      const ok = await tryFetchPublicImage(publicUrl)
      if (ok) {
        setSrc(publicUrl)
        setLoading(false)
        return
      }

      if (token) {
        const dataUrl = await fetchJsonQr(apiBase, token)
        if (dataUrl) {
          const url = dataUrlToObjectUrl(dataUrl)
          if (url) {
            currentObjectUrl.current = url
            setSrc(url)
            setLoading(false)
            return
          }
        }

        const blobUrl = await fetchImageBlobAsObjectUrl(apiBase, token)
        if (blobUrl) {
          currentObjectUrl.current = blobUrl
          setSrc(blobUrl)
          setLoading(false)
          return
        }
      }

      setError("Falha ao obter QR Code")
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar QR")
    } finally {
      setLoading(false)
    }
  }, [apiBase, token, cacheBuster])

  useEffect(() => {
    return () => {
      if (currentObjectUrl.current) {
        try { URL.revokeObjectURL(currentObjectUrl.current) } catch {}
        currentObjectUrl.current = null
      }
    }
  }, [])

  return { src, loading, error, generate, revoke }
}

