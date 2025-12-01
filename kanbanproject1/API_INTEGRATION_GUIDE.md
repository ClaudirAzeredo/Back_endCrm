# Guia de Integração com API Spring Boot

Este documento explica como o frontend Next.js foi adaptado para consumir a API Spring Boot.

## Estrutura da Integração

### 1. API Client (`lib/api-client.ts`)
Cliente HTTP centralizado que gerencia:
- Requisições HTTP (GET, POST, PUT, DELETE)
- Autenticação JWT via header `Authorization: Bearer {token}`
- Tratamento de erros
- Logging de requisições

### 2. Serviços de API (`lib/api/`)
Cada recurso tem seu próprio serviço:
- `auth-api.ts` - Autenticação (login, register, logout, me)
- `leads-api.ts` - CRUD de leads + interações + status
- `funnels-api.ts` - CRUD de funis + colunas
- `tasks-api.ts` - CRUD de tarefas + status
- `automations-api.ts` - CRUD de automações + toggle

### 3. Hooks Customizados (`hooks/`)
Hooks React para consumir a API:
- `use-api-auth.ts` - Gerenciamento de autenticação
- `use-api-leads.ts` - Gerenciamento de leads

## Como Usar

### Autenticação

\`\`\`typescript
import { useApiAuth } from '@/hooks/use-api-auth'

function MyComponent() {
  const { user, isAuthenticated, login, logout, error } = useApiAuth()

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' })
      // Login bem-sucedido
    } catch (err) {
      // Erro já está em `error`
    }
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>Bem-vindo, {user?.name}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
\`\`\`

### Leads

\`\`\`typescript
import { useApiLeads } from '@/hooks/use-api-leads'

function LeadsComponent() {
  const { leads, isLoading, createLead, updateLead, deleteLead } = useApiLeads({
    funnelId: 'funnel-123'
  })

  const handleCreateLead = async () => {
    await createLead({
      title: 'Novo Lead',
      client: 'Cliente XYZ',
      status: 'novo',
      funnelId: 'funnel-123'
    })
  }

  return (
    <div>
      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <ul>
          {leads.map(lead => (
            <li key={lead.id}>{lead.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
\`\`\`

### Chamadas Diretas à API

\`\`\`typescript
import { leadsApi } from '@/lib/api/leads-api'

async function fetchLeadById(id: string) {
  try {
    const lead = await leadsApi.getLead(id)
    console.log('Lead:', lead)
  } catch (error) {
    console.error('Erro:', error)
  }
}
\`\`\`

## Configuração

### Variável de Ambiente

Adicione no `.env.local`:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
\`\`\`

### Token JWT

O token é armazenado automaticamente no localStorage após login/registro:

\`\`\`json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
\`\`\`

## Tratamento de Erros

Todos os erros da API são capturados e transformados em `ApiError`:

\`\`\`typescript
try {
  await leadsApi.createLead(data)
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.status)
    console.log('Mensagem:', error.message)
    console.log('Dados:', error.data)
  }
}
\`\`\`

## Migração do localStorage para API

### Antes (localStorage):
\`\`\`typescript
const leads = loadFromStorage('leads_funnel-123')
saveToStorage(newLeads, 'leads_funnel-123')
\`\`\`

### Depois (API):
\`\`\`typescript
const { leads, createLead } = useApiLeads({ funnelId: 'funnel-123' })
await createLead(newLeadData)
\`\`\`

## Próximos Passos

1. **Implementar hooks para outros recursos:**
   - `use-api-funnels.ts`
   - `use-api-tasks.ts`
   - `use-api-automations.ts`
   - `use-api-conversations.ts`

2. **Atualizar componentes principais:**
   - `components/auth/login-form.tsx` - Usar `useApiAuth`
   - `components/auth/register-form.tsx` - Usar `useApiAuth`
   - `components/project-kanban.tsx` - Usar `useApiLeads`

3. **Implementar refresh token automático**

4. **Adicionar retry logic para requisições falhadas**

5. **Implementar cache de dados com SWR ou React Query**

## Logs de Debug

Todos os logs da API são prefixados com `[v0]`:

\`\`\`
[v0] API Request: { method: 'POST', url: 'http://localhost:8080/api/auth/login', ... }
[v0] API Response: { status: 200, statusText: 'OK', ... }
[v0] Login successful: { id: '...', name: '...', ... }
\`\`\`

## Compatibilidade com localStorage

O sistema mantém compatibilidade com localStorage para desenvolvimento offline:
- Token JWT é armazenado no localStorage
- Dados do usuário são armazenados no localStorage
- Permite desenvolvimento sem backend rodando

Para desabilitar localStorage e forçar uso da API, remova as chamadas de `localStorage` dos serviços de API.
