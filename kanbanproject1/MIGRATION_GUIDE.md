# Guia de Migração: localStorage para API

Este documento descreve como migrar completamente do `localStorage` para consumir dados pela API.

## Status da Migração

### ✅ Concluído
- [x] Componentes de autenticação (login-form, register-form)
- [x] app/page.tsx - usando useApiAuth
- [x] Hooks de API criados (useApiAuth, useApiLeads, useApiFunnels, useApiTasks)

### 🔄 Em Progresso
- [ ] Refatorar project-kanban.tsx para usar useApiLeads e useApiFunnels
- [ ] Refatorar componentes de tarefas para usar useApiTasks
- [ ] Remover localStorage de lib/auth.ts
- [ ] Remover localStorage de lib/storage.ts

### ⏳ Pendente
- [ ] Refatorar admin-panel.tsx
- [ ] Refatorar conversation-panel.tsx
- [ ] Refatorar componentes de landing pages
- [ ] Remover todas as funções de storage do projeto

## Padrão de Refatoração

### Antes (localStorage)
\`\`\`typescript
const [leads, setLeads] = useState<Lead[]>([])

useEffect(() => {
  const storedLeads = loadFromStorage(`leads_${funnelId}`, [])
  setLeads(storedLeads)
}, [funnelId])

useEffect(() => {
  saveToStorage(leads, `leads_${funnelId}`)
}, [leads, funnelId])
\`\`\`

### Depois (API)
\`\`\`typescript
const { leads, isLoading, createLead, updateLead, deleteLead } = useApiLeads({
  funnelId
})

// Dados são sincronizados automaticamente com a API
\`\`\`

## Checklist de Refatoração por Arquivo

### lib/auth.ts
- [ ] Remover `localStorage.getItem(AUTH_STORAGE_KEY)`
- [ ] Remover `localStorage.setItem(AUTH_STORAGE_KEY, ...)`
- [ ] Remover `localStorage.removeItem(AUTH_STORAGE_KEY)`
- [ ] Usar `useApiAuth` hook em vez de funções diretas
- [ ] Remover `registerUser` e `loginUser` (usar API)

### lib/storage.ts
- [ ] Remover todas as funções `loadFromStorage`
- [ ] Remover todas as funções `saveToStorage`
- [ ] Remover `getCurrentUser` (usar `useApiAuth`)

### components/project-kanban.tsx
- [ ] Substituir `loadFromStorage("leads_...")` por `useApiLeads`
- [ ] Substituir `saveToStorage(leads, ...)` por chamadas de API
- [ ] Substituir `loadFromStorage("funnels")` por `useApiFunnels`
- [ ] Substituir `loadFromStorage("tasks")` por `useApiTasks`
- [ ] Remover todos os `useEffect` que salvam em localStorage

### components/admin-panel.tsx
- [ ] Substituir `localStorage.getItem("unicrm_companies")` por API
- [ ] Substituir `localStorage.setItem("unicrm_companies", ...)` por API
- [ ] Criar hook `useApiCompanies` se necessário

### components/conversation-panel.tsx
- [ ] Remover `localStorage.getItem("is_admin")`
- [ ] Remover `localStorage.getItem("whatsapp_config")`
- [ ] Remover `localStorage.getItem("whatsapp_connected")`
- [ ] Usar API para verificar configurações

## Testes Recomendados

1. **Autenticação**
   - [ ] Login funciona com API
   - [ ] Registro funciona com API
   - [ ] Logout limpa dados corretamente
   - [ ] Refresh de página mantém autenticação

2. **Leads**
   - [ ] Criar lead salva na API
   - [ ] Atualizar lead sincroniza com API
   - [ ] Deletar lead remove da API
   - [ ] Mover lead entre colunas atualiza status

3. **Funnels**
   - [ ] Criar funil salva na API
   - [ ] Atualizar funil sincroniza com API
   - [ ] Deletar funil remove da API

4. **Tasks**
   - [ ] Criar tarefa salva na API
   - [ ] Atualizar tarefa sincroniza com API
   - [ ] Deletar tarefa remove da API

## Notas Importantes

- O `localStorage` ainda é usado em `lib/api/auth-api.ts` para armazenar token JWT. Isso é aceitável para desenvolvimento.
- Em produção, considere usar cookies seguros em vez de localStorage para tokens.
- Todos os dados devem ser sincronizados com a API em tempo real.
- Implementar tratamento de erros adequado para falhas de rede.
