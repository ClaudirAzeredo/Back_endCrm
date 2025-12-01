export type FieldType = "text" | "email" | "phone" | "cpf" | "cnpj" | "custom"

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder: string
  required: boolean
  order: number
  countryCode?: string
}

export interface LandingPageElement {
  id: string
  type: "heading" | "text" | "button" | "image" | "form"
  content: string
  styles: Record<string, any>
  order: number
  formFields?: FormField[]
}

export interface LandingPage {
  id: string
  name: string
  companyId?: string
  funnelId?: string
  stageId?: string
  funnelStage?: string
  elements: LandingPageElement[]
  backgroundColor: string
  tagIds?: string[]
  createdAt: string
  updatedAt: string
  leads: Lead[]
  title?: string
  subtitle?: string
  description?: string
  buttonText?: string
  buttonColor?: string
  textColor?: string
}

export interface Lead {
  id: string
  formData: Record<string, string>
  submittedAt: string
  landingPageId: string
}
