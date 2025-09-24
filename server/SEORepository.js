const { createClient } = require('@supabase/supabase-js');
const { getDatabase } = require('./DatabaseConfig');

class SEORepository {
  constructor() {
    this.database = getDatabase();
    this.supabase = this.database.getClient();
  }

  // Obter post por ID
  async getPostById(postId) {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter post:', error);
      throw error;
    }
  }

  // Obter posts com dados de SEO
  async getPostsWithSEO(filters = {}) {
    try {
      let query = this.supabase
        .from('posts')
        .select(`
          *,
          post_seo (
            meta_title,
            meta_description,
            focus_keyword,
            keywords,
            seo_score,
            canonical_url,
            og_title,
            og_description,
            twitter_title,
            twitter_description,
            created_at,
            updated_at
          )
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter posts com SEO:', error);
      throw error;
    }
  }

  // Obter configurações de SEO de um post
  async getPostSEO(postId) {
    try {
      const { data, error } = await this.supabase
        .from('post_seo')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter SEO do post:', error);
      throw error;
    }
  }

  // Criar configurações de SEO para um post
  async createPostSEO(postId, seoData) {
    try {
      const { data, error } = await this.supabase
        .from('post_seo')
        .insert({
          post_id: postId,
          ...seoData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar SEO do post:', error);
      throw error;
    }
  }

  // Atualizar configurações de SEO de um post
  async updatePostSEO(postId, seoData) {
    try {
      const { data, error } = await this.supabase
        .from('post_seo')
        .update({
          ...seoData,
          updated_at: new Date().toISOString()
        })
        .eq('post_id', postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar SEO do post:', error);
      throw error;
    }
  }

  // Remover configurações de SEO de um post
  async deletePostSEO(postId) {
    try {
      const { data, error } = await this.supabase
        .from('post_seo')
        .delete()
        .eq('post_id', postId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao remover SEO do post:', error);
      throw error;
    }
  }

  // Obter todos os posts publicados
  async getAllPublishedPosts() {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select('id, title, slug, created_at, updated_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter posts publicados:', error);
      throw error;
    }
  }

  // Obter páginas estáticas (simulado)
  async getStaticPages() {
    try {
      // Em um cenário real, isso viria de uma tabela de páginas
      const staticPages = [
        {
          path: '/sobre',
          updated_at: new Date().toISOString()
        },
        {
          path: '/contato',
          updated_at: new Date().toISOString()
        },
        {
          path: '/servicos',
          updated_at: new Date().toISOString()
        },
        {
          path: '/portfolio',
          updated_at: new Date().toISOString()
        }
      ];

      return staticPages;
    } catch (error) {
      console.error('Erro ao obter páginas estáticas:', error);
      throw error;
    }
  }

  // Obter configurações globais de SEO
  async getGlobalSEOSettings() {
    try {
      const { data, error } = await this.supabase
        .from('advanced_settings')
        .select('*')
        .eq('category', 'seo')
        .eq('key', 'global_settings')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? JSON.parse(data.value) : {
        site_title: 'RG Pulse Blog',
        site_description: 'Blog sobre tecnologia e inovação',
        default_og_image: '/default-og-image.jpg',
        allow_crawling: true,
        google_analytics_id: '',
        google_search_console_id: '',
        facebook_app_id: '',
        twitter_username: ''
      };
    } catch (error) {
      console.error('Erro ao obter configurações globais de SEO:', error);
      throw error;
    }
  }

  // Atualizar configurações globais de SEO
  async updateGlobalSEOSettings(settings) {
    try {
      const { data, error } = await this.supabase
        .from('advanced_settings')
        .upsert({
          category: 'seo',
          key: 'global_settings',
          value: JSON.stringify(settings),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return JSON.parse(data.value);
    } catch (error) {
      console.error('Erro ao atualizar configurações globais de SEO:', error);
      throw error;
    }
  }

  // Obter estatísticas de SEO
  async getSEOStats() {
    try {
      const { data: totalPosts, error: postsError } = await this.supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('status', 'published');

      if (postsError) throw postsError;

      const { data: postsWithSEO, error: seoError } = await this.supabase
        .from('post_seo')
        .select('post_id', { count: 'exact' });

      if (seoError) throw seoError;

      const { data: avgScore, error: scoreError } = await this.supabase
        .from('post_seo')
        .select('seo_score');

      if (scoreError) throw scoreError;

      const averageScore = avgScore.length > 0 
        ? avgScore.reduce((sum, item) => sum + (item.seo_score || 0), 0) / avgScore.length
        : 0;

      return {
        totalPosts: totalPosts.length,
        postsWithSEO: postsWithSEO.length,
        seoOptimizationRate: totalPosts.length > 0 
          ? (postsWithSEO.length / totalPosts.length) * 100 
          : 0,
        averageScore: Math.round(averageScore)
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de SEO:', error);
      throw error;
    }
  }

  // Obter posts com baixo score de SEO
  async getLowSEOScorePosts(threshold = 60) {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          id,
          title,
          slug,
          status,
          created_at,
          post_seo (
            seo_score,
            meta_title,
            meta_description,
            focus_keyword
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar posts com score baixo ou sem SEO
      const lowScorePosts = data.filter(post => {
        const seoScore = post.post_seo?.[0]?.seo_score || 0;
        return seoScore < threshold;
      });

      return lowScorePosts;
    } catch (error) {
      console.error('Erro ao obter posts com baixo score de SEO:', error);
      throw error;
    }
  }

  // Obter posts sem configurações de SEO
  async getPostsWithoutSEO() {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          id,
          title,
          slug,
          status,
          created_at
        `)
        .eq('status', 'published')
        .is('post_seo', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter posts sem SEO:', error);
      throw error;
    }
  }

  // Buscar posts por palavra-chave
  async searchPostsByKeyword(keyword) {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          id,
          title,
          slug,
          content,
          status,
          created_at,
          post_seo (
            focus_keyword,
            keywords,
            seo_score
          )
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar posts por palavra-chave:', error);
      throw error;
    }
  }

  // Obter análise de concorrência (simulado)
  async getCompetitorAnalysis(keywords) {
    try {
      // Em um cenário real, isso se conectaria a APIs de análise de SEO
      const analysis = {
        keywords: keywords.map(keyword => ({
          keyword,
          difficulty: Math.floor(Math.random() * 100),
          volume: Math.floor(Math.random() * 10000),
          competitors: [
            { domain: 'competitor1.com', position: 1, score: 95 },
            { domain: 'competitor2.com', position: 2, score: 88 },
            { domain: 'competitor3.com', position: 3, score: 82 }
          ]
        })),
        analyzedAt: new Date().toISOString()
      };

      return analysis;
    } catch (error) {
      console.error('Erro na análise de concorrência:', error);
      throw error;
    }
  }

  // Obter tendências de palavras-chave
  async getKeywordTrends(period = '30d') {
    try {
      // Em um cenário real, isso se conectaria a APIs como Google Trends
      const trends = {
        period,
        trending: [
          { keyword: 'inteligência artificial', growth: '+150%', volume: 50000 },
          { keyword: 'machine learning', growth: '+120%', volume: 35000 },
          { keyword: 'automação', growth: '+90%', volume: 25000 },
          { keyword: 'digital transformation', growth: '+80%', volume: 20000 },
          { keyword: 'cloud computing', growth: '+70%', volume: 18000 }
        ],
        declining: [
          { keyword: 'legacy systems', growth: '-30%', volume: 5000 },
          { keyword: 'on-premise', growth: '-25%', volume: 8000 }
        ],
        analyzedAt: new Date().toISOString()
      };

      return trends;
    } catch (error) {
      console.error('Erro ao obter tendências de palavras-chave:', error);
      throw error;
    }
  }

  // Obter ranking de posts por performance de SEO
  async getPostSEORanking(limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          id,
          title,
          slug,
          created_at,
          post_seo (
            seo_score,
            focus_keyword,
            meta_title,
            updated_at
          ),
          post_analytics (
            views,
            organic_traffic,
            bounce_rate,
            avg_time_on_page
          )
        `)
        .eq('status', 'published')
        .not('post_seo', 'is', null)
        .order('post_seo(seo_score)', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter ranking de SEO:', error);
      throw error;
    }
  }

  // Limpar dados antigos de SEO
  async cleanupOldSEOData(daysOld = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Remover configurações de SEO de posts deletados
      const { data: deletedPosts, error: deleteError } = await this.supabase
        .from('post_seo')
        .delete()
        .not('post_id', 'in', 
          `(SELECT id FROM posts WHERE status != 'deleted')`
        )
        .select();

      if (deleteError) throw deleteError;

      return {
        deletedSEORecords: deletedPosts?.length || 0,
        cleanedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao limpar dados antigos de SEO:', error);
      throw error;
    }
  }

  // Backup de configurações de SEO
  async backupSEOData() {
    try {
      const { data: seoData, error: seoError } = await this.supabase
        .from('post_seo')
        .select('*');

      if (seoError) throw seoError;

      const { data: settingsData, error: settingsError } = await this.supabase
        .from('advanced_settings')
        .select('*')
        .eq('category', 'seo');

      if (settingsError) throw settingsError;

      const backup = {
        postSEO: seoData,
        globalSettings: settingsData,
        backupDate: new Date().toISOString(),
        version: '1.0'
      };

      return backup;
    } catch (error) {
      console.error('Erro ao fazer backup dos dados de SEO:', error);
      throw error;
    }
  }

  // Restaurar backup de configurações de SEO
  async restoreSEOData(backupData) {
    try {
      // Restaurar configurações de posts
      if (backupData.postSEO && backupData.postSEO.length > 0) {
        const { error: seoError } = await this.supabase
          .from('post_seo')
          .upsert(backupData.postSEO);

        if (seoError) throw seoError;
      }

      // Restaurar configurações globais
      if (backupData.globalSettings && backupData.globalSettings.length > 0) {
        const { error: settingsError } = await this.supabase
          .from('advanced_settings')
          .upsert(backupData.globalSettings);

        if (settingsError) throw settingsError;
      }

      return {
        restoredPosts: backupData.postSEO?.length || 0,
        restoredSettings: backupData.globalSettings?.length || 0,
        restoredAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao restaurar backup de SEO:', error);
      throw error;
    }
  }
}

module.exports = SEORepository;