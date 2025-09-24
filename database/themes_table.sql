-- =====================================================
-- TABELA DE TEMAS PARA GERAÇÃO DE POSTS
-- =====================================================
-- Esta tabela armazena os temas/templates para geração automática de posts

CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  prompt TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  tone VARCHAR(100) DEFAULT 'professional',
  target_audience VARCHAR(255),
  content_examples TEXT[],
  guidelines TEXT,
  active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(active);
CREATE INDEX IF NOT EXISTS idx_themes_name ON themes(name);
CREATE INDEX IF NOT EXISTS idx_themes_created_at ON themes(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Política RLS para service_role
CREATE POLICY "Allow service role full access on themes" ON themes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Inserir alguns temas padrão
INSERT INTO themes (name, description, prompt, keywords, tone, target_audience, guidelines) VALUES
(
  'Inteligência Artificial',
  'Posts sobre IA, machine learning e automação',
  'Escreva um post informativo sobre inteligência artificial, focando em aplicações práticas para empresas. Use linguagem acessível mas técnica.',
  ARRAY['inteligência artificial', 'IA', 'machine learning', 'automação', 'tecnologia'],
  'professional',
  'Empresários e gestores de TI',
  'Mantenha o tom profissional, use exemplos práticos e evite jargões muito técnicos.'
),
(
  'Transformação Digital',
  'Posts sobre digitalização e modernização de processos',
  'Crie um artigo sobre transformação digital, abordando benefícios, desafios e estratégias para implementação em empresas.',
  ARRAY['transformação digital', 'digitalização', 'modernização', 'processos', 'inovação'],
  'consultative',
  'CEOs e diretores de empresas',
  'Foque em ROI, casos de sucesso e passos práticos para implementação.'
),
(
  'Chatbots e Atendimento',
  'Posts sobre chatbots, atendimento automatizado e experiência do cliente',
  'Desenvolva um post sobre como chatbots podem melhorar o atendimento ao cliente, incluindo benefícios e melhores práticas.',
  ARRAY['chatbot', 'atendimento', 'customer service', 'automação', 'experiência do cliente'],
  'friendly',
  'Gestores de atendimento e marketing',
  'Use exemplos de interações reais e destaque melhorias na experiência do cliente.'
),
(
  'Análise de Dados',
  'Posts sobre business intelligence, analytics e tomada de decisão baseada em dados',
  'Escreva sobre a importância da análise de dados para tomada de decisões empresariais, incluindo ferramentas e metodologias.',
  ARRAY['análise de dados', 'business intelligence', 'analytics', 'dados', 'decisões'],
  'analytical',
  'Analistas e gestores de negócios',
  'Inclua gráficos conceituais, métricas importantes e exemplos de insights acionáveis.'
),
(
  'Automação de Processos',
  'Posts sobre RPA, automação de workflows e otimização de processos',
  'Crie um artigo sobre automação de processos empresariais, mostrando como RPA pode aumentar eficiência e reduzir custos.',
  ARRAY['automação', 'RPA', 'processos', 'eficiência', 'otimização'],
  'technical',
  'Gestores de operações e TI',
  'Foque em casos de uso específicos, ROI e implementação prática.'
)
ON CONFLICT (name) DO NOTHING;

-- Comentário para documentação
COMMENT ON TABLE themes IS 'Temas/templates para geração automática de posts do blog';