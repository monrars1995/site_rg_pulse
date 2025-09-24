-- Criação da tabela a2a_agents para gerenciar agentes A2A
CREATE TABLE IF NOT EXISTS a2a_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_a2a_agents_agent_id ON a2a_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_status ON a2a_agents(status);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_created_at ON a2a_agents(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_a2a_agents_updated_at
    BEFORE UPDATE ON a2a_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configuração de Row Level Security (RLS)
ALTER TABLE a2a_agents ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações para usuários autenticados
-- (ajuste conforme suas necessidades de segurança)
CREATE POLICY "Allow all operations for authenticated users" ON a2a_agents
    FOR ALL USING (true);

-- Inserir agente padrão baseado nas variáveis de ambiente (opcional)
-- Descomente e ajuste conforme necessário
/*
INSERT INTO a2a_agents (name, agent_id, endpoint, api_key, status, description)
VALUES (
  'Agent Principal',
  '38c389f2-cb03-4bc0-8159-9d3a1e501989',
  'https://connectai.mysaas360.com/api/v1/a2a/565cd289-aa46-49a5-8ea6-b547aef1a5d4',
  '11366a65-1809-4e1f-8650-f2e7280dc81e',
  'active',
  'Agente principal configurado via variáveis de ambiente'
)
ON CONFLICT (agent_id) DO NOTHING;
*/

-- Comentários para documentação
COMMENT ON TABLE a2a_agents IS 'Tabela para gerenciar agentes A2A (Agent-to-Agent)';
COMMENT ON COLUMN a2a_agents.id IS 'Identificador único do agente';
COMMENT ON COLUMN a2a_agents.name IS 'Nome amigável do agente';
COMMENT ON COLUMN a2a_agents.agent_id IS 'ID único do agente para comunicação A2A';
COMMENT ON COLUMN a2a_agents.endpoint IS 'URL do endpoint do agente';
COMMENT ON COLUMN a2a_agents.api_key IS 'Chave de API para autenticação';
COMMENT ON COLUMN a2a_agents.status IS 'Status do agente (active, inactive, maintenance)';
COMMENT ON COLUMN a2a_agents.description IS 'Descrição opcional do agente';
COMMENT ON COLUMN a2a_agents.usage_count IS 'Contador de uso do agente';
COMMENT ON COLUMN a2a_agents.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN a2a_agents.updated_at IS 'Data da última atualização do registro';