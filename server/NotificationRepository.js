require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const pino = require('pino')();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Repository para operações de notificações no banco de dados
 * Gerencia todas as interações com as tabelas de notificações e alertas
 */

/**
 * Obtém lista de notificações com filtros e paginação
 * @param {object} options - Opções de busca
 * @returns {object} Lista paginada de notificações
 */
async function getNotifications(options = {}) {
  try {
    const { page = 1, limit = 20, filters = {} } = options;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Aplicar filtros
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Erro ao buscar notificações: ${error.message}`);
    }
    
    const totalPages = Math.ceil(count / limit);
    
    pino.info({ msg: '[NotificationRepository] Notificações obtidas', count: data?.length, total: count });
    
    return {
      notifications: data || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao obter notificações', error: error.message });
    throw error;
  }
}

/**
 * Obtém contagem de notificações não lidas
 * @returns {number} Contagem de não lidas
 */
async function getUnreadCount() {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false);
    
    if (error) {
      throw new Error(`Erro ao contar notificações não lidas: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Contagem de não lidas obtida', count });
    return count || 0;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao obter contagem não lidas', error: error.message });
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
      action_url: data.action_url,
      metadata: data.metadata || {},
      read: data.read || false,
      created_at: new Date().toISOString()
    };
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao criar notificação: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Notificação criada', id: notification.id });
    return notification;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao criar notificação', error: error.message });
    throw error;
  }
}

/**
 * Marca notificação como lida
 * @param {string} id - ID da notificação
 */
async function markAsRead(id) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Erro ao marcar notificação como lida: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Notificação marcada como lida', id });
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao marcar como lida', error: error.message });
    throw error;
  }
}

/**
 * Marca múltiplas notificações como lidas
 * @param {array} ids - IDs das notificações
 * @returns {number} Número de notificações marcadas
 */
async function markMultipleAsRead(ids) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .in('id', ids)
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Erro ao marcar notificações como lidas: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Notificações marcadas como lidas', count });
    return count || 0;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao marcar múltiplas como lidas', error: error.message });
    throw error;
  }
}

/**
 * Marca todas as notificações como lidas com filtros opcionais
 * @param {object} filters - Filtros opcionais
 * @returns {number} Número de notificações marcadas
 */
async function markAllAsRead(filters = {}) {
  try {
    let query = supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('read', false);
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    const { count, error } = await query.select('id', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Erro ao marcar todas como lidas: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Todas as notificações marcadas como lidas', count });
    return count || 0;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao marcar todas como lidas', error: error.message });
    throw error;
  }
}

/**
 * Remove uma notificação
 * @param {string} id - ID da notificação
 */
async function deleteNotification(id) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Erro ao remover notificação: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Notificação removida', id });
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao remover notificação', error: error.message });
    throw error;
  }
}

/**
 * Remove múltiplas notificações
 * @param {array} ids - IDs das notificações
 * @returns {number} Número de notificações removidas
 */
async function deleteMultiple(ids) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids)
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Erro ao remover notificações: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Notificações removidas', count });
    return count || 0;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao remover múltiplas notificações', error: error.message });
    throw error;
  }
}

/**
 * Remove notificações por filtros
 * @param {object} filters - Filtros
 * @returns {number} Número de notificações removidas
 */
async function deleteByFilters(filters = {}) {
  try {
    let query = supabase.from('notifications').delete();
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }
    
    const { count, error } = await query.select('id', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Erro ao remover notificações por filtros: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Notificações removidas por filtros', count });
    return count || 0;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao remover por filtros', error: error.message });
    throw error;
  }
}

/**
 * Remove notificações antigas
 * @param {string} cutoffDate - Data limite
 * @returns {number} Número de notificações removidas
 */
async function cleanupOldNotifications(cutoffDate) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Erro ao limpar notificações antigas: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Notificações antigas removidas', count, cutoffDate });
    return count || 0;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao limpar notificações antigas', error: error.message });
    throw error;
  }
}

// === CONFIGURAÇÕES DE ALERTAS ===

/**
 * Obtém todas as configurações de alertas
 * @returns {array} Configurações de alertas
 */
async function getAlertSettings() {
  try {
    const { data, error } = await supabase
      .from('alert_settings')
      .select('*')
      .order('alert_type');
    
    if (error) {
      throw new Error(`Erro ao buscar configurações de alertas: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Configurações de alertas obtidas', count: data?.length });
    return data || [];
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao obter configurações de alertas', error: error.message });
    throw error;
  }
}

/**
 * Obtém configuração de alerta específico
 * @param {string} type - Tipo do alerta
 * @returns {object} Configuração do alerta
 */
async function getAlertSetting(type) {
  try {
    const { data, error } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('alert_type', type)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Erro ao buscar configuração de alerta: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Configuração de alerta obtida', type, found: !!data });
    return data;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao obter configuração de alerta', error: error.message });
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
    const updateData = {
      enabled: data.enabled,
      threshold: data.threshold,
      conditions: data.conditions || {},
      actions: data.actions || {},
      updated_at: new Date().toISOString()
    };
    
    // Remover campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const { error } = await supabase
      .from('alert_settings')
      .update(updateData)
      .eq('alert_type', type);
    
    if (error) {
      throw new Error(`Erro ao atualizar configuração de alerta: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Configuração de alerta atualizada', type });
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao atualizar configuração de alerta', error: error.message });
    throw error;
  }
}

/**
 * Atualiza último disparo do alerta
 * @param {string} type - Tipo do alerta
 */
async function updateAlertLastTriggered(type) {
  try {
    const { error } = await supabase
      .from('alert_settings')
      .update({ 
        last_triggered: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('alert_type', type);
    
    if (error) {
      throw new Error(`Erro ao atualizar último disparo: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Último disparo atualizado', type });
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao atualizar último disparo', error: error.message });
    throw error;
  }
}

/**
 * Obtém estatísticas de notificações
 * @param {string} startDate - Data inicial
 * @returns {object} Estatísticas
 */
async function getNotificationStats(startDate) {
  try {
    // Buscar notificações do período
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('type, category, priority, read, created_at')
      .gte('created_at', startDate);
    
    if (error) {
      throw new Error(`Erro ao buscar dados para estatísticas: ${error.message}`);
    }
    
    const stats = {
      total: notifications?.length || 0,
      unread: notifications?.filter(n => !n.read).length || 0,
      byType: {},
      byCategory: {},
      byPriority: {},
      dailyCount: {}
    };
    
    // Processar estatísticas
    (notifications || []).forEach(notification => {
      // Por tipo
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      // Por categoria
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
      
      // Por prioridade
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      
      // Por dia
      const day = notification.created_at.split('T')[0];
      stats.dailyCount[day] = (stats.dailyCount[day] || 0) + 1;
    });
    
    pino.info({ msg: '[NotificationRepository] Estatísticas de notificações calculadas', total: stats.total });
    return stats;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao obter estatísticas', error: error.message });
    throw error;
  }
}

/**
 * Obtém notificação por ID
 * @param {string} id - ID da notificação
 * @returns {object} Notificação
 */
async function getNotificationById(id) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar notificação: ${error.message}`);
    }
    
    pino.info({ msg: '[NotificationRepository] Notificação obtida por ID', id, found: !!data });
    return data;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao obter notificação por ID', error: error.message });
    throw error;
  }
}

/**
 * Obtém contadores gerais
 * @returns {object} Contadores
 */
async function getCounters() {
  try {
    const [totalCount, unreadCount, criticalCount] = await Promise.all([
      supabase.from('notifications').select('id', { count: 'exact', head: true }),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('priority', 'critical')
    ]);
    
    const counters = {
      total: totalCount.count || 0,
      unread: unreadCount.count || 0,
      critical: criticalCount.count || 0
    };
    
    pino.info({ msg: '[NotificationRepository] Contadores obtidos', counters });
    return counters;
  } catch (error) {
    pino.error({ msg: '[NotificationRepository] Erro ao obter contadores', error: error.message });
    throw error;
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteMultiple,
  deleteByFilters,
  cleanupOldNotifications,
  getAlertSettings,
  getAlertSetting,
  updateAlertSetting,
  updateAlertLastTriggered,
  getNotificationStats,
  getNotificationById,
  getCounters
};