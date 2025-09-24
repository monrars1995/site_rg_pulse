# Configuração da Tabela A2A Agents no Supabase

Este documento descreve como configurar a tabela `a2a_agents` no Supabase para gerenciar agentes A2A (Agent-to-Agent) através da interface administrativa.

## Pré-requisitos

- Projeto Supabase configurado
- Variáveis de ambiente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` configuradas
- Acesso ao SQL Editor do Supabase

## Passos para Configuração

### 1. Executar o Script SQL

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Copie e cole o conteúdo do arquivo `supabase_a2a_agents_setup.sql`
5. Execute o script clicando em **Run**

### 2. Verificar a Criação da Tabela

Após executar o script, verifique se a tabela foi criada corretamente:

```sql
SELECT * FROM a2a_agents;
```

### 3. Inserir Agente Padrão (Opcional)

Se você quiser migrar o agente atual das variáveis de ambiente para o banco de dados:

```sql
INSERT INTO a2a_agents (name, agent_id, endpoint, api_key, status, description)
VALUES (
  'Agent Principal',
  'SEU_AGENT_ID_AQUI',
  'SEU_ENDPOINT_AQUI',
  'SUA_API_KEY_AQUI',
  'active',
  'Agente principal migrado das variáveis de ambiente'
);
```

**Substitua os valores pelos dados reais do seu arquivo `.env`:**
- `SEU_AGENT_ID_AQUI` → valor de `A2A_AGENT_ID`
- `SEU_ENDPOINT_AQUI` → valor de `A2A_AGENT_BASE_URL`
- `SUA_API_KEY_AQUI` → valor de `A2A_AGENT_API_KEY`

## Estrutura da Tabela

| Campo | Tipo | Descrição |
|-------|------|----------|
| `id` | UUID | Identificador único (gerado automaticamente) |
| `name` | VARCHAR(255) | Nome amigável do agente |
| `agent_id` | VARCHAR(255) | ID único do agente (deve ser único) |
| `endpoint` | TEXT | URL do endpoint do agente |
| `api_key` | VARCHAR(255) | Chave de API para autenticação |
| `status` | VARCHAR(50) | Status: 'active', 'inactive', 'maintenance' |
| `description` | TEXT | Descrição opcional |
| `usage_count` | INTEGER | Contador de uso (padrão: 0) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data da última atualização |

## Funcionalidades Implementadas

### Endpoints da API

- **GET** `/api/v1/admin/agents` - Lista todos os agentes
- **POST** `/api/v1/admin/agents` - Cria um novo agente
- **PUT** `/api/v1/admin/agents/:id` - Atualiza um agente
- **DELETE** `/api/v1/admin/agents/:id` - Remove um agente

### Fallback para Dados Mock

Se a tabela não existir ou houver erro na consulta, a API retornará dados mock baseados nas variáveis de ambiente atuais, garantindo que a interface continue funcionando.

### Segurança

- Todos os endpoints requerem autenticação de administrador
- Row Level Security (RLS) habilitado na tabela
- Logs de auditoria para todas as operações

## Interface Administrativa

A nova aba "Agents A2A" no painel administrativo permite:

- ✅ Visualizar lista de agentes
- ✅ Adicionar novos agentes
- ✅ Editar agentes existentes
- ✅ Remover agentes
- ✅ Copiar informações para área de transferência
- ✅ Notificações toast para feedback
- ✅ Validação de formulários

## Migração das Variáveis de Ambiente

Após configurar a tabela e inserir os dados, você pode:

1. Manter as variáveis de ambiente como fallback
2. Ou remover as variáveis `A2A_AGENT_*` do `.env` após confirmar que tudo funciona

## Troubleshooting

### Erro 404 ao buscar agentes

- Verifique se a tabela `a2a_agents` foi criada
- Confirme as variáveis de ambiente do Supabase
- Verifique os logs do servidor para mais detalhes

### Erro de permissão

- Verifique se está usando `SUPABASE_SERVICE_ROLE_KEY` (não a chave anônima)
- Confirme as políticas RLS da tabela

### Dados não aparecem

- Execute uma consulta manual no SQL Editor para verificar os dados
- Verifique se o endpoint está sendo chamado corretamente
- Confirme a autenticação de administrador