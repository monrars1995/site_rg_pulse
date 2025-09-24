const pino = require('pino')();
const NotificationRepository = require('./NotificationRepository');
const AnalyticsService = require('./AnalyticsService');

/**
 * Serviço de notificações e alertas
 * Gerencia criação, processamento e entrega de notificações
 */

/**
 * Obtém lista de notificações com filtros
 * @param {object} options - Opções de filtro e paginação
 * @returns {object} Lista paginada de notificações
 */
async function getNotifications(options = {}) {
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
    } = options;

    const filters = {
      type,
      category,
      priority,
      read,
      startDate,
      endDate
    };

    // Remover filtros undefined
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await NotificationRepository.getNotifications({
      page,
      limit,
      filters
    });

    pino.info({ msg: '[NotificationService] Notificações obtidas', count: result.notifications.length });
    return result;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao obter notificações', error: error.message });
    throw error;
  }
}

/**
 * Obtém contagem de notificações não lidas
 * @returns {number} Contagem de não lidas
 */
async function getUnreadCount() {
  try {
    const count = await NotificationRepository.getUnreadCount();
    pino.info({ msg: '[NotificationService] Contagem de não lidas obtida', count });
    return count;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao obter contagem não lidas', error: error.message });
    throw error;
  }
}

/**
 * Obtém notificações recentes (últimas 24h)
 * @param {number} limit - Limite de resultados
 * @returns {array} Notificações recentes
 */
async function getRecentNotifications(limit = 10) {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const notifications = await NotificationRepository.getNotifications({
      page: 1,
      limit,
      filters: {
        startDate: yesterday.toISOString()
      }
    });

    pino.info({ msg: '[NotificationService] Notificações recentes obtidas', count: notifications.notifications.length });
    return notifications.notifications;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao obter notificações recentes', error: error.message });
    throw error;
  }
}

/**
 * Cria uma nova notificação
 * @param {object} data - Dados da notificação
 * @returns {object} Notificação criada
 */
async function createNotification(data) {
  try {
    const notificationData = {
      type: data.type,
      category: data.category,
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium',
      action_url: data.actionUrl,
      metadata: data.metadata || {},
      read: false
    };

    const notification = await NotificationRepository.createNotification(notificationData);

    // Processar ações automáticas baseadas na prioridade
    if (notification.priority === 'critical') {
      await processCriticalNotification(notification);
    }

    pino.info({ msg: '[NotificationService] Notificação criada', id: notification.id, type: notification.type });
    return notification;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao criar notificação', error: error.message });
    throw error;
  }
}

/**
 * Marca notificação como lida
 * @param {string} id - ID da notificação
 */
async function markAsRead(id) {
  try {
    await NotificationRepository.markAsRead(id);
    pino.info({ msg: '[NotificationService] Notificação marcada como lida', id });
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao marcar como lida', error: error.message });
    throw error;
  }
}

/**
 * Marca todas as notificações como lidas
 * @param {object} filters - Filtros opcionais
 * @returns {number} Número de notificações marcadas
 */
async function markAllAsRead(filters = {}) {
  try {
    const count = await NotificationRepository.markAllAsRead(filters);
    pino.info({ msg: '[NotificationService] Notificações marcadas como lidas', count });
    return count;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao marcar todas como lidas', error: error.message });
    throw error;
  }
}

/**
 * Remove uma notificação
 * @param {string} id - ID da notificação
 */
async function deleteNotification(id) {
  try {
    await NotificationRepository.deleteNotification(id);
    pino.info({ msg: '[NotificationService] Notificação removida', id });
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao remover notificação', error: error.message });
    throw error;
  }
}

/**
 * Remove notificações antigas
 * @param {number} days - Dias para manter
 * @returns {number} Número de notificações removidas
 */
async function cleanupOldNotifications(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const count = await NotificationRepository.cleanupOldNotifications(cutoffDate.toISOString());
    pino.info({ msg: '[NotificationService] Limpeza de notificações concluída', count, days });
    return count;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro na limpeza de notificações', error: error.message });
    throw error;
  }
}

// === SISTEMA DE ALERTAS ===

/**
 * Obtém configurações de alertas
 * @returns {array} Configurações de alertas
 */
async function getAlertSettings() {
  try {
    const settings = await NotificationRepository.getAlertSettings();
    pino.info({ msg: '[NotificationService] Configurações de alertas obtidas', count: settings.length });
    return settings;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao obter configurações de alertas', error: error.message });
    throw error;
  }
}

/**
 * Atualiza configuração de alerta
 * @param {string} type - Tipo do alerta
 * @param {object} data - Dados da configuração
 */
async function updateAlertSetting(type, data) {
  try {
    await NotificationRepository.updateAlertSetting(type, data);
    pino.info({ msg: '[NotificationService] Configuração de alerta atualizada', type });
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao atualizar configuração de alerta', error: error.message });
    throw error;
  }
}

/**
 * Testa um alerta específico
 * @param {string} type - Tipo do alerta
 * @param {object} testData - Dados de teste
 * @returns {object} Resultado do teste
 */
async function testAlert(type, testData = {}) {
  try {
    const setting = await NotificationRepository.getAlertSetting(type);
    
    if (!setting) {
      throw new Error(`Configuração de alerta não encontrada: ${type}`);
    }

    // Simular condições do alerta
    const testResult = await simulateAlertConditions(setting, testData);
    
    if (testResult.triggered) {
      // Criar notificação de teste
      await createNotification({
        type: 'test',
        category: 'system',
        title: `Teste de Alerta: ${setting.alert_type}`,
        message: `Alerta testado com sucesso. Condições: ${JSON.stringify(testResult.conditions)}`,
        priority: 'low',
        metadata: {
          test: true,
          originalType: type,
          testData,
          result: testResult
        }
      });
    }

    pino.info({ msg: '[NotificationService] Teste de alerta executado', type, triggered: testResult.triggered });
    return testResult;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao testar alerta', error: error.message });
    throw error;
  }
}

/**
 * Processa alertas automáticos (para ser chamado por cron/scheduler)
 */
async function processAutomaticAlerts() {
  try {
    pino.info({ msg: '[NotificationService] Iniciando processamento de alertas automáticos' });
    
    const settings = await getAlertSettings();
    const enabledSettings = settings.filter(s => s.enabled);
    
    for (const setting of enabledSettings) {
      try {
        await processAlert(setting);
      } catch (alertError) {
        pino.error({ 
          msg: '[NotificationService] Erro ao processar alerta específico', 
          type: setting.alert_type, 
          error: alertError.message 
        });
      }
    }
    
    pino.info({ msg: '[NotificationService] Processamento de alertas automáticos concluído', count: enabledSettings.length });
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro no processamento de alertas automáticos', error: error.message });
    throw error;
  }
}

/**
 * Processa um alerta específico
 * @param {object} setting - Configuração do alerta
 */
async function processAlert(setting) {
  try {
    const { alert_type, threshold, conditions, actions } = setting;
    
    // Obter dados relevantes baseado no tipo de alerta
    const alertData = await getAlertData(alert_type);
    
    // Verificar condições
    const triggered = await checkAlertConditions(alertData, threshold, conditions);
    
    if (triggered) {
      // Executar ações configuradas
      await executeAlertActions(alert_type, alertData, actions);
      
      // Registrar último disparo
      await NotificationRepository.updateAlertLastTriggered(alert_type);
    }
    
    pino.info({ msg: '[NotificationService] Alerta processado', type: alert_type, triggered });
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao processar alerta', type: setting.alert_type, error: error.message });
    throw error;
  }
}

/**
 * Obtém dados para verificação de alerta
 * @param {string} alertType - Tipo do alerta
 * @returns {object} Dados do alerta
 */
async function getAlertData(alertType) {
  try {
    switch (alertType) {
      case 'high_traffic':
        return await AnalyticsService.getDailyAnalytics({ limit: 1 });
      
      case 'low_performance':
        return await AnalyticsService.getSystemMetrics({ 
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
        });
      
      case 'error_rate':
        return await AnalyticsService.getSystemMetrics({ 
          metricType: 'error_rate',
          startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString() 
        });
      
      case 'storage_usage':
        return await AnalyticsService.getSystemMetrics({ 
          metricType: 'storage_usage' 
        });
      
      default:
        return {};
    }
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao obter dados do alerta', alertType, error: error.message });
    return {};
  }
}

/**
 * Verifica condições do alerta
 * @param {object} data - Dados para verificação
 * @param {number} threshold - Limite configurado
 * @param {object} conditions - Condições adicionais
 * @returns {boolean} Se o alerta deve ser disparado
 */
async function checkAlertConditions(data, threshold, conditions = {}) {
  try {
    // Implementar lógica específica baseada no tipo de dados
    if (data.analytics && data.analytics.length > 0) {
      const latest = data.analytics[0];
      return latest.total_views > threshold;
    }
    
    if (data.metrics) {
      // Verificar métricas do sistema
      const criticalMetrics = Object.values(data.metrics).filter(metric => 
        metric.current > threshold
      );
      return criticalMetrics.length > 0;
    }
    
    return false;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao verificar condições do alerta', error: error.message });
    return false;
  }
}

/**
 * Executa ações do alerta
 * @param {string} alertType - Tipo do alerta
 * @param {object} data - Dados do alerta
 * @param {object} actions - Ações configuradas
 */
async function executeAlertActions(alertType, data, actions = {}) {
  try {
    if (actions.create_notification !== false) {
      await createNotification({
        type: 'alert',
        category: 'system',
        title: getAlertTitle(alertType),
        message: getAlertMessage(alertType, data),
        priority: actions.priority || 'high',
        metadata: {
          alertType,
          data,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (actions.email_notification) {
      // Implementar envio de email (placeholder)
      pino.info({ msg: '[NotificationService] Email de alerta seria enviado', alertType });
    }
    
    if (actions.webhook_url) {
      // Implementar webhook (placeholder)
      pino.info({ msg: '[NotificationService] Webhook seria chamado', alertType, url: actions.webhook_url });
    }
    
    pino.info({ msg: '[NotificationService] Ações do alerta executadas', alertType });
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao executar ações do alerta', error: error.message });
    throw error;
  }
}

/**
 * Obtém estatísticas de notificações
 * @param {string} period - Período (7d, 30d, etc.)
 * @returns {object} Estatísticas
 */
async function getNotificationStats(period = '7d') {
  try {
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stats = await NotificationRepository.getNotificationStats(startDate.toISOString());
    
    pino.info({ msg: '[NotificationService] Estatísticas de notificações obtidas', period });
    return stats;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao obter estatísticas', error: error.message });
    throw error;
  }
}

/**
 * Executa ação em lote
 * @param {string} action - Ação a executar
 * @param {object} options - Opções da ação
 * @returns {object} Resultado da ação
 */
async function bulkAction(action, options = {}) {
  try {
    const { notificationIds, filters } = options;
    
    let result = { count: 0 };
    
    switch (action) {
      case 'mark_read':
        if (notificationIds) {
          result.count = await NotificationRepository.markMultipleAsRead(notificationIds);
        } else {
          result.count = await markAllAsRead(filters);
        }
        break;
        
      case 'delete':
        if (notificationIds) {
          result.count = await NotificationRepository.deleteMultiple(notificationIds);
        } else {
          result.count = await NotificationRepository.deleteByFilters(filters);
        }
        break;
        
      default:
        throw new Error(`Ação não suportada: ${action}`);
    }
    
    pino.info({ msg: '[NotificationService] Ação em lote executada', action, count: result.count });
    return result;
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro na ação em lote', error: error.message });
    throw error;
  }
}

// === FUNÇÕES AUXILIARES ===

/**
 * Processa notificação crítica
 * @param {object} notification - Notificação crítica
 */
async function processCriticalNotification(notification) {
  try {
    // Implementar lógica para notificações críticas
    // Ex: envio imediato, escalação, etc.
    pino.warn({ msg: '[NotificationService] Notificação crítica processada', id: notification.id });
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro ao processar notificação crítica', error: error.message });
  }
}

/**
 * Simula condições de alerta para teste
 * @param {object} setting - Configuração do alerta
 * @param {object} testData - Dados de teste
 * @returns {object} Resultado da simulação
 */
async function simulateAlertConditions(setting, testData) {
  try {
    // Simular condições baseadas no tipo de alerta
    const mockData = testData.value || setting.threshold + 1;
    const triggered = mockData > setting.threshold;
    
    return {
      triggered,
      conditions: {
        threshold: setting.threshold,
        currentValue: mockData,
        exceeded: triggered
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    pino.error({ msg: '[NotificationService] Erro na simulação de alerta', error: error.message });
    return { triggered: false, error: error.message };
  }
}

/**
 * Obtém título do alerta baseado no tipo
 * @param {string} alertType - Tipo do alerta
 * @returns {string} Título
 */
function getAlertTitle(alertType) {
  const titles = {
    high_traffic: 'Alto Tráfego Detectado',
    low_performance: 'Performance Baixa',
    error_rate: 'Taxa de Erro Elevada',
    storage_usage: 'Uso de Armazenamento Alto'
  };
  
  return titles[alertType] || 'Alerta do Sistema';
}

/**
 * Obtém mensagem do alerta baseado no tipo e dados
 * @param {string} alertType - Tipo do alerta
 * @param {object} data - Dados do alerta
 * @returns {string} Mensagem
 */
function getAlertMessage(alertType, data) {
  const messages = {
    high_traffic: `Tráfego elevado detectado. Visualizações: ${data.analytics?.[0]?.total_views || 'N/A'}`,
    low_performance: 'Performance do sistema abaixo do esperado',
    error_rate: 'Taxa de erro acima do limite configurado',
    storage_usage: 'Uso de armazenamento próximo do limite'
  };
  
  return messages[alertType] || 'Condição de alerta detectada';
}

module.exports = {
  getNotifications,
  getUnreadCount,
  getRecentNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
  getAlertSettings,
  updateAlertSetting,
  testAlert,
  processAutomaticAlerts,
  getNotificationStats,
  bulkAction
};