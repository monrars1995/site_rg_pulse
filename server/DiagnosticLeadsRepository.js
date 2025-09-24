const { getDatabase } = require('./DatabaseConfig');

class DiagnosticLeadsRepository {
  constructor() {
    this.db = getDatabase();
    this.client = this.db.getClient();
  }

  // Inicializar schema da tabela de leads
  async initializeSchema() {
    try {
      // Tentar fazer uma query simples na tabela para verificar se existe
      const { data, error } = await this.client
        .from('diagnostic_leads')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Tabela não existe - isso é esperado se ainda não foi criada
          console.log('ℹ️  Tabela diagnostic_leads não encontrada - será criada quando necessário');
        } else if (error.message && error.message.includes('fetch failed')) {
          // Erro de rede - pode ser temporário
          console.log('ℹ️  Verificação de schema adiada - conexão será testada quando necessário');
        } else {
          // Outros erros
          console.log('⚠️  Aviso na verificação da tabela diagnostic_leads:', error.message);
        }
      } else {
        console.log('✅ Tabela diagnostic_leads verificada com sucesso');
      }
    } catch (error) {
      // Capturar erros de rede ou outros problemas
      if (error.message && error.message.includes('fetch failed')) {
        console.log('ℹ️  Verificação de schema adiada - testando conexão quando necessário');
      } else {
        console.log('ℹ️  Schema será verificado na primeira operação:', error.message);
      }
    }
  }

  // Salvar um novo lead
  async createLead(leadData) {
    try {
      const { data, error } = await this.client
        .from('diagnostic_leads')
        .insert({
          full_name: leadData.fullName,
          company_name: leadData.companyName,
          role: leadData.role,
          segment: leadData.segment,
          revenue: leadData.revenue,
          challenge: leadData.challenge,
          has_marketing_team: leadData.hasMarketingTeam,
          marketing_team_size: leadData.marketingTeamSize,
          marketing_investment: leadData.marketingInvestment,
          monthly_traffic_investment: leadData.monthlyTrafficInvestment,
          current_results: leadData.currentResults,
          phone: leadData.phone,
          email: leadData.email,
          qualification_score: leadData.qualificationScore,
          qualification_result: leadData.qualificationResult,
          agent_response: leadData.agentResponse,
          status: leadData.status || 'new',
          source: leadData.source || 'diagnostic_form'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar lead no Supabase:', error);
        throw error;
      }

      console.log('✅ Lead salvo com sucesso:', data.id);
      return data;
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      throw error;
    }
  }

  // Buscar todos os leads com paginação
  async getAllLeads(page = 1, limit = 20, filters = {}) {
    try {
      let query = this.client
        .from('diagnostic_leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.segment) {
        query = query.eq('segment', filters.segment);
      }
      if (filters.revenue) {
        query = query.eq('revenue', filters.revenue);
      }
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Aplicar paginação
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar leads no Supabase:', error);
        throw error;
      }

      return {
        leads: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      throw error;
    }
  }

  // Buscar lead por ID
  async getLeadById(id) {
    try {
      const { data, error } = await this.client
        .from('diagnostic_leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar lead por ID no Supabase:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar lead por ID:', error);
      throw error;
    }
  }

  // Atualizar status do lead
  async updateLeadStatus(id, status, notes = null) {
    try {
      const updateData = { status };
      if (notes) {
        updateData.agent_response = notes;
      }

      const { data, error } = await this.client
        .from('diagnostic_leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar status do lead no Supabase:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar status do lead:', error);
      throw error;
    }
  }

  // Buscar estatísticas dos leads
  async getLeadsStats() {
    try {
      // Total de leads
      const { count: totalLeads } = await this.client
        .from('diagnostic_leads')
        .select('*', { count: 'exact', head: true });

      // Leads por status
      const { data: statusStats } = await this.client
        .from('diagnostic_leads')
        .select('status')
        .then(({ data }) => {
          const stats = {};
          data?.forEach(lead => {
            stats[lead.status] = (stats[lead.status] || 0) + 1;
          });
          return { data: stats };
        });

      // Leads dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentLeads } = await this.client
        .from('diagnostic_leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Leads de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayLeads } = await this.client
        .from('diagnostic_leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      return {
        totalLeads: totalLeads || 0,
        statusStats: statusStats || {},
        recentLeads: recentLeads || 0,
        todayLeads: todayLeads || 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos leads:', error);
      throw error;
    }
  }

  // Deletar lead
  async deleteLead(id) {
    try {
      const { error } = await this.client
        .from('diagnostic_leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar lead no Supabase:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      throw error;
    }
  }
}

module.exports = DiagnosticLeadsRepository;