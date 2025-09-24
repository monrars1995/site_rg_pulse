# 🚀 Deploy Guide - RG Pulse

Guia completo para deploy da aplicação RG Pulse no Coolify usando GitHub.

## 📋 Visão Geral

O RG Pulse é uma aplicação full-stack que combina:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Supabase
- **Deploy**: Docker multi-stage build no Coolify

## 🛠️ Pré-requisitos

### 1. Serviços Externos
- ✅ **Supabase**: Projeto configurado com tabelas necessárias
- ✅ **Google AI Studio**: Chave API do Gemini
- ✅ **A2A Agent**: Chave API e configuração
- ✅ **GitHub**: Repositório do projeto
- ✅ **Coolify**: Instância configurada

### 2. Arquivos de Configuração
- ✅ `Dockerfile` - Build multi-stage
- ✅ `docker-compose.yml` - Configuração local
- ✅ `.dockerignore` - Otimização do build
- ✅ `.env.example` - Template de variáveis
- ✅ `.gitignore` - Arquivos ignorados

## 🔧 Preparação Local

### 1. Verificar Estrutura
```bash
# Verificar se todos os arquivos estão presentes
ls -la Dockerfile docker-compose.yml .dockerignore .env.example
```

### 2. Testar Build Local (Opcional)
```bash
# Testar build do Docker
docker build -t rg-pulse-test .

# Testar execução
docker run -p 3001:3001 --env-file .env rg-pulse-test

# Limpar
docker rmi rg-pulse-test
```

### 3. Preparar Repositório
```bash
# Verificar status
git status

# Adicionar arquivos de configuração
git add Dockerfile docker-compose.yml .dockerignore .env.example DEPLOY.md

# Commit
git commit -m "feat: add Docker configuration for Coolify deployment"

# Push para GitHub
git push origin main
```

## 🌐 Configuração no Coolify

### 1. Criar Nova Aplicação

1. **Acesse Coolify** → "New Resource" → "Application"
2. **Selecione**: "Public Repository" ou "Private Repository"
3. **Configure**:
   - Repository URL: `https://github.com/seu-usuario/site_rg_pulse`
   - Branch: `main`
   - Build Pack: `Docker`
   - Dockerfile Location: `./Dockerfile`
   - Port: `3001`

### 2. Configurar Variáveis de Ambiente

#### 🗄️ Banco de Dados
```env
DATABASE_TYPE=supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

#### 🔑 APIs Externas
```env
GEMINI_API_KEY=sua_chave_gemini_aqui
A2A_AGENT_API_KEY=sua_chave_a2a_aqui
A2A_AGENT_BASE_URL=https://connectai.mysaas360.com/api/v1/a2a
BLOG_AGENT_ID=blog-writer
```

#### 🔒 Segurança
```env
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
```

#### 🌍 Configuração do Servidor
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://seu-dominio.com
```

#### ⚛️ Frontend (Build Time)
```env
VITE_BACKEND_CHAT_API_URL=https://seu-dominio.com/api/v1/chat
VITE_BACKEND_BASE_API_URL=https://seu-dominio.com
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 3. Configurar Domínio e SSL

1. **Domains** → "Add Domain"
2. **Digite seu domínio**: `seu-dominio.com`
3. **SSL**: Automático (Let's Encrypt)
4. **Port**: `3001`

### 4. Configurar Health Check

- **Health Check URL**: `/health`
- **Health Check Port**: `3001`
- **Interval**: `30s`
- **Timeout**: `10s`
- **Retries**: `3`

## 🚀 Processo de Deploy

### Build Multi-Stage

```dockerfile
# Stage 1: Builder
- Instala dependências (frontend + backend)
- Constrói aplicação React
- Otimiza assets

# Stage 2: Production
- Copia apenas arquivos necessários
- Instala dependências de produção
- Configura usuário não-root
- Expõe porta 3001
```

### Fluxo Automático

1. **Push → GitHub** 📤
2. **Webhook → Coolify** 🔗
3. **Docker Build** 🐳
4. **Deploy** 🚀
5. **Health Check** ✅

## ✅ Verificação Pós-Deploy

### 1. Health Check
```bash
curl https://seu-dominio.com/health
```

**Resposta esperada**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "uptime": 123.45
}
```

### 2. Frontend
- ✅ Página inicial carrega
- ✅ Navegação funciona
- ✅ Componentes renderizam

### 3. API Backend
```bash
# Testar endpoint público
curl https://seu-dominio.com/api/v1/agents

# Testar chat (requer autenticação)
curl -X POST https://seu-dominio.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "teste"}'
```

### 4. Admin Panel
- ✅ Acesso: `https://seu-dominio.com/admin`
- ✅ Login funciona
- ✅ Dashboard carrega

## 🔧 Troubleshooting

### Problemas Comuns

#### ❌ Build Falha
```bash
# Verificar logs no Coolify
# Possíveis causas:
- Variáveis de ambiente faltando
- Chaves de API inválidas
- Erro de sintaxe no código
```

#### ❌ Aplicação Não Inicia
```bash
# Verificar:
- SUPABASE_URL correto
- Chaves de API válidas
- PORT=3001 definido
- NODE_ENV=production
```

#### ❌ Frontend Não Carrega
```bash
# Verificar:
- Build do React bem-sucedido
- Arquivos estáticos servidos
- VITE_* variáveis corretas
```

#### ❌ CORS Errors
```bash
# Verificar:
- FRONTEND_URL correto
- Domínio configurado
- Protocolo HTTPS
```

### Logs e Monitoramento

1. **Coolify Logs**: Painel → Aplicação → "Logs"
2. **Real-time**: Monitoramento em tempo real
3. **Health Checks**: Status automático

## 🔄 Atualizações

### Deploy Automático
```bash
# 1. Fazer alterações no código
# 2. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 3. Coolify detecta automaticamente
# 4. Build e deploy automáticos
```

### Deploy Manual
1. Coolify → Aplicação → "Deploy"
2. Selecionar branch/commit
3. Iniciar build manual

## 📊 Monitoramento

### Métricas Disponíveis
- ✅ **Uptime**: Health checks automáticos
- ✅ **Logs**: Aplicação e sistema
- ✅ **Performance**: CPU, memória, rede
- ✅ **SSL**: Renovação automática

### Alertas
- 🚨 **Down**: Aplicação offline
- 🚨 **Build Failed**: Erro no deploy
- 🚨 **SSL Expiring**: Certificado expirando

## 🔐 Segurança

### Implementado
- ✅ **Container não-root**: Usuário `nodejs`
- ✅ **Variáveis seguras**: Environment variables
- ✅ **SSL/TLS**: HTTPS automático
- ✅ **CORS**: Configurado adequadamente
- ✅ **JWT**: Autenticação admin

### Recomendações
- 🔒 **Chaves únicas**: JWT_SECRET exclusivo
- 🔒 **Rotação**: Renovar chaves periodicamente
- 🔒 **Backup**: Supabase automático
- 🔒 **Monitoramento**: Logs de segurança

## 📞 Suporte

### Recursos
- 📖 **Documentação**: Este arquivo
- 📖 **Coolify Docs**: [docs.coolify.io](https://docs.coolify.io)
- 📖 **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

### Contato
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussões**: GitHub Discussions
- 📧 **Email**: [seu-email@exemplo.com]

---

**🎉 Parabéns! Sua aplicação RG Pulse está pronta para produção!**