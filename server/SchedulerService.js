const cron = require('node-cron');
const pino = require('pino')();
const BlogService = require('./BlogService');
const SchedulerRepository = require('./SchedulerRepository');

// Configuração para gerar posts 3 vezes ao dia:
// - 08:00 (manhã)
// - 14:00 (tarde) 
// - 20:00 (noite)
// Formato cron: '0 8,14,20 * * *'
const CRON_EXPRESSION_DAILY_POST = process.env.BLOG_POST_CRON_EXPRESSION || '0 8,14,20 * * *'; // Padrão: 3x ao dia

let scheduledTask;
const schedulerRepository = new SchedulerRepository();

/**
 * Inicia o agendamento da tarefa de geração diária de posts.
 */
function startDailyPostGeneration() {
  if (scheduledTask) {
    pino.info('[SchedulerService] A tarefa de geração de posts já está agendada.');
    return;
  }

  if (!cron.validate(CRON_EXPRESSION_DAILY_POST)) {
    pino.error(`[SchedulerService] Expressão cron inválida: ${CRON_EXPRESSION_DAILY_POST}. A tarefa não será agendada.`);
    return;
  }

  pino.info(`[SchedulerService] Agendando geração diária de posts com a expressão: ${CRON_EXPRESSION_DAILY_POST}`);
  
  scheduledTask = cron.schedule(CRON_EXPRESSION_DAILY_POST, async () => {
    pino.info('[SchedulerService] Executando tarefa agendada: generateAndStoreNewPost');
    try {
      const newPost = await BlogService.generateAndStoreNewPost();
      pino.info({ msg: '[SchedulerService] Tarefa agendada concluída com sucesso.', postId: newPost.id, slug: newPost.slug });
    } catch (error) {
      // O BlogService já loga o erro detalhado.
      // Aqui apenas logamos que a tarefa agendada encontrou um erro.
      pino.error('[SchedulerService] Tarefa agendada encontrou um erro durante a execução.');
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || "America/Sao_Paulo" // TODO: Configurar timezone apropriado ou via variável de ambiente TZ
  });

  pino.info('[SchedulerService] Tarefa de geração diária de posts agendada.');
}

/**
 * Para a tarefa agendada.
 */
function stopDailyPostGeneration() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    pino.info('[SchedulerService] Tarefa de geração diária de posts parada.');
  } else {
    pino.info('[SchedulerService] Nenhuma tarefa de geração de posts para parar.');
  }
}

/**
 * Verifica se o scheduler está rodando
 */
function isRunning() {
  return !!scheduledTask;
}

/**
 * Obtém posts agendados
 */
async function getScheduledPosts(options = {}) {
  try {
    const posts = await schedulerRepository.getScheduledPosts(options);
    const total = await schedulerRepository.countScheduledPosts(options.filters || {});
    
    return {
      posts,
      total,
      page: options.page || 1,
      limit: options.limit || 20,
      totalPages: Math.ceil(total / (options.limit || 20))
    };
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao obter posts agendados', error: error.message });
    throw error;
  }
}

/**
 * Obtém um post agendado específico
 */
async function getScheduledPost(id) {
  try {
    return await schedulerRepository.getScheduledPost(id);
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao obter post agendado', id, error: error.message });
    throw error;
  }
}

/**
 * Cria um novo post agendado
 */
async function createScheduledPost(postData) {
  try {
    const scheduledPost = await schedulerRepository.createScheduledPost({
      ...postData,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    pino.info({ msg: '[SchedulerService] Post agendado criado', id: scheduledPost.id });
    return scheduledPost;
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao criar post agendado', error: error.message });
    throw error;
  }
}

/**
 * Atualiza um post agendado
 */
async function updateScheduledPost(id, updateData) {
  try {
    const updatedData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    await schedulerRepository.updateScheduledPost(id, updatedData);
    pino.info({ msg: '[SchedulerService] Post agendado atualizado', id });
    return { success: true };
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao atualizar post agendado', id, error: error.message });
    throw error;
  }
}

/**
 * Remove um post agendado
 */
async function deleteScheduledPost(id) {
  try {
    await schedulerRepository.deleteScheduledPost(id);
    pino.info({ msg: '[SchedulerService] Post agendado removido', id });
    return { success: true };
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao remover post agendado', id, error: error.message });
    throw error;
  }
}

/**
 * Publica um post agendado
 */
async function publishScheduledPost(id) {
  try {
    const scheduledPost = await schedulerRepository.getScheduledPost(id);
    if (!scheduledPost) {
      throw new Error('Post agendado não encontrado');
    }

    // Cria o post usando o BlogService
    const newPost = await BlogService.createPost({
      title: scheduledPost.title,
      content: scheduledPost.content,
      theme_id: scheduledPost.theme_id,
      custom_content: scheduledPost.custom_content
    });

    // Atualiza o status do post agendado
    await schedulerRepository.updateScheduledPost(id, {
      status: 'published',
      published_post_id: newPost.id,
      updated_at: new Date().toISOString()
    });

    pino.info({ msg: '[SchedulerService] Post agendado publicado', id, postId: newPost.id });
    return { postId: newPost.id, success: true };
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao publicar post agendado', id, error: error.message });
    throw error;
  }
}

/**
 * Obtém próximos posts a serem publicados
 */
async function getUpcomingPosts(limit = 10) {
  try {
    return await schedulerRepository.getUpcomingPosts(limit);
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao obter próximos posts', error: error.message });
    throw error;
  }
}

/**
 * Obtém status do scheduler
 */
async function getSchedulerStatus() {
  try {
    const stats = await schedulerRepository.getSchedulerStats();
    return {
      isRunning: isRunning(),
      cronExpression: CRON_EXPRESSION_DAILY_POST,
      timezone: process.env.TZ || "America/Sao_Paulo",
      ...stats
    };
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao obter status', error: error.message });
    throw error;
  }
}

/**
 * Processa posts agendados que devem ser publicados
 */
async function processScheduledPosts() {
  try {
    const postsToPublish = await schedulerRepository.getPostsToPublish();
    let processed = 0;

    for (const post of postsToPublish) {
      try {
        await publishScheduledPost(post.id);
        processed++;
      } catch (error) {
        pino.error({ msg: '[SchedulerService] Erro ao processar post agendado', postId: post.id, error: error.message });
      }
    }

    pino.info({ msg: '[SchedulerService] Processamento de posts agendados concluído', processed, total: postsToPublish.length });
    return { processed, total: postsToPublish.length };
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro no processamento de posts agendados', error: error.message });
    throw error;
  }
}

/**
 * Obtém estatísticas do scheduler
 */
async function getSchedulerStats(period = '30d') {
  try {
    return await schedulerRepository.getSchedulerStats(period);
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao obter estatísticas', error: error.message });
    throw error;
  }
}

/**
 * Executa ação em lote
 */
async function bulkAction(action, options = {}) {
  try {
    const { postIds, filters } = options;
    let count = 0;

    switch (action) {
      case 'delete':
        if (postIds && postIds.length > 0) {
          for (const id of postIds) {
            await deleteScheduledPost(id);
            count++;
          }
        }
        break;
      case 'publish':
        if (postIds && postIds.length > 0) {
          for (const id of postIds) {
            await publishScheduledPost(id);
            count++;
          }
        }
        break;
      default:
        throw new Error(`Ação não suportada: ${action}`);
    }

    pino.info({ msg: '[SchedulerService] Ação em lote executada', action, count });
    return { count, success: true };
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro na ação em lote', action, error: error.message });
    throw error;
  }
}

// Funções relacionadas a templates (se necessário)
async function getTemplates(options = {}) {
  try {
    return await schedulerRepository.getTemplates(options);
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao obter templates', error: error.message });
    throw error;
  }
}

async function getTemplate(id) {
  try {
    return await schedulerRepository.getTemplate(id);
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao obter template', id, error: error.message });
    throw error;
  }
}

async function createTemplate(templateData) {
  try {
    return await schedulerRepository.createTemplate(templateData);
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao criar template', error: error.message });
    throw error;
  }
}

async function updateTemplate(id, updateData) {
  try {
    return await schedulerRepository.updateTemplate(id, updateData);
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao atualizar template', id, error: error.message });
    throw error;
  }
}

async function deleteTemplate(id) {
  try {
    return await schedulerRepository.deleteTemplate(id);
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao remover template', id, error: error.message });
    throw error;
  }
}

async function useTemplate(id, options = {}) {
  try {
    const template = await getTemplate(id);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    const postData = {
      title: template.title,
      content: template.content,
      theme_id: template.theme_id,
      scheduled_for: options.scheduledFor,
      custom_content: options.customContent || template.custom_content
    };

    const scheduledPost = await createScheduledPost(postData);
    
    // Incrementa contador de uso do template
    await schedulerRepository.incrementTemplateUsage(id);
    
    return scheduledPost;
  } catch (error) {
    pino.error({ msg: '[SchedulerService] Erro ao usar template', id, error: error.message });
    throw error;
  }
}

module.exports = {
  startDailyPostGeneration,
  stopDailyPostGeneration,
  isRunning,
  getScheduledPosts,
  getScheduledPost,
  createScheduledPost,
  updateScheduledPost,
  deleteScheduledPost,
  publishScheduledPost,
  getUpcomingPosts,
  getSchedulerStatus,
  processScheduledPosts,
  getSchedulerStats,
  bulkAction,
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  useTemplate
};
