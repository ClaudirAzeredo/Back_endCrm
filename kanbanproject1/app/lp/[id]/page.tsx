"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import type { LandingPage, Lead, LandingPageElement } from "@/lib/types/landing-page"
import { getLandingPageById, addLeadToLandingPage } from "@/lib/landing-page-storage"
import { formatCPF, formatCNPJ } from "@/lib/input-formatters"

export default function LandingPagePublic() {
  const params = useParams()
  const id = params.id as string

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (id) {
      const page = getLandingPageById(id)
      setLandingPage(page)
      setLoading(false)
    }
  }, [id])

  const validateForm = () => {
    if (!landingPage) return false

    const formElement = landingPage.elements.find((el) => el.type === "form")
    if (!formElement?.formFields) return false

    const newErrors: Record<string, string> = {}

    formElement.formFields.forEach((field) => {
      const value = formData[field.id] || ""

      if (field.required && !value.trim()) {
        newErrors[field.id] = `${field.label} é obrigatório`
        return
      }

      if (value.trim()) {
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.id] = "E-mail inválido"
        } else if (field.type === "cpf" && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value) && !/^\d{11}$/.test(value)) {
          newErrors[field.id] = "CPF inválido"
        } else if (
          field.type === "cnpj" &&
          !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value) &&
          !/^\d{14}$/.test(value)
        ) {
          newErrors[field.id] = "CNPJ inválido"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!landingPage) return

    const lead: Lead = {
      id: `lead-${Date.now()}`,
      formData: formData,
      submittedAt: new Date().toISOString(),
      landingPageId: landingPage.id,
    }

    addLeadToLandingPage(landingPage.id, lead)

    // Fixed storage key to use company-scoped key format
    if (landingPage.funnelId && landingPage.stageId) {
      try {
        const formElement = landingPage.elements.find((el) => el.type === "form")
        const formFields = formElement?.formFields || []

        const nameField = formFields.find((f) => f.label.toLowerCase().includes("nome"))
        const emailField = formFields.find((f) => f.type === "email")
        const phoneField = formFields.find((f) => f.type === "phone")

        const clientName = nameField ? formData[nameField.id] : "Lead da Landing Page"
        const clientEmail = emailField ? formData[emailField.id] : undefined
        const clientPhone = phoneField ? formData[phoneField.id] : undefined

        // Get company ID from landing page data
        const lpData = getLandingPageById(landingPage.id)
        const companyId = lpData?.companyId

        if (!companyId) {
          console.error("[v0] No company ID found for landing page")
          setSubmitted(true)
          return
        }

        const funnelLead = {
          id: `lead_${Date.now()}`,
          title: `Lead - ${landingPage.name}`,
          client: clientName,
          clientEmail,
          clientPhone,
          source: `Landing Page: ${landingPage.name}`,
          status: landingPage.stageId,
          people: [],
          priority: "medium",
          tags: landingPage.tagIds || [],
          notes: `Lead capturado via landing page em ${new Date().toLocaleString("pt-BR")}`,
          createdAt: new Date().toISOString(),
          funnelId: landingPage.funnelId,
          statusHistory: [
            {
              status: landingPage.stageId,
              timestamp: new Date().toISOString(),
              duration: 0,
            },
          ],
        }

        // Use company-scoped storage key
        const storageKey = `${companyId}_kanban-data`
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '{"leads": []}')
        const existingLeads = existingData.leads || []
        existingLeads.push(funnelLead)
        existingData.leads = existingLeads
        localStorage.setItem(storageKey, JSON.stringify(existingData))

        console.log(
          "[v0] Lead added to funnel:",
          landingPage.funnelId,
          "stage:",
          landingPage.stageId,
          "tags:",
          landingPage.tagIds,
        )
      } catch (error) {
        console.error("[v0] Error adding lead to funnel:", error)
      }
    }

    setSubmitted(true)
  }

  const getInputType = (fieldType: string) => {
    switch (fieldType) {
      case "email":
        return "email"
      case "phone":
        return "tel"
      default:
        return "text"
    }
  }

  const handleInputChange = (fieldId: string, value: string, fieldType: string) => {
    let formattedValue = value

    if (fieldType === "cpf") {
      formattedValue = formatCPF(value)
    } else if (fieldType === "cnpj") {
      formattedValue = formatCNPJ(value)
    }

    setFormData({ ...formData, [fieldId]: formattedValue })
  }

  const handlePhoneChange = (fieldId: string, value: string) => {
    setFormData({ ...formData, [fieldId]: value })
  }

  const renderElement = (element: LandingPageElement) => {
    const commonStyles = {
      ...element.styles,
      margin: "0 auto",
    }

    switch (element.type) {
      case "heading":
        return (
          <h1 key={element.id} style={commonStyles}>
            {element.content}
          </h1>
        )
      case "text":
        return (
          <p key={element.id} style={commonStyles}>
            {element.content}
          </p>
        )
      case "button":
        return (
          <div key={element.id} style={{ textAlign: element.styles.textAlign || "center" }}>
            <button style={commonStyles}>{element.content}</button>
          </div>
        )
      case "image":
        return (
          <div key={element.id} style={{ textAlign: "center" }}>
            <img src={element.content || "/placeholder.svg"} alt="Landing page" style={commonStyles} />
          </div>
        )
      case "form":
        return (
          <form key={element.id} onSubmit={handleSubmit} style={commonStyles}>
            <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px", textAlign: "center" }}>
              {element.content}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {element.formFields?.map((field) => (
                <div key={field.id}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                  </label>
                  {field.type === "phone" ? (
                    <PhoneInputComponent
                      value={formData[field.id] || ""}
                      onChange={(value) => handlePhoneChange(field.id, value)}
                      placeholder={field.placeholder}
                      defaultCountry={(field.countryCode || "BR").toLowerCase()}
                    />
                  ) : (
                    <Input
                      type={getInputType(field.type)}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value, field.type)}
                      className="h-12 text-base"
                      style={{
                        borderColor: errors[field.id] ? "#ef4444" : undefined,
                      }}
                    />
                  )}
                  {errors[field.id] && (
                    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors[field.id]}</p>
                  )}
                </div>
              ))}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-semibold"
                style={{
                  backgroundColor: "#14b8a6",
                  color: "#ffffff",
                }}
              >
                Enviar
              </Button>
            </div>
          </form>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
            <p className="text-muted-foreground">A landing page que você está procurando não existe ou foi removida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: landingPage.backgroundColor,
        }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold">Obrigado!</h1>
            <p className="text-xl opacity-90">Suas informações foram enviadas com sucesso.</p>
            <p className="text-lg opacity-75">Entraremos em contato em breve!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundColor: landingPage.backgroundColor,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-8">{landingPage.elements.map((element) => renderElement(element))}</div>
    </div>
  )
}
