# Sistema de Gerenciamento de Tarefas

Um sistema completo de gerenciamento de tarefas desenvolvido com React, TypeScript, TailwindCSS e Supabase.

## 🚀 Funcionalidades

- **Gestão de Tarefas**: Crie, edite e organize tarefas
- **Filtros Avançados**: Filtre por status, prioridade, responsável e data
- **Histórico de Alterações**: Acompanhe todas as mudanças realizadas
- **Anexos de Arquivos**: Adicione arquivos às suas tarefas
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile
- **Design Moderno**: Interface limpa e intuitiva com TailwindCSS

## 📋 Páginas do Sistema

- **Home**: Página inicial com apresentação do sistema
- **Lista de Tarefas**: Visualização principal com filtros e cards
- **Criar/Editar Tarefa**: Formulário para gerenciar tarefas
- **Detalhes da Tarefa**: Visualização completa com histórico e anexos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: TailwindCSS 3
- **Backend**: Supabase (BaaS)
- **Banco de Dados**: PostgreSQL
- **Gerenciamento de Estado**: Zustand
- **Ícones**: Lucide React
- **Datas**: date-fns

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone [url-do-repositorio]
   cd sistema-gerenciamento-tarefas
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o Supabase**
   - Crie um projeto no [Supabase](https://supabase.com)
   - Execute o script SQL em `supabase/migrations/20241201_create_task_tables.sql`
   - Configure o storage bucket chamado `anexos` para upload de arquivos
   - Copie as credenciais do projeto

4. **Configure as variáveis de ambiente**
   - Copie `.env.example` para `.env`
   - Adicione suas credenciais do Supabase:
     ```
     VITE_SUPABASE_URL=sua_url_do_supabase
     VITE_SUPABASE_ANON_KEY=sua_chave_anonima
     ```

5. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

6. **Acesse o sistema**
   - Abra [http://localhost:5173](http://localhost:5173) no navegador

## 📁 Estrutura do Projeto

```
src/
├── api/              # Funções de API para comunicação com Supabase
├── components/       # Componentes React reutilizáveis
├── lib/             # Configurações e utilidades
├── pages/           # Páginas principais do sistema
├── store/           # Gerenciamento de estado com Zustand
├── types/           # Definições de tipos TypeScript
└── main.tsx         # Ponto de entrada da aplicação
```

## 🎯 Funcionalidades Detalhadas

### Gestão de Tarefas
- Criar novas tarefas com título, descrição, status, prioridade e vencimento
- Editar tarefas existentes
- Excluir tarefas
- Marcar tarefas como concluídas

### Filtros e Busca
- Filtrar por status (pendente, em andamento, concluída)
- Filtrar por prioridade (alta, média, baixa)
- Buscar por responsável
- Filtrar por data de vencimento

### Anexos
- Upload de arquivos para tarefas
- Download de anexos
- Visualização de tipo e data de upload

### Histórico
- Registro automático de alterações
- Visualização de quem fez cada alteração
- Timestamps precisos de cada mudança

## 🔧 Comandos Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Pré-visualização do build
- `npm run lint` - Executa linting
- `npm run check` - Verifica tipos TypeScript

## 🚀 Deploy

O sistema está pronto para deploy em serviços como:
- Vercel
- Netlify
- Firebase Hosting
- Outros serviços de hospedagem estática

## 📄 Licença

Este projeto está licenciado sob a licença MIT.

## 👥 Autor

Desenvolvido como parte do sistema CRM integrado.

---

Para dúvidas ou sugestões, por favor abra uma issue no repositório.