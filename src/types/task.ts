export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida'
export type TaskPriority = 'alta' | 'media' | 'baixa'

export interface User {
  id: string
  email: string
  nome: string
  role: string
  created_at: string
}

export interface Task {
  id: string
  titulo: string
  descricao?: string
  status: TaskStatus
  prioridade: TaskPriority
  criador_id: string
  responsavel_id: string
  data_vencimento?: string
  created_at: string
  updated_at: string
  criador?: User
  responsavel?: User
}

export interface Attachment {
  id: string
  tarefa_id: string
  nome_arquivo: string
  url_arquivo: string
  tipo_arquivo: string
  created_at: string
}

export interface HistoryEntry {
  id: string
  tarefa_id: string
  usuario_id: string
  campo_alterado: string
  valor_anterior?: string
  valor_novo?: string
  created_at: string
  usuario?: User
}

export interface TaskFilters {
  status?: TaskStatus
  prioridade?: TaskPriority
  responsavel?: string
  data_vencimento?: string
}