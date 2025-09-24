const pino = require('pino')();
const AnalyticsRepository = require('./AnalyticsRepository');
const { getBlogRepository } = require('./BlogRepositoryFactory');

/**
 * Serviço de analytics e métricas
 * Gerencia coleta, processamento e análise de dados
 */

/**
 * Obtém analytics de um post específico
 * @param {string} postId - ID do post
 * @param {object} options - Opções de filtro (startDate, endDate)
 * @returns {object} Analytics do post
 */
async function getPostAnalytics(postId, options = {}) {
  try {
    const { startDate, endDate } = options;
    
    // Buscar dados básicos do post
    const blogRepository = getBlogRepository();
    const post = await blogRepository.getPostById(postId);
    
    if (!post) {
      throw new Error('Post não encontrado');
    }

    // Buscar analytics do post
    const analytics = await AnalyticsRepository.getPostAnalytics(postId, { startDate, endDate });
    
    // Calcular métricas agregadas
    const totalViews = analytics.reduce((sum, record) => sum + (record.views || 0), 0);
    const avgTimeOnPage = analytics.length > 0 
      ? analytics.reduce((sum, record) => sum + (record.time_on_page || 0), 0) / analytics.length 
      : 0;
    const avgBounceRate = analytics.length > 0
      ? analytics.reduce((sum, record) => sum + (record.bounce_rate || 0), 0) / analytics.length
      : 0;

    // Agrupar por dispositivo
    const deviceStats = analytics.reduce((acc, record) => {
      const device = record.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + (record.views || 0);
      return acc;
    }, {});

    // Agrupar por data
    const dailyViews = analytics.reduce((acc, record) => {
      const date = record.date || record.created_at?.split('T')[0];
      if (date) {
        acc[date] = (acc[date] || 0) + (record.views || 0);
      }
      return acc;
    }, {});

    pino.info({ msg: '[AnalyticsService] Analytics do post processadas', postId, totalViews });
    
    return {
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        created_at: post.created_at
      },
      metrics: {
        totalViews,
        avgTimeOnPage: Math.round(avgTimeOnPage),
        avgBounceRate: Math.round(avgBounceRate * 100) / 100
      },
      deviceStats,
      dailyViews,
      rawData: analytics
    };
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao obter analytics do post', error: error.message });
    throw error;
  }
}

/**
 * Obtém analytics diárias agregadas
 * @param {object} options - Opções de filtro
 * @returns {array} Analytics diárias
 */
async function getDailyAnalytics(options = {}) {
  try {
    const { startDate, endDate, limit = 30 } = options;
    
    const analytics = await AnalyticsRepository.getDailyAnalytics({ 
      startDate, 
      endDate, 
      limit 
    });
    
    // Calcular totais
    const totals = analytics.reduce((acc, day) => {
      acc.totalViews += day.total_views || 0;
      acc.totalSessions += day.total_sessions || 0;
      acc.totalUsers += day.unique_visitors || 0;
      return acc;
    }, { totalViews: 0, totalSessions: 0, totalUsers: 0 });

    pino.info({ msg: '[AnalyticsService] Analytics diárias processadas', count: analytics.length });
    
    return {
      analytics,
      totals,
      period: {
        startDate: startDate || (analytics[analytics.length - 1]?.date),
        endDate: endDate || (analytics[0]?.date),
        days: analytics.length
      }
    };
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao obter analytics diárias', error: error.message });
    throw error;
  }
}

/**
 * Obtém métricas do sistema
 * @param {object} options - Opções de filtro
 * @returns {object} Métricas do sistema
 */
async function getSystemMetrics(options = {}) {
  try {
    const { startDate, endDate } = options;
    
    const metrics = await AnalyticsRepository.getSystemMetrics({ startDate, endDate });
    
    // Agrupar métricas por tipo
    const groupedMetrics = metrics.reduce((acc, metric) => {
      const type = metric.metric_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(metric);
      return acc;
    }, {});

    // Calcular estatísticas para cada tipo
    const stats = Object.keys(groupedMetrics).reduce((acc, type) => {
      const typeMetrics = groupedMetrics[type];
      const values = typeMetrics.map(m => m.value).filter(v => v !== null);
      
      if (values.length > 0) {
        acc[type] = {
          current: values[0], // Valor mais recente
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
          unit: typeMetrics[0].unit,
          lastUpdated: typeMetrics[0].created_at
        };
      }
      return acc;
    }, {});

    pino.info({ msg: '[AnalyticsService] Métricas do sistema processadas', types: Object.keys(stats) });
    
    return {
      metrics: stats,
      rawData: groupedMetrics
    };
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao obter métricas do sistema', error: error.message });
    throw error;
  }
}

/**
 * Registra uma visualização de post
 * @param {string} postId - ID do post
 * @param {object} data - Dados da visualização
 */
async function recordPostView(postId, data) {
  try {
    const viewData = {
      post_id: postId,
      session_id: data.sessionId,
      user_agent: data.userAgent,
      referrer: data.referrer,
      device_type: data.deviceType || 'desktop',
      time_on_page: data.timeOnPage || 0,
      ip_address: data.ip,
      views: 1,
      bounce_rate: data.timeOnPage < 30 ? 1 : 0 // Considera bounce se ficou menos de 30s
    };

    await AnalyticsRepository.recordPostView(viewData);
    
    // Atualizar analytics diárias
    await updateDailyAnalytics(postId);
    
    pino.info({ msg: '[AnalyticsService] Visualização registrada', postId });
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao registrar visualização', error: error.message });
    throw error;
  }
}

/**
 * Obtém dashboard com resumo de analytics
 * @param {string} period - Período (7d, 30d, 90d)
 * @returns {object} Dados do dashboard
 */
async function getDashboard(period = '30d') {
  try {
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar dados em paralelo
    const [dailyAnalytics, popularPosts, deviceStats, systemMetrics] = await Promise.all([
      getDailyAnalytics({ startDate: startDate.toISOString(), limit: days }),
      getPopularPosts(period, 5),
      getDeviceStats({ startDate: startDate.toISOString() }),
      getSystemMetrics({ startDate: startDate.toISOString() })
    ]);

    // Calcular métricas de crescimento
    const analytics = dailyAnalytics.analytics;
    const midPoint = Math.floor(analytics.length / 2);
    const firstHalf = analytics.slice(midPoint);
    const secondHalf = analytics.slice(0, midPoint);
    
    const firstHalfViews = firstHalf.reduce((sum, day) => sum + (day.total_views || 0), 0);
    const secondHalfViews = secondHalf.reduce((sum, day) => sum + (day.total_views || 0), 0);
    
    const growthRate = firstHalfViews > 0 
      ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100 
      : 0;

    pino.info({ msg: '[AnalyticsService] Dashboard gerado', period });
    
    return {
      period,
      summary: {
        totalViews: dailyAnalytics.totals.totalViews,
        totalSessions: dailyAnalytics.totals.totalSessions,
        totalUsers: dailyAnalytics.totals.totalUsers,
        growthRate: Math.round(growthRate * 100) / 100
      },
      dailyAnalytics: analytics,
      popularPosts,
      deviceStats,
      systemHealth: systemMetrics.metrics
    };
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao gerar dashboard', error: error.message });
    throw error;
  }
}

/**
 * Obtém posts mais populares
 * @param {string} period - Período
 * @param {number} limit - Limite de resultados
 * @returns {array} Posts populares
 */
async function getPopularPosts(period = '7d', limit = 10) {
  try {
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const posts = await AnalyticsRepository.getPopularPosts({
      startDate: startDate.toISOString(),
      limit
    });
    
    pino.info({ msg: '[AnalyticsService] Posts populares obtidos', count: posts.length });
    return posts;
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao obter posts populares', error: error.message });
    throw error;
  }
}

/**
 * Obtém estatísticas de dispositivos
 * @param {object} options - Opções de filtro
 * @returns {object} Estatísticas de dispositivos
 */
async function getDeviceStats(options = {}) {
  try {
    const stats = await AnalyticsRepository.getDeviceStats(options);
    
    // Calcular percentuais
    const total = stats.reduce((sum, stat) => sum + stat.views, 0);
    const statsWithPercentage = stats.map(stat => ({
      ...stat,
      percentage: total > 0 ? Math.round((stat.views / total) * 100 * 100) / 100 : 0
    }));
    
    pino.info({ msg: '[AnalyticsService] Estatísticas de dispositivos processadas' });
    return {
      stats: statsWithPercentage,
      total
    };
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao obter estatísticas de dispositivos', error: error.message });
    throw error;
  }
}

/**
 * Registra métrica do sistema
 * @param {object} data - Dados da métrica
 */
async function recordSystemMetric(data) {
  try {
    await AnalyticsRepository.recordSystemMetric(data);
    pino.info({ msg: '[AnalyticsService] Métrica do sistema registrada', type: data.metricType });
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao registrar métrica do sistema', error: error.message });
    throw error;
  }
}

/**
 * Atualiza analytics diárias (função auxiliar)
 * @param {string} postId - ID do post
 */
async function updateDailyAnalytics(postId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await AnalyticsRepository.updateDailyAnalytics(today, postId);
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro ao atualizar analytics diárias', error: error.message });
    // Não propagar erro para não afetar o registro da visualização
  }
}

/**
 * Processa analytics em lote (para jobs/cron)
 * @param {string} date - Data para processar
 */
async function processBatchAnalytics(date) {
  try {
    pino.info({ msg: '[AnalyticsService] Iniciando processamento em lote', date });
    
    // Agregar dados do dia
    await AnalyticsRepository.aggregateDailyData(date);
    
    // Limpar dados antigos (manter apenas últimos 90 dias de dados detalhados)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    await AnalyticsRepository.cleanupOldData(cutoffDate.toISOString());
    
    pino.info({ msg: '[AnalyticsService] Processamento em lote concluído', date });
  } catch (error) {
    pino.error({ msg: '[AnalyticsService] Erro no processamento em lote', error: error.message });
    throw error;
  }
}

module.exports = {
  getPostAnalytics,
  getDailyAnalytics,
  getSystemMetrics,
  recordPostView,
  getDashboard,
  getPopularPosts,
  getDeviceStats,
  recordSystemMetric,
  processBatchAnalytics
};