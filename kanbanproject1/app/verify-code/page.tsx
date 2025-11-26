"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"

export default function VerifyCodePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)

  // Estado para os dígitos do código OTP
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Iniciar contagem regressiva para reenvio
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Manipulador para entrada de código
  const handleCodeChange = (index: number, value: string) => {
    // Permitir apenas dígitos
    if (!/^\d*$/.test(value)) return

    // Atualizar o código
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Mover para o próximo input se o valor for preenchido
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Manipulador para tecla de backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Manipulador para colar código
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()

    // Verificar se o texto colado contém apenas dígitos e tem o comprimento correto
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("")
      setCode(digits)

      // Focar no último input
      inputRefs.current[5]?.focus()
    }
  }

  // Manipulador para verificar código
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const fullCode = code.join("")

    // Validação básica
    if (fullCode.length !== 6) {
      setError("Por favor, insira o código completo de 6 dígitos")
      return
    }

    try {
      setIsLoading(true)

      // Simulação de verificação - aqui você implementaria a lógica real
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirecionar para a página principal após verificação bem-sucedida
      router.push("/")
    } catch (err) {
      setError("Código inválido. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Manipulador para reenviar código
  const handleResendCode = async () => {
    if (!canResend) return

    try {
      setIsLoading(true)

      // Simulação de reenvio - aqui você implementaria a lógica real
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Reiniciar contagem regressiva
      setCountdown(30)
      setCanResend(false)

      // Iniciar novo timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError("Não foi possível reenviar o código. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para login
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Verificação de Código</CardTitle>
            <CardDescription>Insira o código de 6 dígitos enviado para seu telefone</CardDescription>
          </CardHeader>

          <form onSubmit={handleVerifyCode}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between gap-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-lg"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o código?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={handleResendCode}
                    disabled={!canResend || isLoading}
                  >
                    {canResend ? "Reenviar código" : <>Reenviar em {countdown}s</>}
                  </Button>
                </p>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar Código"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
