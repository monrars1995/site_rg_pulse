require('dotenv').config({ path: require('path').join(__dirname, '.env') }); // Garante que as variáveis de ambiente sejam carregadas
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const pino = require('pino')();
const { getBlogRepository } = require('./BlogRepositoryFactory');
const Joi = require('joi');
const AgentResponseHandler = require('./AgentResponseHandler');

// ID do agente específico para geração de posts do blog
const BLOG_AGENT_ID = process.env.BLOG_AGENT_ID || 'blog-writer';

/**
 * Busca as configurações do agente no Supabase
 * @param {string} agentId - ID do agente
 * @returns {Promise<{endpoint: string, api_key: string}>}
 */
async function getAgentConfig(agentId) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: agent, error } = await supabase
    .from('a2a_agents')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'active')
    .single();

  if (error || !agent) {
    throw new Error(`Agente A2A não encontrado ou inativo: ${agentId}`);
  }

  return {
    endpoint: agent.endpoint,
    api_key: agent.api_key
  };
}

// Configurações para retry e timeout
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  timeout: 60000 // 60 segundos
};

// Códigos de erro JSON-RPC que devem ser retentados
const RETRYABLE_ERROR_CODES = [-32603, -32000, -32002, -32003];

// Instância do handler de resposta do agente
const responseHandler = new AgentResponseHandler();

// Esquema Joi para validar a resposta JSON esperada do agente
const agentResponseSchema = Joi.object({
  title: Joi.string().required(),
  summary: Joi.string().required(),
  content_markdown: Joi.string().required(),
  cover_image_url: Joi.string().uri().required(),
  estimated_read_time_minutes: Joi.number().integer().min(1).required(),
  tags: Joi.array().items(Joi.string()).required(),
  suggested_slug: Joi.string().optional() // Opcional
});

/**
 * Gera um slug amigável a partir de um título.
 * Ex: "Olá Mundo!" -> "ola-mundo"
 * @param {string} title
 * @returns {string}
 */
function generateSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Substitui espaços e não-alfanuméricos (exceto hífen) por hífen
    .replace(/^-+|-+$/g, ''); // Remove hífens no início/fim
}

/**
 * Implementa delay exponencial para retry
 * @param {number} attempt - Número da tentativa (começando em 0)
 * @returns {number} Delay em milissegundos
 */
function calculateRetryDelay(attempt) {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * Implementa delay com jitter para evitar thundering herd
 * @param {number} delay - Delay base em milissegundos
 * @returns {Promise<void>}
 */
function sleep(delay) {
  const jitter = Math.random() * 0.1 * delay; // 10% de jitter
  return new Promise(resolve => setTimeout(resolve, delay + jitter));
}

/**
 * Verifica se um erro deve ser retentado
 * @param {object} error - Objeto de erro
 * @returns {boolean}
 */
function isRetryableError(error) {
  // Erros de rede
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }
  
  // Erros HTTP 5xx
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Erros JSON-RPC específicos
  if (error.jsonrpc && RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }
  
  return false;
}

/**
 * Cria um AbortController com timeout
 * @param {number} timeout - Timeout em milissegundos
 * @returns {AbortController}
 */
function createTimeoutController(timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  // Limpa o timeout se a requisição for bem-sucedida
  const originalAbort = controller.abort.bind(controller);
  controller.abort = () => {
    clearTimeout(timeoutId);
    originalAbort();
  };
  
  return controller;
}

/**
 * Faz uma chamada robusta à API A2A com retry, timeout e tratamento de erros
 * @param {string} agentId - ID do agente
 * @param {object} payload - Payload JSON-RPC
 * @param {object} options - Opções adicionais
 * @returns {Promise<object>} Resposta da API
 */
async function callA2AAgentWithRetry(agentId, payload, agentConfig, options = {}) {
  const { maxRetries = RETRY_CONFIG.maxRetries, timeout = RETRY_CONFIG.timeout } = options;
  const agentEndpoint = agentConfig.endpoint;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = createTimeoutController(timeout);
    
    try {
      pino.info({ 
        msg: '[BlogService] Enviando requisição para A2A Agent', 
        agentId, 
        endpoint: agentEndpoint,
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        taskId: payload.params?.id,
        callId: payload.id
      });
      
      const response = await fetch(agentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': agentConfig.api_key,
          'User-Agent': 'RG-Pulse-Blog-Service/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      const responseBodyText = await response.text();
      
      if (!response.ok) {
        const error = new Error(`Erro na API do Agente: ${response.status} - ${responseBodyText}`);
        error.status = response.status;
        error.response = responseBodyText;
        
        pino.error({ 
          msg: '[BlogService] Erro na resposta da API do Agente', 
          status: response.status, 
          body: responseBodyText, 
          attempt: attempt + 1,
          taskId: payload.params?.id
        });
        
        // Verifica se deve tentar novamente
        if (attempt < maxRetries && isRetryableError(error)) {
          const delay = calculateRetryDelay(attempt);
          pino.warn({ 
            msg: '[BlogService] Tentando novamente após erro retryable', 
            attempt: attempt + 1, 
            nextAttemptIn: delay,
            error: error.message
          });
          await sleep(delay);
          lastError = error;
          continue;
        }
        
        throw error;
      }
      
      let agentResponseData;
      try {
        agentResponseData = JSON.parse(responseBodyText);
      } catch (parseError) {
        const error = new Error('Resposta inválida da API do Agente (não é JSON válido).');
        error.originalError = parseError;
        error.responseBody = responseBodyText;
        
        pino.error({ 
          msg: '[BlogService] Erro ao fazer parse da resposta JSON do agente', 
          error: parseError.message, 
          responseBody: responseBodyText, 
          attempt: attempt + 1,
          taskId: payload.params?.id
        });
        
        throw error;
      }
      
      // Verifica erros JSON-RPC
      if (agentResponseData.error) {
        const error = new Error(`Erro da API do Agente: ${JSON.stringify(agentResponseData.error)}`);
        error.jsonrpc = true;
        error.code = agentResponseData.error.code;
        error.agentError = agentResponseData.error;
        
        pino.error({ 
          msg: '[BlogService] Erro JSON-RPC retornado pela API do Agente', 
          error: agentResponseData.error, 
          attempt: attempt + 1,
          taskId: payload.params?.id
        });
        
        // Verifica se deve tentar novamente para erros JSON-RPC específicos
        if (attempt < maxRetries && isRetryableError(error)) {
          const delay = calculateRetryDelay(attempt);
          pino.warn({ 
            msg: '[BlogService] Tentando novamente após erro JSON-RPC retryable', 
            attempt: attempt + 1, 
            nextAttemptIn: delay,
            errorCode: agentResponseData.error.code
          });
          await sleep(delay);
          lastError = error;
          continue;
        }
        
        // Se o erro não é retryable ou esgotou as tentativas, lança um erro mais específico
        if (agentResponseData.error.code === -32603 && agentResponseData.error.message?.includes('Error searching for agent')) {
          pino.error({ 
            msg: '[BlogService] Erro -32603: Agente não encontrado', 
            blogAgentId: BLOG_AGENT_ID,
            errorDetails: agentResponseData.error,
            fullResponse: agentResponseData
          });
          throw new Error('Agente de blog não encontrado ou indisponível. Verifique a configuração do BLOG_AGENT_ID.');
        }
        
        throw error;
      }
      
      // Sucesso!
      pino.info({ 
        msg: '[BlogService] Resposta bem-sucedida da API do Agente', 
        attempt: attempt + 1,
        taskId: payload.params?.id
      });
      
      return agentResponseData;
      
    } catch (error) {
      controller.abort(); // Limpa o timeout
      
      // Se foi cancelado por timeout
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Timeout na chamada para API do Agente após ${timeout}ms`);
        timeoutError.code = 'ETIMEDOUT';
        error = timeoutError;
      }
      
      lastError = error;
      
      // Se não deve tentar novamente ou já esgotou as tentativas
      if (attempt >= maxRetries || !isRetryableError(error)) {
        pino.error({ 
          msg: '[BlogService] Falha definitiva na chamada para API do Agente', 
          error: error.message, 
          attempt: attempt + 1,
          taskId: payload.params?.id,
          stack: error.stack
        });
        throw error;
      }
      
      // Aguarda antes da próxima tentativa
      const delay = calculateRetryDelay(attempt);
      pino.warn({ 
        msg: '[BlogService] Tentando novamente após erro', 
        attempt: attempt + 1, 
        nextAttemptIn: delay,
        error: error.message
      });
      await sleep(delay);
    }
  }
  
  // Se chegou aqui, esgotou todas as tentativas
  throw lastError || new Error('Falha desconhecida na chamada para API do Agente');
}

/**
 * Chama a API A2A para gerar dados de uma nova postagem e a armazena no banco.
 * @param {string} [theme] - Tema opcional para a geração do post
 * @returns {Promise<object>} A postagem criada.
 * @throws {Error} Se a geração ou armazenamento falhar.
 */
async function generateAndStoreNewPost(theme = null) {
  pino.info('[BlogService] Iniciando geração de nova postagem de blog.', { theme });

  // Buscar configurações do agente no Supabase
  let agentConfig;
  try {
    agentConfig = await getAgentConfig(BLOG_AGENT_ID);
  } catch (error) {
    pino.error('[BlogService] Erro ao buscar configurações do agente:', error.message);
    throw new Error('Configuração da API do Agente ausente.');
  }

  const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // Constrói o prompt baseado no tema
  let promptText = 'Gere uma nova postagem para o blog da RG Pulse sobre temas relevantes como: tecnologia, inteligência artificial, automação, vendas, marketing digital, inovação ou transformação digital.';
  
  if (theme) {
    promptText = `Gere uma nova postagem para o blog da RG Pulse sobre o tema específico: "${theme}". A postagem deve estar relacionada a tecnologia, inteligência artificial, automação, vendas, marketing digital, inovação ou transformação digital.`;
  }
  
  promptText += ' A postagem deve ser informativa, engajante e útil para nossos leitores.\n\nIMPORTANTE: Retorne o resultado EXCLUSIVAMENTE em formato JSON válido com os seguintes campos obrigatórios:\n- title: string (título da postagem)\n- summary: string (resumo da postagem)\n- content_markdown: string (conteúdo em markdown)\n- cover_image_url: string (URL da imagem de capa)\n- estimated_read_time_minutes: number (tempo estimado de leitura em minutos)\n- tags: array de strings (tags da postagem)\n- suggested_slug: string (slug sugerido, opcional)\n\nNão inclua texto adicional, apenas o JSON.';

  // O prompt/mensagem para o agente. Como o agente já é treinado,
  // podemos enviar uma mensagem simples ou uma estrutura que ele entenda para iniciar a geração do post.
  // Para este exemplo, vamos assumir que o agente espera um comando simples.
  const payload = {
    jsonrpc: '2.0',
    id: callId,
    method: 'message/send', // Usaremos message/send para obter a resposta completa
    params: {
      id: taskId,
      sessionId: `blog-session-${Date.now()}`,
      message: {
        role: 'user',
        parts: [
          {
            type: 'text',
            text: promptText
          }
        ]
      }
    }
  };

  try {
    // Usa a nova função robusta com retry
    const responseJson = await callA2AAgentWithRetry(BLOG_AGENT_ID, payload, agentConfig);

    pino.info({ msg: '[BlogService] Resposta da API A2A recebida.', response: responseJson, taskId });

    // Usar o AgentResponseHandler para processar a resposta
    let blogPostDataFromAgent;
    
    try {
      // Extrair o conteúdo de texto da resposta
      const blogPostJsonString = responseHandler.extractTextContent(responseJson, taskId);
      
      // Fazer parse do JSON usando as estratégias robustas
      blogPostDataFromAgent = responseHandler.parseAgentJSON(blogPostJsonString, taskId);
      
      pino.info({ 
        msg: '[BlogService] Resposta do agente processada com sucesso usando AgentResponseHandler', 
        data: blogPostDataFromAgent, 
        taskId 
      });
    } catch (processingError) {
      pino.error({ 
        msg: '[BlogService] Erro ao processar resposta do agente com AgentResponseHandler', 
        error: processingError.message, 
        response: responseJson, 
        taskId 
      });
      throw new Error(`Erro ao processar dados da postagem do agente: ${processingError.message}`);
    }
    
    // Validar o JSON recebido do agente
    const { error: validationError, value: validatedPostData } = agentResponseSchema.validate(blogPostDataFromAgent);
    if (validationError) {
        pino.warn({ msg: '[BlogService] Dados da postagem do agente falharam na validação Joi.', error: validationError.details, data: blogPostDataFromAgent, taskId });
        throw new Error(`Dados inválidos da postagem do agente: ${validationError.message}`);
    }

    // Gerar slug (se não vier do agente ou se quisermos garantir um formato)
    let slug = validatedPostData.suggested_slug ? generateSlug(validatedPostData.suggested_slug) : generateSlug(validatedPostData.title);
    
    // Verificar se o slug já existe e adicionar um sufixo se necessário para garantir unicidade
    let slugCounter = 1;
    let originalSlug = slug;
    const blogRepository = getBlogRepository();
    while (await blogRepository.getPostBySlug(slug)) {
      slug = `${originalSlug}-${slugCounter}`;
      slugCounter++;
      pino.info({ msg: '[BlogService] Slug já existe, tentando com sufixo', originalSlug, newSlug: slug });
    }

    const newPost = {
      title: validatedPostData.title,
      slug: slug,
      content: validatedPostData.content_markdown,
      excerpt: validatedPostData.summary,
      author: 'Admin',
      tags: validatedPostData.tags,
      featured_image: validatedPostData.cover_image_url,
      status: 'published'
    };

    const createdPost = await blogRepository.createPost(newPost);
    const createdPostId = createdPost.id;
    pino.info({ msg: '[BlogService] Nova postagem de blog gerada e armazenada com sucesso.', postId: createdPostId, slug: newPost.slug });
    
    // Retornar a postagem completa (ou pelo menos o ID e o slug)
    return { id: createdPostId, ...newPost };

  } catch (error) {
    pino.error({ msg: '[BlogService] Falha ao gerar e armazenar nova postagem.', error: error.message, stack: error.stack });
    // Não relançar o erro aqui se o agendador for chamá-lo, para não parar o agendador.
    // O agendador deve tratar o erro retornado pela Promise.
    // Se chamado diretamente por uma rota HTTP, o controller tratará o erro.
    throw error; // Relançar para que o chamador (scheduler ou controller) possa tratar.
  }
}

/**
 * Cria uma postagem diretamente a partir de dados JSON já processados.
 * @param {object} postData - Dados da postagem já processados.
 * @param {string} postData.title - Título da postagem.
 * @param {string} postData.summary - Resumo da postagem.
 * @param {string} postData.content_markdown - Conteúdo em Markdown.
 * @param {string} postData.cover_image_url - URL da imagem de capa.
 * @param {number} postData.estimated_read_time_minutes - Tempo de leitura estimado.
 * @param {string[]} postData.tags - Array de tags.
 * @param {string} [postData.suggested_slug] - Slug sugerido (opcional).
 * @returns {Promise<object>} A postagem criada.
 * @throws {Error} Se a validação ou armazenamento falhar.
 */
async function createPostFromProcessedData(postData) {
  pino.info('[BlogService] Criando postagem a partir de dados processados.');

  // Validar o JSON recebido
  const { error: validationError, value: validatedPostData } = agentResponseSchema.validate(postData);
  if (validationError) {
    pino.warn({ msg: '[BlogService] Dados da postagem falharam na validação Joi.', error: validationError.details, data: postData });
    throw new Error(`Dados inválidos da postagem: ${validationError.message}`);
  }

  // Gerar slug (se não vier ou se quisermos garantir um formato)
  let slug = validatedPostData.suggested_slug ? generateSlug(validatedPostData.suggested_slug) : generateSlug(validatedPostData.title);
  
  // Verificar se o slug já existe e adicionar um sufixo se necessário para garantir unicidade
  let slugCounter = 1;
  let originalSlug = slug;
  const blogRepository = getBlogRepository();
  while (await blogRepository.getPostBySlug(slug)) {
    slug = `${originalSlug}-${slugCounter}`;
    slugCounter++;
    pino.info({ msg: '[BlogService] Slug já existe, tentando com sufixo', originalSlug, newSlug: slug });
  }

  const newPost = {
    title: validatedPostData.title,
    slug: slug,
    content: validatedPostData.content_markdown,
    excerpt: validatedPostData.summary,
    author: 'Admin',
    tags: validatedPostData.tags,
    featured_image: validatedPostData.cover_image_url,
    status: 'published'
  };

  try {
    const createdPost = await blogRepository.createPost(newPost);
    const createdPostId = createdPost.id;
    pino.info({ msg: '[BlogService] Postagem criada com sucesso a partir de dados processados.', postId: createdPostId, slug: newPost.slug });
    
    // Retornar a postagem completa
    return { id: createdPostId, ...newPost };
  } catch (error) {
    pino.error({ msg: '[BlogService] Falha ao criar postagem a partir de dados processados.', error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Gera um post com prompt específico
 * @param {string} prompt - Prompt específico para geração do post
 * @returns {Promise<object>} A postagem criada.
 * @throws {Error} Se a geração ou armazenamento falhar.
 */
async function generateAndStoreNewPostWithPrompt(prompt) {
  pino.info('[BlogService] Iniciando geração de nova postagem com prompt específico.', { prompt });

  // Buscar configurações do agente no Supabase
  let agentConfig;
  try {
    agentConfig = await getAgentConfig(BLOG_AGENT_ID);
  } catch (error) {
    pino.error('[BlogService] Erro ao buscar configurações do agente:', error.message);
    throw new Error('Configuração da API do Agente ausente.');
  }

  const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // Usa o prompt fornecido diretamente com instruções claras para formato JSON
  const promptText = `${prompt}

IMPORTANTE: Retorne o resultado EXCLUSIVAMENTE em formato JSON válido com os seguintes campos obrigatórios:
- title: string (título da postagem)
- summary: string (resumo da postagem)
- content_markdown: string (conteúdo em markdown)
- cover_image_url: string (URL da imagem de capa)
- estimated_read_time_minutes: number (tempo estimado de leitura em minutos)
- tags: array de strings (tags da postagem)
- suggested_slug: string (slug sugerido, opcional)

Não inclua texto adicional, apenas o JSON.`;

  const payload = {
    jsonrpc: '2.0',
    id: callId,
    method: 'message/send',
    params: {
      id: taskId,
      sessionId: `blog-session-${Date.now()}`,
      message: {
        role: 'user',
        parts: [
          {
            type: 'text',
            text: promptText
          }
        ]
      }
    }
  };

  try {
    // Log da configuração do agente
    pino.info({ 
      msg: '[BlogService] Iniciando geração de post com agente', 
      blogAgentId: BLOG_AGENT_ID,
      agentBaseUrl: agentConfig.endpoint,
      taskId 
    });

    // Usa a nova função robusta com retry
    const responseJson = await callA2AAgentWithRetry(BLOG_AGENT_ID, payload, agentConfig);

    // Log da resposta completa para diagnóstico
    pino.info({ 
      msg: '[BlogService] Resposta completa do agente recebida', 
      response: responseJson, 
      taskId 
    });

    // Verifica se a resposta contém os dados esperados
    if (!responseJson.result) {
      pino.error({ 
        msg: '[BlogService] Resposta da API do Agente não contém result', 
        response: responseJson, 
        hasResult: !!responseJson.result,
        responseKeys: Object.keys(responseJson || {}),
        responseType: typeof responseJson,
        fullStructure: JSON.stringify(responseJson, null, 2),
        taskId 
      });
      throw new Error('Resposta da API do Agente não contém dados de postagem.');
    }

    // Extrai o conteúdo da resposta (pode estar em diferentes formatos)
    let agentContent;
    if (responseJson.result.status?.message?.parts?.[0]?.text) {
      agentContent = responseJson.result.status.message.parts[0].text;
    } else if (responseJson.result.content) {
      agentContent = responseJson.result.content;
    } else {
      pino.error({ msg: '[BlogService] Formato de resposta inesperado', response: responseJson, taskId });
      throw new Error('Formato de resposta da API do Agente não reconhecido.');
    }

    let blogPostDataFromAgent;

    try {
      if (typeof agentContent === 'string') {
        // Tenta fazer parse direto primeiro
        try {
          blogPostDataFromAgent = JSON.parse(agentContent.trim());
        } catch {
          // Se falhar, procura por JSON na string
          const jsonMatch = agentContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            blogPostDataFromAgent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Nenhum JSON válido encontrado na resposta do agente.');
          }
        }
      } else if (typeof agentContent === 'object') {
        blogPostDataFromAgent = agentContent;
      } else {
        throw new Error('Formato de resposta do agente não suportado.');
      }
    } catch (parseError) {
      pino.error({ msg: '[BlogService] Erro ao extrair dados JSON da resposta do agente', error: parseError.message, content: agentContent, taskId });
      throw new Error('Erro ao processar dados da postagem do agente.');
    }
    
    // Validar o JSON recebido do agente
    const { error: validationError, value: validatedPostData } = agentResponseSchema.validate(blogPostDataFromAgent);
    if (validationError) {
        pino.warn({ msg: '[BlogService] Dados da postagem do agente falharam na validação Joi.', error: validationError.details, data: blogPostDataFromAgent, taskId });
        throw new Error(`Dados inválidos da postagem do agente: ${validationError.message}`);
    }

    // Gerar slug (se não vier do agente ou se quisermos garantir um formato)
    let slug = validatedPostData.suggested_slug ? generateSlug(validatedPostData.suggested_slug) : generateSlug(validatedPostData.title);
    
    // Verificar se o slug já existe e adicionar um sufixo se necessário para garantir unicidade
    let slugCounter = 1;
    let originalSlug = slug;
    const blogRepository = getBlogRepository();
    while (await blogRepository.getPostBySlug(slug)) {
      slug = `${originalSlug}-${slugCounter}`;
      slugCounter++;
      pino.info({ msg: '[BlogService] Slug já existe, tentando com sufixo', originalSlug, newSlug: slug });
    }

    const newPost = {
      title: validatedPostData.title,
      slug: slug,
      content: validatedPostData.content_markdown,
      excerpt: validatedPostData.summary,
      author: 'Admin',
      tags: validatedPostData.tags,
      featured_image: validatedPostData.cover_image_url,
      status: 'published'
    };

    const createdPost = await blogRepository.createPost(newPost);
    const createdPostId = createdPost.id;
    pino.info({ msg: '[BlogService] Nova postagem de blog gerada e armazenada com sucesso com prompt específico.', postId: createdPostId, slug: newPost.slug });
    
    // Retornar a postagem completa (ou pelo menos o ID e o slug)
    return { id: createdPostId, ...newPost };

  } catch (error) {
    pino.error({ msg: '[BlogService] Falha ao gerar e armazenar nova postagem com prompt específico.', error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Lista todos os posts com paginação
 * @param {object} options - Opções de paginação
 * @param {number} options.page - Número da página (padrão: 1)
 * @param {number} options.limit - Limite de posts por página (padrão: 10)
 * @returns {Promise<object>} Posts e informações de paginação
 */
async function getAllPosts(options = {}) {
  try {
    const { page = 1, limit = 10 } = options;
    const blogRepository = getBlogRepository();
    return await blogRepository.getPostsPaginated(page, limit);
  } catch (error) {
    pino.error({ msg: '[BlogService] Erro ao listar posts', error: error.message });
    throw error;
  }
}

/**
 * Inicia uma stream A2A para comunicação em tempo real com o agente
 * @param {string} agentId - ID do agente
 * @param {string} prompt - Prompt para o agente
 * @param {function} onUpdate - Callback para atualizações da stream
 * @param {AbortController} abortController - Controller para cancelar a stream
 * @returns {Promise<object>} Resultado final da stream
 */
async function initA2AAgentStream(agentId, prompt, onUpdate, abortController) {
  pino.info('[BlogService] Iniciando stream A2A com agente.', { agentId, prompt: prompt.substring(0, 100) + '...' });

  // Buscar configurações do agente no Supabase
  let agentConfig;
  try {
    agentConfig = await getAgentConfig(agentId);
  } catch (error) {
    pino.error('[BlogService] Erro ao buscar configurações do agente:', error.message);
    throw new Error('Configuração da API do Agente ausente.');
  }

  const agentA2AEndpoint = agentConfig.endpoint;
  const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const sessionId = `stream-session-${Date.now()}`;

  const payload = {
    jsonrpc: '2.0',
    id: callId,
    method: 'message/stream',
    params: {
      id: taskId,
      sessionId: sessionId,
      message: {
        role: 'user',
        parts: [
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    }
  };

  try {
    pino.info({ msg: '[BlogService] Iniciando requisição de stream A2A', endpoint: agentA2AEndpoint, taskId, callId });
    
    const response = await fetch(agentA2AEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'x-api-key': agentConfig.api_key
      },
      body: JSON.stringify(payload),
      signal: abortController?.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      pino.error({ msg: '[BlogService] Erro na requisição de stream A2A', status: response.status, error: errorText, taskId });
      throw new Error(`Erro na API A2A Stream: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Resposta da stream A2A não contém body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          pino.info({ msg: '[BlogService] Stream A2A finalizada', taskId });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Mantém a linha incompleta no buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              pino.info({ msg: '[BlogService] Stream A2A marcada como concluída', taskId });
              continue;
            }

            try {
              const eventData = JSON.parse(data);
              
              // Processa diferentes tipos de eventos
              if (eventData.result) {
                if (eventData.result.status?.type === 'artifact') {
                  // Evento de conteúdo
                  const content = eventData.result.status.message?.parts?.[0]?.text || '';
                  if (content && onUpdate) {
                    onUpdate({ type: 'content', content, status: 'streaming' });
                  }
                } else if (eventData.result.status?.type === 'status') {
                  // Evento de status
                  const status = eventData.result.status.status || 'unknown';
                  if (onUpdate) {
                    onUpdate({ type: 'status', status });
                  }
                  
                  // Se o status indica conclusão, salva o resultado final
                  if (status === 'completed' || status === 'done') {
                    finalResult = eventData.result;
                  }
                }
              } else if (eventData.error) {
                pino.error({ msg: '[BlogService] Erro na stream A2A', error: eventData.error, taskId });
                throw new Error(`Erro na stream A2A: ${JSON.stringify(eventData.error)}`);
              }
            } catch (parseError) {
              pino.warn({ msg: '[BlogService] Erro ao fazer parse de evento da stream', error: parseError.message, data, taskId });
              // Continua processando outros eventos
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return finalResult || { status: 'completed', message: 'Stream finalizada sem resultado específico' };

  } catch (error) {
    if (error.name === 'AbortError') {
      pino.info({ msg: '[BlogService] Stream A2A cancelada pelo usuário', taskId });
      throw new Error('Stream cancelada pelo usuário.');
    }
    
    pino.error({ msg: '[BlogService] Erro na stream A2A', error: error.message, taskId });
    throw error;
  }
}

module.exports = {
  generateAndStoreNewPost,
  generateAndStoreNewPostWithPrompt,
  createPostFromProcessedData,
  getAllPosts,
  initA2AAgentStream,
  callA2AAgentWithRetry,
  generateSlug // Exportar para possível uso em controllers
};
