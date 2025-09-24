-- =====================================================
-- SCHEMA COMPLETO PARA RG PULSE - SUPABASE
-- =====================================================
-- Este arquivo contém todas as tabelas necessárias para o projeto RG Pulse
-- Execute este script no Supabase SQL Editor para criar toda a estrutura

-- =====================================================
-- 1. TABELA DE POSTS DO BLOG
-- =====================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT DEFAULT 'Admin',
  tags TEXT[] DEFAULT '{}',
  featured_image TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance da tabela posts
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

-- =====================================================
-- 2. TABELA DE USUÁRIOS ADMINISTRATIVOS
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para tabela admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- =====================================================
-- 3. TABELA DE LEADS DO DIAGNÓSTICO
-- =====================================================
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

-- Índices para tabela diagnostic_leads
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_email ON diagnostic_leads(email);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_status ON diagnostic_leads(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_created_at ON diagnostic_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_company ON diagnostic_leads(company_name);

-- =====================================================
-- 4. TABELA DE AGENTES A2A
-- =====================================================
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

-- Índices para tabela a2a_agents
CREATE INDEX IF NOT EXISTS idx_a2a_agents_agent_id ON a2a_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_status ON a2a_agents(status);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_created_at ON a2a_agents(created_at);

-- =====================================================
-- 5. TABELAS DE SEO
-- =====================================================

-- Tabela para configurações de SEO por post
CREATE TABLE IF NOT EXISTS post_seo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    focus_keyword VARCHAR(100),
    keywords TEXT[], -- Array de palavras-chave
    seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
    canonical_url TEXT,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image TEXT,
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image TEXT,
    schema_markup JSONB,
    robots_meta VARCHAR(100) DEFAULT 'index,follow',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id)
);

-- Tabela para configurações globais de SEO
CREATE TABLE IF NOT EXISTS seo_global_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_title VARCHAR(255),
    site_description TEXT,
    default_og_image TEXT,
    default_twitter_image TEXT,
    google_analytics_id VARCHAR(50),
    google_search_console_id VARCHAR(50),
    facebook_app_id VARCHAR(50),
    twitter_username VARCHAR(50),
    schema_organization JSONB,
    robots_txt TEXT,
    sitemap_enabled BOOLEAN DEFAULT true,
    auto_generate_meta BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para histórico de análises de SEO
CREATE TABLE IF NOT EXISTS seo_analysis_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- 'manual', 'auto', 'bulk'
    seo_score INTEGER NOT NULL CHECK (seo_score >= 0 AND seo_score <= 100),
    analysis_data JSONB, -- Dados detalhados da análise
    recommendations TEXT[],
    issues_found TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para palavras-chave e seu desempenho
CREATE TABLE IF NOT EXISTS seo_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    search_volume INTEGER DEFAULT 0,
    difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 100),
    cpc DECIMAL(10,2) DEFAULT 0,
    trend_data JSONB,
    category VARCHAR(100),
    language VARCHAR(10) DEFAULT 'pt-BR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(keyword, language)
);

-- Tabela para relacionar posts com palavras-chave
CREATE TABLE IF NOT EXISTS post_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
    is_focus_keyword BOOLEAN DEFAULT false,
    density DECIMAL(5,2) DEFAULT 0, -- Densidade da palavra-chave no post
    position INTEGER, -- Posição nos resultados de busca
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, keyword_id)
);

-- Tabela para monitoramento de rankings
CREATE TABLE IF NOT EXISTS seo_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
    search_engine VARCHAR(50) DEFAULT 'google',
    position INTEGER,
    url TEXT,
    location VARCHAR(100) DEFAULT 'Brazil',
    device VARCHAR(20) DEFAULT 'desktop', -- 'desktop', 'mobile'
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para relatórios de SEO
CREATE TABLE IF NOT EXISTS seo_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary_data JSONB NOT NULL,
    recommendations TEXT[],
    generated_by UUID, -- ID do usuário que gerou
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TABELAS DE ANALYTICS
-- =====================================================

-- Tabela para analytics de posts
CREATE TABLE IF NOT EXISTS post_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    avg_time_on_page INTEGER DEFAULT 0, -- em segundos
    social_shares INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, date)
);

-- Tabela para métricas do sistema
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'counter', 'gauge', 'histogram'
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. TABELAS DE AGENDAMENTO
-- =====================================================

-- Tabela para posts agendados
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author TEXT DEFAULT 'Admin',
    tags TEXT[] DEFAULT '{}',
    featured_image TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
    created_by UUID, -- Referência ao usuário que criou
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para tabela scheduled_posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- =====================================================
-- 8. TABELAS DE AUDITORIA
-- =====================================================

-- Tabela para logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- ID do usuário que executou a ação
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
    resource VARCHAR(100) NOT NULL, -- 'post', 'user', 'settings', etc.
    resource_id TEXT, -- ID do recurso afetado
    old_values JSONB, -- Valores anteriores (para updates/deletes)
    new_values JSONB, -- Novos valores (para creates/updates)
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tabela audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- 9. ÍNDICES ADICIONAIS PARA SEO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_post_seo_post_id ON post_seo(post_id);
CREATE INDEX IF NOT EXISTS idx_post_seo_score ON post_seo(seo_score);
CREATE INDEX IF NOT EXISTS idx_seo_analysis_post_id ON seo_analysis_history(post_id);
CREATE INDEX IF NOT EXISTS idx_seo_analysis_created_at ON seo_analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON seo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_post_keywords_post_id ON post_keywords(post_id);
CREATE INDEX IF NOT EXISTS idx_post_keywords_keyword_id ON post_keywords(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_rankings_post_id ON seo_rankings(post_id);
CREATE INDEX IF NOT EXISTS idx_seo_rankings_checked_at ON seo_rankings(checked_at);
CREATE INDEX IF NOT EXISTS idx_seo_reports_created_at ON seo_reports(created_at);

-- =====================================================
-- 10. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnostic_leads_updated_at BEFORE UPDATE ON diagnostic_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_a2a_agents_updated_at BEFORE UPDATE ON a2a_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_seo_updated_at BEFORE UPDATE ON post_seo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_global_settings_updated_at BEFORE UPDATE ON seo_global_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_keywords_updated_at BEFORE UPDATE ON seo_keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. CONFIGURAÇÃO DE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. POLÍTICAS RLS BÁSICAS
-- =====================================================

-- Políticas para tabela posts
CREATE POLICY "Allow public read access to published posts" ON posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Allow service role full access on posts" ON posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para tabela admin_users
CREATE POLICY "Allow service role full access on admin_users" ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para tabela diagnostic_leads
CREATE POLICY "Allow service role full access on diagnostic_leads" ON diagnostic_leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert on diagnostic_leads" ON diagnostic_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Políticas para tabela a2a_agents
CREATE POLICY "Allow service role full access on a2a_agents" ON a2a_agents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para tabelas de SEO (apenas service_role)
CREATE POLICY "Allow service role full access on post_seo" ON post_seo
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on seo_global_settings" ON seo_global_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on seo_analysis_history" ON seo_analysis_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on seo_keywords" ON seo_keywords
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on post_keywords" ON post_keywords
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on seo_rankings" ON seo_rankings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on seo_reports" ON seo_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para tabelas de analytics (apenas service_role)
CREATE POLICY "Allow service role full access on post_analytics" ON post_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on system_metrics" ON system_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para tabelas de agendamento (apenas service_role)
CREATE POLICY "Allow service role full access on scheduled_posts" ON scheduled_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para tabela de auditoria (apenas service_role)
CREATE POLICY "Allow service role full access on audit_logs" ON audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 13. DADOS INICIAIS
-- =====================================================

-- Inserir configurações globais de SEO padrão
INSERT INTO seo_global_settings (
    site_title,
    site_description,
    robots_txt,
    sitemap_enabled,
    auto_generate_meta
) VALUES (
    'RG Pulse - Soluções em IA e Automação',
    'Transformamos negócios através de soluções inteligentes em IA, automação e tecnologia. Descubra como podemos impulsionar sua empresa.',
    'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://rgpulse.com.br/sitemap.xml',
    true,
    true
) ON CONFLICT DO NOTHING;

-- Inserir algumas palavras-chave padrão
INSERT INTO seo_keywords (keyword, category, search_volume, difficulty) VALUES
    ('inteligência artificial', 'tecnologia', 5000, 75),
    ('automação de processos', 'tecnologia', 3000, 65),
    ('chatbot', 'tecnologia', 8000, 60),
    ('machine learning', 'tecnologia', 4000, 80),
    ('transformação digital', 'negócios', 6000, 70),
    ('RPA', 'tecnologia', 2000, 55),
    ('análise de dados', 'tecnologia', 4500, 65),
    ('business intelligence', 'negócios', 3500, 70)
ON CONFLICT (keyword, language) DO NOTHING;

-- =====================================================
-- 14. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE posts IS 'Tabela principal para posts do blog';
COMMENT ON TABLE admin_users IS 'Usuários administrativos do sistema';
COMMENT ON TABLE diagnostic_leads IS 'Leads capturados através do formulário de diagnóstico';
COMMENT ON TABLE a2a_agents IS 'Agentes A2A (Agent-to-Agent) para comunicação entre sistemas';
COMMENT ON TABLE post_seo IS 'Configurações de SEO específicas para cada post';
COMMENT ON TABLE seo_global_settings IS 'Configurações globais de SEO do site';
COMMENT ON TABLE seo_analysis_history IS 'Histórico de análises de SEO realizadas';
COMMENT ON TABLE seo_keywords IS 'Banco de palavras-chave com métricas';
COMMENT ON TABLE post_keywords IS 'Relacionamento entre posts e palavras-chave';
COMMENT ON TABLE seo_rankings IS 'Monitoramento de posições nos resultados de busca';
COMMENT ON TABLE seo_reports IS 'Relatórios de SEO gerados pelo sistema';
COMMENT ON TABLE post_analytics IS 'Analytics e métricas de performance dos posts';
COMMENT ON TABLE system_metrics IS 'Métricas gerais do sistema';
COMMENT ON TABLE scheduled_posts IS 'Posts agendados para publicação futura';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para rastreamento de ações';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
-- Execute este script completo no Supabase SQL Editor
-- Todas as tabelas, índices, triggers e políticas RLS serão criadas