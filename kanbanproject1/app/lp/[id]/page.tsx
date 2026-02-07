"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { PhoneInputComponent } from "@/components/ui/phone-input"
import type { LandingPage, Lead, LandingPageElement } from "@/lib/types/landing-page"
import type { BuilderElement } from "@/lib/types/builder-types"
import { getLandingPageById, addLeadToLandingPage } from "@/lib/landing-page-storage"
import { formatCPF, formatCNPJ } from "@/lib/input-formatters"
import { API_BASE_URL } from "@/lib/api-client"

export default function LandingPagePublic() {
  const params = useParams()
  const id = params.id as string

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      const page = getLandingPageById(id)
      setLandingPage(page)
      setLoading(false)
    }
  }, [id])

  const isLegacyElements = (elements: unknown): elements is LandingPageElement[] => {
    return Array.isArray(elements) && elements.length > 0 && typeof (elements as any)[0]?.order === "number"
  }

  const getBuilderFormFields = (formElement: BuilderElement): any[] => {
    const content = (formElement.content || {}) as any
    const fields = content.formFields
    return Array.isArray(fields) ? fields.filter((f) => typeof f === "object" && f && typeof f.id === "string") : []
  }

  const validateBuilderForm = (formElement: BuilderElement) => {
    const fields = getBuilderFormFields(formElement)
    if (fields.length === 0) return false

    const newErrors: Record<string, string> = {}

    fields.forEach((field: any) => {
      const fieldId = String(field.id)
      const value = formData[fieldId] || ""

      if (field.required && !value.trim()) {
        newErrors[fieldId] = `${field.label || "Campo"} é obrigatório`
        return
      }

      if (value.trim()) {
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[fieldId] = "E-mail inválido"
        } else if (field.type === "cpf" && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value) && !/^\d{11}$/.test(value)) {
          newErrors[fieldId] = "CPF inválido"
        } else if (
          field.type === "cnpj" &&
          !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value) &&
          !/^\d{14}$/.test(value)
        ) {
          newErrors[fieldId] = "CNPJ inválido"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submitLeadToPipeline = async (sourceFormElement?: BuilderElement | LandingPageElement | null) => {
    if (!landingPage) return
    if (!landingPage.funnelId || !landingPage.stageId) {
      setSubmitted(true)
      return
    }

    const lpData = getLandingPageById(landingPage.id)
    const companyId = lpData?.companyId
    if (!companyId) {
      setSubmitted(true)
      return
    }

    const formFields = (() => {
      if (!sourceFormElement) return []
      if ((sourceFormElement as any).type === "form" && (sourceFormElement as any).content && typeof (sourceFormElement as any).content === "object") {
        return getBuilderFormFields(sourceFormElement as BuilderElement)
      }
      const legacyFields = (sourceFormElement as any).formFields
      return Array.isArray(legacyFields) ? legacyFields : []
    })()

    const nameField = formFields.find((f: any) => typeof f.label === "string" && f.label.toLowerCase().includes("nome"))
    const emailField = formFields.find((f: any) => f.type === "email")
    const phoneField = formFields.find((f: any) => f.type === "phone" || f.type === "tel")

    const clientName = nameField ? formData[String(nameField.id)] : "Lead da Landing Page"
    const clientEmail = emailField ? formData[String(emailField.id)] : undefined
    const clientPhone = phoneField ? formData[String(phoneField.id)] : undefined

    const lead: Lead = {
      id: `lead-${Date.now()}`,
      formData: formData,
      submittedAt: new Date().toISOString(),
      landingPageId: landingPage.id,
    }

    addLeadToLandingPage(landingPage.id, lead)

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

    const storageKey = `${companyId}_kanban-data`
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '{"leads": []}')
    const existingLeads = existingData.leads || []
    existingLeads.push(funnelLead)
    existingData.leads = existingLeads
    localStorage.setItem(storageKey, JSON.stringify(existingData))

    const payload = {
      title: clientName || `Lead - ${landingPage.name}`,
      client: clientName || "Lead da Landing Page",
      clientEmail: clientEmail,
      clientPhone: clientPhone,
      source: `Landing Page: ${landingPage.name}`,
      status: landingPage.stageId,
      funnelId: landingPage.funnelId,
      companyId: companyId,
      notes: `Lead capturado via landing page em ${new Date().toLocaleString("pt-BR")}. Dados do formulário: ${JSON.stringify(formData)}`,
      tags: landingPage.tagIds || [],
      contacts: [
        {
          name: clientName || "Lead",
          email: clientEmail,
          phone: clientPhone,
          isPrincipal: true,
        },
      ],
    }

    const res = await fetch(`${API_BASE_URL}/leads/public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Falha ao enviar lead para o backend (${res.status})`)
    }

    setSubmitted(true)

    if ((sourceFormElement as any)?.content && typeof (sourceFormElement as any).content === "object") {
      const redirectUrl = (sourceFormElement as any).content.redirectUrl
      if (typeof redirectUrl === "string" && redirectUrl.trim()) {
        window.location.href = redirectUrl
      }
    }
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

  const renderLegacyElement = (element: LandingPageElement) => {
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
        return renderBuilderFormAsLegacy(element)
      default:
        return null
    }
  }

  const renderBuilderFormAsLegacy = (element: LandingPageElement) => {
    const styles = {
      ...element.styles,
      margin: "0 auto",
    }

    const fields = Array.isArray(element.formFields) ? element.formFields : []

    return (
      <form
        key={element.id}
        onSubmit={async (e) => {
          e.preventDefault()
          setSubmitError(null)

          const newErrors: Record<string, string> = {}
          fields.forEach((field) => {
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
          if (Object.keys(newErrors).length > 0) return

          try {
            setSubmitting(true)
            await submitLeadToPipeline(element)
          } catch (err: any) {
            setSubmitError(err?.message || "Erro ao enviar formulário")
          } finally {
            setSubmitting(false)
          }
        }}
        style={styles}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {fields.map((field) => (
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
              ) : field.type === "textarea" ? (
                <Textarea
                  placeholder={field.placeholder}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value, field.type)}
                  className="text-base"
                  style={{
                    borderColor: errors[field.id] ? "#ef4444" : undefined,
                  }}
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
              {errors[field.id] && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors[field.id]}</p>}
            </div>
          ))}

          {submitError && <p style={{ color: "#ef4444", fontSize: "12px" }}>{submitError}</p>}

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full h-12 text-base font-semibold"
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
            }}
          >
            {submitting ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </form>
    )
  }

  const renderBuilderElement = (element: BuilderElement): React.ReactNode => {
    const styles = (element.styles || {}) as React.CSSProperties
    const content = (element.content || {}) as any

    switch (element.type) {
      case "section":
        return (
          <div key={element.id} style={styles} className="w-full">
            {element.children?.map((child) => renderBuilderElement(child))}
          </div>
        )
      case "columns": {
        const columns = Number(content.columns || 2)
        const columnWidths = Array.isArray(content.columnWidths) ? content.columnWidths : null
        const gridTemplateColumns =
          columnWidths && columnWidths.length === columns ? columnWidths.map((w: any) => `${w}fr`).join(" ") : `repeat(${columns}, 1fr)`

        return (
          <div
            key={element.id}
            style={{
              ...styles,
              display: "grid",
              gridTemplateColumns,
            }}
            className="w-full"
          >
            {element.children?.map((child) => renderBuilderElement(child))}
          </div>
        )
      }
      case "column":
        return (
          <div key={element.id} style={styles} className="w-full flex flex-col">
            {element.children?.map((child) => renderBuilderElement(child))}
          </div>
        )
      case "heading":
        return (
          <h2 key={element.id} style={styles} className="w-full whitespace-pre-wrap break-words">
            {content.text || "Título"}
          </h2>
        )
      case "paragraph":
        return (
          <p key={element.id} style={styles} className="w-full whitespace-pre-wrap break-words">
            {content.text || ""}
          </p>
        )
      case "button": {
        const buttonStyles: React.CSSProperties = {
          backgroundColor: styles.backgroundColor as any,
          color: styles.color as any,
          fontSize: styles.fontSize as any,
          fontWeight: styles.fontWeight as any,
          padding: styles.padding as any,
          borderRadius: styles.borderRadius as any,
          display: "inline-block",
          textDecoration: "none",
          cursor: "pointer",
          border: "none",
          textAlign: (styles.textAlign as any) || "center",
        }

        return (
          <div key={element.id} style={{ textAlign: (styles.textAlign as any) || "center" }} className="w-full">
            <button style={buttonStyles} onClick={(e) => e.preventDefault()}>
              {content.buttonText || "Botão"}
            </button>
          </div>
        )
      }
      case "image": {
        const src = content.src || content.imageUrl || "/placeholder.svg"
        const imgStyles: React.CSSProperties = {
          width: (styles.width as any) || "100%",
          height: (styles.height as any) || "auto",
          maxWidth: (styles.maxWidth as any) || undefined,
          borderRadius: (styles.borderRadius as any) || undefined,
          padding: (styles.padding as any) || undefined,
          margin: (styles.margin as any) || undefined,
        }

        return (
          <div key={element.id} style={{ textAlign: (styles.textAlign as any) || "center" }} className="w-full">
            <img src={src} alt="Imagem" style={imgStyles} />
          </div>
        )
      }
      case "video": {
        const url = content.videoUrl
        const wrapperStyles: React.CSSProperties = {
          width: (styles.width as any) || "100%",
          borderRadius: (styles.borderRadius as any) || undefined,
          padding: (styles.padding as any) || undefined,
          margin: (styles.margin as any) || undefined,
        }

        if (!url) {
          return <div key={element.id} style={wrapperStyles} className="w-full aspect-video" />
        }

        return (
          <div key={element.id} style={wrapperStyles} className="w-full aspect-video">
            <iframe
              src={url}
              className="w-full h-full rounded-lg"
              style={{ borderRadius: (styles.borderRadius as any) || undefined }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }
      case "spacer":
        return <div key={element.id} style={{ height: (styles.height as any) || "40px" }} className="w-full" />
      case "code":
        return (
          <pre key={element.id} style={styles} className="w-full overflow-auto">
            <code>{content.code || ""}</code>
          </pre>
        )
      case "form": {
        const fields = getBuilderFormFields(element)
        const submitLabel = content.submitLabel || "Enviar"
        const containerStyles: React.CSSProperties = {
          backgroundColor: (styles.backgroundColor as any) || undefined,
          padding: (styles.padding as any) || undefined,
          borderRadius: (styles.borderRadius as any) || undefined,
          borderWidth: (styles.borderWidth as any) || undefined,
          borderColor: (styles.borderColor as any) || undefined,
          borderStyle: (styles.borderWidth as any) ? "solid" : undefined,
          margin: (styles.margin as any) || "0 auto",
          maxWidth: (styles.maxWidth as any) || undefined,
        }

        return (
          <form
            key={element.id}
            style={containerStyles}
            className="w-full space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setSubmitError(null)
              if (!validateBuilderForm(element)) return
              try {
                setSubmitting(true)
                await submitLeadToPipeline(element)
              } catch (err: any) {
                setSubmitError(err?.message || "Erro ao enviar formulário")
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {fields.map((field: any) => {
              const fieldId = String(field.id)
              const type = String(field.type || "text")
              return (
                <div key={fieldId} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {type === "phone" ? (
                    <PhoneInputComponent
                      value={formData[fieldId] || ""}
                      onChange={(value) => handlePhoneChange(fieldId, value)}
                      placeholder={field.placeholder || ""}
                      defaultCountry={String(field.defaultCountry || "BR").toLowerCase()}
                    />
                  ) : type === "textarea" ? (
                    <Textarea
                      value={formData[fieldId] || ""}
                      onChange={(e) => handleInputChange(fieldId, e.target.value, type)}
                      placeholder={field.placeholder || ""}
                      style={{ borderColor: errors[fieldId] ? "#ef4444" : undefined }}
                    />
                  ) : (
                    <Input
                      type={getInputType(type)}
                      value={formData[fieldId] || ""}
                      onChange={(e) => handleInputChange(fieldId, e.target.value, type)}
                      placeholder={field.placeholder || ""}
                      className="h-12 text-base"
                      style={{ borderColor: errors[fieldId] ? "#ef4444" : undefined }}
                    />
                  )}

                  {errors[fieldId] && <p className="text-xs text-red-500">{errors[fieldId]}</p>}
                </div>
              )
            })}

            {submitError && <p className="text-xs text-red-500">{submitError}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
              }}
            >
              {submitting ? "Enviando..." : submitLabel}
            </Button>
          </form>
        )
      }
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
      <div className="max-w-4xl mx-auto space-y-8">
        {isLegacyElements(landingPage.elements)
          ? (landingPage.elements as LandingPageElement[]).map((el) => renderLegacyElement(el))
          : (landingPage.elements as unknown as BuilderElement[]).map((el) => renderBuilderElement(el))}
      </div>
    </div>
  )
}
