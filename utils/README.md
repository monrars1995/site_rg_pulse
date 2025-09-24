# Utilitários de Processamento de Blog

Este diretório contém utilitários para processar e integrar conteúdo de blog ao sistema RG Pulse.

## Scripts Disponíveis

### `process-and-upload.cjs`

Script para processar arquivos JSON brutos gerados por agentes A2A e enviá-los para a API do blog.

#### Uso

```bash
# Processar arquivo padrão (raw-json-content.txt)
node utils/process-and-upload.cjs

# Processar arquivo específico
node utils/process-and-upload.cjs caminho/para/arquivo.txt
```

#### Funcionalidades

1. **Limpeza de JSON**: Remove escapes inválidos e caracteres problemáticos
2. **Extração de Campos**: Usa regex para extrair campos específicos do JSON malformado
3. **Reconstrução**: Reconstrói um objeto JSON válido
4. **Validação**: Verifica se o JSON final é válido
5. **Upload**: Envia o post processado para a API do blog
6. **Backup**: Salva uma cópia local do JSON processado

#### Variáveis de Ambiente

- `API_URL`: URL da API (padrão: http://localhost:3001)
- `ADMIN_API_KEY`: Chave de API para autenticação (se necessário)

#### Exemplo de Saída

```
🔍 Processando arquivo: raw-json-content.txt
🧹 Limpando e reconstruindo JSON...
✅ JSON reconstruído com sucesso!

📋 Informações do post:
Título: IA e Automação: A Dupla Dinâmica para o Crescimento
Resumo: A Inteligência Artificial (IA) e a Automação deixaram de ser promessas futuristas...
Tags: IA, Automação, Crescimento, Tecnologia
Slug sugerido: ia-automacao-dupla-dinamica-crescimento
Tempo estimado de leitura: 8 minutos
URL da imagem: https://example.com/image.jpg

📄 JSON processado salvo em: raw-json-content-processed.json

🚀 Enviando para a API...
✅ Post criado com sucesso!
ID: 123
Slug final: ia-automacao-dupla-dinamica-crescimento
URL do post: http://localhost:3001/blog/ia-automacao-dupla-dinamica-crescimento
```

## Estrutura de Dados Esperada

O script espera que o arquivo JSON bruto contenha os seguintes campos:

```json
{
  "title": "Título do Post",
  "summary": "Resumo do post",
  "content_markdown": "# Conteúdo em Markdown\n\nTexto do post...",
  "cover_image_url": "https://example.com/image.jpg",
  "estimated_read_time_minutes": 5,
  "tags": ["tag1", "tag2", "tag3"],
  "suggested_slug": "titulo-do-post"
}
```

## Integração com o Backend

O script utiliza a rota `/api/v1/blog/admin/create-post` do backend para criar novos posts. Esta rota:

1. Valida os dados recebidos
2. Gera um slug único (adiciona sufixo se necessário)
3. Armazena o post no banco de dados
4. Retorna informações do post criado

## Tratamento de Erros

O script trata diversos tipos de erros:

- Arquivo não encontrado
- JSON malformado
- Campos obrigatórios ausentes
- Erros de rede na comunicação com a API
- Erros de validação do backend

## Desenvolvimento

Para adicionar novos utilitários:

1. Crie um novo arquivo `.cjs` neste diretório
2. Siga o padrão de logging e tratamento de erros
3. Documente o uso neste README
4. Teste com dados reais antes de usar em produção