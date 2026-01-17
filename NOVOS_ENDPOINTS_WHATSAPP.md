# Novos Endpoints WhatsApp - Documentação

## Visão Geral
Esta documentação descreve os novos endpoints implementados para integração com a API Z-API, permitindo funcionalidades avançadas de gerenciamento de chats e webhooks.

## Endpoints Implementados

### 1. Modificar Chat (`/api/whatsapp/modify-chat`)
**Método:** POST  
**Descrição:** Permite marcar chats como lidos/não lidos ou deletar chats.

**Request Body:**
```json
{
  "phone": "5544999999999",
  "action": "read"  // "read", "unread" ou "delete"
}
```

**Response:**
```json
{
  "success": true,
  "value": true
}
```

**Códigos de Status:**
- 200: Sucesso
- 400: Requisição inválida (phone ou action ausente/inválido)
- 500: Erro interno do servidor

### 2. Atualizar Webhook de Presença (`/api/whatsapp/update-webhook-chat-presence`)
**Método:** PUT  
**Descrição:** Configura a URL do webhook para receber atualizações de presença do chat.

**Request Body:**
```json
{
  "value": "https://seu-sistema.com/webhook/chat-presence"
}
```

**Response:**
```json
{
  "success": true
}
```

### 3. Atualizar Webhook de Status (`/api/whatsapp/update-webhook-message-status`)
**Método:** PUT  
**Descrição:** Configura a URL do webhook para receber atualizações de status de mensagens.

**Request Body:**
```json
{
  "value": "https://seu-sistema.com/webhook/message-status"
}
```

**Response:**
```json
{
  "success": true
}
```

## Webhooks

### Webhook de Presença do Chat (`/api/whatsapp/webhook/chat-presence`)
**Método:** POST  
**Descrição:** Recebe atualizações de presença do chat (quando usuários entram/saem do chat, digitam, etc.).

**Payload Exemplo:**
```json
{
  "type": "PresenceChatCallback",
  "phone": "5544999999999",
  "status": "AVAILABLE",  // UNAVAILABLE, AVAILABLE, COMPOSING, RECORDING, PAUSED
  "lastSeen": null,
  "instanceId": "instance.id"
}
```

### Webhook de Status da Mensagem (`/api/whatsapp/webhook/message-status`)
**Método:** POST  
**Descrição:** Recebe atualizações de status de mensagens (enviadas, recebidas, lidas, etc.).

**Payload Exemplo:**
```json
{
  "instanceId": "instance.id",
  "status": "READ",  // SENT, RECEIVED, READ, READ_BY_ME, PLAYED
  "ids": ["999999999999999999999"],
  "momment": 1632234645000,
  "phoneDevice": 0,
  "phone": "5544999999999",
  "type": "MessageStatusCallback",
  "isGroup": false
}
```

## Integração com Z-API

### Configuração Necessária
1. **Instance ID**: Identificador da instância Z-API
2. **Instance Token**: Token da instância (armazenado criptografado)
3. **API Key**: Chave de segurança da conta (Client-Token)

### Headers Enviados para Z-API
```
Content-Type: application/json
Client-Token: {API_KEY}
Authorization: Bearer {INSTANCE_TOKEN}
```

### Tratamento de Erros
- **Configuração Ausente**: Retorna erro 500 com mensagem "Config not found for company"
- **Tokens Ausentes**: Retorna erro 500 com mensagem "Missing instanceId or instanceToken for company"
- **Client-Token Ausente**: Retorna erro 500 com mensagem "Client-Token ausente"
- **Erro de API**: Retorna erro 500 com mensagem detalhada do erro Z-API

## Eventos SSE (Server-Sent Events)

Os webhooks publicam eventos em tempo real via SSE para atualização da interface:

### Evento de Presença do Chat
```json
{
  "type": "chat_presence",
  "phone": "5544999999999",
  "status": "AVAILABLE",
  "lastSeen": null,
  "instanceId": "instance.id"
}
```

### Evento de Status da Mensagem
```json
{
  "type": "message_status",
  "phone": "5544999999999",
  "status": "READ",
  "ids": ["msg123"],
  "instanceId": "instance.id",
  "isGroup": false
}
```

## Exemplos de Uso

### Marcar Chat como Lido
```bash
curl -X POST http://localhost:8080/api/whatsapp/modify-chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5544999999999",
    "action": "read"
  }'
```

### Configurar Webhook de Presença
```bash
curl -X PUT http://localhost:8080/api/whatsapp/update-webhook-chat-presence \\
  -H "Content-Type: application/json" \\
  -d '{
    "value": "https://meu-sistema.com/webhook/chat-presence"
  }'
```

### Deletar Chat
```bash
curl -X POST http://localhost:8080/api/whatsapp/modify-chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5544999999999",
    "action": "delete"
  }'
```

## Testes

Os testes unitários foram implementados para garantir o funcionamento correto:

- `WhatsAppWebhookControllerTest`: Testa os endpoints da API
- `WhatsappServiceTest`: Testa a comunicação com Z-API

Para executar os testes:
```bash
mvn test -Dtest=WhatsAppWebhookControllerTest
mvn test -Dtest=WhatsappServiceTest
```

## Observações Importantes

1. **Formatação de Telefone**: Os números de telefone são automaticamente formatados para conter apenas dígitos antes de enviar para Z-API
2. **HTTPS Obrigatório**: Z-API não aceita webhooks que não sejam HTTPS
3. **Autenticação Multi-tenant**: O sistema identifica automaticamente a empresa pelo tenant atual
4. **Criptografia**: Tokens e chaves de API são armazenados criptografados no banco de dados
5. **Logs Detalhados**: Todos os webhooks e chamadas de API são logados para debugging