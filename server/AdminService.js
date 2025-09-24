const pino = require('pino')();
const BlogService = require('./BlogService');
const SchedulerService = require('./SchedulerService');
const AdminRepository = require('./AdminRepository');
const { getBlogRepository } = require('./BlogRepositoryFactory');

/**
 * Serviço de administração do blog
 * Gerencia configurações, temas e controles do sistema
 */

// Estado interno da geração automática
let autoGenerationEnabled = true;

/**
 * Temas predefinidos para geração de posts
 */
const DEFAULT_THEMES = [
  {
    id: 'tech-innovation',
    name: 'Inovação Tecnológica',
    description: 'Posts sobre novas tecnologias, tendências e inovações que estão transformando o mercado',
    prompt: 'Gere uma postagem sobre inovação tecnológica, focando em tendências emergentes, novas tecnologias disruptivas ou casos de sucesso em transformação digital. O conteúdo deve ser informativo e inspirador para empresários e profissionais de tecnologia. Inclua exemplos práticos, dados relevantes e insights acionáveis.',
    tags: ['tecnologia', 'inovação', 'tendências', 'transformação digital'],
    active: true,
    keywords: ['blockchain', 'IoT', 'cloud computing', 'edge computing', '5G', 'realidade aumentada', 'realidade virtual'],
    tone: 'profissional e inspirador',
    targetAudience: 'Empresários, CTOs, profissionais de TI e inovação',
    contentExamples: [
      'Como a IA está revolucionando a indústria manufatureira',
      'Tendências de cloud computing para 2024',
      'Blockchain além das criptomoedas: casos de uso empresariais'
    ],
    guidelines: 'Sempre incluir dados estatísticos, mencionar empresas reais como exemplos, e fornecer insights práticos para implementação'
  },
  {
    id: 'ai-automation',
    name: 'IA e Automação',
    description: 'Conteúdo sobre inteligência artificial, automação de processos e suas aplicações práticas no mundo empresarial',
    prompt: 'Crie uma postagem sobre inteligência artificial e automação, abordando aplicações práticas, benefícios para empresas, casos de uso reais ou impactos na produtividade. O conteúdo deve ser acessível e prático, com foco em ROI e implementação.',
    tags: ['ia', 'automação', 'produtividade', 'machine learning', 'RPA'],
    active: true,
    keywords: ['chatbots', 'machine learning', 'deep learning', 'RPA', 'automação de processos', 'IA generativa', 'computer vision'],
    tone: 'educativo e prático',
    targetAudience: 'Gestores, analistas de processos, profissionais de TI',
    contentExamples: [
      'Como implementar chatbots para melhorar o atendimento ao cliente',
      'ROI da automação: casos reais de empresas brasileiras',
      'IA no RH: automatizando recrutamento e seleção'
    ],
    guidelines: 'Focar em benefícios mensuráveis, incluir métricas de ROI, e sempre mencionar ferramentas específicas disponíveis no mercado'
  },
  {
    id: 'digital-marketing',
    name: 'Marketing Digital',
    description: 'Estratégias e táticas de marketing digital para aumentar vendas e engajamento',
    prompt: 'Desenvolva uma postagem sobre marketing digital, cobrindo estratégias eficazes, ferramentas úteis, tendências do mercado ou estudos de caso. O foco deve ser em dicas práticas e acionáveis para profissionais de marketing, com métricas e resultados concretos.',
    tags: ['marketing', 'digital', 'estratégia', 'SEO', 'redes sociais'],
    active: true,
    keywords: ['SEO', 'Google Ads', 'Facebook Ads', 'content marketing', 'email marketing', 'influencer marketing', 'marketing automation'],
    tone: 'estratégico e orientado a resultados',
    targetAudience: 'Profissionais de marketing, empreendedores, gestores comerciais',
    contentExamples: [
      'Estratégias de SEO que realmente funcionam em 2024',
      'Como criar campanhas de Google Ads com alto ROI',
      'Marketing de conteúdo: do planejamento à conversão'
    ],
    guidelines: 'Sempre incluir métricas específicas, mencionar ferramentas gratuitas e pagas, e fornecer templates ou checklists quando possível'
  },
  {
    id: 'sales-optimization',
    name: 'Otimização de Vendas',
    description: 'Técnicas e estratégias para melhorar processos de vendas e aumentar conversões',
    prompt: 'Escreva uma postagem sobre otimização de vendas, incluindo técnicas de conversão, automação de vendas, CRM, metodologias de vendas modernas ou análise de funil. O conteúdo deve ser prático e aplicável para equipes comerciais, com foco em resultados mensuráveis.',
    tags: ['vendas', 'otimização', 'conversão', 'CRM', 'funil de vendas'],
    active: true,
    keywords: ['CRM', 'funil de vendas', 'lead scoring', 'sales automation', 'metodologia SPIN', 'metodologia BANT', 'social selling'],
    tone: 'prático e orientado a performance',
    targetAudience: 'Vendedores, gerentes comerciais, diretores de vendas',
    contentExamples: [
      'Como aumentar a taxa de conversão do seu funil de vendas',
      'CRM: escolhendo e implementando a ferramenta certa',
      'Técnicas de follow-up que realmente convertem'
    ],
    guidelines: 'Incluir scripts de vendas, templates de email, e sempre mencionar métricas de conversão e benchmarks do mercado'
  },
  {
    id: 'business-growth',
    name: 'Crescimento Empresarial',
    description: 'Estratégias para crescimento sustentável e escalabilidade de negócios',
    prompt: 'Produza uma postagem sobre crescimento empresarial, abordando estratégias de escalabilidade, gestão de crescimento, expansão de mercado, desenvolvimento organizacional ou captação de recursos. O foco deve ser em insights práticos para empreendedores e gestores, com cases de sucesso.',
    tags: ['crescimento', 'negócios', 'estratégia', 'escalabilidade', 'gestão'],
    active: true,
    keywords: ['escalabilidade', 'expansão', 'captação de recursos', 'gestão de crescimento', 'KPIs', 'planejamento estratégico', 'cultura organizacional'],
    tone: 'estratégico e visionário',
    targetAudience: 'Empreendedores, CEOs, diretores, gestores seniores',
    contentExamples: [
      'Como escalar sua startup sem perder a qualidade',
      'KPIs essenciais para monitorar o crescimento empresarial',
      'Estratégias de expansão para novos mercados'
    ],
    guidelines: 'Sempre incluir cases de empresas brasileiras e internacionais, mencionar frameworks de gestão específicos, e fornecer métricas de crescimento'
  },
  {
    id: 'data-analytics',
    name: 'Análise de Dados e BI',
    description: 'Business Intelligence, análise de dados e tomada de decisão baseada em dados',
    prompt: 'Crie uma postagem sobre análise de dados e Business Intelligence, abordando ferramentas de BI, visualização de dados, análise preditiva ou cultura data-driven. O conteúdo deve ser prático para gestores que querem implementar análise de dados em suas empresas.',
    tags: ['dados', 'BI', 'analytics', 'data-driven', 'dashboards'],
    active: true,
    keywords: ['Power BI', 'Tableau', 'Google Analytics', 'data visualization', 'KPIs', 'métricas', 'big data', 'análise preditiva'],
    tone: 'técnico mas acessível',
    targetAudience: 'Analistas de dados, gestores, diretores de TI',
    contentExamples: [
      'Como criar dashboards eficazes para tomada de decisão',
      'Implementando uma cultura data-driven na sua empresa',
      'Ferramentas de BI gratuitas vs pagas: qual escolher?'
    ],
    guidelines: 'Incluir exemplos de dashboards, mencionar ferramentas específicas com prós e contras, e sempre focar no ROI da análise de dados'
  },
  {
    id: 'customer-experience',
    name: 'Experiência do Cliente',
    description: 'Estratégias para melhorar a experiência do cliente e aumentar a satisfação',
    prompt: 'Desenvolva uma postagem sobre experiência do cliente, cobrindo jornada do cliente, touchpoints, personalização, atendimento omnichannel ou métricas de satisfação. O foco deve ser em estratégias práticas para melhorar a experiência e aumentar a retenção.',
    tags: ['experiência do cliente', 'CX', 'atendimento', 'satisfação', 'retenção'],
    active: true,
    keywords: ['jornada do cliente', 'NPS', 'CSAT', 'omnichannel', 'personalização', 'customer success', 'touchpoints'],
    tone: 'empático e orientado ao cliente',
    targetAudience: 'Profissionais de CX, atendimento, customer success, gestores',
    contentExamples: [
      'Mapeando a jornada do cliente: guia prático',
      'Como implementar um atendimento omnichannel eficaz',
      'Métricas de CX que realmente importam'
    ],
    guidelines: 'Sempre incluir exemplos de empresas com excelente CX, mencionar ferramentas de pesquisa e feedback, e fornecer templates de pesquisa'
  }
];

/**
 * Obtém o status atual do sistema
 */
async function getSystemStatus() {
  try {
    const settings = await getSystemSettings();
    const stats = await getBlogStatistics();
    
    return {
      autoGenerationEnabled: settings.autoGenerationEnabled,
      schedulerRunning: !!SchedulerService.isRunning?.(),
      totalPosts: stats.totalPosts,
      postsThisMonth: stats.postsThisMonth,
      activeThemes: stats.activeThemes,
      lastPostGenerated: stats.lastPostGenerated,
      nextScheduledGeneration: settings.cronExpression,
      systemHealth: 'healthy'
    };
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao obter status do sistema', error: error.message });
    throw error;
  }
}

/**
 * Ativa a geração automática de posts
 */
async function enableAutoGeneration() {
  try {
    autoGenerationEnabled = true;
    await updateSystemSettings({ autoGenerationEnabled: true });
    
    // Reinicia o scheduler se não estiver rodando
    SchedulerService.startDailyPostGeneration();
    
    pino.info('[AdminService] Geração automática ativada.');
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao ativar geração automática', error: error.message });
    throw error;
  }
}

/**
 * Desativa a geração automática de posts
 */
async function disableAutoGeneration() {
  try {
    autoGenerationEnabled = false;
    await updateSystemSettings({ autoGenerationEnabled: false });
    
    // Para o scheduler
    SchedulerService.stopDailyPostGeneration();
    
    pino.info('[AdminService] Geração automática desativada.');
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao desativar geração automática', error: error.message });
    throw error;
  }
}

/**
 * Gera um post com tema específico usando Gemini AI
 */
async function generatePostWithTheme(themeId, customPrompt) {
  try {
    const GeminiBlogService = require('./GeminiBlogService');
    const geminiBlogService = new GeminiBlogService();
    
    let topic;
    let options = { tone: 'profissional', targetAudience: 'empresários' };
    
    if (customPrompt) {
      // Se há um prompt customizado, usa como tópico
      topic = customPrompt;
    } else if (themeId) {
      const theme = await getThemeById(themeId);
      if (!theme) {
        throw new Error(`Tema não encontrado: ${themeId}`);
      }
      topic = theme.name || theme.prompt;
      // Extrai configurações do tema se disponíveis
      if (theme.tone) options.tone = theme.tone;
      if (theme.targetAudience) options.targetAudience = theme.targetAudience;
    } else {
      // Seleciona um tema aleatório dos ativos
      const activeThemes = await getActiveThemes();
      if (activeThemes.length === 0) {
        throw new Error('Nenhum tema ativo disponível');
      }
      const randomTheme = activeThemes[Math.floor(Math.random() * activeThemes.length)];
      topic = randomTheme.name || randomTheme.prompt;
      if (randomTheme.tone) options.tone = randomTheme.tone;
      if (randomTheme.targetAudience) options.targetAudience = randomTheme.targetAudience;
    }
    
    // Usa o GeminiBlogService para gerar o post
    const newPost = await geminiBlogService.createBlogPost(topic, options);
    
    pino.info({ msg: '[AdminService] Post gerado com Gemini AI', postId: newPost.id, themeId, topic });
    return newPost;
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao gerar post com Gemini', error: error.message, themeId });
    throw error;
  }
}

/**
 * Obtém todos os temas disponíveis
 */
async function getAvailableThemes() {
  try {
    let themes = await AdminRepository.getAllThemes();
    
    // Se não há temas no banco, inicializa com os padrões
    if (!themes || themes.length === 0) {
      await initializeDefaultThemes();
      themes = await AdminRepository.getAllThemes();
    }
    
    return themes;
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao obter temas', error: error.message });
    throw error;
  }
}

/**
 * Obtém temas ativos
 */
async function getActiveThemes() {
  try {
    const themes = await getAvailableThemes();
    return themes.filter(theme => theme.active);
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao obter temas ativos', error: error.message });
    throw error;
  }
}

/**
 * Obtém tema por ID
 */
async function getThemeById(themeId) {
  try {
    return await AdminRepository.getThemeById(themeId);
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao obter tema por ID', error: error.message, themeId });
    throw error;
  }
}

/**
 * Cria um novo tema
 */
async function createTheme(themeData) {
  try {
    const theme = {
      id: themeData.id || `theme-${Date.now()}`,
      name: themeData.name,
      description: themeData.description,
      prompt: themeData.prompt,
      tags: themeData.tags || [],
      active: themeData.active !== undefined ? themeData.active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const newTheme = await AdminRepository.createTheme(theme);
    pino.info({ msg: '[AdminService] Novo tema criado', themeId: newTheme.id });
    return newTheme;
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao criar tema', error: error.message });
    throw error;
  }
}

/**
 * Atualiza um tema existente
 */
async function updateTheme(themeId, themeData) {
  try {
    const updatedData = {
      ...themeData,
      updated_at: new Date().toISOString()
    };
    
    const updatedTheme = await AdminRepository.updateTheme(themeId, updatedData);
    pino.info({ msg: '[AdminService] Tema atualizado', themeId });
    return updatedTheme;
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao atualizar tema', error: error.message, themeId });
    throw error;
  }
}

/**
 * Remove um tema
 */
async function deleteTheme(themeId) {
  try {
    await AdminRepository.deleteTheme(themeId);
    pino.info({ msg: '[AdminService] Tema removido', themeId });
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao remover tema', error: error.message, themeId });
    throw error;
  }
}

/**
 * Obtém estatísticas do blog
 */
async function getBlogStatistics() {
  try {
    const blogRepository = getBlogRepository();
    // Usar getAllPostsForAdmin para obter TODOS os posts (incluindo drafts)
    const allPosts = await blogRepository.getAllPostsForAdmin();
    const totalPosts = allPosts.length;
    
    // Calculate posts this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const postsThisMonth = allPosts.filter(post => new Date(post.created_at) >= startOfMonth).length;
    
    // Categoriza posts por status (se disponível)
    const publishedPosts = allPosts.filter(post => post.status === 'published' || !post.status).length;
    const draftPosts = allPosts.filter(post => post.status === 'draft').length;
    
    // Get last post
    const lastPost = allPosts.length > 0 ? allPosts[0] : null;
    
    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      postsThisMonth,
      lastPostGenerated: lastPost ? lastPost.created_at : null,
      averagePostsPerWeek: await calculateAveragePostsPerWeek()
    };
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao obter estatísticas', error: error.message });
    throw error;
  }
}

/**
 * Calcula média de posts por semana
 */
async function calculateAveragePostsPerWeek() {
  try {
    // Implementação simplificada - pode ser melhorada
    const blogRepository = getBlogRepository();
    const allPosts = await blogRepository.getAllPostsForAdmin();
    const totalPosts = allPosts.length;
    const firstPost = allPosts.length > 0 ? allPosts[allPosts.length - 1] : null;
    
    if (!firstPost || totalPosts === 0) return 0;
    
    const firstPostDate = new Date(firstPost.created_at);
    const now = new Date();
    const weeksDiff = Math.max(1, (now - firstPostDate) / (7 * 24 * 60 * 60 * 1000));
    
    return Math.round((totalPosts / weeksDiff) * 100) / 100;
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao calcular média de posts', error: error.message });
    return 0;
  }
}

/**
 * Atualiza configurações do sistema
 */
async function updateSystemSettings(settings) {
  try {
    const updatedSettings = await AdminRepository.updateSettings(settings);
    
    // Aplica mudanças imediatamente se necessário
    if (settings.autoGenerationEnabled !== undefined) {
      autoGenerationEnabled = settings.autoGenerationEnabled;
      if (settings.autoGenerationEnabled) {
        SchedulerService.startDailyPostGeneration();
      } else {
        SchedulerService.stopDailyPostGeneration();
      }
    }
    
    pino.info('[AdminService] Configurações do sistema atualizadas.');
    return updatedSettings;
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao atualizar configurações', error: error.message });
    throw error;
  }
}

/**
 * Obtém configurações atuais do sistema
 */
async function getSystemSettings() {
  try {
    let settings = await AdminRepository.getSettings();
    
    // Se não há configurações, inicializa com padrões
    if (!settings) {
      settings = await initializeDefaultSettings();
    }
    
    return settings;
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao obter configurações', error: error.message });
    throw error;
  }
}

/**
 * Inicializa temas padrão no banco de dados
 */
async function initializeDefaultThemes() {
  try {
    for (const theme of DEFAULT_THEMES) {
      await AdminRepository.createTheme({
        ...theme,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    pino.info('[AdminService] Temas padrão inicializados.');
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao inicializar temas padrão', error: error.message });
    throw error;
  }
}

/**
 * Inicializa configurações padrão
 */
async function initializeDefaultSettings() {
  try {
    const defaultSettings = {
      autoGenerationEnabled: true,
      cronExpression: process.env.BLOG_POST_CRON_EXPRESSION || '0 8,14,20 * * *',
      maxPostsPerDay: 3,
      timezone: process.env.TZ || 'America/Sao_Paulo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const settings = await AdminRepository.createSettings(defaultSettings);
    pino.info('[AdminService] Configurações padrão inicializadas.');
    return settings;
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro ao inicializar configurações padrão', error: error.message });
    throw error;
  }
}

/**
 * Obtém estatísticas do sistema para o dashboard administrativo
 */
async function getSystemStats() {
  try {
    // Inicializa valores padrão
    let stats = {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      postsThisMonth: 0,
      averagePostsPerWeek: 0
    };
    let themes = [];
    let settings = null;
    let lastGenerated = null;
    
    // Tenta obter estatísticas do blog
    try {
      stats = await getBlogStatistics();
    } catch (error) {
      pino.warn({ msg: '[AdminService] Erro ao obter estatísticas do blog, usando valores padrão', error: error.message });
    }
    
    // Tenta obter temas
    try {
      themes = await getAvailableThemes();
    } catch (error) {
      pino.warn({ msg: '[AdminService] Erro ao obter temas, usando array vazio', error: error.message });
    }
    
    // Tenta obter configurações
    try {
      settings = await getSystemSettings();
    } catch (error) {
      pino.warn({ msg: '[AdminService] Erro ao obter configurações, usando null', error: error.message });
    }
    
    // Tenta buscar último post gerado
    try {
      const blogRepository = getBlogRepository();
      const postsResult = await blogRepository.getPostsPaginated(1, 1);
      lastGenerated = postsResult.posts.length > 0 ? postsResult.posts[0].created_at : null;
    } catch (error) {
      pino.warn({ msg: '[AdminService] Erro ao obter último post, usando null', error: error.message });
    }
    
    return {
      totalPosts: stats.totalPosts || 0,
      publishedPosts: stats.publishedPosts || 0,
      draftPosts: stats.draftPosts || 0,
      postsThisMonth: stats.postsThisMonth || 0,
      averagePostsPerWeek: stats.averagePostsPerWeek || 0,
      totalThemes: themes.length || 0,
      activeThemes: themes.filter(t => t && t.active).length || 0,
      lastGenerated,
      autoGenerationEnabled: autoGenerationEnabled || false,
      settings: settings || {
        autoGenerationEnabled: false,
        cronExpression: '0 8,14,20 * * *',
        maxPostsPerDay: 3,
        timezone: 'America/Sao_Paulo'
      }
    };
  } catch (error) {
    pino.error({ msg: '[AdminService] Erro crítico ao obter estatísticas do sistema', error: error.message });
    // Retorna valores padrão em caso de erro crítico
    return {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      postsThisMonth: 0,
      averagePostsPerWeek: 0,
      totalThemes: 0,
      activeThemes: 0,
      lastGenerated: null,
      autoGenerationEnabled: false,
      settings: {
        autoGenerationEnabled: false,
        cronExpression: '0 8,14,20 * * *',
        maxPostsPerDay: 3,
        timezone: 'America/Sao_Paulo'
      }
    };
  }
}

module.exports = {
  getSystemStatus,
  enableAutoGeneration,
  disableAutoGeneration,
  generatePostWithTheme,
  getAvailableThemes,
  getActiveThemes,
  getThemeById,
  createTheme,
  updateTheme,
  deleteTheme,
  getBlogStatistics,
  updateSystemSettings,
  getSystemSettings,
  initializeDefaultThemes,
  initializeDefaultSettings,
  getSystemStats
};