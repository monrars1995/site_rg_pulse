# Configuração do Supabase para RG Pulse

Este guia explica como configurar o Supabase para substituir o SQLite no projeto RG Pulse.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha uma organização
5. Preencha:
   - **Name**: `rg-pulse-blog`
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima (ex: South America)
6. Clique em "Create new project"

## 2. Obter Credenciais

Após criar o projeto:

1. Vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL**: `https://buqypvoonsclneqinmvh.supabase.co`
   - **anon public key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cXlwdm9vbnNjbG5lcWlubXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjQzNjAsImV4cCI6MjA2NDI0MDM2MH0.ZUC9IQ4ZzGDzRCmm0Z1D7s5_qONd2D-m3yB21J3r7t4
   - **service_role secret key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cXlwdm9vbnNjbG5lcWlubXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY2NDM2MCwiZXhwIjoyMDY0MjQwMzYwfQ.5d1PvqmlN7fnLRmOA64FEaHXOIii9V00f6pX1YF5aGU
## 3. Configurar Variáveis de Ambiente

Edite o arquivo `server/.env`:

```env
# Database Configuration
DATABASE_TYPE=supabase

# Supabase Configuration
SUPABASE_URL=https://[seu-project-ref].supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

## 4. Criar Tabela de Posts

No Supabase Dashboard:

1. Vá para **Table Editor**
2. Clique em **New Table**
3. Nome: `posts`
4. Adicione as seguintes colunas:

```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT DEFAULT 'Admin',
  tags TEXT[] DEFAULT '{}',
  featured_image TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

## 5. Configurar RLS (Row Level Security)

Para segurança, configure as políticas RLS:

```sql
-- Habilitar RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Allow public read access" ON posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Política para operações administrativas (apenas service_role)
CREATE POLICY "Allow service role full access" ON posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## 6. Testar Conexão

Após configurar, reinicie o servidor:

```bash
cd server
npm start
```

Verifique os logs para confirmar que a conexão com Supabase foi estabelecida.

## 7. Migração de Dados (Opcional)

Se você tem dados no SQLite que deseja migrar:

1. Exporte os dados do SQLite
2. Use o Supabase Dashboard ou SQL Editor para importar
3. Ou crie um script de migração personalizado

## Vantagens do Supabase

- **Escalabilidade**: Banco PostgreSQL gerenciado
- **Real-time**: Subscriptions em tempo real
- **Backup automático**: Dados seguros
- **Dashboard**: Interface visual para gerenciar dados
- **API REST automática**: Endpoints gerados automaticamente
- **Segurança**: RLS e autenticação integrada

## Troubleshooting

### Erro de Conexão
- Verifique se as credenciais estão corretas
- Confirme que `DATABASE_TYPE=supabase` no .env
- Verifique se o projeto Supabase está ativo

### Erro de Permissão
- Verifique as políticas RLS
- Confirme que está usando a service_role key para operações administrativas

### Performance
- Crie índices apropriados
- Use paginação para grandes datasets
- Considere usar views materializadas para consultas complexas