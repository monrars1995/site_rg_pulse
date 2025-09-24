-- =====================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA POSTS
-- =====================================================
-- Este script adiciona as colunas que estão sendo referenciadas no código mas não existem no schema

-- Adicionar coluna estimated_read_time (tempo estimado de leitura em minutos)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS estimated_read_time INTEGER DEFAULT 5;

-- Adicionar coluna published_at (data de publicação específica)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Adicionar coluna meta_title (título para SEO)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);

-- Adicionar coluna meta_description (descrição para SEO)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Adicionar coluna view_count (contador de visualizações)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Adicionar coluna theme (tema usado para gerar o post)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS theme VARCHAR(255);

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_posts_estimated_read_time ON posts(estimated_read_time);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count);
CREATE INDEX IF NOT EXISTS idx_posts_theme ON posts(theme);

-- Comentários para documentação
COMMENT ON COLUMN posts.estimated_read_time IS 'Tempo estimado de leitura em minutos';
COMMENT ON COLUMN posts.published_at IS 'Data e hora específica de publicação';
COMMENT ON COLUMN posts.meta_title IS 'Título otimizado para SEO';
COMMENT ON COLUMN posts.meta_description IS 'Descrição otimizada para SEO';
COMMENT ON COLUMN posts.view_count IS 'Contador de visualizações do post';
COMMENT ON COLUMN posts.theme IS 'Tema usado para gerar o post automaticamente';