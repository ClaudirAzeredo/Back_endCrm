"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, LogIn, Phone, Mail, UserPlus, MessageSquare, Users, BarChart3 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("login")

  // Estado para formulário de login
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  // Estado para formulário de registro
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  // Manipulador para login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação básica
    if (!loginForm.email || !loginForm.password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    try {
      setIsLoading(true)

      // Simulação de login - aqui você implementaria a lógica real de autenticação
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirecionar para a página principal após login bem-sucedido
      router.push("/")
    } catch (err) {
      setError("Falha na autenticação. Verifique suas credenciais.")
    } finally {
      setIsLoading(false)
    }
  }

  // Manipulador para registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação básica
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError("Por favor, preencha todos os campos obrigatórios")
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (!registerForm.agreeTerms) {
      setError("Você precisa concordar com os termos de serviço")
      return
    }

    try {
      setIsLoading(true)

      // Simulação de registro - aqui você implementaria a lógica real
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirecionar para a página principal após registro bem-sucedido
      router.push("/")
    } catch (err) {
      setError("Não foi possível completar o registro. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            UniCRM
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Plataforma Completa de Gestão e Comunicação</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          <div className="order-last lg:order-first">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Tudo que você precisa em uma plataforma</h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">UniChat</h3>
                      <p className="text-muted-foreground">
                        Integração completa com WhatsApp para comunicação direta com seus clientes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Gestão de Leads</h3>
                      <p className="text-muted-foreground">
                        Pipeline visual para acompanhar e converter seus leads em clientes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Dashboard Inteligente</h3>
                      <p className="text-muted-foreground">
                        Métricas e relatórios em tempo real para tomar decisões estratégicas
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl text-white">
                <h3 className="font-bold text-lg mb-2">Comece gratuitamente</h3>
                <p className="text-blue-100">Teste todas as funcionalidades por 14 dias, sem compromisso</p>
              </div>
            </div>
          </div>

          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login" className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Conta
                </TabsTrigger>
              </TabsList>

              {/* Conteúdo da aba de Login */}
              <TabsContent value="login">
                <Card className="shadow-xl border-0">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
                    <CardDescription>Entre na sua conta para acessar o UniCRM</CardDescription>
                  </CardHeader>

                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          disabled={isLoading}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Senha</Label>
                          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                            Esqueceu a senha?
                          </Link>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          disabled={isLoading}
                          className="h-12"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-me"
                          checked={loginForm.rememberMe}
                          onCheckedChange={(checked) => setLoginForm({ ...loginForm, rememberMe: checked as boolean })}
                          disabled={isLoading}
                        />
                        <label
                          htmlFor="remember-me"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Lembrar-me
                        </label>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-6">
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Entrar
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                <div className="text-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Não tem uma conta?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600"
                      onClick={() => setActiveTab("register")}
                    >
                      Crie uma agora
                    </Button>
                  </p>
                </div>

                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      className="w-full h-12 bg-transparent"
                      onClick={() => router.push("/verify-code")}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Telefone
                    </Button>
                    <Button variant="outline" className="w-full h-12 bg-transparent">
                      <Mail className="mr-2 h-4 w-4" />
                      Email OTP
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Conteúdo da aba de Registro */}
              <TabsContent value="register">
                <Card className="shadow-xl border-0">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl">Criar sua conta</CardTitle>
                    <CardDescription>Comece a usar o UniCRM gratuitamente</CardDescription>
                  </CardHeader>

                  <form onSubmit={handleRegister}>
                    <CardContent className="space-y-6">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                          id="name"
                          placeholder="Seu nome completo"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          disabled={isLoading}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          disabled={isLoading}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-phone">Telefone (opcional)</Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="+55 (11) 98765-4321"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          disabled={isLoading}
                          className="h-12"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Senha</Label>
                          <Input
                            id="register-password"
                            type="password"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                            disabled={isLoading}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmar senha</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                            disabled={isLoading}
                            className="h-12"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="terms"
                          checked={registerForm.agreeTerms}
                          onCheckedChange={(checked) =>
                            setRegisterForm({ ...registerForm, agreeTerms: checked as boolean })
                          }
                          disabled={isLoading}
                        />
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Concordo com os{" "}
                          <Link href="/terms" className="text-blue-600 hover:underline">
                            termos de serviço
                          </Link>{" "}
                          e{" "}
                          <Link href="/privacy" className="text-blue-600 hover:underline">
                            política de privacidade
                          </Link>
                        </label>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-6">
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Criar conta gratuita
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                <div className="text-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Já tem uma conta?{" "}
                    <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => setActiveTab("login")}>
                      Faça login
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
