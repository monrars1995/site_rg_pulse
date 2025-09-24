require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const pino = require('pino')();

class SupabaseAuthService {
  constructor() {
    // Cliente para autenticação de usuários (usa ANON_KEY)
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Cliente administrativo para operações que requerem privilégios elevados
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Autentica um usuário usando Supabase Auth
   */
  async signIn(email, password) {
    try {
      console.log(`[SupabaseAuthService] Tentando login com Supabase Auth para: ${email}`);
      
      // Fazer login usando Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        console.log(`[SupabaseAuthService] Falha na autenticação:`, authError?.message);
        return { user: null, error: { message: 'Credenciais inválidas' } };
      }

      console.log(`[SupabaseAuthService] Login realizado com sucesso no Supabase Auth`);
      
      // Verificar se o usuário tem role de admin nos metadados
      const userRole = authData.user.user_metadata?.role;
      if (userRole !== 'admin') {
        console.log(`[SupabaseAuthService] Usuário ${email} não tem permissão de admin`);
        // Fazer logout do usuário já que ele não tem permissão
        await this.supabase.auth.signOut();
        return { user: null, error: { message: 'Acesso negado. Usuário não tem permissão de administrador.' } };
      }

      console.log(`[SupabaseAuthService] Usuário ${email} autenticado como admin`);
      
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: userRole,
          full_name: authData.user.user_metadata?.full_name,
          email_verified: authData.user.email_confirmed_at ? true : false
        },
        session: authData.session,
        error: null
      };
    } catch (error) {
      console.error('[SupabaseAuthService] Erro no login:', error);
      return { user: null, error: { message: 'Erro interno do servidor' } };
    }
  }

  /**
   * Verifica se um token de sessão do Supabase é válido
   */
  async verifyToken(token) {
    try {
      console.log(`[SupabaseAuthService] Verificando token do Supabase Auth`);
      
      // Verificar token usando Supabase Auth
      const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.log(`[SupabaseAuthService] Token inválido:`, authError?.message);
        return { user: null, error: { message: 'Token inválido' } };
      }

      // Verificar se o usuário tem role de admin
      const userRole = authUser.user_metadata?.role;
      if (userRole !== 'admin') {
        console.log(`[SupabaseAuthService] Usuário não tem permissão de admin`);
        return { user: null, error: { message: 'Acesso negado' } };
      }

      console.log(`[SupabaseAuthService] Token válido para admin: ${authUser.email}`);
      
      return {
        user: {
          id: authUser.id,
          email: authUser.email,
          role: userRole,
          full_name: authUser.user_metadata?.full_name,
          email_verified: authUser.email_confirmed_at ? true : false
        },
        error: null
      };
    } catch (error) {
      console.error('[SupabaseAuthService] Erro na verificação do token:', error);
      return { user: null, error: { message: 'Erro interno do servidor' } };
    }
  }

  /**
   * Faz logout do usuário
   */
  async signOut() {
    try {
      console.log(`[SupabaseAuthService] Fazendo logout do Supabase Auth`);
      
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        console.log(`[SupabaseAuthService] Erro no logout:`, error.message);
        return { error: { message: 'Erro ao fazer logout' } };
      }

      console.log(`[SupabaseAuthService] Logout realizado com sucesso`);
      return { error: null };
    } catch (error) {
      console.error('[SupabaseAuthService] Erro no logout:', error);
      return { error: { message: 'Erro interno do servidor' } };
    }
  }

  /**
   * Cria um novo usuário admin usando Supabase Auth
   */
  async createUser(userData) {
    try {
      const { email, password, full_name, role = 'admin' } = userData;
      
      // Criar usuário usando Supabase Auth Admin
      const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name
        },
        email_confirm: true
      });

      if (authError || !authData.user) {
        pino.error({ msg: '[SupabaseAuthService] Erro ao criar usuário no Auth', error: authError?.message });
        return { user: null, error: { message: authError?.message || 'Erro ao criar usuário' } };
      }

      // Inserir usuário na tabela admin_users
      const { data: userData, error: userError } = await this.supabase
        .from('admin_users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          role,
          full_name,
          username: email.split('@')[0]
        })
        .select('id, email, role, full_name, avatar_url, created_at')
        .single();

      if (userError) {
        pino.error({ msg: '[SupabaseAuthService] Erro ao atualizar role do usuário', error: userError.message });
        // Tentar deletar o usuário criado no Auth se falhou ao atualizar a role
        await this.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return { user: null, error: { message: 'Erro ao configurar permissões do usuário' } };
      }

      pino.info(`[SupabaseAuthService] Usuário admin criado: ${email}`);
      return { user: userData, error: null };
    } catch (error) {
      pino.error({ msg: '[SupabaseAuthService] Erro ao criar usuário', error: error.message });
      return { user: null, error: { message: 'Erro ao criar usuário' } };
    }
  }

  /**
   * Lista todos os usuários admin
   */
  async listUsers() {
    try {
      const { data: users, error } = await this.supabase
        .from('admin_users')
        .select('id, email, role, full_name, avatar_url, created_at, updated_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) {
        return { users: [], error };
      }

      return { users, error: null };
    } catch (error) {
      pino.error({ msg: '[SupabaseAuthService] Erro ao listar usuários', error: error.message });
      return { users: [], error: { message: 'Erro ao listar usuários' } };
    }
  }
}

module.exports = SupabaseAuthService;