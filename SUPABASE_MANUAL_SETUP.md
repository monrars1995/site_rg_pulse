# 🚀 Configuração Manual do Schema no Supabase

Como o Supabase não permite execução de SQL via API para criação de tabelas, você precisa executar o schema manualmente no SQL Editor do Supabase.

## 📋 Passos para Configuração

### 1. Acesse o Supabase Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto: **yheraepvupdsimzjfbva**

### 2. Abra o SQL Editor
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** para criar uma nova consulta

### 3. Execute o Schema Completo
Copie e cole o conteúdo do arquivo `database/complete_schema.sql` no SQL Editor e execute.

**OU** execute os comandos abaixo em sequência:

## 🗃️ Tabelas Principais

### Tabela de Posts
```sql
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

-- Índices para posts
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
```

### Tabela de Usuários Administrativos
```sql
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

-- Índices para admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
```

### Tabela de Leads do Diagnóstico
```sql
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

-- Índices para diagnostic_leads
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_email ON diagnostic_leads(email);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_status ON diagnostic_leads(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_created_at ON diagnostic_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_diagnostic_leads_company ON diagnostic_leads(company_name);
```

### Tabela de Agentes A2A
```sql
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

-- Índices para a2a_agents
CREATE INDEX IF NOT EXISTS idx_a2a_agents_agent_id ON a2a_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_status ON a2a_agents(status);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_created_at ON a2a_agents(created_at);
```

## 🔧 Tabelas de SEO

### Configurações de SEO por Post
```sql
CREATE TABLE IF NOT EXISTS post_seo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    focus_keyword VARCHAR(100),
    keywords TEXT[],
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
```

### Configurações Globais de SEO
```sql
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
```

### Palavras-chave e Performance
```sql
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

CREATE TABLE IF NOT EXISTS post_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
    is_focus_keyword BOOLEAN DEFAULT false,
    density DECIMAL(5,2) DEFAULT 0,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, keyword_id)
);
```

## 📊 Tabelas de Analytics e Agendamento

### Posts Agendados
```sql
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
    created_by UUID,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
```

### Logs de Auditoria
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
```

## ⚙️ Funções e Triggers

### Função para Updated At
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Triggers
```sql
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
```

## 🔒 Row Level Security (RLS)

### Habilitar RLS
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### Políticas Básicas
```sql
-- Posts: leitura pública para posts publicados
CREATE POLICY "Allow public read access to published posts" ON posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Service role: acesso total a todas as tabelas
CREATE POLICY "Allow service role full access on posts" ON posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on admin_users" ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on diagnostic_leads" ON diagnostic_leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Leads: permitir inserção pública (formulário)
CREATE POLICY "Allow public insert on diagnostic_leads" ON diagnostic_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on a2a_agents" ON a2a_agents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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

CREATE POLICY "Allow service role full access on scheduled_posts" ON scheduled_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on audit_logs" ON audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## 📝 Dados Iniciais

### Configurações de SEO
```sql
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
```

### Palavras-chave Padrão
```sql
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
```

## ✅ Verificação

Após executar todos os comandos, verifique se as tabelas foram criadas:

1. Vá para **Table Editor** no Supabase Dashboard
2. Você deve ver todas as tabelas listadas:
   - `posts`
   - `admin_users`
   - `diagnostic_leads`
   - `a2a_agents`
   - `post_seo`
   - `seo_global_settings`
   - `seo_keywords`
   - `post_keywords`
   - `scheduled_posts`
   - `audit_logs`

## 🚨 Importante

- Execute os comandos **na ordem apresentada**
- Algumas tabelas dependem de outras (foreign keys)
- Se houver erro, verifique se as tabelas dependentes foram criadas primeiro
- As políticas RLS garantem que apenas o service_role tenha acesso total

## 🎯 Próximos Passos

Após criar as tabelas:
1. Teste a conexão do backend com o Supabase
2. Verifique se as operações CRUD funcionam
3. Teste o formulário de diagnóstico
4. Verifique o sistema de blog

---

**📞 Suporte**: Se encontrar problemas, verifique os logs do Supabase e as mensagens de erro no SQL Editor.