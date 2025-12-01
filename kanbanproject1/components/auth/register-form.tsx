"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, User, Building, Mail, Lock, Briefcase, AlertCircle } from "lucide-react"
import { useApiAuth } from "@/hooks/use-api-auth"
import type { RegisterRequest } from "@/lib/api/auth-api"

interface RegisterFormProps {
  onRegisterSuccess: () => void
  register?: (data: RegisterRequest) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export default function RegisterForm({ onRegisterSuccess, register: registerProp, isLoading: isLoadingProp, error: errorProp }: RegisterFormProps) {
  const [fullName, setFullName] = useState("")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isValidating, setIsValidating] = useState(false)

  const { register: registerHook, isLoading: isLoadingHook, error: apiErrorHook } = useApiAuth()

  const registerFn = registerProp ?? registerHook
  const isLoading = isLoadingProp ?? isLoadingHook
  const apiError = errorProp ?? apiErrorHook

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }

    switch (field) {
      case "fullName":
        if (value.length < 2) {
          newErrors.fullName = "Nome deve ter pelo menos 2 caracteres"
        } else {
          delete newErrors.fullName
        }
        break
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          newErrors.email = "Email inválido"
        } else {
          delete newErrors.email
        }
        break
      case "password":
        if (value.length < 6) {
          newErrors.password = "Senha deve ter pelo menos 6 caracteres"
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.password = "Senha deve conter maiúscula, minúscula e número"
        } else {
          delete newErrors.password
        }
        break
      case "confirmPassword":
        if (value !== password) {
          newErrors.confirmPassword = "Senhas não coincidem"
        } else {
          delete newErrors.confirmPassword
        }
        break
      case "role":
        if (value.length < 2) {
          newErrors.role = "Cargo deve ter pelo menos 2 caracteres"
        } else {
          delete newErrors.role
        }
        break
    }

    setErrors(newErrors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)

    // Validate all fields
    validateField("fullName", fullName)
    validateField("email", email)
    validateField("password", password)
    validateField("confirmPassword", confirmPassword)
    validateField("role", role)

    if (Object.keys(errors).length > 0) {
      setIsValidating(false)
      return
    }

    if (!acceptTerms) {
      setErrors({ terms: "Você deve aceitar os termos de uso" })
      setIsValidating(false)
      return
    }

    try {
      await registerFn({
        name: fullName,
        email,
        password,
        phone: "",
        company,
        role,
      })
      onRegisterSuccess()
    } catch (err) {
      console.error("[v0] Registration error:", err)
    } finally {
      setIsValidating(false)
    }
  }

  const displayError = apiError

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <Image
            src="/unicrm-logo.png"
            alt="UniCRM Logo"
            width={240}
            height={70}
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Junte-se ao <span className="text-primary">UniCRM</span>
          </h1>
          <p className="text-gray-600">Crie sua conta e comece a gerenciar seus clientes</p>
        </div>

        {displayError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{displayError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Nome completo
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  validateField("fullName", e.target.value)
                }}
                className={`pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white ${errors.fullName ? "border-red-500" : ""}`}
                required
                disabled={isLoading || isValidating}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-gray-700">
              Empresa
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="company"
                type="text"
                placeholder="Nome da sua empresa"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white"
                required
                disabled={isLoading || isValidating}
              />
            </div>
          </div>

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
                onChange={(e) => {
                  setEmail(e.target.value)
                  validateField("email", e.target.value)
                }}
                className={`pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white ${errors.email ? "border-red-500" : ""}`}
                required
                disabled={isLoading || isValidating}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              Cargo
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="role"
                type="text"
                placeholder="Ex: CEO, Gerente, Desenvolvedor, Designer..."
                value={role}
                onChange={(e) => {
                  setRole(e.target.value)
                  validateField("role", e.target.value)
                }}
                className={`pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white ${errors.role ? "border-red-500" : ""}`}
                required
                disabled={isLoading || isValidating}
              />
            </div>
            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
            <p className="text-xs text-gray-500">Defina seu cargo ou função na empresa</p>
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
                placeholder="Crie uma senha segura"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validateField("password", e.target.value)
                }}
                className={`pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:bg-white ${errors.password ? "border-red-500" : ""}`}
                required
                disabled={isLoading || isValidating}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading || isValidating}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirmar senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  validateField("confirmPassword", e.target.value)
                }}
                className={`pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:bg-white ${errors.confirmPassword ? "border-red-500" : ""}`}
                required
                disabled={isLoading || isValidating}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading || isValidating}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
          </div>

          {/* Terms and Privacy */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => {
                setAcceptTerms(checked as boolean)
                if (checked) {
                  const newErrors = { ...errors }
                  delete newErrors.terms
                  setErrors(newErrors)
                }
              }}
              className="mt-1"
              disabled={isLoading || isValidating}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
              Eu concordo com os{" "}
              <button
                type="button"
                className="text-primary hover:text-primary/80 font-medium"
                disabled={isLoading || isValidating}
              >
                Termos de Uso
              </button>{" "}
              e{" "}
              <button
                type="button"
                className="text-primary hover:text-primary/80 font-medium"
                disabled={isLoading || isValidating}
              >
                Política de Privacidade
              </button>
            </Label>
          </div>
          {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}

          {/* Register Button */}
          <Button
            type="submit"
            disabled={isLoading || isValidating || Object.keys(errors).length > 0}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl disabled:opacity-50"
          >
            {isLoading || isValidating ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </div>
    </div>
  )
}
