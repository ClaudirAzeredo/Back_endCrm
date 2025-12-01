"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { useApiAuth } from "@/hooks/use-api-auth"
import type { LoginRequest } from "@/lib/api/auth-api"

interface LoginFormProps {
  onLoginSuccess: () => void
  login?: (data: LoginRequest) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export default function LoginForm({ onLoginSuccess, login: loginProp, isLoading: isLoadingProp, error: errorProp }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { login: loginHook, isLoading: isLoadingHook, error: apiErrorHook } = useApiAuth()

  const loginFn = loginProp ?? loginHook
  const isLoading = isLoadingProp ?? isLoadingHook
  const apiError = errorProp ?? apiErrorHook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    try {
      await loginFn({ email, password })
      onLoginSuccess()
    } catch (err) {
      setLocalError(apiError || "Erro ao fazer login")
    }
  }

  const fillDemoCredentials = () => {
    setEmail("dev.tester@example.com")
    setPassword("Passw0rd!")
    setLocalError(null)
  }

  const displayError = localError || apiError

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/unicrm-logo.png" alt="UniCRM Logo" width={280} height={80} className="h-auto w-auto" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-gray-600">Faça login para acessar sua conta</p>
        </div>

        {displayError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{displayError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:bg-white"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember me and Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm text-gray-600">
                Lembrar de mim
              </Label>
            </div>
            <button
              type="button"
              className="text-sm text-primary hover:text-primary/80 font-medium"
              disabled={isLoading}
            >
              Esqueceu a senha?
            </button>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          {/* Demo Helper */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-sm text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Usar credenciais demo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
