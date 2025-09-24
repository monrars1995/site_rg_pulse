require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pino = require('pino')();
const BlogService = require('./BlogService');
const SchedulerService = require('./SchedulerService');
const AdminService = require('./AdminService');
const GeminiBlogService = require('./GeminiBlogService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * Interface de gerenciamento administrativo do blog
 */

// Credenciais administrativas (em produção, usar banco de dados)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123' // Hash em produção
};

const JWT_SECRET = process.env.JWT_SECRET || 'rg-pulse-admin-secret-key';

/**
 * Autentica usuário administrativo
 * POST /api/v1/admin/login
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    // Verificar credenciais (em produção, usar hash)
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    pino.info('[AdminController] Login administrativo realizado com sucesso.');
    res.status(200).json({ 
      message: 'Login realizado com sucesso.',
      token,
      user: { username, role: 'admin' }
    });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro no login', error: error.message });
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

/**
 * Verifica se o token é válido
 * GET /api/v1/admin/verify-token
 */
async function verifyToken(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ 
      valid: true,
      user: { username: decoded.username, role: decoded.role }
    });
  } catch (error) {
    pino.error({ msg: '[AdminController] Token inválido', error: error.message });
    res.status(401).json({ error: 'Token inválido.' });
  }
}

/**
 * Middleware para verificar autenticação
 */
function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    pino.error({ msg: '[AdminController] Falha na autenticação', error: error.message });
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

/**
 * Obtém estatísticas do sistema
 * GET /api/v1/admin/stats
 */
async function getStats(req, res) {
  try {
    const stats = await AdminService.getSystemStats();
    res.status(200).json(stats);
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter estatísticas', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter estatísticas.' });
  }
}

/**
 * Lista todos os posts para administração
 * GET /api/v1/admin/posts
 */
async function getPosts(req, res) {
  try {
    const { getBlogRepository } = require('./BlogRepositoryFactory');
    const blogRepository = getBlogRepository();
    const posts = await blogRepository.getAllPostsForAdmin();
    res.status(200).json({ posts });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter posts', error: error.message });
    // Em caso de erro, retornar array vazio para manter consistência
    res.status(200).json({ posts: [] });
  }
}

/**
 * Exclui um post
 * DELETE /api/v1/admin/posts/:id
 */
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    await BlogService.deletePost(id);
    pino.info(`[AdminController] Post ${id} excluído com sucesso.`);
    res.status(200).json({ message: 'Post excluído com sucesso.' });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao excluir post', error: error.message });
    res.status(500).json({ error: 'Erro interno ao excluir post.' });
  }
}

/**
 * Obtém o status atual do sistema de geração automática
 * GET /api/v1/admin/status
 */
async function getSystemStatus(req, res) {
  try {
    const status = await AdminService.getSystemStatus();
    res.status(200).json(status);
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter status do sistema', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter status do sistema.' });
  }
}

/**
 * Ativa a geração automática de posts
 * POST /api/v1/admin/auto-generation/enable
 */
async function enableAutoGeneration(req, res) {
  try {
    await AdminService.enableAutoGeneration();
    pino.info('[AdminController] Geração automática ativada.');
    res.status(200).json({ message: 'Geração automática ativada com sucesso.' });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao ativar geração automática', error: error.message });
    res.status(500).json({ error: 'Erro interno ao ativar geração automática.' });
  }
}

/**
 * Desativa a geração automática de posts
 * POST /api/v1/admin/auto-generation/disable
 */
async function disableAutoGeneration(req, res) {
  try {
    await AdminService.disableAutoGeneration();
    pino.info('[AdminController] Geração automática desativada.');
    res.status(200).json({ message: 'Geração automática desativada com sucesso.' });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao desativar geração automática', error: error.message });
    res.status(500).json({ error: 'Erro interno ao desativar geração automática.' });
  }
}

/**
 * Gera um post manualmente com tema específico
 * POST /api/v1/admin/generate-post
 */
async function generatePost(req, res) {
  try {
    const { theme, customPrompt } = req.body;
    
    const newPost = await AdminService.generatePostWithTheme(theme, customPrompt);
    pino.info({ msg: '[AdminController] Post gerado manualmente com sucesso.', postId: newPost.id, theme });
    res.status(201).json({ message: 'Post gerado com sucesso.', post: newPost });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao gerar post manualmente', error: error.message });
    res.status(500).json({ error: 'Erro interno ao gerar post.', details: error.message });
  }
}

/**
 * Lista todos os temas disponíveis
 * GET /api/v1/admin/themes
 */
async function getThemes(req, res) {
  try {
    const themes = await AdminService.getAvailableThemes();
    res.status(200).json({ themes });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter temas', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter temas.' });
  }
}

/**
 * Cria um novo tema
 * POST /api/v1/admin/themes
 */
async function createTheme(req, res) {
  try {
    const themeData = req.body;
    const newTheme = await AdminService.createTheme(themeData);
    pino.info({ msg: '[AdminController] Novo tema criado.', themeId: newTheme.id });
    res.status(201).json({ message: 'Tema criado com sucesso.', theme: newTheme });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao criar tema', error: error.message });
    res.status(500).json({ error: 'Erro interno ao criar tema.', details: error.message });
  }
}

/**
 * Atualiza um tema existente
 * PUT /api/v1/admin/themes/:id
 */
async function updateTheme(req, res) {
  try {
    const { id } = req.params;
    const themeData = req.body;
    
    const updatedTheme = await AdminService.updateTheme(id, themeData);
    pino.info({ msg: '[AdminController] Tema atualizado.', themeId: id });
    res.status(200).json({ message: 'Tema atualizado com sucesso.', theme: updatedTheme });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao atualizar tema', error: error.message });
    res.status(500).json({ error: 'Erro interno ao atualizar tema.', details: error.message });
  }
}

/**
 * Remove um tema
 * DELETE /api/v1/admin/themes/:id
 */
async function deleteTheme(req, res) {
  try {
    const { id } = req.params;
    
    await AdminService.deleteTheme(id);
    pino.info({ msg: '[AdminController] Tema removido.', themeId: id });
    res.status(200).json({ message: 'Tema removido com sucesso.' });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao remover tema', error: error.message });
    res.status(500).json({ error: 'Erro interno ao remover tema.', details: error.message });
  }
}

/**
 * Obtém estatísticas do blog
 * GET /api/v1/admin/stats
 */
async function getBlogStats(req, res) {
  try {
    const stats = await AdminService.getBlogStatistics();
    res.status(200).json(stats);
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter estatísticas', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter estatísticas.' });
  }
}

/**
 * Atualiza configurações do sistema
 * PUT /api/v1/admin/settings
 */
async function updateSettings(req, res) {
  try {
    const settings = req.body;
    
    const updatedSettings = await AdminService.updateSystemSettings(settings);
    pino.info('[AdminController] Configurações do sistema atualizadas.');
    res.status(200).json({ message: 'Configurações atualizadas com sucesso.', settings: updatedSettings });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao atualizar configurações', error: error.message });
    res.status(500).json({ error: 'Erro interno ao atualizar configurações.', details: error.message });
  }
}

/**
 * Obtém configurações atuais do sistema
 * GET /api/v1/admin/settings
 */
async function getSettings(req, res) {
  try {
    const settings = await AdminService.getSystemSettings();
    res.status(200).json(settings);
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter configurações', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter configurações.' });
  }
}

/**
 * Obtém estatísticas do sistema para o dashboard
 */
async function getSystemStats(req, res) {
  try {
    const stats = await AdminService.getSystemStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter estatísticas do sistema', error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

/**
 * Inicia geração automática de posts
 * POST /api/v1/admin/scheduler/start
 */
async function startScheduler(req, res) {
  try {
    SchedulerService.startDailyPostGeneration();
    pino.info('[AdminController] Geração automática iniciada pelo admin');
    res.json({ success: true, message: 'Geração automática ativada' });
  } catch (error) {
    pino.error('Erro ao iniciar geração automática:', error);
    res.status(500).json({ error: 'Erro ao ativar geração automática' });
  }
}

/**
 * Para geração automática de posts
 * POST /api/v1/admin/scheduler/stop
 */
async function stopScheduler(req, res) {
  try {
    SchedulerService.stopDailyPostGeneration();
    pino.info('[AdminController] Geração automática parada pelo admin');
    res.json({ success: true, message: 'Geração automática desativada' });
  } catch (error) {
    pino.error('Erro ao parar geração automática:', error);
    res.status(500).json({ error: 'Erro ao desativar geração automática' });
  }
}

/**
 * Gera um post único manualmente
 * POST /api/v1/admin/generate-single-post
 */
async function generateSinglePost(req, res) {
  try {
    const { topic } = req.body;
    const geminiBlogService = new GeminiBlogService();
    
    // Se não foi fornecido um tópico, gera um automaticamente
    let finalTopic = topic;
    if (!finalTopic || finalTopic.includes('automático')) {
      const suggestedTopics = await geminiBlogService.suggestTopics(1);
      finalTopic = suggestedTopics[0] || 'Estratégias de Marketing Digital para 2024';
    }
    
    const newPost = await geminiBlogService.createBlogPost(finalTopic);
    pino.info(`[AdminController] Post gerado manualmente pelo admin: ${newPost.id}`);
    
    res.json({ 
      success: true, 
      message: 'Post gerado com sucesso',
      post: newPost
    });
  } catch (error) {
    pino.error('Erro ao gerar post:', error);
    res.status(500).json({ error: 'Erro ao gerar post' });
  }
}

/**
 * Lista todos os agentes A2A
 * GET /api/v1/admin/agents
 */
async function getAgents(req, res) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: agents, error } = await supabase
      .from('a2a_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      pino.error({ msg: '[AdminController] Erro ao buscar agentes', error: error.message });
      // Retornar lista vazia em caso de erro
      return res.status(200).json({
        agents: []
      });
    }

    res.status(200).json({ agents: agents || [] });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter agentes', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter agentes.' });
  }
}

/**
 * Cria um novo agente A2A
 * POST /api/v1/admin/agents
 */
async function createAgent(req, res) {
  try {
    const { name, agent_id, endpoint, api_key, status, description } = req.body;

    if (!name || !agent_id || !endpoint || !api_key) {
      return res.status(400).json({ error: 'Nome, ID do agente, endpoint e chave API são obrigatórios.' });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: agent, error } = await supabase
      .from('a2a_agents')
      .insert({
        name,
        agent_id,
        endpoint,
        api_key,
        status: status || 'active',
        description: description || '',
        usage_count: 0
      })
      .select()
      .single();

    if (error) {
      pino.error({ msg: '[AdminController] Erro ao criar agente', error: error.message });
      return res.status(500).json({ error: 'Erro ao criar agente.' });
    }

    pino.info(`[AdminController] Agente A2A criado: ${agent.id}`);
    res.status(201).json({ agent });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao criar agente', error: error.message });
    res.status(500).json({ error: 'Erro interno ao criar agente.' });
  }
}

/**
 * Atualiza um agente A2A
 * PUT /api/v1/admin/agents/:id
 */
async function updateAgent(req, res) {
  try {
    const { id } = req.params;
    const { name, agent_id, endpoint, api_key, status, description } = req.body;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (agent_id !== undefined) updateData.agent_id = agent_id;
    if (endpoint !== undefined) updateData.endpoint = endpoint;
    if (api_key !== undefined) updateData.api_key = api_key;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    const { data: agent, error } = await supabase
      .from('a2a_agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      pino.error({ msg: '[AdminController] Erro ao atualizar agente', error: error.message });
      return res.status(500).json({ error: 'Erro ao atualizar agente.' });
    }

    if (!agent) {
      return res.status(404).json({ error: 'Agente não encontrado.' });
    }

    pino.info(`[AdminController] Agente A2A atualizado: ${agent.id}`);
    res.status(200).json({ agent });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao atualizar agente', error: error.message });
    res.status(500).json({ error: 'Erro interno ao atualizar agente.' });
  }
}

/**
 * Deleta um agente A2A
 * DELETE /api/v1/admin/agents/:id
 */
async function deleteAgent(req, res) {
  try {
    const { id } = req.params;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('a2a_agents')
      .delete()
      .eq('id', id);

    if (error) {
      pino.error({ msg: '[AdminController] Erro ao deletar agente', error: error.message });
      return res.status(500).json({ error: 'Erro ao deletar agente.' });
    }

    pino.info(`[AdminController] Agente A2A deletado: ${id}`);
    res.status(200).json({ message: 'Agente deletado com sucesso.' });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao deletar agente', error: error.message });
    res.status(500).json({ error: 'Erro interno ao deletar agente.' });
  }
}

/**
 * Obtém configurações de tracking
 * GET /api/v1/admin/tracking-config
 */
async function getTrackingConfig(req, res) {
  try {
    const settings = await AdminService.getSystemSettings();
    
    const trackingConfig = {
      gtm_id: settings.gtm_id || '',
      facebook_pixel_id: settings.facebook_pixel_id || '',
      google_analytics_id: settings.google_analytics_id || ''
    };
    
    res.status(200).json(trackingConfig);
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter configurações de tracking', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter configurações de tracking.' });
  }
}

/**
 * Atualiza configurações de tracking
 * POST /api/v1/admin/tracking-config
 */
async function updateTrackingConfig(req, res) {
  try {
    const { gtm_id, facebook_pixel_id, google_analytics_id } = req.body;
    
    const trackingSettings = {
      gtm_id: gtm_id || '',
      facebook_pixel_id: facebook_pixel_id || '',
      google_analytics_id: google_analytics_id || ''
    };
    
    await AdminService.updateSystemSettings(trackingSettings);
    pino.info('[AdminController] Configurações de tracking atualizadas.');
    res.status(200).json({ message: 'Configurações de tracking atualizadas com sucesso.', config: trackingSettings });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao atualizar configurações de tracking', error: error.message });
    res.status(500).json({ error: 'Erro interno ao atualizar configurações de tracking.', details: error.message });
  }
}

/**
 * Obtém eventos de tracking disponíveis
 * GET /api/v1/admin/tracking-events
 */
async function getTrackingEvents(req, res) {
  try {
    // Lista de eventos padrão que podem ser rastreados
    const events = [
      { id: 'page_view', name: 'Visualização de Página', description: 'Quando um usuário visualiza uma página' },
      { id: 'contact_form_submit', name: 'Envio de Formulário de Contato', description: 'Quando um usuário envia o formulário de contato' },
      { id: 'newsletter_signup', name: 'Inscrição na Newsletter', description: 'Quando um usuário se inscreve na newsletter' },
      { id: 'download_click', name: 'Click em Download', description: 'Quando um usuário clica em um link de download' },
      { id: 'external_link_click', name: 'Click em Link Externo', description: 'Quando um usuário clica em um link externo' },
      { id: 'video_play', name: 'Reprodução de Vídeo', description: 'Quando um usuário inicia a reprodução de um vídeo' },
      { id: 'scroll_depth', name: 'Profundidade de Rolagem', description: 'Quando um usuário rola a página até determinado ponto' }
    ];
    
    res.status(200).json({ events });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter eventos de tracking', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter eventos de tracking.' });
  }
}

/**
 * Obtém configurações de vídeo
 * GET /api/v1/admin/video-config
 */
async function getVideoConfig(req, res) {
  try {
    const settings = await AdminService.getSystemSettings();
    
    const videoConfig = {
      home_video_url: settings.home_video_url || '',
      home_video_title: settings.home_video_title || '',
      home_video_subtitle: settings.home_video_subtitle || '',
      home_video_cta_text: settings.home_video_cta_text || '',
      home_video_cta_href: settings.home_video_cta_href || '',
      inpractice_video_url: settings.inpractice_video_url || '',
      inpractice_video_title: settings.inpractice_video_title || '',
      inpractice_video_subtitle: settings.inpractice_video_subtitle || '',
      inpractice_video_cta_text: settings.inpractice_video_cta_text || '',
      inpractice_video_cta_href: settings.inpractice_video_cta_href || ''
    };
    
    res.status(200).json({ config: videoConfig });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao obter configurações de vídeo', error: error.message });
    res.status(500).json({ error: 'Erro interno ao obter configurações de vídeo.' });
  }
}

/**
 * Atualiza configurações de vídeo
 * POST /api/v1/admin/video-config
 */
async function updateVideoConfig(req, res) {
  try {
    const {
      home_video_url,
      home_video_title,
      home_video_subtitle,
      home_video_cta_text,
      home_video_cta_href,
      inpractice_video_url,
      inpractice_video_title,
      inpractice_video_subtitle,
      inpractice_video_cta_text,
      inpractice_video_cta_href
    } = req.body;
    
    const videoSettings = {
      home_video_url: home_video_url || '',
      home_video_title: home_video_title || '',
      home_video_subtitle: home_video_subtitle || '',
      home_video_cta_text: home_video_cta_text || '',
      home_video_cta_href: home_video_cta_href || '',
      inpractice_video_url: inpractice_video_url || '',
      inpractice_video_title: inpractice_video_title || '',
      inpractice_video_subtitle: inpractice_video_subtitle || '',
      inpractice_video_cta_text: inpractice_video_cta_text || '',
      inpractice_video_cta_href: inpractice_video_cta_href || ''
    };
    
    await AdminService.updateSystemSettings(videoSettings);
    pino.info('[AdminController] Configurações de vídeo atualizadas.');
    res.status(200).json({ message: 'Configurações de vídeo atualizadas com sucesso.', config: videoSettings });
  } catch (error) {
    pino.error({ msg: '[AdminController] Erro ao atualizar configurações de vídeo', error: error.message });
    res.status(500).json({ error: 'Erro interno ao atualizar configurações de vídeo.', details: error.message });
  }
}

module.exports = {
  login,
  verifyToken,
  authenticateAdmin,
  getSystemStatus,
  enableAutoGeneration,
  disableAutoGeneration,
  generatePost,
  getThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  getBlogStats,
  updateSettings,
  getSettings,
  getStats,
  getPosts,
  deletePost,
  getSystemStats,
  startScheduler,
  stopScheduler,
  generateSinglePost,
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  getTrackingConfig,
  updateTrackingConfig,
  getTrackingEvents,
  getVideoConfig,
  updateVideoConfig
};