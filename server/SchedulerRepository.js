require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const pino = require('pino')();

/**
 * Repository para operações de banco de dados do sistema de agendamento
 * Gerencia posts agendados, templates e estatísticas
 */
class SchedulerRepository {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  // === POSTS AGENDADOS ===

  /**
   * Obtém lista de posts agendados
   */
  async getScheduledPosts(options = {}) {
    try {
      const { page = 1, limit = 20, filters = {} } = options;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_for', { ascending: true })
        .range(offset, offset + limit - 1);

      // Aplicar filtros apenas se tiverem valores
      if (filters.status && filters.status !== '') {
        query = query.eq('status', filters.status);
      }
      if (filters.theme && filters.theme !== '') {
        query = query.eq('theme_id', filters.theme);
      }
      if (filters.startDate && filters.startDate !== '') {
        query = query.gte('scheduled_for', filters.startDate);
      }
      if (filters.endDate && filters.endDate !== '') {
        query = query.lte('scheduled_for', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao obter posts agendados: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao obter posts agendados', error: error.message });
      throw error;
    }
  }

  /**
   * Conta posts agendados com filtros
   */
  async countScheduledPosts(filters = {}) {
    try {
      let query = this.supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact', head: true });

      // Aplicar filtros apenas se tiverem valores
      if (filters.status && filters.status !== '') {
        query = query.eq('status', filters.status);
      }
      if (filters.theme && filters.theme !== '') {
        query = query.eq('theme_id', filters.theme);
      }
      if (filters.startDate && filters.startDate !== '') {
        query = query.gte('scheduled_for', filters.startDate);
      }
      if (filters.endDate && filters.endDate !== '') {
        query = query.lte('scheduled_for', filters.endDate);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Erro ao contar posts agendados: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao contar posts agendados', error: error.message });
      throw error;
    }
  }

  /**
   * Obtém post agendado específico
   */
  async getScheduledPost(id) {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao obter post agendado: ${error.message}`);
      }

      return data;
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao obter post agendado', id, error: error.message });
      throw error;
    }
  }

  /**
   * Cria um novo post agendado
   */
  async createScheduledPost(postData) {
    try {
      // Mapear scheduledDate para scheduled_for se necessário
      const mappedData = {
        ...postData,
        scheduled_for: postData.scheduledFor || postData.scheduled_for,
        status: postData.status || 'scheduled'
      };
      
      // Remover campos que podem causar conflito
      delete mappedData.scheduledFor;
      
      const { data, error } = await this.supabase
        .from('scheduled_posts')
        .insert([mappedData])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar post agendado: ${error.message}`);
      }

      return data;
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao criar post agendado', error: error.message });
      throw error;
    }
  }

  /**
   * Atualiza post agendado
   */
  async updateScheduledPost(id, updateData) {
    try {
      // Mapear campos para os nomes corretos da tabela
      const mappedData = { ...updateData };
      
      if (mappedData.scheduledFor) {
        mappedData.scheduled_for = mappedData.scheduledFor;
        delete mappedData.scheduledFor;
      }
      
      if (mappedData.autoPublish !== undefined) {
        mappedData.auto_publish = mappedData.autoPublish;
        delete mappedData.autoPublish;
      }
      
      if (mappedData.theme) {
        mappedData.theme_id = mappedData.theme;
        delete mappedData.theme;
      }

      const { error } = await this.supabase
        .from('scheduled_posts')
        .update(mappedData)
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao atualizar post agendado: ${error.message}`);
      }
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao atualizar post agendado', id, error: error.message });
      throw error;
    }
  }

  /**
   * Remove post agendado
   */
  async deleteScheduledPost(id) {
    try {
      const { error } = await this.supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao remover post agendado: ${error.message}`);
      }
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao remover post agendado', id, error: error.message });
      throw error;
    }
  }

  /**
   * Obtém posts que devem ser publicados
   */
  async getPostsToPublish(currentTime) {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'scheduled')
        .eq('auto_publish', true)
        .lte('scheduled_for', currentTime)
        .order('scheduled_for', { ascending: true });

      if (error) {
        throw new Error(`Erro ao obter posts para publicar: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao obter posts para publicar', error: error.message });
      throw error;
    }
  }

  /**
   * Obtém próximos posts a serem publicados
   */
  async getUpcomingPosts(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'scheduled')
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao obter próximos posts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao obter próximos posts', error: error.message });
      throw error;
    }
  }

  // === TEMPLATES ===

  /**
   * Obtém lista de templates
   */
  async getTemplates(options = {}) {
    try {
      const { page = 1, limit = 20, filters = {} } = options;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('post_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao obter templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao obter templates', error: error.message });
      throw error;
    }
  }

  /**
   * Conta templates com filtros
   */
  async countTemplates(filters = {}) {
    try {
      let query = this.supabase
        .from('post_templates')
        .select('id', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Erro ao contar templates: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao contar templates', error: error.message });
      throw error;
    }
  }

  /**
   * Obtém template específico
   */
  async getTemplate(id) {
    try {
      const { data, error } = await this.supabase
        .from('post_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao obter template: ${error.message}`);
      }

      return data;
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao obter template', id, error: error.message });
      throw error;
    }
  }

  /**
   * Cria um novo template
   */
  async createTemplate(templateData) {
    try {
      const { data, error } = await this.supabase
        .from('post_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar template: ${error.message}`);
      }

      return data;
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao criar template', error: error.message });
      throw error;
    }
  }

  /**
   * Atualiza template
   */
  async updateTemplate(id, updateData) {
    try {
      const { error } = await this.supabase
        .from('post_templates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao atualizar template: ${error.message}`);
      }
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao atualizar template', id, error: error.message });
      throw error;
    }
  }

  /**
   * Remove template
   */
  async deleteTemplate(id) {
    try {
      const { error } = await this.supabase
        .from('post_templates')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao remover template: ${error.message}`);
      }
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao remover template', id, error: error.message });
      throw error;
    }
  }

  /**
   * Incrementa contador de uso do template
   */
  async incrementTemplateUsage(id) {
    try {
      const { error } = await this.supabase
        .rpc('increment_template_usage', { template_id: id });

      if (error) {
        // Se a função RPC não existir, fazer update manual
        const template = await this.getTemplate(id);
        if (template) {
          await this.updateTemplate(id, {
            usage_count: (template.usage_count || 0) + 1,
            last_used_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao incrementar uso do template', id, error: error.message });
      // Não propagar o erro, pois é uma operação secundária
    }
  }

  // === ESTATÍSTICAS ===

  /**
   * Obtém estatísticas básicas do scheduler
   */
  async getSchedulerStats() {
    try {
      // Posts agendados por status
      const { data: statusStats, error: statusError } = await this.supabase
        .from('scheduled_posts')
        .select('status')
        .then(result => {
          if (result.error) throw result.error;
          
          const stats = {};
          result.data.forEach(post => {
            stats[post.status] = (stats[post.status] || 0) + 1;
          });
          
          return { data: stats, error: null };
        });

      if (statusError) {
        throw new Error(`Erro ao obter estatísticas de status: ${statusError.message}`);
      }

      // Templates ativos
      const { count: activeTemplates, error: templatesError } = await this.supabase
        .from('post_templates')
        .select('id', { count: 'exact', head: true })
        .eq('active', true);

      if (templatesError) {
        throw new Error(`Erro ao contar templates ativos: ${templatesError.message}`);
      }

      // Próximos posts (próximas 24 horas)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { count: upcomingPosts, error: upcomingError } = await this.supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('scheduled_for', new Date().toISOString())
        .lte('scheduled_for', tomorrow.toISOString());

      if (upcomingError) {
        throw new Error(`Erro ao contar próximos posts: ${upcomingError.message}`);
      }

      return {
        postsByStatus: statusStats || {},
        activeTemplates: activeTemplates || 0,
        upcomingPosts: upcomingPosts || 0
      };
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao obter estatísticas', error: error.message });
      throw error;
    }
  }

  /**
   * Obtém estatísticas detalhadas por período
   */
  async getSchedulerStats(period = '30d') {
    try {
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Posts criados no período
      const { count: postsCreated, error: createdError } = await this.supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (createdError) {
        throw new Error(`Erro ao contar posts criados: ${createdError.message}`);
      }

      // Posts publicados no período
      const { count: postsPublished, error: publishedError } = await this.supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', startDate.toISOString());

      if (publishedError) {
        throw new Error(`Erro ao contar posts publicados: ${publishedError.message}`);
      }

      // Templates mais usados
      const { data: topTemplates, error: templatesError } = await this.supabase
        .from('post_templates')
        .select('id, name, usage_count')
        .order('usage_count', { ascending: false })
        .limit(5);

      if (templatesError) {
        throw new Error(`Erro ao obter templates mais usados: ${templatesError.message}`);
      }

      return {
        postsCreated: postsCreated || 0,
        postsPublished: postsPublished || 0,
        topTemplates: topTemplates || [],
        period: `${days}d`,
        startDate: startDate.toISOString()
      };
    } catch (error) {
      pino.error({ msg: '[SchedulerRepository] Erro ao obter estatísticas detalhadas', error: error.message });
      throw error;
    }
  }
}

module.exports = SchedulerRepository;