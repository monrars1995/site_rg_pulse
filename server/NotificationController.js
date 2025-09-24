const express = require('express');
const pino = require('pino')();
const NotificationService = require('./NotificationService');
const { authenticateAdmin } = require('./middleware/auth');

const router = express.Router();

/**
 * Controller para gerenciamento de notificações e alertas
 * Endpoints para criar, listar, marcar como lida e configurar alertas
 */

/**
 * Middleware de autenticação para todas as rotas
 */
router.use(authenticateAdmin);

/**
 * GET /api/notifications
 * Obtém lista de notificações
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      priority,
      read,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      category,
      priority,
      read: read !== undefined ? read === 'true' : undefined,
      startDate,
      endDate
    };

    const result = await NotificationService.getNotifications(options);

    pino.info({ msg: '[NotificationController] Notificações obtidas', count: result.notifications.length });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao obter notificações', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Obtém contagem de notificações não lidas
 */
router.get('/unread-count', async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount();

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao obter contagem não lidas', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/notifications/recent
 * Obtém notificações recentes (últimas 24h)
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const notifications = await NotificationService.getRecentNotifications(parseInt(limit));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao obter notificações recentes', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/notifications
 * Cria uma nova notificação
 */
router.post('/', async (req, res) => {
  try {
    const {
      type,
      category,
      title,
      message,
      priority = 'medium',
      actionUrl,
      metadata
    } = req.body;

    // Validação básica
    if (!type || !category || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: type, category, title, message'
      });
    }

    const notificationData = {
      type,
      category,
      title,
      message,
      priority,
      actionUrl,
      metadata
    };

    const notification = await NotificationService.createNotification(notificationData);

    pino.info({ msg: '[NotificationController] Notificação criada', id: notification.id });
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao criar notificação', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marca notificação como lida
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await NotificationService.markAsRead(id);

    pino.info({ msg: '[NotificationController] Notificação marcada como lida', id });
    
    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao marcar como lida', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Marca todas as notificações como lidas
 */
router.put('/mark-all-read', async (req, res) => {
  try {
    const { category, type } = req.query;
    
    const count = await NotificationService.markAllAsRead({ category, type });

    pino.info({ msg: '[NotificationController] Notificações marcadas como lidas', count });
    
    res.json({
      success: true,
      message: `${count} notificações marcadas como lidas`
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao marcar todas como lidas', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Remove uma notificação
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await NotificationService.deleteNotification(id);

    pino.info({ msg: '[NotificationController] Notificação removida', id });
    
    res.json({
      success: true,
      message: 'Notificação removida com sucesso'
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao remover notificação', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * DELETE /api/notifications/cleanup
 * Remove notificações antigas
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const count = await NotificationService.cleanupOldNotifications(parseInt(days));

    pino.info({ msg: '[NotificationController] Limpeza de notificações concluída', count });
    
    res.json({
      success: true,
      message: `${count} notificações antigas removidas`
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro na limpeza de notificações', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// === ROTAS DE CONFIGURAÇÃO DE ALERTAS ===

/**
 * GET /api/notifications/alerts/settings
 * Obtém configurações de alertas
 */
router.get('/alerts/settings', async (req, res) => {
  try {
    const settings = await NotificationService.getAlertSettings();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao obter configurações de alertas', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * PUT /api/notifications/alerts/settings/:type
 * Atualiza configuração de alerta específico
 */
router.put('/alerts/settings/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { enabled, threshold, conditions, actions } = req.body;

    const settingData = {
      enabled,
      threshold,
      conditions,
      actions
    };

    await NotificationService.updateAlertSetting(type, settingData);

    pino.info({ msg: '[NotificationController] Configuração de alerta atualizada', type });
    
    res.json({
      success: true,
      message: 'Configuração de alerta atualizada'
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao atualizar configuração de alerta', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/notifications/alerts/test/:type
 * Testa um alerta específico
 */
router.post('/alerts/test/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { testData } = req.body;

    const result = await NotificationService.testAlert(type, testData);

    pino.info({ msg: '[NotificationController] Teste de alerta executado', type });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao testar alerta', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/notifications/stats
 * Obtém estatísticas de notificações
 */
router.get('/stats', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const stats = await NotificationService.getNotificationStats(period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro ao obter estatísticas', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/notifications/bulk-action
 * Executa ação em lote nas notificações
 */
router.post('/bulk-action', async (req, res) => {
  try {
    const { action, notificationIds, filters } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Ação é obrigatória'
      });
    }

    const result = await NotificationService.bulkAction(action, { notificationIds, filters });

    pino.info({ msg: '[NotificationController] Ação em lote executada', action, count: result.count });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    pino.error({ msg: '[NotificationController] Erro na ação em lote', error: error.message });
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
  pino.error({ msg: '[NotificationController] Erro não tratado', error: error.message });
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;