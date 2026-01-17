-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
    prioridade VARCHAR(20) NOT NULL CHECK (prioridade IN ('alta', 'media', 'baixa')),
    criador_id UUID NOT NULL REFERENCES auth.users(id),
    responsavel_id UUID NOT NULL REFERENCES auth.users(id),
    data_vencimento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de anexos
CREATE TABLE IF NOT EXISTS anexos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarefa_id UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    url_arquivo TEXT NOT NULL,
    tipo_arquivo VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de histórico
CREATE TABLE IF NOT EXISTS historico_alteracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarefa_id UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    campo_alterado VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON tarefas(prioridade);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_vencimento ON tarefas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_tarefas_criador ON tarefas(criador_id);
CREATE INDEX IF NOT EXISTS idx_anexos_tarefa ON anexos(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_historico_tarefa ON historico_alteracoes(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_historico_usuario ON historico_alteracoes(usuario_id);

-- Configurar RLS (Row Level Security)
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Permitir que usuários vejam apenas tarefas onde são criadores ou responsáveis
CREATE POLICY "Usuários podem ver próprias tarefas" ON tarefas
    FOR SELECT USING (
        auth.uid() = criador_id OR auth.uid() = responsavel_id
    );

-- Permitir que usuários criem tarefas
CREATE POLICY "Usuários podem criar tarefas" ON tarefas
    FOR INSERT WITH CHECK (auth.uid() = criador_id);

-- Permitir que usuários atualizem tarefas onde são responsáveis
CREATE POLICY "Responsáveis podem atualizar tarefas" ON tarefas
    FOR UPDATE USING (auth.uid() = responsavel_id)
    WITH CHECK (auth.uid() = responsavel_id);

-- Permissões básicas para usuários autenticados
GRANT ALL PRIVILEGES ON tarefas TO authenticated;
GRANT ALL PRIVILEGES ON anexos TO authenticated;
GRANT ALL PRIVILEGES ON historico_alteracoes TO authenticated;

-- Permissões de leitura para usuários anônimos (se necessário)
GRANT SELECT ON tarefas TO anon;
GRANT SELECT ON anexos TO anon;