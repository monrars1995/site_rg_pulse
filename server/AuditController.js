const AuditService = require('./AuditService');
const jwt = require('jsonwebtoken');

class AuditController {
  constructor() {
    this.auditService = new AuditService();
  }

  // Middleware de autenticação administrativa
  async authenticateAdmin(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado: privilégios administrativos requeridos' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return res.status(401).json({ error: 'Token inválido' });
    }
  }

  // Middleware de log de auditoria
  async logAuditMiddleware(req, res, next) {
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function(data) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log da ação
      setImmediate(async () => {
        try {
          await this.auditService.logAction({
            userId: req.user?.id || 'anonymous',
            action: `${req.method} ${req.path}`,
            resource: req.path,
            details: {
              method: req.method,
              path: req.path,
              query: req.query,
              body: req.method !== 'GET' ? req.body : undefined,
              statusCode: res.statusCode,
              duration,
              userAgent: req.headers['user-agent'],
              ip: req.ip || req.connection.remoteAddress
            },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Erro ao registrar log de auditoria:', error);
        }
      }.bind(this));

      originalSend.call(this, data);
    }.bind(this);

    next();
  }

  // Obter logs de auditoria
  async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        action,
        resource,
        dateFrom,
        dateTo,
        severity
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        action,
        resource,
        dateFrom,
        dateTo,
        severity
      };

      const result = await this.auditService.getAuditLogs(filters);
      res.json(result);
    } catch (error) {
      console.error('Erro ao obter logs de auditoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter estatísticas de auditoria
  async getAuditStats(req, res) {
    try {
      const { period = '7d' } = req.query;
      const stats = await this.auditService.getAuditStats(period);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao obter estatísticas de auditoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter atividades suspeitas
  async getSuspiciousActivities(req, res) {
    try {
      const { limit = 20, severity = 'medium' } = req.query;
      const activities = await this.auditService.getSuspiciousActivities({
        limit: parseInt(limit),
        severity
      });
      res.json(activities);
    } catch (error) {
      console.error('Erro ao obter atividades suspeitas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter relatório de segurança
  async getSecurityReport(req, res) {
    try {
      const { period = '30d' } = req.query;
      const report = await this.auditService.getSecurityReport(period);
      res.json(report);
    } catch (error) {
      console.error('Erro ao gerar relatório de segurança:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Gerenciar usuários administrativos
  async getAdminUsers(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      };

      const result = await this.auditService.getAdminUsers(filters);
      res.json(result);
    } catch (error) {
      console.error('Erro ao obter usuários administrativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Criar usuário administrativo
  async createAdminUser(req, res) {
    try {
      const { username, email, password, role, permissions } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email e password são obrigatórios' });
      }

      const adminUser = await this.auditService.createAdminUser({
        username,
        email,
        password,
        role: role || 'admin',
        permissions: permissions || [],
        createdBy: req.user.id
      });

      // Log da criação
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'CREATE_ADMIN_USER',
        resource: 'admin_users',
        details: {
          createdUserId: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role
        }
      });

      res.status(201).json(adminUser);
    } catch (error) {
      console.error('Erro ao criar usuário administrativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar usuário administrativo
  async updateAdminUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedUser = await this.auditService.updateAdminUser(id, updates);

      // Log da atualização
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'UPDATE_ADMIN_USER',
        resource: 'admin_users',
        details: {
          updatedUserId: id,
          changes: updates
        }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar usuário administrativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Desativar usuário administrativo
  async deactivateAdminUser(req, res) {
    try {
      const { id } = req.params;

      const result = await this.auditService.deactivateAdminUser(id);

      // Log da desativação
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'DEACTIVATE_ADMIN_USER',
        resource: 'admin_users',
        details: {
          deactivatedUserId: id
        }
      });

      res.json(result);
    } catch (error) {
      console.error('Erro ao desativar usuário administrativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter sessões ativas
  async getActiveSessions(req, res) {
    try {
      const { userId } = req.query;
      const sessions = await this.auditService.getActiveSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error('Erro ao obter sessões ativas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Revogar sessão
  async revokeSession(req, res) {
    try {
      const { sessionId } = req.params;

      const result = await this.auditService.revokeSession(sessionId);

      // Log da revogação
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'REVOKE_SESSION',
        resource: 'admin_sessions',
        details: {
          revokedSessionId: sessionId
        }
      });

      res.json(result);
    } catch (error) {
      console.error('Erro ao revogar sessão:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Exportar logs de auditoria
  async exportAuditLogs(req, res) {
    try {
      const {
        format = 'json',
        dateFrom,
        dateTo,
        userId,
        action
      } = req.query;

      const filters = {
        dateFrom,
        dateTo,
        userId,
        action
      };

      const exportData = await this.auditService.exportAuditLogs(filters, format);

      // Log da exportação
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'EXPORT_AUDIT_LOGS',
        resource: 'audit_logs',
        details: {
          format,
          filters,
          recordCount: exportData.recordCount
        }
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
      }

      res.send(exportData.data);
    } catch (error) {
      console.error('Erro ao exportar logs de auditoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Limpar logs antigos
  async cleanupOldLogs(req, res) {
    try {
      const { daysOld = 90 } = req.body;

      const result = await this.auditService.cleanupOldLogs(parseInt(daysOld));

      // Log da limpeza
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'CLEANUP_AUDIT_LOGS',
        resource: 'audit_logs',
        details: {
          daysOld: parseInt(daysOld),
          deletedRecords: result.deletedRecords
        }
      });

      res.json(result);
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter configurações de segurança
  async getSecuritySettings(req, res) {
    try {
      const settings = await this.auditService.getSecuritySettings();
      res.json(settings);
    } catch (error) {
      console.error('Erro ao obter configurações de segurança:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar configurações de segurança
  async updateSecuritySettings(req, res) {
    try {
      const settings = req.body;

      const updatedSettings = await this.auditService.updateSecuritySettings(settings);

      // Log da atualização
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'UPDATE_SECURITY_SETTINGS',
        resource: 'security_settings',
        details: {
          changes: settings
        }
      });

      res.json(updatedSettings);
    } catch (error) {
      console.error('Erro ao atualizar configurações de segurança:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Verificar integridade do sistema
  async checkSystemIntegrity(req, res) {
    try {
      const integrityCheck = await this.auditService.checkSystemIntegrity();

      // Log da verificação
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'SYSTEM_INTEGRITY_CHECK',
        resource: 'system',
        details: {
          status: integrityCheck.status,
          issues: integrityCheck.issues?.length || 0
        }
      });

      res.json(integrityCheck);
    } catch (error) {
      console.error('Erro ao verificar integridade do sistema:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter alertas de segurança
  async getSecurityAlerts(req, res) {
    try {
      const { limit = 20, severity, status } = req.query;
      const filters = {
        limit: parseInt(limit),
        severity,
        status
      };

      const alerts = await this.auditService.getSecurityAlerts(filters);
      res.json(alerts);
    } catch (error) {
      console.error('Erro ao obter alertas de segurança:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Marcar alerta como resolvido
  async resolveSecurityAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { resolution } = req.body;

      const result = await this.auditService.resolveSecurityAlert(alertId, {
        resolution,
        resolvedBy: req.user.id,
        resolvedAt: new Date().toISOString()
      });

      // Log da resolução
      await this.auditService.logAction({
        userId: req.user.id,
        action: 'RESOLVE_SECURITY_ALERT',
        resource: 'security_alerts',
        details: {
          alertId,
          resolution
        }
      });

      res.json(result);
    } catch (error) {
      console.error('Erro ao resolver alerta de segurança:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = AuditController;