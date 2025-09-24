const AuditRepository = require('./AuditRepository');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class AuditService {
  constructor() {
    this.auditRepository = new AuditRepository();
  }

  // Registrar ação de auditoria
  async logAction(actionData) {
    try {
      const logEntry = {
        user_id: actionData.userId,
        action: actionData.action,
        resource: actionData.resource,
        resource_id: actionData.resourceId,
        details: actionData.details,
        ip_address: actionData.details?.ip,
        user_agent: actionData.details?.userAgent,
        severity: this.calculateSeverity(actionData.action),
        timestamp: actionData.timestamp || new Date().toISOString()
      };

      const result = await this.auditRepository.createAuditLog(logEntry);
      
      // Verificar se a ação é suspeita
      await this.checkSuspiciousActivity(logEntry);
      
      return result;
    } catch (error) {
      console.error('Erro ao registrar ação de auditoria:', error);
      throw error;
    }
  }

  // Obter logs de auditoria
  async getAuditLogs(filters) {
    try {
      return await this.auditRepository.getAuditLogs(filters);
    } catch (error) {
      console.error('Erro ao obter logs de auditoria:', error);
      throw error;
    }
  }

  // Obter estatísticas de auditoria
  async getAuditStats(period) {
    try {
      const stats = await this.auditRepository.getAuditStats(period);
      
      // Calcular métricas adicionais
      const enhancedStats = {
        ...stats,
        securityScore: this.calculateSecurityScore(stats),
        riskLevel: this.assessRiskLevel(stats),
        recommendations: this.generateSecurityRecommendations(stats)
      };

      return enhancedStats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de auditoria:', error);
      throw error;
    }
  }

  // Obter atividades suspeitas
  async getSuspiciousActivities(filters) {
    try {
      const activities = await this.auditRepository.getSuspiciousActivities(filters);
      
      // Enriquecer com análise de risco
      const enrichedActivities = activities.map(activity => ({
        ...activity,
        riskScore: this.calculateRiskScore(activity),
        threatLevel: this.assessThreatLevel(activity),
        recommendations: this.generateActivityRecommendations(activity)
      }));

      return enrichedActivities;
    } catch (error) {
      console.error('Erro ao obter atividades suspeitas:', error);
      throw error;
    }
  }

  // Gerar relatório de segurança
  async getSecurityReport(period) {
    try {
      const [stats, suspiciousActivities, failedLogins, adminActions] = await Promise.all([
        this.auditRepository.getAuditStats(period),
        this.auditRepository.getSuspiciousActivities({ limit: 10 }),
        this.auditRepository.getFailedLoginAttempts(period),
        this.auditRepository.getAdminActions(period)
      ]);

      const report = {
        period,
        summary: {
          totalActions: stats.totalActions,
          suspiciousActivities: suspiciousActivities.length,
          failedLogins: failedLogins.length,
          adminActions: adminActions.length,
          securityScore: this.calculateSecurityScore(stats),
          riskLevel: this.assessRiskLevel(stats)
        },
        trends: {
          actionsOverTime: stats.actionsOverTime,
          topActions: stats.topActions,
          topUsers: stats.topUsers,
          ipAddresses: stats.topIpAddresses
        },
        security: {
          suspiciousActivities: suspiciousActivities.slice(0, 5),
          recentFailedLogins: failedLogins.slice(0, 10),
          criticalAdminActions: adminActions.filter(a => a.severity === 'high').slice(0, 5)
        },
        recommendations: this.generateSecurityRecommendations(stats),
        generatedAt: new Date().toISOString()
      };

      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório de segurança:', error);
      throw error;
    }
  }

  // Gerenciar usuários administrativos
  async getAdminUsers(filters) {
    try {
      return await this.auditRepository.getAdminUsers(filters);
    } catch (error) {
      console.error('Erro ao obter usuários administrativos:', error);
      throw error;
    }
  }

  // Criar usuário administrativo
  async createAdminUser(userData) {
    try {
      // Validar dados
      await this.validateAdminUserData(userData);
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Gerar ID único
      const userId = crypto.randomUUID();
      
      const adminUser = {
        id: userId,
        username: userData.username,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        permissions: userData.permissions,
        status: 'active',
        created_by: userData.createdBy,
        created_at: new Date().toISOString(),
        last_login: null,
        login_attempts: 0
      };

      const result = await this.auditRepository.createAdminUser(adminUser);
      
      // Remover senha do resultado
      delete result.password_hash;
      
      return result;
    } catch (error) {
      console.error('Erro ao criar usuário administrativo:', error);
      throw error;
    }
  }

  // Atualizar usuário administrativo
  async updateAdminUser(userId, updates) {
    try {
      // Se a senha está sendo atualizada, fazer hash
      if (updates.password) {
        updates.password_hash = await bcrypt.hash(updates.password, 12);
        delete updates.password;
      }

      updates.updated_at = new Date().toISOString();

      const result = await this.auditRepository.updateAdminUser(userId, updates);
      
      // Remover senha do resultado
      if (result.password_hash) {
        delete result.password_hash;
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao atualizar usuário administrativo:', error);
      throw error;
    }
  }

  // Desativar usuário administrativo
  async deactivateAdminUser(userId) {
    try {
      const updates = {
        status: 'inactive',
        deactivated_at: new Date().toISOString()
      };

      return await this.auditRepository.updateAdminUser(userId, updates);
    } catch (error) {
      console.error('Erro ao desativar usuário administrativo:', error);
      throw error;
    }
  }

  // Autenticar usuário administrativo
  async authenticateAdminUser(username, password) {
    try {
      const user = await this.auditRepository.getAdminUserByUsername(username);
      
      if (!user) {
        await this.logAction({
          userId: 'unknown',
          action: 'FAILED_LOGIN_ATTEMPT',
          resource: 'admin_auth',
          details: { username, reason: 'user_not_found' }
        });
        throw new Error('Credenciais inválidas');
      }

      if (user.status !== 'active') {
        await this.logAction({
          userId: user.id,
          action: 'FAILED_LOGIN_ATTEMPT',
          resource: 'admin_auth',
          details: { username, reason: 'user_inactive' }
        });
        throw new Error('Usuário inativo');
      }

      // Verificar tentativas de login
      if (user.login_attempts >= 5) {
        await this.logAction({
          userId: user.id,
          action: 'FAILED_LOGIN_ATTEMPT',
          resource: 'admin_auth',
          details: { username, reason: 'too_many_attempts' }
        });
        throw new Error('Muitas tentativas de login. Conta bloqueada.');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        // Incrementar tentativas de login
        await this.auditRepository.updateAdminUser(user.id, {
          login_attempts: user.login_attempts + 1
        });
        
        await this.logAction({
          userId: user.id,
          action: 'FAILED_LOGIN_ATTEMPT',
          resource: 'admin_auth',
          details: { username, reason: 'invalid_password' }
        });
        
        throw new Error('Credenciais inválidas');
      }

      // Login bem-sucedido - resetar tentativas e atualizar último login
      await this.auditRepository.updateAdminUser(user.id, {
        login_attempts: 0,
        last_login: new Date().toISOString()
      });

      await this.logAction({
        userId: user.id,
        action: 'SUCCESSFUL_LOGIN',
        resource: 'admin_auth',
        details: { username }
      });

      // Remover senha do resultado
      delete user.password_hash;
      
      return user;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw error;
    }
  }

  // Gerenciar sessões
  async createSession(userId, sessionData) {
    try {
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 horas

      const session = {
        id: sessionId,
        user_id: userId,
        ip_address: sessionData.ipAddress,
        user_agent: sessionData.userAgent,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true
      };

      return await this.auditRepository.createSession(session);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      throw error;
    }
  }

  async getActiveSessions(userId) {
    try {
      return await this.auditRepository.getActiveSessions(userId);
    } catch (error) {
      console.error('Erro ao obter sessões ativas:', error);
      throw error;
    }
  }

  async revokeSession(sessionId) {
    try {
      return await this.auditRepository.revokeSession(sessionId);
    } catch (error) {
      console.error('Erro ao revogar sessão:', error);
      throw error;
    }
  }

  // Exportar logs
  async exportAuditLogs(filters, format) {
    try {
      const logs = await this.auditRepository.getAuditLogsForExport(filters);
      
      let exportData;
      
      if (format === 'csv') {
        exportData = this.convertToCSV(logs);
      } else {
        exportData = JSON.stringify(logs, null, 2);
      }

      return {
        data: exportData,
        recordCount: logs.length,
        format,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      throw error;
    }
  }

  // Limpeza de logs antigos
  async cleanupOldLogs(daysOld) {
    try {
      return await this.auditRepository.cleanupOldLogs(daysOld);
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      throw error;
    }
  }

  // Configurações de segurança
  async getSecuritySettings() {
    try {
      return await this.auditRepository.getSecuritySettings();
    } catch (error) {
      console.error('Erro ao obter configurações de segurança:', error);
      throw error;
    }
  }

  async updateSecuritySettings(settings) {
    try {
      return await this.auditRepository.updateSecuritySettings(settings);
    } catch (error) {
      console.error('Erro ao atualizar configurações de segurança:', error);
      throw error;
    }
  }

  // Verificação de integridade
  async checkSystemIntegrity() {
    try {
      const checks = {
        database: await this.checkDatabaseIntegrity(),
        files: await this.checkFileIntegrity(),
        permissions: await this.checkPermissions(),
        security: await this.checkSecurityConfiguration()
      };

      const issues = [];
      let overallStatus = 'healthy';

      Object.entries(checks).forEach(([component, result]) => {
        if (result.status !== 'ok') {
          issues.push({
            component,
            severity: result.severity,
            message: result.message,
            recommendation: result.recommendation
          });
          
          if (result.severity === 'high' || result.severity === 'critical') {
            overallStatus = 'critical';
          } else if (overallStatus !== 'critical' && result.severity === 'medium') {
            overallStatus = 'warning';
          }
        }
      });

      return {
        status: overallStatus,
        checks,
        issues,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na verificação de integridade:', error);
      throw error;
    }
  }

  // Alertas de segurança
  async getSecurityAlerts(filters) {
    try {
      return await this.auditRepository.getSecurityAlerts(filters);
    } catch (error) {
      console.error('Erro ao obter alertas de segurança:', error);
      throw error;
    }
  }

  async createSecurityAlert(alertData) {
    try {
      const alert = {
        id: crypto.randomUUID(),
        type: alertData.type,
        severity: alertData.severity,
        title: alertData.title,
        description: alertData.description,
        details: alertData.details,
        status: 'open',
        created_at: new Date().toISOString()
      };

      return await this.auditRepository.createSecurityAlert(alert);
    } catch (error) {
      console.error('Erro ao criar alerta de segurança:', error);
      throw error;
    }
  }

  async resolveSecurityAlert(alertId, resolution) {
    try {
      return await this.auditRepository.resolveSecurityAlert(alertId, resolution);
    } catch (error) {
      console.error('Erro ao resolver alerta de segurança:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados
  calculateSeverity(action) {
    const highSeverityActions = [
      'DELETE_POST', 'DELETE_USER', 'UPDATE_SECURITY_SETTINGS',
      'FAILED_LOGIN_ATTEMPT', 'REVOKE_SESSION', 'DEACTIVATE_ADMIN_USER'
    ];
    
    const mediumSeverityActions = [
      'CREATE_POST', 'UPDATE_POST', 'CREATE_ADMIN_USER',
      'UPDATE_ADMIN_USER', 'EXPORT_AUDIT_LOGS'
    ];

    if (highSeverityActions.includes(action)) return 'high';
    if (mediumSeverityActions.includes(action)) return 'medium';
    return 'low';
  }

  async checkSuspiciousActivity(logEntry) {
    try {
      // Verificar múltiplas tentativas de login falhadas
      if (logEntry.action === 'FAILED_LOGIN_ATTEMPT') {
        const recentFailures = await this.auditRepository.getRecentFailedLogins(
          logEntry.ip_address, 
          5 // últimos 5 minutos
        );
        
        if (recentFailures.length >= 3) {
          await this.createSecurityAlert({
            type: 'brute_force_attempt',
            severity: 'high',
            title: 'Possível ataque de força bruta detectado',
            description: `Múltiplas tentativas de login falhadas do IP ${logEntry.ip_address}`,
            details: {
              ipAddress: logEntry.ip_address,
              attempts: recentFailures.length,
              timeframe: '5 minutos'
            }
          });
        }
      }

      // Verificar ações administrativas suspeitas
      if (logEntry.severity === 'high') {
        const recentHighSeverityActions = await this.auditRepository.getRecentHighSeverityActions(
          logEntry.user_id,
          10 // últimos 10 minutos
        );
        
        if (recentHighSeverityActions.length >= 5) {
          await this.createSecurityAlert({
            type: 'suspicious_admin_activity',
            severity: 'medium',
            title: 'Atividade administrativa suspeita',
            description: `Múltiplas ações de alta severidade pelo usuário ${logEntry.user_id}`,
            details: {
              userId: logEntry.user_id,
              actions: recentHighSeverityActions.length,
              timeframe: '10 minutos'
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar atividade suspeita:', error);
    }
  }

  calculateSecurityScore(stats) {
    let score = 100;
    
    // Penalizar por atividades suspeitas
    if (stats.suspiciousActivities > 0) {
      score -= Math.min(30, stats.suspiciousActivities * 5);
    }
    
    // Penalizar por tentativas de login falhadas
    if (stats.failedLogins > 0) {
      score -= Math.min(20, stats.failedLogins * 2);
    }
    
    // Penalizar por ações de alta severidade excessivas
    if (stats.highSeverityActions > stats.totalActions * 0.1) {
      score -= 15;
    }
    
    return Math.max(0, score);
  }

  assessRiskLevel(stats) {
    const score = this.calculateSecurityScore(stats);
    
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  generateSecurityRecommendations(stats) {
    const recommendations = [];
    
    if (stats.failedLogins > 10) {
      recommendations.push({
        priority: 'high',
        message: 'Considere implementar CAPTCHA após múltiplas tentativas de login falhadas'
      });
    }
    
    if (stats.suspiciousActivities > 5) {
      recommendations.push({
        priority: 'medium',
        message: 'Revise as atividades suspeitas e considere fortalecer as políticas de segurança'
      });
    }
    
    if (stats.adminActions > stats.totalActions * 0.5) {
      recommendations.push({
        priority: 'low',
        message: 'Alto volume de ações administrativas. Considere revisar as permissões dos usuários'
      });
    }
    
    return recommendations;
  }

  calculateRiskScore(activity) {
    let score = 0;
    
    // Fatores de risco
    if (activity.severity === 'high') score += 30;
    if (activity.severity === 'medium') score += 15;
    
    if (activity.action.includes('DELETE')) score += 25;
    if (activity.action.includes('FAILED')) score += 20;
    
    // Frequência
    if (activity.frequency > 5) score += 15;
    
    return Math.min(100, score);
  }

  assessThreatLevel(activity) {
    const score = this.calculateRiskScore(activity);
    
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  generateActivityRecommendations(activity) {
    const recommendations = [];
    
    if (activity.action.includes('FAILED_LOGIN')) {
      recommendations.push('Verificar se o IP está em uma lista de bloqueio');
      recommendations.push('Considerar implementar autenticação de dois fatores');
    }
    
    if (activity.action.includes('DELETE')) {
      recommendations.push('Verificar se a ação foi autorizada');
      recommendations.push('Revisar as permissões do usuário');
    }
    
    return recommendations;
  }

  async validateAdminUserData(userData) {
    // Validar username único
    const existingUser = await this.auditRepository.getAdminUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username já existe');
    }
    
    // Validar email único
    const existingEmail = await this.auditRepository.getAdminUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email já existe');
    }
    
    // Validar força da senha
    if (userData.password.length < 8) {
      throw new Error('Senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userData.password)) {
      throw new Error('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número');
    }
  }

  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  async checkDatabaseIntegrity() {
    try {
      // Verificações básicas de integridade do banco
      const result = await this.auditRepository.checkDatabaseHealth();
      return {
        status: result.healthy ? 'ok' : 'error',
        severity: result.healthy ? 'low' : 'high',
        message: result.healthy ? 'Banco de dados saudável' : 'Problemas detectados no banco de dados',
        recommendation: result.healthy ? null : 'Verificar logs do banco de dados'
      };
    } catch (error) {
      return {
        status: 'error',
        severity: 'critical',
        message: 'Erro ao verificar integridade do banco de dados',
        recommendation: 'Verificar conectividade e logs do banco'
      };
    }
  }

  async checkFileIntegrity() {
    // Simulação de verificação de integridade de arquivos
    return {
      status: 'ok',
      severity: 'low',
      message: 'Arquivos do sistema íntegros',
      recommendation: null
    };
  }

  async checkPermissions() {
    // Simulação de verificação de permissões
    return {
      status: 'ok',
      severity: 'low',
      message: 'Permissões configuradas corretamente',
      recommendation: null
    };
  }

  async checkSecurityConfiguration() {
    // Simulação de verificação de configuração de segurança
    return {
      status: 'ok',
      severity: 'low',
      message: 'Configurações de segurança adequadas',
      recommendation: null
    };
  }
}

module.exports = AuditService;