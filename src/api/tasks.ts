import { supabase } from '@/lib/supabase'
import { Task, TaskFilters, Attachment, HistoryEntry } from '@/types/task'

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  let query = supabase
    .from('tarefas')
    .select(`
      *,
      criador:criador_id(id, email, nome, role),
      responsavel:responsavel_id(id, email, nome, role)
    `)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.prioridade) {
    query = query.eq('prioridade', filters.prioridade)
  }
  if (filters?.responsavel) {
    query = query.eq('responsavel_id', filters.responsavel)
  }
  if (filters?.data_vencimento) {
    query = query.eq('data_vencimento', filters.data_vencimento)
  }

  const { data, error } = await query
  
  if (error) {
    throw new Error(`Erro ao buscar tarefas: ${error.message}`)
  }
  
  return data || []
}

export async function getTaskById(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tarefas')
    .select(`
      *,
      criador:criador_id(id, email, nome, role),
      responsavel:responsavel_id(id, email, nome, role)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Erro ao buscar tarefa: ${error.message}`)
  }
  
  return data
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tarefas')
    .insert([task])
    .select(`
      *,
      criador:criador_id(id, email, nome, role),
      responsavel:responsavel_id(id, email, nome, role)
    `)
    .single()

  if (error) {
    throw new Error(`Erro ao criar tarefa: ${error.message}`)
  }
  
  return data
}

export async function updateTask(id: string, task: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tarefas')
    .update(task)
    .eq('id', id)
    .select(`
      *,
      criador:criador_id(id, email, nome, role),
      responsavel:responsavel_id(id, email, nome, role)
    `)
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar tarefa: ${error.message}`)
  }
  
  return data
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tarefas')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao excluir tarefa: ${error.message}`)
  }
}

export async function getTaskAttachments(taskId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('anexos')
    .select('*')
    .eq('tarefa_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar anexos: ${error.message}`)
  }
  
  return data || []
}

export async function getTaskHistory(taskId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('historico_alteracoes')
    .select(`
      *,
      usuario:usuario_id(id, email, nome, role)
    `)
    .eq('tarefa_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar histórico: ${error.message}`)
  }
  
  return data || []
}

export async function uploadAttachment(taskId: string, file: File): Promise<Attachment> {
  const fileName = `${Date.now()}-${file.name}`
  const filePath = `tarefas/${taskId}/${fileName}`

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('anexos')
    .upload(filePath, file)

  if (uploadError) {
    throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('anexos')
    .getPublicUrl(filePath)

  // Create attachment record
  const { data, error } = await supabase
    .from('anexos')
    .insert([{
      tarefa_id: taskId,
      nome_arquivo: file.name,
      url_arquivo: publicUrl,
      tipo_arquivo: file.type
    }])
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar anexo: ${error.message}`)
  }
  
  return data
}