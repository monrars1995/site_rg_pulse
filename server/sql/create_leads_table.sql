-- Criar tabela para armazenar leads do diagnóstico
CREATE TABLE IF NOT EXISTS diagnostic_leads (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  segment TEXT NOT NULL,
  revenue TEXT NOT NULL,
  challenge TEXT NOT NULL,
  has_marketing_team TEXT NOT NULL,
  marketing_team_size TEXT,
  marketing_investment TEXT NOT NULL,
  monthly_traffic_investment TEXT NOT NULL,
  current_results TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  qualification_score INTEGER,
  qualification_result TEXT,
  agent_response TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'rejected')),
  source TEXT DEFAULT 'diagnostic_form',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_email ON diagnostic_leads(email);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_status ON diagnostic_leads(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_created_at ON diagnostic_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_company ON diagnostic_leads(company_name);

-- Habilitar RLS (Row Level Security)
ALTER TABLE diagnostic_leads ENABLE ROW LEVEL SECURITY;

-- Política para operações administrativas (apenas service_role)
CREATE POLICY "Allow service role full access on diagnostic_leads" ON diagnostic_leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para inserção pública (permitir que o formulário salve leads)
CREATE POLICY "Allow public insert on diagnostic_leads" ON diagnostic_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_diagnostic_leads_updated_at
    BEFORE UPDATE ON diagnostic_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();