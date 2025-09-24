-- Criação das tabelas para o sistema de SEO

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

-- Índices para melhor performance
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

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_post_seo_updated_at BEFORE UPDATE ON post_seo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_global_settings_updated_at BEFORE UPDATE ON seo_global_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_keywords_updated_at BEFORE UPDATE ON seo_keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações globais padrão
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

-- Comentários nas tabelas
COMMENT ON TABLE post_seo IS 'Configurações de SEO específicas para cada post';
COMMENT ON TABLE seo_global_settings IS 'Configurações globais de SEO do site';
COMMENT ON TABLE seo_analysis_history IS 'Histórico de análises de SEO realizadas';
COMMENT ON TABLE seo_keywords IS 'Banco de palavras-chave com métricas';
COMMENT ON TABLE post_keywords IS 'Relacionamento entre posts e palavras-chave';
COMMENT ON TABLE seo_rankings IS 'Monitoramento de posições nos resultados de busca';
COMMENT ON TABLE seo_reports IS 'Relatórios de SEO gerados pelo sistema';