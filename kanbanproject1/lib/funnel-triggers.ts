export type TriggerType = "status_change" | "time_delay" | "tag_added" | "custom_field"

export type WhatsAppTrigger = {
  id: string
  name: string
  type: TriggerType
  conditions: {
    fromStatus?: string
    toStatus?: string
    delayMinutes?: number
    tagName?: string
    fieldName?: string
    fieldValue?: string
  }
  message: {
    template: string
    variables?: Record<string, string>
  }
  isActive: boolean
  createdAt: string
}

export type TriggerExecution = {
  id: string
  triggerId: string
  leadId: string
  message: string
  status: "pending" | "sent" | "failed"
  executedAt: string
  error?: string
}

export async function executeFunnelTriggers(leadId: string, fromStatus: string, toStatus: string) {
  const triggers = loadFromStorage("whatsapp_triggers", []) as WhatsAppTrigger[]
  const activeTriggers = triggers.filter(
    (trigger) =>
      trigger.isActive &&
      trigger.type === "status_change" &&
      trigger.conditions.fromStatus === fromStatus &&
      trigger.conditions.toStatus === toStatus,
  )

  for (const trigger of activeTriggers) {
    await sendWhatsAppMessage(leadId, trigger.message.template, trigger.id)
  }
}

async function sendWhatsAppMessage(leadId: string, messageTemplate: string, triggerId: string) {
  try {
    // Get lead data
    const leads = loadFromStorage("leads", [])
    const lead = leads.find((l: any) => l.id === leadId)

    if (!lead) {
      throw new Error("Lead not found")
    }

    // Replace variables in message template
    const message = messageTemplate
      .replace("{name}", lead.name || "Cliente")
      .replace("{company}", lead.company || "")
      .replace("{phone}", lead.phone || "")

    // Create conversation if it doesn't exist
    const conversations = loadFromStorage("whatsapp_conversations", [])
    let conversation = conversations.find((c: any) => c.leadId === leadId)

    if (!conversation) {
      conversation = {
        id: `conv_${Date.now()}`,
        contactName: lead.name || "Cliente",
        contactPhone: lead.phone || "Sem telefone",
        lastMessage: message,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        leadId: leadId,
        messages: [],
      }
      conversations.push(conversation)
    }

    // Add message to conversation
    const whatsappMessage = {
      id: `msg_${Date.now()}`,
      text: message,
      timestamp: new Date().toISOString(),
      isFromClient: false,
      status: "sent" as const,
      leadId: leadId,
    }

    conversation.messages.push(whatsappMessage)
    conversation.lastMessage = message
    conversation.lastMessageTime = new Date().toISOString()

    // Save updated conversations
    saveToStorage(conversations, "whatsapp_conversations")

    // Log trigger execution
    const executions = loadFromStorage("trigger_executions", [])
    executions.push({
      id: `exec_${Date.now()}`,
      triggerId,
      leadId,
      message,
      status: "sent",
      executedAt: new Date().toISOString(),
    })
    saveToStorage(executions, "trigger_executions")

    console.log(`[v0] WhatsApp message sent via trigger: ${message}`)
  } catch (error) {
    console.error(`[v0] Failed to send WhatsApp message:`, error)

    // Log failed execution
    const executions = loadFromStorage("trigger_executions", [])
    executions.push({
      id: `exec_${Date.now()}`,
      triggerId,
      leadId,
      message: messageTemplate,
      status: "failed",
      executedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    })
    saveToStorage(executions, "trigger_executions")
  }
}

import { loadFromStorage, saveToStorage } from "./storage"
