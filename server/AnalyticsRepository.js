require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const pino = require('pino')();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Repository para operações de analytics no banco de dados
 * Gerencia todas as interações com as tabelas de analytics
 */

/**
 * Obtém analytics de um post específico
 * @param {string} postId - ID do post
 * @param {object} options - Opções de filtro
 * @returns {array} Analytics do post
 */
async function getPostAnalytics(postId, options = {}) {
  try {
    const { startDate, endDate } = options;
    
    let query = supabase
      .from('post_analytics')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Erro ao buscar analytics do post: ${error.message}`);
    }
    
    pino.info({ msg: '[AnalyticsRepository] Analytics do post obtidas', postId, count: data?.length });
    return data || [];
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao obter analytics do post', error: error.message });
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
    
    let query = supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    
    if (startDate) {
      query = query.gte('date', startDate.split('T')[0]);
    }
    
    if (endDate) {
      query = query.lte('date', endDate.split('T')[0]);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Erro ao buscar analytics diárias: ${error.message}`);
    }
    
    pino.info({ msg: '[AnalyticsRepository] Analytics diárias obtidas', count: data?.length });
    return data || [];
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao obter analytics diárias', error: error.message });
    throw error;
  }
}

/**
 * Obtém métricas do sistema
 * @param {object} options - Opções de filtro
 * @returns {array} Métricas do sistema
 */
async function getSystemMetrics(options = {}) {
  try {
    const { startDate, endDate, metricType } = options;
    
    let query = supabase
      .from('system_metrics')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    if (metricType) {
      query = query.eq('metric_type', metricType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Erro ao buscar métricas do sistema: ${error.message}`);
    }
    
    pino.info({ msg: '[AnalyticsRepository] Métricas do sistema obtidas', count: data?.length });
    return data || [];
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao obter métricas do sistema', error: error.message });
    throw error;
  }
}

/**
 * Registra uma visualização de post
 * @param {object} data - Dados da visualização
 */
async function recordPostView(data) {
  try {
    const { error } = await supabase
      .from('post_analytics')
      .insert([{
        post_id: data.post_id,
        session_id: data.session_id,
        user_agent: data.user_agent,
        referrer: data.referrer,
        device_type: data.device_type,
        time_on_page: data.time_on_page,
        ip_address: data.ip_address,
        views: data.views,
        bounce_rate: data.bounce_rate,
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      throw new Error(`Erro ao registrar visualização: ${error.message}`);
    }
    
    pino.info({ msg: '[AnalyticsRepository] Visualização registrada', postId: data.post_id });
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao registrar visualização', error: error.message });
    throw error;
  }
}

/**
 * Obtém posts mais populares
 * @param {object} options - Opções de filtro
 * @returns {array} Posts populares
 */
async function getPopularPosts(options = {}) {
  try {
    const { startDate, limit = 10 } = options;
    
    // Query complexa para obter posts mais populares
    let query = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.created_at,
        COALESCE(SUM(pa.views), 0) as total_views,
        COUNT(DISTINCT pa.session_id) as unique_sessions
      FROM posts p
      LEFT JOIN post_analytics pa ON p.id = pa.post_id
    `;
    
    const params = [];
    
    if (startDate) {
      query += ` WHERE pa.created_at >= $1`;
      params.push(startDate);
    }
    
    query += `
      GROUP BY p.id, p.title, p.slug, p.created_at
      ORDER BY total_views DESC
      LIMIT $${params.length + 1}
    `;
    
    params.push(limit);
    
    const { data, error } = await supabase.rpc('execute_sql', {
      query,
      params
    });
    
    if (error) {
      // Fallback para query mais simples se RPC não estiver disponível
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          slug,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (fallbackError) {
        throw new Error(`Erro ao buscar posts populares: ${fallbackError.message}`);
      }
      
      pino.warn({ msg: '[AnalyticsRepository] Usando fallback para posts populares' });
      return fallbackData || [];
    }
    
    pino.info({ msg: '[AnalyticsRepository] Posts populares obtidos', count: data?.length });
    return data || [];
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao obter posts populares', error: error.message });
    throw error;
  }
}

/**
 * Obtém estatísticas de dispositivos
 * @param {object} options - Opções de filtro
 * @returns {array} Estatísticas de dispositivos
 */
async function getDeviceStats(options = {}) {
  try {
    const { startDate, endDate } = options;
    
    let query = supabase
      .from('post_analytics')
      .select('device_type, views')
      .not('device_type', 'is', null);
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Erro ao buscar estatísticas de dispositivos: ${error.message}`);
    }
    
    // Agregar por tipo de dispositivo
    const deviceStats = (data || []).reduce((acc, record) => {
      const device = record.device_type || 'unknown';
      const existing = acc.find(item => item.device_type === device);
      
      if (existing) {
        existing.views += record.views || 0;
      } else {
        acc.push({
          device_type: device,
          views: record.views || 0
        });
      }
      
      return acc;
    }, []);
    
    pino.info({ msg: '[AnalyticsRepository] Estatísticas de dispositivos obtidas', count: deviceStats.length });
    return deviceStats;
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao obter estatísticas de dispositivos', error: error.message });
    throw error;
  }
}

/**
 * Registra métrica do sistema
 * @param {object} data - Dados da métrica
 */
async function recordSystemMetric(data) {
  try {
    const { error } = await supabase
      .from('system_metrics')
      .insert([{
        metric_type: data.metricType,
        value: data.value,
        unit: data.unit,
        metadata: data.metadata || {},
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      throw new Error(`Erro ao registrar métrica do sistema: ${error.message}`);
    }
    
    pino.info({ msg: '[AnalyticsRepository] Métrica do sistema registrada', type: data.metricType });
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao registrar métrica do sistema', error: error.message });
    throw error;
  }
}

/**
 * Atualiza analytics diárias
 * @param {string} date - Data (YYYY-MM-DD)
 * @param {string} postId - ID do post (opcional)
 */
async function updateDailyAnalytics(date, postId = null) {
  try {
    // Verificar se já existe registro para a data
    const { data: existing } = await supabase
      .from('daily_analytics')
      .select('*')
      .eq('date', date)
      .single();
    
    // Calcular métricas do dia
    let query = supabase
      .from('post_analytics')
      .select('views, session_id')
      .gte('created_at', `${date}T00:00:00.000Z`)
      .lt('created_at', `${date}T23:59:59.999Z`);
    
    if (postId) {
      query = query.eq('post_id', postId);
    }
    
    const { data: dayData, error: dayError } = await query;
    
    if (dayError) {
      throw new Error(`Erro ao calcular métricas diárias: ${dayError.message}`);
    }
    
    const totalViews = (dayData || []).reduce((sum, record) => sum + (record.views || 0), 0);
    const uniqueSessions = new Set((dayData || []).map(record => record.session_id)).size;
    
    const analyticsData = {
      date,
      total_views: totalViews,
      total_sessions: uniqueSessions,
      unique_visitors: uniqueSessions, // Simplificação: sessões únicas = visitantes únicos
      avg_time_on_page: 0, // Será calculado em processamento posterior
      bounce_rate: 0, // Será calculado em processamento posterior
      updated_at: new Date().toISOString()
    };
    
    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('daily_analytics')
        .update(analyticsData)
        .eq('date', date);
      
      if (updateError) {
        throw new Error(`Erro ao atualizar analytics diárias: ${updateError.message}`);
      }
    } else {
      // Criar novo registro
      const { error: insertError } = await supabase
        .from('daily_analytics')
        .insert([analyticsData]);
      
      if (insertError) {
        throw new Error(`Erro ao inserir analytics diárias: ${insertError.message}`);
      }
    }
    
    pino.info({ msg: '[AnalyticsRepository] Analytics diárias atualizadas', date, totalViews });
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao atualizar analytics diárias', error: error.message });
    throw error;
  }
}

/**
 * Agrega dados diários (para processamento em lote)
 * @param {string} date - Data para agregar
 */
async function aggregateDailyData(date) {
  try {
    // Buscar todos os dados do dia
    const { data: dayData, error } = await supabase
      .from('post_analytics')
      .select('*')
      .gte('created_at', `${date}T00:00:00.000Z`)
      .lt('created_at', `${date}T23:59:59.999Z`);
    
    if (error) {
      throw new Error(`Erro ao buscar dados para agregação: ${error.message}`);
    }
    
    if (!dayData || dayData.length === 0) {
      pino.info({ msg: '[AnalyticsRepository] Nenhum dado para agregar', date });
      return;
    }
    
    // Calcular métricas agregadas
    const totalViews = dayData.reduce((sum, record) => sum + (record.views || 0), 0);
    const uniqueSessions = new Set(dayData.map(record => record.session_id)).size;
    const avgTimeOnPage = dayData.length > 0 
      ? dayData.reduce((sum, record) => sum + (record.time_on_page || 0), 0) / dayData.length 
      : 0;
    const bounceRate = dayData.length > 0
      ? dayData.reduce((sum, record) => sum + (record.bounce_rate || 0), 0) / dayData.length
      : 0;
    
    // Atualizar ou inserir dados agregados
    await updateDailyAnalytics(date);
    
    // Atualizar campos calculados
    const { error: updateError } = await supabase
      .from('daily_analytics')
      .update({
        avg_time_on_page: Math.round(avgTimeOnPage),
        bounce_rate: Math.round(bounceRate * 100) / 100
      })
      .eq('date', date);
    
    if (updateError) {
      throw new Error(`Erro ao atualizar campos calculados: ${updateError.message}`);
    }
    
    pino.info({ msg: '[AnalyticsRepository] Dados diários agregados', date, totalViews, uniqueSessions });
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao agregar dados diários', error: error.message });
    throw error;
  }
}

/**
 * Remove dados antigos (limpeza)
 * @param {string} cutoffDate - Data limite
 */
async function cleanupOldData(cutoffDate) {
  try {
    // Remover dados de post_analytics mais antigos que a data limite
    const { error: analyticsError } = await supabase
      .from('post_analytics')
      .delete()
      .lt('created_at', cutoffDate);
    
    if (analyticsError) {
      throw new Error(`Erro ao limpar dados de analytics: ${analyticsError.message}`);
    }
    
    // Remover métricas de sistema antigas
    const { error: metricsError } = await supabase
      .from('system_metrics')
      .delete()
      .lt('created_at', cutoffDate);
    
    if (metricsError) {
      throw new Error(`Erro ao limpar métricas do sistema: ${metricsError.message}`);
    }
    
    pino.info({ msg: '[AnalyticsRepository] Dados antigos removidos', cutoffDate });
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao limpar dados antigos', error: error.message });
    throw error;
  }
}

/**
 * Obtém estatísticas gerais do banco
 * @returns {object} Estatísticas
 */
async function getDatabaseStats() {
  try {
    const [postsCount, analyticsCount, dailyCount, metricsCount] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('post_analytics').select('id', { count: 'exact', head: true }),
      supabase.from('daily_analytics').select('date', { count: 'exact', head: true }),
      supabase.from('system_metrics').select('id', { count: 'exact', head: true })
    ]);
    
    const stats = {
      posts: postsCount.count || 0,
      analytics_records: analyticsCount.count || 0,
      daily_records: dailyCount.count || 0,
      system_metrics: metricsCount.count || 0
    };
    
    pino.info({ msg: '[AnalyticsRepository] Estatísticas do banco obtidas', stats });
    return stats;
  } catch (error) {
    pino.error({ msg: '[AnalyticsRepository] Erro ao obter estatísticas do banco', error: error.message });
    throw error;
  }
}

module.exports = {
  getPostAnalytics,
  getDailyAnalytics,
  getSystemMetrics,
  recordPostView,
  getPopularPosts,
  getDeviceStats,
  recordSystemMetric,
  updateDailyAnalytics,
  aggregateDailyData,
  cleanupOldData,
  getDatabaseStats
};