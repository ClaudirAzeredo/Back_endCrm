"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Loader2, ArrowLeft, CreditCard, Building, CheckCircle2, Calendar, Lock } from "lucide-react"

// Tipos
type PlanType = {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  recommended?: boolean
}

// Dados dos planos
const plans: PlanType[] = [
  {
    id: "basic",
    name: "Básico",
    price: 99,
    description: "Para pequenas equipes e projetos simples",
    features: ["Até 5 projetos ativos", "Até 3 usuários", "Kanban básico", "Suporte por email"],
  },
  {
    id: "pro",
    name: "Profissional",
    price: 199,
    description: "Para equipes em crescimento",
    features: [
      "Projetos ilimitados",
      "Até 10 usuários",
      "Kanban avançado",
      "Integração com WhatsApp",
      "Suporte prioritário",
    ],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Empresarial",
    price: 399,
    description: "Para grandes organizações",
    features: [
      "Projetos ilimitados",
      "Usuários ilimitados",
      "Kanban avançado",
      "Integração com WhatsApp",
      "API personalizada",
      "Suporte 24/7",
      "Gerente de conta dedicado",
    ],
  },
]

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string>("pro")
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)

  // Estado para formulário de pagamento
  const [paymentForm, setPaymentForm] = useState({
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    billingName: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    billingCountry: "Brasil",
  })

  // Obter o plano da URL
  useEffect(() => {
    const planParam = searchParams.get("plan")
    if (planParam) {
      setPlanId(planParam)
    }
  }, [searchParams])

  // Atualizar o plano selecionado quando o ID mudar
  useEffect(() => {
    const plan = plans.find((p) => p.id === planId)
    if (plan) {
      setSelectedPlan(plan)
    }
  }, [planId])

  // Manipulador para processar pagamento
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação básica
    if (!paymentForm.cardName || !paymentForm.cardNumber || !paymentForm.cardExpiry || !paymentForm.cardCvc) {
      setError("Por favor, preencha todos os campos do cartão")
      return
    }

    try {
      setIsLoading(true)

      // Simulação de processamento de pagamento - aqui você implementaria a lógica real
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simular sucesso
      setIsSuccess(true)

      // Redirecionar após alguns segundos
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (err) {
      setError("Não foi possível processar o pagamento. Verifique os dados do cartão.")
    } finally {
      setIsLoading(false)
    }
  }

  // Formatar número do cartão
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  // Formatar data de expiração
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }

    return value
  }

  // Se o pagamento foi bem-sucedido, mostrar tela de confirmação
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
            <CardDescription>Seu plano foi ativado com sucesso</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              Obrigado por escolher nosso sistema. Você agora tem acesso ao plano{" "}
              <span className="font-bold">{selectedPlan?.name}</span>.
            </p>
            <p className="text-muted-foreground">Você será redirecionado para o dashboard em alguns segundos...</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/")}>
              Ir para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para login
        </Link>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Coluna de Pagamento */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Pagamento</CardTitle>
                <CardDescription>Preencha os dados para finalizar sua assinatura</CardDescription>
              </CardHeader>

              <Tabs defaultValue="card" className="w-full">
                <TabsList className="grid w-full grid-cols-2 px-6">
                  <TabsTrigger value="card" className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Cartão de Crédito
                  </TabsTrigger>
                  <TabsTrigger value="invoice" className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Boleto Bancário
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="card">
                  <form onSubmit={handlePayment}>
                    <CardContent className="space-y-6">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dados do Cartão</h3>

                        <div className="space-y-2">
                          <Label htmlFor="cardName">Nome no Cartão</Label>
                          <Input
                            id="cardName"
                            placeholder="Nome como aparece no cartão"
                            value={paymentForm.cardName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Número do Cartão</Label>
                          <div className="relative">
                            <Input
                              id="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              value={paymentForm.cardNumber}
                              onChange={(e) =>
                                setPaymentForm({
                                  ...paymentForm,
                                  cardNumber: formatCardNumber(e.target.value),
                                })
                              }
                              maxLength={19}
                              disabled={isLoading}
                            />
                            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cardExpiry">Validade</Label>
                            <div className="relative">
                              <Input
                                id="cardExpiry"
                                placeholder="MM/AA"
                                value={paymentForm.cardExpiry}
                                onChange={(e) =>
                                  setPaymentForm({
                                    ...paymentForm,
                                    cardExpiry: formatExpiry(e.target.value),
                                  })
                                }
                                maxLength={5}
                                disabled={isLoading}
                              />
                              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardCvc">CVC</Label>
                            <Input
                              id="cardCvc"
                              placeholder="123"
                              value={paymentForm.cardCvc}
                              onChange={(e) =>
                                setPaymentForm({
                                  ...paymentForm,
                                  cardCvc: e.target.value.replace(/\D/g, "").substring(0, 3),
                                })
                              }
                              maxLength={3}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Endereço de Cobrança</h3>

                        <div className="space-y-2">
                          <Label htmlFor="billingName">Nome Completo</Label>
                          <Input
                            id="billingName"
                            placeholder="Nome completo"
                            value={paymentForm.billingName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, billingName: e.target.value })}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billingAddress">Endereço</Label>
                          <Input
                            id="billingAddress"
                            placeholder="Rua, número, complemento"
                            value={paymentForm.billingAddress}
                            onChange={(e) => setPaymentForm({ ...paymentForm, billingAddress: e.target.value })}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="billingCity">Cidade</Label>
                            <Input
                              id="billingCity"
                              placeholder="Cidade"
                              value={paymentForm.billingCity}
                              onChange={(e) => setPaymentForm({ ...paymentForm, billingCity: e.target.value })}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingState">Estado</Label>
                            <Input
                              id="billingState"
                              placeholder="Estado"
                              value={paymentForm.billingState}
                              onChange={(e) => setPaymentForm({ ...paymentForm, billingState: e.target.value })}
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="billingZip">CEP</Label>
                            <Input
                              id="billingZip"
                              placeholder="00000-000"
                              value={paymentForm.billingZip}
                              onChange={(e) => setPaymentForm({ ...paymentForm, billingZip: e.target.value })}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingCountry">País</Label>
                            <Input
                              id="billingCountry"
                              value={paymentForm.billingCountry}
                              onChange={(e) => setPaymentForm({ ...paymentForm, billingCountry: e.target.value })}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Pagar R${selectedPlan?.price},00
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>

                <TabsContent value="invoice">
                  <CardContent className="space-y-4 py-6">
                    <div className="text-center p-6">
                      <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Pagamento por Boleto</h3>
                      <p className="text-muted-foreground mb-4">
                        Ao clicar em "Gerar Boleto", você receberá um boleto bancário para pagamento em até 3 dias
                        úteis.
                      </p>
                      <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Seu acesso será liberado somente após a confirmação do pagamento.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      Gerar Boleto
                    </Button>
                  </CardFooter>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Coluna de Resumo */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlan && (
                  <>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Plano {selectedPlan.name}</h3>
                        <span className="font-bold">R${selectedPlan.price},00</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{selectedPlan.description}</p>
                      <div className="space-y-1">
                        {selectedPlan.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-start text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {selectedPlan.features.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            + {selectedPlan.features.length - 3} outros recursos
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>R${selectedPlan.price},00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Impostos</span>
                        <span>R$0,00</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>R${selectedPlan.price},00</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Cobrança mensal, cancele a qualquer momento</div>
                    </div>

                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <p className="flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                        Pagamento seguro via criptografia SSL
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
