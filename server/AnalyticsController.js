const pino = require('pino')();
const AnalyticsService = require('./AnalyticsService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rg-pulse-admin-secret-key';

/**
 * Controller para gerenciamento de analytics e métricas
 * Fornece endpoints para visualização de dados e estatísticas
 */

/**
 * Middleware de autenticação para rotas administrativas
 */
function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Falha na autenticação', error: error.message });
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

/**
 * Obtém analytics de um post específico
 * GET /api/v1/analytics/posts/:postId
 */
async function getPostAnalytics(req, res) {
  try {
    const { postId } = req.params;
    const { startDate, endDate } = req.query;

    if (!postId) {
      return res.status(400).json({ error: 'ID do post é obrigatório.' });
    }

    const analytics = await AnalyticsService.getPostAnalytics(postId, { startDate, endDate });
    
    pino.info({ msg: '[AnalyticsController] Analytics do post obtidas', postId });
    res.status(200).json(analytics);
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Erro ao obter analytics do post', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter analytics do post.' });
  }
}

/**
 * Obtém analytics diárias agregadas
 * GET /api/v1/analytics/daily
 */
async function getDailyAnalytics(req, res) {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    const analytics = await AnalyticsService.getDailyAnalytics({ 
      startDate, 
      endDate, 
      limit: parseInt(limit) 
    });
    
    pino.info('[AnalyticsController] Analytics diárias obtidas');
    res.status(200).json(analytics);
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Erro ao obter analytics diárias', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter analytics diárias.' });
  }
}

/**
 * Obtém métricas do sistema
 * GET /api/v1/analytics/system-metrics
 */
async function getSystemMetrics(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const metrics = await AnalyticsService.getSystemMetrics({ startDate, endDate });
    
    pino.info('[AnalyticsController] Métricas do sistema obtidas');
    res.status(200).json(metrics);
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Erro ao obter métricas do sistema', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter métricas do sistema.' });
  }
}

/**
 * Registra uma visualização de post
 * POST /api/v1/analytics/posts/:postId/view
 */
async function recordPostView(req, res) {
  try {
    const { postId } = req.params;
    const { 
      sessionId, 
      userAgent, 
      referrer, 
      deviceType = 'desktop',
      timeOnPage = 0 
    } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'ID do post é obrigatório.' });
    }

    await AnalyticsService.recordPostView(postId, {
      sessionId,
      userAgent,
      referrer,
      deviceType,
      timeOnPage,
      ip: req.ip
    });
    
    pino.info({ msg: '[AnalyticsController] Visualização registrada', postId });
    res.status(201).json({ message: 'Visualização registrada com sucesso.' });
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Erro ao registrar visualização', error: error.message });
    res.status(500).json({ error: 'Erro interno ao registrar visualização.' });
  }
}

/**
 * Obtém dashboard com resumo de analytics
 * GET /api/v1/analytics/dashboard
 */
async function getDashboard(req, res) {
  try {
    const { period = '30d' } = req.query;

    const dashboard = await AnalyticsService.getDashboard(period);
    
    pino.info('[AnalyticsController] Dashboard obtido');
    res.status(200).json(dashboard);
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Erro ao obter dashboard', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter dashboard.' });
  }
}

/**
 * Obtém posts mais populares
 * GET /api/v1/analytics/popular-posts
 */
async function getPopularPosts(req, res) {
  try {
    const { period = '7d', limit = 10 } = req.query;

    const posts = await AnalyticsService.getPopularPosts(period, parseInt(limit));
    
    pino.info('[AnalyticsController] Posts populares obtidos');
    res.status(200).json(posts);
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Erro ao obter posts populares', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter posts populares.' });
  }
}

/**
 * Obtém estatísticas de dispositivos
 * GET /api/v1/analytics/device-stats
 */
async function getDeviceStats(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const stats = await AnalyticsService.getDeviceStats({ startDate, endDate });
    
    pino.info('[AnalyticsController] Estatísticas de dispositivos obtidas');
    res.status(200).json(stats);
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Erro ao obter estatísticas de dispositivos', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter estatísticas de dispositivos.' });
  }
}

/**
 * Registra métrica do sistema
 * POST /api/v1/analytics/system-metrics
 */
async function recordSystemMetric(req, res) {
  try {
    const { 
      metricType, 
      value, 
      unit, 
      metadata = {} 
    } = req.body;

    if (!metricType || value === undefined) {
      return res.status(400).json({ error: 'Tipo de métrica e valor são obrigatórios.' });
    }

    await AnalyticsService.recordSystemMetric({
      metricType,
      value,
      unit,
      metadata
    });
    
    pino.info({ msg: '[AnalyticsController] Métrica do sistema registrada', metricType });
    res.status(201).json({ message: 'Métrica registrada com sucesso.' });
  } catch (error) {
    pino.error({ msg: '[AnalyticsController] Erro ao registrar métrica', error: error.message });
    res.status(500).json({ error: 'Erro interno ao registrar métrica.' });
  }
}

module.exports = {
  authenticateAdmin,
  getPostAnalytics,
  getDailyAnalytics,
  getSystemMetrics,
  recordPostView,
  getDashboard,
  getPopularPosts,
  getDeviceStats,
  recordSystemMetric
};