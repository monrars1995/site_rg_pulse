const SupabaseAuthService = require('./SupabaseAuthService');
const pino = require('pino')();

class SupabaseAuthController {
  constructor() {
    this.authService = new SupabaseAuthService();
  }

  /**
   * Login com email e senha
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email e senha são obrigatórios.' 
        });
      }

      const { user, session, error } = await this.authService.signIn(email, password);

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      pino.info(`[SupabaseAuthController] Login realizado: ${email}`);
      res.status(200).json({
        message: 'Login realizado com sucesso.',
        user,
        session
      });
    } catch (error) {
      pino.error({ msg: '[SupabaseAuthController] Erro no login', error: error.message });
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }

  /**
   * Verifica se o token é válido
   * GET /api/v1/auth/verify
   */
  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido.' });
      }

      const { user, error } = await this.authService.verifyToken(token);

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      res.status(200).json({
        valid: true,
        user
      });
    } catch (error) {
      pino.error({ msg: '[SupabaseAuthController] Erro na verificação', error: error.message });
      res.status(401).json({ error: 'Token inválido.' });
    }
  }

  /**
   * Middleware para verificar autenticação
   */
  async authenticateAdmin(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido.' });
      }

      const { user, error } = await this.authService.verifyToken(token);

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      req.user = user;
      next();
    } catch (error) {
      pino.error({ msg: '[SupabaseAuthController] Falha na autenticação', error: error.message });
      res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
  }

  /**
   * Criar novo usuário admin
   * POST /api/v1/auth/users
   */
  async createUser(req, res) {
    try {
      const { email, password, username, full_name, role } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ 
          error: 'Email, senha e nome de usuário são obrigatórios.' 
        });
      }

      const { user, error } = await this.authService.createUser({
        email,
        password,
        username,
        full_name,
        role
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      pino.info(`[SupabaseAuthController] Usuário criado: ${email}`);
      res.status(201).json({
        message: 'Usuário criado com sucesso.',
        user
      });
    } catch (error) {
      pino.error({ msg: '[SupabaseAuthController] Erro ao criar usuário', error: error.message });
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }

  /**
   * Listar usuários admin
   * GET /api/v1/auth/users
   */
  async listUsers(req, res) {
    try {
      const { users, error } = await this.authService.listUsers();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ users });
    } catch (error) {
      pino.error({ msg: '[SupabaseAuthController] Erro ao listar usuários', error: error.message });
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }

  /**
   * Atualizar senha
   * PUT /api/v1/auth/password
   */
  async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Senha atual e nova senha são obrigatórias.' 
        });
      }

      // Verificar senha atual
      const { user, error: authError } = await this.authService.signIn(req.user.email, currentPassword);
      if (authError) {
        return res.status(401).json({ error: 'Senha atual incorreta.' });
      }

      const { error } = await this.authService.updatePassword(userId, newPassword);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      pino.info(`[SupabaseAuthController] Senha atualizada para usuário ${userId}`);
      res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
      pino.error({ msg: '[SupabaseAuthController] Erro ao atualizar senha', error: error.message });
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }

  /**
   * Logout do usuário
   */
  async logout(req, res) {
    try {
      const { error } = await this.authService.signOut();
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = SupabaseAuthController;