# RG Pulse Blog Backend - Documentação da API

## Visão Geral
Backend completo para gerenciamento de blog com geração automática de conteúdo usando IA.

## Estrutura do Banco de Dados

### Tabelas
- **BlogPosts**: Armazena os posts do blog
- **BlogThemes**: Temas para geração de posts
- **SystemSettings**: Configurações do sistema

## Endpoints Implementados

### 🔓 Endpoints Públicos (Blog)

#### GET /api/v1/blog/posts
- **Descrição**: Lista posts com paginação
- **Parâmetros**: `page` (default: 1), `limit` (default: 10, max: 100)
- **Resposta**: Lista de posts com metadados de paginação

#### GET /api/v1/blog/posts/:slug
- **Descrição**: Obtém post específico pelo slug
- **Parâmetros**: `slug` (string)
- **Resposta**: Dados completos do post

### 🔒 Endpoints Administrativos

#### Autenticação
- **POST /api/v1/admin/login**: Login administrativo
- **GET /api/v1/admin/verify-token**: Verificação de token

#### Gerenciamento de Posts
- **GET /api/v1/admin/posts**: Lista posts (admin)
- **POST /api/v1/admin/generate-post**: Gera novo post
- **DELETE /api/v1/admin/posts/:id**: Exclui post

#### Gerenciamento de Temas
- **GET /api/v1/admin/themes**: Lista temas
- **POST /api/v1/admin/themes**: Cria novo tema
- **PUT /api/v1/admin/themes/:id**: Atualiza tema
- **DELETE /api/v1/admin/themes/:id**: Exclui tema

#### Sistema e Configurações
- **GET /api/v1/admin/status**: Status do sistema
- **GET /api/v1/admin/system-stats**: Estatísticas do sistema
- **GET /api/v1/admin/stats**: Estatísticas gerais
- **GET /api/v1/admin/settings**: Configurações do sistema
- **PUT /api/v1/admin/settings**: Atualiza configurações

#### Geração Automática
- **POST /api/v1/admin/auto-generation/enable**: Ativa geração automática
- **POST /api/v1/admin/auto-generation/disable**: Desativa geração automática

## Funcionalidades Implementadas

### ✅ Concluídas
1. **Sistema de Autenticação Admin**
   - Login com JWT
   - Middleware de autenticação
   - Verificação de token

2. **Gerenciamento de Posts**
   - CRUD completo de posts
   - Geração automática via IA
   - Geração manual com temas
   - Paginação e busca

3. **Sistema de Temas**
   - CRUD de temas
   - Temas predefinidos
   - Prompts personalizados
   - Ativação/desativação

4. **Geração Automática**
   - Agendamento via cron
   - 3 posts por dia (8h, 14h, 20h)
   - Configuração via variáveis de ambiente

5. **Configurações do Sistema**
   - Configurações persistentes no banco
   - Controle de geração automática
   - Timezone configurável

6. **API Pública do Blog**
   - Listagem de posts
   - Visualização individual
   - Paginação

### 🔧 Funcionalidades Adicionais Sugeridas

#### 1. Sistema de Categorias
```sql
CREATE TABLE BlogCategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relacionamento posts-categorias
CREATE TABLE PostCategories (
  post_id INTEGER,
  category_id INTEGER,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES BlogPosts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES BlogCategories(id) ON DELETE CASCADE
);
```

#### 2. Sistema de Comentários
```sql
CREATE TABLE BlogComments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES BlogPosts(id) ON DELETE CASCADE
);
```

#### 3. Analytics e Métricas
```sql
CREATE TABLE PostViews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES BlogPosts(id) ON DELETE CASCADE
);
```

#### 4. Sistema de SEO
- Meta descriptions automáticas
- Open Graph tags
- Sitemap XML automático
- Schema.org markup

#### 5. Sistema de Cache
- Cache Redis para posts populares
- Cache de estatísticas
- Invalidação automática

#### 6. Sistema de Backup
- Backup automático do banco
- Export/import de posts
- Versionamento de conteúdo

#### 7. Webhooks e Integrações
- Webhook para novos posts
- Integração com redes sociais
- Newsletter automática

#### 8. Sistema de Usuários
- Múltiplos administradores
- Níveis de permissão
- Auditoria de ações

## Variáveis de Ambiente

```env
# Servidor
PORT=3000
FRONTEND_URL=http://localhost:3001

# Banco de Dados
DB_PATH=./blog_database.db

# Autenticação
JWT_SECRET=your-secret-key
# Admin users são gerenciados via Supabase Auth
# Não há mais variáveis de ambiente para credenciais hardcoded

# IA Agent
AGENT_API_KEY=your-agent-api-key
AGENT_BASE_URL=https://api.agent.com
BLOG_AGENT_ID=your-blog-agent-id

# Agendamento
BLOG_POST_CRON_EXPRESSION=0 8,14,20 * * *
TZ=America/Sao_Paulo
```

## Scripts Disponíveis

- `npm start`: Inicia o servidor
- `npm run dev`: Inicia com nodemon
- `npm run init-db`: Inicializa o banco de dados

## Status Atual

✅ **Sistema Funcional**: O backend está completamente operacional com todas as funcionalidades básicas implementadas.

🔧 **Próximos Passos**: Implementar funcionalidades avançadas conforme necessidade do projeto.