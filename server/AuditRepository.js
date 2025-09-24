require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

class AuditRepository {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  // Logs de auditoria
  async createAuditLog(logData) {
    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .insert([logData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error);
      throw error;
    }
  }

  async getAuditLogs(filters = {}) {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*');

      // Aplicar filtros
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.resource) {
        query = query.eq('resource', filters.resource);
      }
      
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }
      
      if (filters.ipAddress) {
        query = query.eq('ip_address', filters.ipAddress);
      }

      // Paginação
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      query = query
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao obter logs de auditoria:', error);
      throw error;
    }
  }

  async getAuditStats(period = '7d') {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      // Total de ações
      const { count: totalActions } = await this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', startDate);

      // Ações por severidade
      const { data: severityStats } = await this.supabase
        .from('audit_logs')
        .select('severity')
        .gte('timestamp', startDate);

      // Top ações
      const { data: actionStats } = await this.supabase
        .from('audit_logs')
        .select('action')
        .gte('timestamp', startDate);

      // Top usuários
      const { data: userStats } = await this.supabase
        .from('audit_logs')
        .select('user_id')
        .gte('timestamp', startDate)
        .not('user_id', 'is', null);

      // Top IPs
      const { data: ipStats } = await this.supabase
        .from('audit_logs')
        .select('ip_address')
        .gte('timestamp', startDate)
        .not('ip_address', 'is', null);

      // Ações ao longo do tempo
      const { data: timeStats } = await this.supabase
        .from('audit_logs')
        .select('timestamp')
        .gte('timestamp', startDate)
        .order('timestamp');

      // Processar estatísticas
      const severityCounts = this.countOccurrences(severityStats, 'severity');
      const actionCounts = this.countOccurrences(actionStats, 'action');
      const userCounts = this.countOccurrences(userStats, 'user_id');
      const ipCounts = this.countOccurrences(ipStats, 'ip_address');
      const actionsOverTime = this.groupByTimeInterval(timeStats, period);

      return {
        totalActions,
        period,
        severityBreakdown: severityCounts,
        topActions: Object.entries(actionCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([action, count]) => ({ action, count })),
        topUsers: Object.entries(userCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([userId, count]) => ({ userId, count })),
        topIpAddresses: Object.entries(ipCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([ipAddress, count]) => ({ ipAddress, count })),
        actionsOverTime,
        highSeverityActions: severityCounts.high || 0,
        failedLogins: actionCounts.FAILED_LOGIN_ATTEMPT || 0,
        adminActions: actionCounts.CREATE_ADMIN_USER + actionCounts.UPDATE_ADMIN_USER + actionCounts.DEACTIVATE_ADMIN_USER || 0,
        suspiciousActivities: await this.countSuspiciousActivities(startDate)
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de auditoria:', error);
      throw error;
    }
  }

  async getSuspiciousActivities(filters = {}) {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .or('action.eq.FAILED_LOGIN_ATTEMPT,severity.eq.high');

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      const limit = filters.limit || 20;
      query = query
        .order('timestamp', { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por tipo de atividade suspeita
      const grouped = data.reduce((acc, log) => {
        const key = `${log.action}_${log.ip_address || log.user_id}`;
        if (!acc[key]) {
          acc[key] = {
            type: log.action,
            identifier: log.ip_address || log.user_id,
            count: 0,
            firstSeen: log.timestamp,
            lastSeen: log.timestamp,
            severity: log.severity,
            details: []
          };
        }
        acc[key].count++;
        acc[key].lastSeen = log.timestamp;
        acc[key].details.push({
          timestamp: log.timestamp,
          resource: log.resource,
          details: log.details
        });
        return acc;
      }, {});

      return Object.values(grouped)
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Erro ao obter atividades suspeitas:', error);
      throw error;
    }
  }

  async getFailedLoginAttempts(period = '24h') {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'FAILED_LOGIN_ATTEMPT')
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter tentativas de login falhadas:', error);
      throw error;
    }
  }

  async getAdminActions(period = '24h') {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .in('action', [
          'CREATE_ADMIN_USER', 'UPDATE_ADMIN_USER', 'DEACTIVATE_ADMIN_USER',
          'UPDATE_SECURITY_SETTINGS', 'EXPORT_AUDIT_LOGS', 'CLEANUP_LOGS'
        ])
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter ações administrativas:', error);
      throw error;
    }
  }

  async getRecentFailedLogins(ipAddress, minutes = 5) {
    try {
      const startDate = new Date();
      startDate.setMinutes(startDate.getMinutes() - minutes);
      
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'FAILED_LOGIN_ATTEMPT')
        .eq('ip_address', ipAddress)
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter tentativas de login recentes:', error);
      throw error;
    }
  }

  async getRecentHighSeverityActions(userId, minutes = 10) {
    try {
      const startDate = new Date();
      startDate.setMinutes(startDate.getMinutes() - minutes);
      
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('severity', 'high')
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter ações de alta severidade recentes:', error);
      throw error;
    }
  }

  // Usuários administrativos
  async getAdminUsers(filters = {}) {
    try {
      let query = this.supabase
        .from('admin_users')
        .select('id, username, email, role, permissions, status, created_at, last_login, login_attempts');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao obter usuários administrativos:', error);
      throw error;
    }
  }

  async getAdminUserByUsername(username) {
    try {
      const { data, error } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter usuário por username:', error);
      throw error;
    }
  }

  async getAdminUserByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter usuário por email:', error);
      throw error;
    }
  }

  async createAdminUser(userData) {
    try {
      const { data, error } = await this.supabase
        .from('admin_users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar usuário administrativo:', error);
      throw error;
    }
  }

  async updateAdminUser(userId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('admin_users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar usuário administrativo:', error);
      throw error;
    }
  }

  // Sessões
  async createSession(sessionData) {
    try {
      const { data, error } = await this.supabase
        .from('admin_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      throw error;
    }
  }

  async getActiveSessions(userId) {
    try {
      const { data, error } = await this.supabase
        .from('admin_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter sessões ativas:', error);
      throw error;
    }
  }

  async revokeSession(sessionId) {
    try {
      const { data, error } = await this.supabase
        .from('admin_sessions')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao revogar sessão:', error);
      throw error;
    }
  }

  // Exportação e limpeza
  async getAuditLogsForExport(filters = {}) {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*');

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }
      
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      query = query.order('timestamp', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao obter logs para exportação:', error);
      throw error;
    }
  }

  async cleanupOldLogs(daysOld) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { data, error } = await this.supabase
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;
      
      return {
        deletedCount: data.length,
        cutoffDate: cutoffDate.toISOString()
      };
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      throw error;
    }
  }

  // Configurações de segurança
  async getSecuritySettings() {
    try {
      const { data, error } = await this.supabase
        .from('security_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Retornar configurações padrão se não existirem
      return data || {
        max_login_attempts: 5,
        session_timeout_hours: 8,
        password_min_length: 8,
        require_2fa: false,
        auto_lock_after_failed_attempts: true,
        log_retention_days: 90,
        alert_on_suspicious_activity: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter configurações de segurança:', error);
      throw error;
    }
  }

  async updateSecuritySettings(settings) {
    try {
      settings.updated_at = new Date().toISOString();
      
      const { data, error } = await this.supabase
        .from('security_settings')
        .upsert([settings])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar configurações de segurança:', error);
      throw error;
    }
  }

  // Alertas de segurança
  async getSecurityAlerts(filters = {}) {
    try {
      let query = this.supabase
        .from('security_alerts')
        .select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      const limit = filters.limit || 50;
      query = query
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erro ao obter alertas de segurança:', error);
      throw error;
    }
  }

  async createSecurityAlert(alertData) {
    try {
      const { data, error } = await this.supabase
        .from('security_alerts')
        .insert([alertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar alerta de segurança:', error);
      throw error;
    }
  }

  async resolveSecurityAlert(alertId, resolution) {
    try {
      const { data, error } = await this.supabase
        .from('security_alerts')
        .update({
          status: 'resolved',
          resolution: resolution.description,
          resolved_by: resolution.resolvedBy,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao resolver alerta de segurança:', error);
      throw error;
    }
  }

  // Verificação de integridade
  async checkDatabaseHealth() {
    try {
      // Teste simples de conectividade
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('id')
        .limit(1);

      return {
        healthy: !error,
        error: error?.message
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // Métodos auxiliares
  getStartDateForPeriod(period) {
    const now = new Date();
    
    switch (period) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  countOccurrences(data, field) {
    return data.reduce((acc, item) => {
      const value = item[field];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  groupByTimeInterval(data, period) {
    const intervals = {};
    const intervalSize = this.getIntervalSize(period);
    
    data.forEach(item => {
      const timestamp = new Date(item.timestamp);
      const intervalKey = this.getIntervalKey(timestamp, intervalSize);
      intervals[intervalKey] = (intervals[intervalKey] || 0) + 1;
    });
    
    return Object.entries(intervals)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  getIntervalSize(period) {
    switch (period) {
      case '1h':
      case '24h':
        return 'hour';
      case '7d':
        return 'day';
      case '30d':
      case '90d':
        return 'week';
      default:
        return 'day';
    }
  }

  getIntervalKey(timestamp, intervalSize) {
    switch (intervalSize) {
      case 'hour':
        return timestamp.toISOString().substring(0, 13) + ':00:00.000Z';
      case 'day':
        return timestamp.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      case 'week':
        const weekStart = new Date(timestamp);
        weekStart.setDate(timestamp.getDate() - timestamp.getDay());
        return weekStart.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      default:
        return timestamp.toISOString().substring(0, 10) + 'T00:00:00.000Z';
    }
  }

  async countSuspiciousActivities(startDate) {
    try {
      const { count } = await this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .or('action.eq.FAILED_LOGIN_ATTEMPT,severity.eq.high')
        .gte('timestamp', startDate);

      return count || 0;
    } catch (error) {
      console.error('Erro ao contar atividades suspeitas:', error);
      return 0;
    }
  }
}

module.exports = AuditRepository;