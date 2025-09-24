# Deploy no Coolify - RG Pulse

Este guia explica como fazer o deploy da aplicação RG Pulse no Coolify usando GitHub.

## Pré-requisitos

1. **Conta no GitHub** com o repositório do projeto
2. **Instância do Coolify** configurada
3. **Banco de dados Supabase** configurado
4. **Chaves de API** necessárias (Gemini, A2A Agent)

## Estrutura do Projeto

O projeto é uma aplicação full-stack com:
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express
- **Banco de dados**: Supabase (PostgreSQL)
- **Build**: Multi-stage Docker build

## Configuração no Coolify

### 1. Criar Nova Aplicação

1. Acesse seu painel do Coolify
2. Clique em "New Resource" → "Application"
3. Selecione "Public Repository" ou "Private Repository"
4. Configure:
   - **Repository URL**: `https://github.com/seu-usuario/site_rg_pulse`
   - **Branch**: `main` (ou sua branch principal)
   - **Build Pack**: `Docker`
   - **Dockerfile Location**: `./Dockerfile`

### 2. Configurar Variáveis de Ambiente

No painel do Coolify, adicione as seguintes variáveis de ambiente:

#### Configuração do Banco de Dados
```
DATABASE_TYPE=supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

#### Chaves de API
```
GEMINI_API_KEY=sua-chave-gemini
A2A_AGENT_API_KEY=sua-chave-a2a
A2A_AGENT_BASE_URL=https://connectai.mysaas360.com/api/v1/a2a
BLOG_AGENT_ID=blog-writer
```

#### Configuração de Segurança
```
JWT_SECRET=sua-chave-jwt-secreta
```

#### Configuração do Servidor
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://alpha2.rgpulse.com.br
```

#### Variáveis do Frontend (para build)
```
VITE_BACKEND_CHAT_API_URL=http://alpha2.rgpulse.com.br/api/v1/chat
VITE_BACKEND_BASE_API_URL=http://alpha2.rgpulse.com.br
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 3. Configurar Domínio

1. Na seção "Domains", adicione seu domínio
2. Configure SSL (automático no Coolify)
3. Defina a porta como `3001`

### 4. Configurar Health Check

- **Health Check URL**: `/health`
- **Health Check Port**: `3001`
- **Health Check Interval**: `30s`

## Processo de Deploy

### Build Multi-stage

O Dockerfile usa um build multi-stage:

1. **Stage 1 (Builder)**:
   - Instala dependências do frontend e backend
   - Constrói a aplicação React
   - Gera arquivos estáticos otimizados

2. **Stage 2 (Production)**:
   - Copia apenas os arquivos necessários
   - Instala apenas dependências de produção
   - Configura usuário não-root para segurança
   - Expõe porta 3001

### Fluxo de Deploy

1. **Push para GitHub**: Faça push das alterações para o repositório
2. **Webhook Automático**: Coolify detecta mudanças via webhook
3. **Build Docker**: Executa o build multi-stage
4. **Deploy**: Substitui a versão anterior
5. **Health Check**: Verifica se a aplicação está funcionando

## Verificação Pós-Deploy

### 1. Health Check
```bash
curl http://alpha2.rgpulse.com.br/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "uptime": 123.45
}
```

### 2. Verificar Frontend
- Acesse `http://alpha2.rgpulse.com.br`
- Verifique se a página carrega corretamente
- Teste navegação entre páginas

### 3. Verificar API
```bash
curl http://alpha2.rgpulse.com.br/api/v1/agents
```

### 4. Verificar Admin
- Acesse `http://alpha2.rgpulse.com.br/admin`
- Teste login administrativo

## Troubleshooting

### Problemas Comuns

1. **Build falha**:
   - Verifique se todas as variáveis de ambiente estão configuradas
   - Confirme se as chaves de API são válidas

2. **Aplicação não inicia**:
   - Verifique logs no Coolify
   - Confirme configuração do Supabase

3. **Frontend não carrega**:
   - Verifique se `NODE_ENV=production` está definido
   - Confirme se o build do React foi bem-sucedido

4. **CORS errors**:
   - Verifique se `FRONTEND_URL` está correto
   - Confirme configuração de domínio

### Logs

Para visualizar logs:
1. Acesse o painel do Coolify
2. Vá para sua aplicação
3. Clique em "Logs"
4. Monitore logs em tempo real

## Atualizações

Para atualizar a aplicação:
1. Faça push das alterações para o GitHub
2. Coolify detectará automaticamente via webhook
3. Novo build será iniciado automaticamente
4. Deploy será feito após build bem-sucedido

## Backup e Monitoramento

- **Banco de dados**: Backup automático no Supabase
- **Aplicação**: Versionamento via Git
- **Monitoramento**: Health checks automáticos do Coolify
- **Logs**: Disponíveis no painel do Coolify

## Configuração de Registry Interno

### Problema: Acesso Negado ao Docker Registry

Se você está enfrentando erros como:
```
failed to push image to registry: access denied
```

Isso indica que o Coolify não consegue fazer push da imagem Docker para o registry configurado. A solução é configurar um registry interno.

### Opção 1: Registry Interno do Coolify

#### 1. Habilitar Registry Interno

1. Acesse o painel administrativo do Coolify
2. Vá para **Settings** → **Configuration**
3. Na seção **Registry**, habilite:
   - **Enable Internal Registry**: `true`
   - **Registry URL**: `registry.coolify.local` (ou seu domínio interno)
   - **Registry Port**: `5000`

#### 2. Configurar na Aplicação

1. Vá para sua aplicação no Coolify
2. Em **Settings** → **Build**:
   - **Registry**: Selecione "Internal Registry"
   - **Image Name**: `rg-pulse`
   - **Tag**: `latest` (ou use tags baseadas em commit)

#### 3. Configurar Dockerfile (se necessário)

Se você quiser usar um registry específico, adicione no início do Dockerfile:
```dockerfile
# Use registry interno como base se necessário
# FROM registry.coolify.local:5000/node:18-alpine AS builder
FROM node:18-alpine AS builder
```

### Opção 2: Docker Hub Registry

#### 1. Criar Conta no Docker Hub

1. Acesse [Docker Hub](https://hub.docker.com)
2. Crie uma conta gratuita
3. Crie um repositório público: `seu-usuario/rg-pulse`

#### 2. Configurar Credenciais no Coolify

1. No Coolify, vá para **Settings** → **Registries**
2. Clique em **Add Registry**
3. Configure:
   - **Name**: `docker-hub`
   - **URL**: `https://index.docker.io/v1/`
   - **Username**: seu usuário do Docker Hub
   - **Password**: sua senha ou token de acesso
   - **Type**: `Docker Hub`

#### 3. Configurar na Aplicação

1. Na sua aplicação, vá para **Settings** → **Build**
2. Configure:
   - **Registry**: Selecione "docker-hub"
   - **Image Name**: `seu-usuario/rg-pulse`
   - **Tag**: `latest`

### Opção 3: Registry Local Personalizado

#### 1. Instalar Registry Docker

No servidor do Coolify:
```bash
# Criar diretório para dados do registry
sudo mkdir -p /opt/registry/data

# Executar registry Docker
docker run -d \
  --name registry \
  --restart=always \
  -p 5000:5000 \
  -v /opt/registry/data:/var/lib/registry \
  registry:2
```

#### 2. Configurar Registry no Coolify

1. Vá para **Settings** → **Registries**
2. Adicione novo registry:
   - **Name**: `local-registry`
   - **URL**: `http://localhost:5000`
   - **Type**: `Docker Registry`
   - **Username**: (deixe vazio para registry sem autenticação)
   - **Password**: (deixe vazio)

#### 3. Configurar Aplicação

1. Na aplicação, configure:
   - **Registry**: `local-registry`
   - **Image Name**: `rg-pulse`
   - **Tag**: `latest`

### Verificação da Configuração

#### 1. Testar Registry

Para verificar se o registry está funcionando:
```bash
# Testar conectividade
curl -X GET http://localhost:5000/v2/_catalog

# Deve retornar algo como:
# {"repositories":[]}
```

#### 2. Verificar Build

1. Faça um novo deploy
2. Monitore os logs de build
3. Procure por mensagens como:
   ```
   Successfully built image: registry.local:5000/rg-pulse:latest
   Successfully pushed image to registry
   ```

### Troubleshooting Registry

#### Problema: "Registry not reachable"

**Solução**:
1. Verifique se o registry está rodando:
   ```bash
   docker ps | grep registry
   ```
2. Teste conectividade:
   ```bash
   telnet localhost 5000
   ```

#### Problema: "Authentication failed"

**Solução**:
1. Verifique credenciais no Coolify
2. Para Docker Hub, use token de acesso em vez de senha
3. Para registry local, desabilite autenticação inicialmente

#### Problema: "Image push failed"

**Solução**:
1. Verifique espaço em disco no servidor
2. Verifique permissões do diretório do registry
3. Reinicie o serviço do registry:
   ```bash
   docker restart registry
   ```

### Recomendação

Para o projeto RG Pulse, recomendo:

1. **Desenvolvimento/Teste**: Use registry interno do Coolify
2. **Produção**: Use Docker Hub (gratuito para repositórios públicos)
3. **Empresarial**: Configure registry privado com autenticação

### Configuração Recomendada

```yaml
# Configuração sugerida para produção
Registry: Docker Hub
Image Name: rgpulse/site-rg-pulse
Tag Strategy: git-commit-sha
Auto Deploy: true
Registry Cleanup: enabled (manter últimas 10 imagens)
```

## Segurança

- Aplicação roda com usuário não-root
- Variáveis sensíveis via environment variables
- SSL automático via Coolify
- CORS configurado adequadamente
- JWT para autenticação admin
- Registry com autenticação adequada