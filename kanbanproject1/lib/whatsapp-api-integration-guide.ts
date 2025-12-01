// GUIA DE INTEGRAÇÃO - Como conectar sua API do WhatsApp
// Este arquivo serve como documentação para integração

/*
=== PONTOS DE INTEGRAÇÃO PRINCIPAIS ===

1. CONFIGURAÇÃO DA API (lib/whatsapp-api.ts - linha ~85)
   Modifique os endpoints na classe GenericWhatsAppProvider:

   async sendMessage(contactId: string, message: string): Promise<WhatsAppMessage> {
     // SUBSTITUA ESTE ENDPOINT PELA SUA API
     const endpoint = `${this.config.customEndpoint}/send-message`
     
     // CONFIGURE OS HEADERS CONFORME SUA API
     const headers = {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${this.config.apiKey}`, // ou outro formato
       ...this.config.customHeaders,
     }

     // AJUSTE O BODY CONFORME SUA API ESPERA
     const response = await fetch(endpoint, {
       method: "POST",
       headers,
       body: JSON.stringify({
         to: contactId,        // pode ser 'phone', 'number', etc.
         message: message,     // pode ser 'text', 'content', etc.
         // adicione outros campos que sua API precisa
       }),
     })

     // AJUSTE A RESPOSTA CONFORME SUA API RETORNA
     const result = await response.json()
     return {
       id: result.id || result.messageId,
       contactId,
       content: message,
       timestamp: new Date(),
       isFromMe: true,
       messageType: "text",
       status: "sent",
     }
   }

2. ENDPOINTS PARA MODIFICAR:
   - sendMessage() - linha ~85: Enviar mensagens
   - getContacts() - linha ~115: Buscar contatos
   - getConversations() - linha ~140: Buscar conversações  
   - getMessages() - linha ~165: Buscar mensagens de um contato

3. CONFIGURAÇÃO NO COMPONENTE (components/whatsapp-config.tsx)
   O usuário admin configura:
   - API Key: sua chave de autenticação
   - Custom Endpoint: URL base da sua API
   - Webhook URL: para receber mensagens em tempo real
   - Custom Headers: headers adicionais (JSON)

4. EXEMPLOS DE CONFIGURAÇÃO:

   Para API REST simples:
   {
     provider: "custom",
     apiKey: "sua-api-key-aqui",
     customEndpoint: "https://sua-api.com/whatsapp",
     customHeaders: {
       "X-API-Version": "v1",
       "Content-Type": "application/json"
     }
   }

   Para API com webhook:
   {
     provider: "custom", 
     apiKey: "sua-api-key-aqui",
     customEndpoint: "https://sua-api.com/whatsapp",
     webhookUrl: "https://seu-webhook.com/whatsapp/messages"
   }

=== ESTRUTURA ESPERADA DA SUA API ===

Sua API deve ter estes endpoints:

POST /send-message
{
  "contactId": "5511999999999",
  "message": "Olá!"
}
Resposta: { "id": "msg123", "status": "sent" }

GET /contacts
Resposta: { 
  "contacts": [
    {
      "id": "5511999999999",
      "name": "João",
      "phone": "5511999999999", 
      "isOnline": true
    }
  ]
}

GET /conversations
Resposta: {
  "conversations": [
    {
      "contactId": "5511999999999",
      "messages": [...],
      "unreadCount": 2
    }
  ]
}

GET /messages/{contactId}
Resposta: {
  "messages": [
    {
      "id": "msg123",
      "contactId": "5511999999999",
      "content": "Olá!",
      "timestamp": "2024-01-01T10:00:00Z",
      "isFromMe": false,
      "messageType": "text",
      "status": "delivered"
    }
  ]
}

=== WEBHOOK PARA TEMPO REAL (OPCIONAL) ===

Se sua API suporta webhooks, configure a URL no componente.
O webhook deve enviar dados neste formato:

POST para sua webhookUrl:
{
  "type": "message",
  "message": {
    "id": "msg123",
    "contactId": "5511999999999", 
    "content": "Nova mensagem",
    "timestamp": "2024-01-01T10:00:00Z",
    "isFromMe": false,
    "messageType": "text",
    "status": "delivered"
  }
}

=== PASSOS PARA INTEGRAÇÃO ===

1. Modifique os métodos em lib/whatsapp-api.ts (GenericWhatsAppProvider)
2. Ajuste os endpoints para sua API
3. Configure os headers de autenticação
4. Teste a conexão usando o componente de configuração
5. Implemente webhook se necessário para tempo real

*/

export const INTEGRATION_GUIDE = {
  mainFile: "lib/whatsapp-api.ts",
  configComponent: "components/whatsapp-config.tsx",
  usageComponent: "components/conversation-panel.tsx",
  keyMethods: ["sendMessage()", "getContacts()", "getConversations()", "getMessages()"],
}
