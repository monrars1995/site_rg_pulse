const express = require('express');
const pino = require('pino')();
const SchedulerService = require('./SchedulerService');
const AdminController = require('./AdminController');
const SupabaseAuthController = require('./SupabaseAuthController');

const router = express.Router();
const supabaseAuthController = new SupabaseAuthController();

/**
 * Controller para gerenciamento de agendamento
 * Endpoints para posts agendados, templates e tarefas automáticas
 */

/**
 * Middleware de autenticação para todas as rotas
 */
router.use(supabaseAuthController.authenticateAdmin.bind(supabaseAuthController));

// === POSTS AGENDADOS ===

/**
 * GET /api/scheduler/posts
 * Obtém lista de posts agendados
 */
router.get('/posts', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      theme
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      filters: {
        status,
        startDate,
        endDate,
        theme
      }
    };

    const result = await SchedulerService.getScheduledPosts(options);

    pino.info({ msg: '[SchedulerController] Posts agendados obtidos', count: result.posts.length });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao obter posts agendados', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/posts/:id
 * Obtém post agendado específico
 */
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await SchedulerService.getScheduledPost(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post agendado não encontrado'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao obter post agendado', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/posts
 * Cria um novo post agendado
 */
router.post('/posts', async (req, res) => {
  try {
    const {
      title,
      content,
      theme,
      scheduledFor,
      autoPublish = true,
      metadata
    } = req.body;

    // Validação básica
    if (!title || !content || !scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: title, content, scheduledFor'
      });
    }

    // Verificar se a data é futura
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Data de agendamento deve ser futura'
      });
    }

    const postData = {
      title,
      content,
      theme_id: theme,
      scheduledFor,
      auto_publish: autoPublish,
      metadata
    };

    const scheduledPost = await SchedulerService.createScheduledPost(postData);

    pino.info({ msg: '[SchedulerController] Post agendado criado', id: scheduledPost.id });
    
    res.status(201).json({
      success: true,
      data: scheduledPost
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao criar post agendado', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * PUT /api/scheduler/posts/:id
 * Atualiza post agendado
 */
router.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Se está atualizando a data, verificar se é futura
    if (updateData.scheduledFor) {
      const scheduledDate = new Date(updateData.scheduledFor);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Data de agendamento deve ser futura'
        });
      }
    }

    await SchedulerService.updateScheduledPost(id, updateData);

    pino.info({ msg: '[SchedulerController] Post agendado atualizado', id });
    
    res.json({
      success: true,
      message: 'Post agendado atualizado com sucesso'
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao atualizar post agendado', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * DELETE /api/scheduler/posts/:id
 * Remove post agendado
 */
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await SchedulerService.deleteScheduledPost(id);

    pino.info({ msg: '[SchedulerController] Post agendado removido', id });
    
    res.json({
      success: true,
      message: 'Post agendado removido com sucesso'
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao remover post agendado', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/posts/:id/publish
 * Publica post agendado imediatamente
 */
router.post('/posts/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await SchedulerService.publishScheduledPost(id);

    pino.info({ msg: '[SchedulerController] Post agendado publicado', id, postId: result.postId });
    
    res.json({
      success: true,
      data: result,
      message: 'Post publicado com sucesso'
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao publicar post agendado', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/posts/upcoming
 * Obtém próximos posts a serem publicados
 */
router.get('/posts/upcoming', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const posts = await SchedulerService.getUpcomingPosts(parseInt(limit));

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao obter próximos posts', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === TEMPLATES ===

/**
 * GET /api/scheduler/templates
 * Obtém lista de templates
 */
router.get('/templates', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      active
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      active: active !== undefined ? active === 'true' : undefined
    };

    const result = await SchedulerService.getTemplates(options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao obter templates', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/templates/:id
 * Obtém template específico
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await SchedulerService.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao obter template', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/templates
 * Cria um novo template
 */
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      content,
      variables,
      active = true
    } = req.body;

    // Validação básica
    if (!name || !content) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: name, content'
      });
    }

    const templateData = {
      name,
      description,
      category,
      content,
      variables: variables || [],
      active
    };

    const template = await SchedulerService.createTemplate(templateData);

    pino.info({ msg: '[SchedulerController] Template criado', id: template.id });
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao criar template', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * PUT /api/scheduler/templates/:id
 * Atualiza template
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await SchedulerService.updateTemplate(id, updateData);

    pino.info({ msg: '[SchedulerController] Template atualizado', id });
    
    res.json({
      success: true,
      message: 'Template atualizado com sucesso'
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao atualizar template', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * DELETE /api/scheduler/templates/:id
 * Remove template
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await SchedulerService.deleteTemplate(id);

    pino.info({ msg: '[SchedulerController] Template removido', id });
    
    res.json({
      success: true,
      message: 'Template removido com sucesso'
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao remover template', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/templates/:id/use
 * Usa template para criar post agendado
 */
router.post('/templates/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      variables = {},
      scheduledFor,
      title,
      theme
    } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Data de agendamento é obrigatória'
      });
    }

    const result = await SchedulerService.useTemplate(id, {
      variables,
      scheduledFor,
      title,
      theme
    });

    pino.info({ msg: '[SchedulerController] Template usado para criar post', templateId: id, postId: result.id });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao usar template', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === TAREFAS E AUTOMAÇÃO ===

/**
 * GET /api/scheduler/status
 * Obtém status do scheduler
 */
router.get('/status', async (req, res) => {
  try {
    const status = await SchedulerService.getSchedulerStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao obter status do scheduler', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/process
 * Força processamento de posts agendados
 */
router.post('/process', async (req, res) => {
  try {
    const result = await SchedulerService.processScheduledPosts();

    pino.info({ msg: '[SchedulerController] Processamento forçado executado', processed: result.processed });
    
    res.json({
      success: true,
      data: result,
      message: `${result.processed} posts processados`
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro no processamento forçado', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/scheduler/stats
 * Obtém estatísticas do scheduler
 */
router.get('/stats', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const stats = await SchedulerService.getSchedulerStats(period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro ao obter estatísticas', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/scheduler/bulk-action
 * Executa ação em lote nos posts agendados
 */
router.post('/bulk-action', async (req, res) => {
  try {
    const { action, postIds, filters } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Ação é obrigatória'
      });
    }

    const result = await SchedulerService.bulkAction(action, { postIds, filters });

    pino.info({ msg: '[SchedulerController] Ação em lote executada', action, count: result.count });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[SchedulerController] Erro na ação em lote', error: error.message });
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
  pino.error({ msg: '[SchedulerController] Erro não tratado', error: error.message });
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;