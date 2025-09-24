const pino = require('pino')();
const BlogRepositoryFactory = require('./BlogRepositoryFactory');
const BlogService = require('./BlogService'); // Pode ser usado para futuras ações de admin
const GeminiBlogService = require('./GeminiBlogService');

const { getBlogRepository } = BlogRepositoryFactory;

/**
 * Lista posts do blog com paginação
 * GET /api/v1/blog/posts
 */
async function listPosts(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    pino.info('[BlogController] Listando posts', { page, limit });
    
    const blogRepository = getBlogRepository();
    const result = await blogRepository.getPostsPaginated(page, limit);
    
    // Sempre retornar uma resposta válida, mesmo se não houver posts
    const response = {
      posts: result.posts || [],
      pagination: result.pagination || {
        page: 1,
        limit: limit,
        totalPages: 0,
        totalPosts: 0,
        hasNext: false,
        hasPrev: false
      }
    };
    
    pino.info('[BlogController] Posts listados com sucesso', { 
      count: response.posts.length,
      totalPosts: response.pagination.totalPosts 
    });
    
    res.status(200).json(response);
  } catch (error) {
    pino.error('[BlogController] Erro ao listar postagens', { 
      error: error.message, 
      stack: error.stack,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    });
    
    // Retornar resposta padrão em caso de erro
    res.status(200).json({
      posts: [],
      pagination: {
        page: 1,
        limit: parseInt(req.query.limit) || 10,
        totalPages: 0,
        totalPosts: 0,
        hasNext: false,
        hasPrev: false
      }
    });
  }
}

/**
 * Obtém uma postagem específica pelo slug.
 * GET /api/v1/blog/posts/:slug
 */
async function getPost(req, res) {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: 'Slug da postagem é obrigatório.' });
    }

    const blogRepository = getBlogRepository();
    const post = await blogRepository.getPostBySlug(slug);

    if (!post) {
      return res.status(404).json({ error: 'Postagem não encontrada.' });
    }

    res.status(200).json(post);
  } catch (error) {
    pino.error({ msg: '[BlogController] Erro ao buscar postagem por slug', slug: req.params.slug, error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Erro interno do servidor ao buscar a postagem.' });
  }
}

// Opcional: Rota para acionar manualmente a geração de um post (para admin/teste)
/**
 * Aciona manualmente a geração de um novo post usando Gemini AI.
 * @param {object} req - Objeto de requisição Express.
 * @param {object} res - Objeto de resposta Express.
 */
async function generateNewPostManually(req, res) {
  try {
    const { topic, tone = 'profissional', targetAudience = 'empresários' } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Tópico é obrigatório para gerar o post'
      });
    }
    
    pino.info('[BlogController] Iniciando geração manual de post com Gemini...', { topic, tone, targetAudience });
    
    const geminiBlogService = new GeminiBlogService();
    const newPost = await geminiBlogService.createBlogPost(topic, { tone, targetAudience });
    
    pino.info('[BlogController] Post gerado manualmente com sucesso', { postId: newPost.id, slug: newPost.slug, topic });
    
    res.status(201).json({
      success: true,
      message: 'Post gerado com sucesso usando Gemini AI',
      data: newPost
    });
  } catch (error) {
    pino.error('[BlogController] Erro ao gerar post manualmente', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar post',
      error: error.message
    });
  }
}

/**
 * Cria uma postagem a partir de dados JSON já processados.
 * POST /api/v1/blog/admin/create-post
 * TODO: Proteger esta rota (ex: API key, autenticação de admin)
 */
async function createPostFromData(req, res) {
    // TODO: Implementar verificação de autenticação/autorização aqui
    // Ex: if (req.headers['x-admin-api-key'] !== process.env.ADMIN_API_KEY) return res.status(403).json({ error: 'Não autorizado' });
    
    pino.info('[BlogController] Recebida requisição para criar post a partir de dados processados.');
    
    try {
        const postData = req.body;
        
        // Validação básica da presença de dados
        if (!postData || typeof postData !== 'object') {
            return res.status(400).json({ error: 'Dados da postagem são obrigatórios.' });
        }
        
        const blogRepository = BlogRepositoryFactory.getRepository();
        const newPost = await blogRepository.createPost(postData);
        pino.info({ msg: '[BlogController] Post criado com sucesso a partir de dados processados.', postId: newPost.id, slug: newPost.slug });
        res.status(201).json({ message: 'Postagem criada com sucesso.', post: newPost });
    } catch (error) {
        pino.error({ msg: '[BlogController] Erro ao criar post a partir de dados processados.', error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Erro interno ao criar a postagem.', details: error.message });
    }
}

/**
 * Sugere tópicos para novos posts usando Gemini AI
 * @param {object} req - Objeto de requisição Express
 * @param {object} res - Objeto de resposta Express
 */
async function suggestTopics(req, res) {
  try {
    const { count = 5 } = req.query;
    
    pino.info('[BlogController] Sugerindo tópicos com Gemini AI', { count });
    
    const geminiBlogService = new GeminiBlogService();
    const topics = await geminiBlogService.suggestTopics(parseInt(count));
    
    res.status(200).json({
      success: true,
      message: 'Tópicos sugeridos com sucesso',
      data: topics
    });
  } catch (error) {
    pino.error('[BlogController] Erro ao sugerir tópicos', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao sugerir tópicos',
      error: error.message
    });
  }
}

/**
 * Gera múltiplos posts baseados em uma lista de tópicos
 * @param {object} req - Objeto de requisição Express
 * @param {object} res - Objeto de resposta Express
 */
async function generateMultiplePosts(req, res) {
  try {
    const { topics, tone = 'profissional', targetAudience = 'empresários' } = req.body;
    
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de tópicos é obrigatória'
      });
    }
    
    pino.info('[BlogController] Gerando múltiplos posts com Gemini AI', { topicsCount: topics.length });
    
    const geminiBlogService = new GeminiBlogService();
    const result = await geminiBlogService.generateMultiplePosts(topics, { tone, targetAudience });
    
    res.status(200).json({
      success: true,
      message: `${result.results.length} posts gerados com sucesso`,
      data: {
        posts: result.results,
        errors: result.errors
      }
    });
  } catch (error) {
    pino.error('[BlogController] Erro ao gerar múltiplos posts', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar posts',
      error: error.message
    });
  }
}

/**
 * Inicia uma stream A2A com o agente de blog (mantido para compatibilidade)
 * @param {object} req - Objeto de requisição Express
 * @param {object} res - Objeto de resposta Express
 */
async function streamWithAgent(req, res) {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt é obrigatório e deve ser uma string não vazia.' 
      });
    }

    // Configura headers para Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.flushHeaders();

    // Controller para cancelar a stream se o cliente desconectar
    const abortController = new AbortController();
    
    req.on('close', () => {
      pino.info('[BlogController] Cliente desconectou, cancelando stream A2A.');
      abortController.abort();
    });

    // Função de callback para atualizações da stream
    const onUpdate = (update) => {
      try {
        const data = JSON.stringify(update);
        res.write(`data: ${data}\n\n`);
      } catch (error) {
        pino.error({ msg: '[BlogController] Erro ao enviar atualização da stream', error: error.message });
      }
    };

    // Envia evento de início
    onUpdate({ type: 'status', status: 'started', message: 'Stream iniciada' });

    try {
      // Inicia a stream A2A
      const result = await BlogService.initA2AAgentStream(
        process.env.BLOG_AGENT_ID || 'default-blog-agent',
        prompt,
        onUpdate,
        abortController
      );

      // Envia resultado final
      onUpdate({ 
        type: 'completed', 
        status: 'finished', 
        result: result,
        message: 'Stream concluída com sucesso' 
      });
      
    } catch (streamError) {
      pino.error({ msg: '[BlogController] Erro na stream A2A', error: streamError.message });
      
      if (streamError.message.includes('cancelada')) {
        onUpdate({ 
          type: 'cancelled', 
          status: 'cancelled', 
          message: 'Stream cancelada pelo usuário' 
        });
      } else {
        onUpdate({ 
          type: 'error', 
          status: 'error', 
          error: streamError.message,
          message: 'Erro na comunicação com o agente' 
        });
      }
    }

    // Finaliza a stream
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    pino.error({ msg: '[BlogController] Erro geral na stream A2A', error: error.message });
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erro interno do servidor ao iniciar stream.',
        details: error.message 
      });
    }
  }
}

module.exports = {
  listPosts,
  getPost,
  generateNewPostManually,
  createPostFromData,
  streamWithAgent,
  suggestTopics,
  generateMultiplePosts
};
