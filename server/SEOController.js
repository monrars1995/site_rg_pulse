const express = require('express');
const pino = require('pino')();
const SEOService = require('./SEOService');
const AdminController = require('./AdminController');
const SupabaseAuthController = require('./SupabaseAuthController');

const router = express.Router();
const seoService = new SEOService();
const supabaseAuthController = new SupabaseAuthController();

/**
 * Controller para gerenciamento de SEO
 * Endpoints para otimização, análise e configurações de SEO
 */

/**
 * Middleware de autenticação para todas as rotas
 */
router.use(supabaseAuthController.authenticateAdmin.bind(supabaseAuthController));

// === ANÁLISE DE SEO ===

/**
 * GET /api/seo/analyze/:postId
 * Analisa SEO de um post específico
 */
router.get('/analyze/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { detailed = false } = req.query;

    const analysis = await seoService.analyzePost(postId, { detailed: detailed === 'true' });

    pino.info({ msg: '[SEOController] Análise de SEO realizada', postId, score: analysis.score });
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na análise de SEO', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/seo/analyze/bulk
 * Analisa SEO de múltiplos posts
 */
router.post('/analyze/bulk', async (req, res) => {
  try {
    const { postIds, filters } = req.body;

    if (!postIds && !filters) {
      return res.status(400).json({
        success: false,
        error: 'É necessário fornecer postIds ou filters'
      });
    }

    const results = await seoService.bulkAnalyze({ postIds, filters });

    pino.info({ msg: '[SEOController] Análise em lote realizada', count: results.length });
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na análise em lote', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/seo/reports
 * Obtém relatórios de SEO
 */
router.get('/reports', async (req, res) => {
  try {
    const {
      period = '30d',
      type = 'overview',
      page = 1,
      limit = 20
    } = req.query;

    const options = {
      period,
      type,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const report = await seoService.generateReport(options);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao gerar relatório', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === ENDPOINTS COM IA (GEMINI) ===

// Otimizar SEO de um post com IA
router.post('/optimize-ai/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    if (!postId) {
      return res.status(400).json({ error: 'ID do post é obrigatório' });
    }

    const result = await seoService.optimizeWithAI(postId);
    res.json({
      success: true,
      message: 'Post otimizado com IA com sucesso',
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na otimização com IA', error: error.message });
    
    if (error.message === 'Post não encontrado') {
      return res.status(404).json({ error: 'Post não encontrado' });
    }
    
    if (error.message === 'Gemini AI não está disponível') {
      return res.status(503).json({ error: 'Serviço de IA temporariamente indisponível' });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Analisar SEO de um post com IA
router.post('/analyze-ai/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    if (!postId) {
      return res.status(400).json({ error: 'ID do post é obrigatório' });
    }

    const result = await seoService.analyzeWithAI(postId);
    res.json({
      success: true,
      message: 'Análise de SEO com IA concluída',
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na análise com IA', error: error.message });
    
    if (error.message === 'Post não encontrado') {
      return res.status(404).json({ error: 'Post não encontrado' });
    }
    
    if (error.message === 'Gemini AI não está disponível') {
      return res.status(503).json({ error: 'Serviço de IA temporariamente indisponível' });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Otimização em lote com IA
router.post('/optimize-ai/bulk', async (req, res) => {
  try {
    const { postIds } = req.body;
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs de posts é obrigatória' });
    }

    if (postIds.length > 10) {
      return res.status(400).json({ error: 'Máximo de 10 posts por vez para otimização em lote' });
    }

    const results = [];
    const errors = [];

    for (const postId of postIds) {
      try {
        const result = await seoService.optimizeWithAI(postId);
        results.push(result);
      } catch (error) {
        errors.push({
          postId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Otimização em lote concluída. ${results.length} sucessos, ${errors.length} erros.`,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: postIds.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na otimização em lote com IA', error: error.message });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === CONFIGURAÇÕES DE SEO ===

/**
 * GET /api/seo/settings/:postId
 * Obtém configurações de SEO de um post
 */
router.get('/settings/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const settings = await seoService.getPostSEOSettings(postId);
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Configurações de SEO não encontradas'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao obter configurações de SEO', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/seo/settings/:postId
 * Cria ou atualiza configurações de SEO de um post
 */
router.post('/settings/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const {
      metaTitle,
      metaDescription,
      keywords,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      structuredData,
      noIndex = false,
      noFollow = false
    } = req.body;

    // Validação básica
    if (metaDescription && metaDescription.length > 160) {
      return res.status(400).json({
        success: false,
        error: 'Meta description deve ter no máximo 160 caracteres'
      });
    }

    if (metaTitle && metaTitle.length > 60) {
      return res.status(400).json({
        success: false,
        error: 'Meta title deve ter no máximo 60 caracteres'
      });
    }

    const seoData = {
      postId,
      metaTitle,
      metaDescription,
      keywords: Array.isArray(keywords) ? keywords : [],
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      structuredData,
      noIndex,
      noFollow
    };

    const settings = await seoService.updatePostSEOSettings(postId, seoData);

    pino.info({ msg: '[SEOController] Configurações de SEO atualizadas', postId });
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao atualizar configurações de SEO', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * DELETE /api/seo/settings/:postId
 * Remove configurações de SEO de um post
 */
router.delete('/settings/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    await seoService.deletePostSEOSettings(postId);

    pino.info({ msg: '[SEOController] Configurações de SEO removidas', postId });
    
    res.json({
      success: true,
      message: 'Configurações de SEO removidas com sucesso'
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao remover configurações de SEO', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === OTIMIZAÇÃO AUTOMÁTICA ===

/**
 * POST /api/seo/optimize/:postId
 * Otimiza automaticamente SEO de um post
 */
router.post('/optimize/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { options = {} } = req.body;

    const optimization = await seoService.autoOptimizePost(postId, options);

    pino.info({ msg: '[SEOController] Otimização automática realizada', postId, improvements: optimization.improvements.length });
    
    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na otimização automática', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/seo/generate-meta/:postId
 * Gera meta tags automaticamente para um post
 */
router.post('/generate-meta/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { type = 'all' } = req.body; // 'title', 'description', 'keywords', 'all'

    const metaTags = await seoService.generateMetaTags(postId, type);

    pino.info({ msg: '[SEOController] Meta tags geradas', postId, type });
    
    res.json({
      success: true,
      data: metaTags
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao gerar meta tags', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === PALAVRAS-CHAVE ===

/**
 * GET /api/seo/keywords/research
 * Pesquisa palavras-chave relacionadas
 */
router.get('/keywords/research', async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query é obrigatória para pesquisa de palavras-chave'
      });
    }

    const keywords = await seoService.researchKeywords(query, parseInt(limit));

    res.json({
      success: true,
      data: keywords
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na pesquisa de palavras-chave', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/seo/keywords/trending
 * Obtém palavras-chave em tendência
 */
router.get('/keywords/trending', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;

    const trendingKeywords = await seoService.getTrendingKeywords({
      category,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: trendingKeywords
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao obter palavras-chave em tendência', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/seo/keywords/analyze
 * Analisa densidade de palavras-chave em um texto
 */
router.post('/keywords/analyze', async (req, res) => {
  try {
    const { content, targetKeywords = [] } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo é obrigatório para análise'
      });
    }

    const analysis = await seoService.analyzeKeywordDensity(content, targetKeywords);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na análise de densidade', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === SITEMAP E ROBOTS ===

/**
 * GET /api/seo/sitemap/generate
 * Gera sitemap XML
 */
router.get('/sitemap/generate', async (req, res) => {
  try {
    const { format = 'xml' } = req.query;

    const sitemap = await seoService.generateSitemap(format);

    if (format === 'xml') {
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } else {
      res.json({
        success: true,
        data: sitemap
      });
    }
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao gerar sitemap', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/seo/robots/generate
 * Gera arquivo robots.txt
 */
router.get('/robots/generate', async (req, res) => {
  try {
    const robotsTxt = await seoService.generateRobotsTxt();

    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao gerar robots.txt', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === CONFIGURAÇÕES GLOBAIS ===

/**
 * GET /api/seo/config
 * Obtém configurações globais de SEO
 */
router.get('/config', async (req, res) => {
  try {
    const config = await seoService.getGlobalSEOConfig();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao obter configurações globais', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * PUT /api/seo/config
 * Atualiza configurações globais de SEO
 */
router.put('/config', async (req, res) => {
  try {
    const configData = req.body;

    const config = await seoService.updateGlobalSEOConfig(configData);

    pino.info({ msg: '[SEOController] Configurações globais de SEO atualizadas' });
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro ao atualizar configurações globais', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === MONITORAMENTO ===

/**
 * GET /api/seo/monitor/rankings
 * Monitora posições de palavras-chave
 */
router.get('/monitor/rankings', async (req, res) => {
  try {
    const {
      keywords,
      period = '30d',
      page = 1,
      limit = 20
    } = req.query;

    const options = {
      keywords: keywords ? keywords.split(',') : undefined,
      period,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const rankings = await seoService.monitorRankings(options);

    res.json({
      success: true,
      data: rankings
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro no monitoramento de rankings', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/seo/monitor/performance
 * Monitora performance de SEO
 */
router.get('/monitor/performance', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const performance = await seoService.monitorSEOPerformance(period);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro no monitoramento de performance', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/seo/health
 * Verifica saúde geral do SEO
 */
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await seoService.performSEOHealthCheck();

    res.json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    pino.error({ msg: '[SEOController] Erro na verificação de saúde do SEO', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * Middleware de tratamento de erros
 */
router.use((error, req, res, next) => {
  pino.error({ msg: '[SEOController] Erro não tratado', error: error.message });
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;