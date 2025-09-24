// meu-projeto-react/server/server.js (VERSÃO REATORADA COM SUPORTE A tasks/send e tasks/sendSubscribe)
require('dotenv').config();
// Removido init-db.js pois estamos usando Supabase
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const pino = require('pino')();
const pinoHttp = require('pino-http')({ logger: pino });
const Joi = require('joi');
const SchedulerService = require('./SchedulerService');
const BlogController = require('./BlogController'); // <<< Adicionado
const AdminController = require('./AdminController');

const app = express();
app.use(pinoHttp);

// Configurar arquivos estáticos para servir imagens
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
pino.info('[server.js] Configurado para servir arquivos estáticos de /uploads');

// Servir arquivos estáticos do React (para produção)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    pino.info('[server.js] Configurado para servir arquivos estáticos do React em produção');
}
const PORT = process.env.PORT || 3001;
// A2A Agent configuration is now managed dynamically via Supabase
// const AGENT_API_KEY = process.env.A2A_AGENT_API_KEY;
// const AGENT_BASE_URL = process.env.A2A_AGENT_BASE_URL;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
const allowedOrigins = [
    frontendUrl,
    'https://front.rgpulse.com.br', // Novo domínio de teste do frontend
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:3000'
];
pino.info(`[server.js] Configurando CORS para permitir origens: ${allowedOrigins.join(', ')}`);
const corsOptions = { 
    origin: function (origin, callback) {
        // Permite requisições sem origin (ex: mobile apps, Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    credentials: true 
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Removed static A2A agent validation - now using dynamic configuration from Supabase
// if (!AGENT_API_KEY || !AGENT_BASE_URL) {
//     pino.fatal('[server.js] ERRO FATAL: AGENT_API_KEY ou AGENT_BASE_URL não estão definidos nas variáveis de ambiente.');
//     process.exit(1); // Encerra o processo se configuração crítica estiver ausente
// }

// Esquema de validação Joi para o payload A2A
const a2aPayloadSchema = Joi.object({
    jsonrpc: Joi.string().valid('2.0').required(),
    method: Joi.string().required(),
    params: Joi.object({
        id: Joi.string().required(),
        sessionId: Joi.string().required(),
        message: Joi.object({
            role: Joi.string().required(),
            parts: Joi.array().items(Joi.object({
                type: Joi.string().required(),
                text: Joi.string().optional(), // text é opcional, pode haver outros tipos de 'parts'
                // Adicionar outras validações para 'parts' se necessário
            })).min(1).required()
        }).optional() // message é opcional dependendo do 'method'
        // Adicionar outros campos em 'params' se forem comuns a todos os 'method'
    }).required().unknown(true), // unknown(true) permite outros campos em params
    id: Joi.string().required() // ID da chamada JSON-RPC
});

// Novo endpoint genérico para A2A
app.post('/api/v1/a2a/:agentId', async (req, res) => {
    const { agentId } = req.params;
    const payload = req.body;

    // Validação do payload com Joi
    const { error: validationError, value: validatedPayload } = a2aPayloadSchema.validate(payload);
    if (validationError) {
        pino.warn({ msg: `[server.js] Requisição inválida para agentId ${agentId}: payload JSON-RPC inválido.`, error: validationError.details, payload });
        return res.status(400).json({ error: "Payload JSON-RPC inválido.", details: validationError.details.map(d => d.message) });
    }
    // Use validatedPayload a partir daqui para garantir que apenas campos validados sejam usados
    const taskId = validatedPayload.params.id;
    const callId = validatedPayload.id;
    const a2aMethod = validatedPayload.method;

    try {
        // Buscar configurações do agente na tabela a2a_agents
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: agent, error: agentError } = await supabase
            .from('a2a_agents')
            .select('*')
            .eq('agent_id', agentId)
            .eq('status', 'active')
            .single();

        if (agentError || !agent) {
            pino.warn(`[server.js] Agente A2A não encontrado ou inativo: ${agentId}`);
            return res.status(404).json({ error: `Agente A2A não encontrado ou inativo: ${agentId}` });
        }

        const agentA2AEndpoint = agent.endpoint;
        const agentApiKey = agent.api_key;

        pino.info(`[server.js] Backend: Recebida requisição para Agent A2A (${agentA2AEndpoint}) com método '${a2aMethod}' (taskId: ${taskId}, callId: ${callId}).`);

        if (a2aMethod === "message/stream") {
            // Lógica para Streaming (SSE)
            pino.info(`[server.js] Iniciando 'message/stream' para taskId: ${taskId}`);
            const agentResponse = await fetch(agentA2AEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': agentApiKey,
                    'Accept': 'text/event-stream', // Crucial para SSE
                },
                body: JSON.stringify(validatedPayload) // Usar payload validado
            });

            if (!agentResponse.ok) {
                const errorText = await agentResponse.text();
                pino.error(`[server.js] Erro ${agentResponse.status} do A2A Agent (message/stream) para taskId ${taskId}: ${errorText}`);
                try {
                    const errorJson = JSON.parse(errorText);
                    return res.status(agentResponse.status).json({ error: errorJson.error?.message || "Erro do agente A2A ao iniciar stream", details: errorJson });
                } catch (e) {
                    return res.status(agentResponse.status).type('text/plain').send(errorText);
                }
            }

            if (!agentResponse.body) {
                pino.error(`[server.js] Corpo da resposta do agente (message/stream) está vazio para taskId ${taskId}.`);
                return res.status(500).json({ error: "Resposta de stream vazia do agente." });
            }

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            pino.info(`[server.js] Headers SSE enviados para o cliente para taskId ${taskId}. Iniciando pipe do stream do agente...`);

            let clientClosed = false;
            req.on('close', () => {
                clientClosed = true;
                pino.info(`[server.js] Conexão do cliente fechada para taskId ${taskId} durante streaming.`);
                // Aqui você poderia tentar cancelar a requisição ao agente se a API do agente suportar
            });

            let chunkCount = 0;
            for await (const chunk of agentResponse.body) {
                if (clientClosed) {
                    pino.info(`[server.js] Interrompendo stream para taskId ${taskId} devido ao fechamento do cliente.`);
                    break;
                }
                
                chunkCount++;
                const chunkText = new TextDecoder().decode(chunk);
                pino.info(`[server.js] Chunk ${chunkCount} recebido do agente para taskId ${taskId}: ${chunkText.substring(0, 200)}${chunkText.length > 200 ? '...' : ''}`);
                
                if (!res.write(chunk)) {
                    await new Promise(resolve => res.once('drain', resolve));
                }
                
                pino.info(`[server.js] Chunk ${chunkCount} enviado para o cliente para taskId ${taskId}`);
            }
            
            pino.info(`[server.js] Total de ${chunkCount} chunks processados para taskId ${taskId}`);

            if (!clientClosed) {
                res.end();
                pino.info(`[server.js] Stream para taskId ${taskId} concluído e enviado ao cliente.`);
            }

        } else if (a2aMethod === "message/send") {
            // Lógica para Resposta Completa (Standard HTTP)
            pino.info(`[server.js] Iniciando 'message/send' para taskId: ${taskId}`);
            const agentResponse = await fetch(agentA2AEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': agentApiKey,
                    // 'Accept' não precisa ser 'text/event-stream' aqui, o padrão 'application/json' é implícito ou pode ser definido
                },
                body: JSON.stringify(validatedPayload) // Usar payload validado
            });

            const responseBodyText = await agentResponse.text();
            if (!agentResponse.ok) {
                pino.error(`[server.js] Erro ${agentResponse.status} do A2A Agent (message/send) para taskId ${taskId}: ${responseBodyText}`);
                try {
                    const errorJson = JSON.parse(responseBodyText);
                    return res.status(agentResponse.status).json({ error: errorJson.error?.message || "Erro do agente A2A", details: errorJson });
                } catch (e) {
                    return res.status(agentResponse.status).type('application/json').send(responseBodyText); // Tenta enviar como JSON se possível, senão texto
                }
            }
            
            try {
                const responseJson = JSON.parse(responseBodyText);
                pino.info(`[server.js] Resposta completa (message/send) recebida do agente para taskId ${taskId} e enviada ao cliente.`);
                res.status(agentResponse.status).json(responseJson);
            } catch (parseError) {
                pino.error({ msg: `[server.js] Erro ao fazer parse da resposta JSON do agente (message/send) para taskId ${taskId}.`, error: parseError, responseBody: responseBodyText });
                res.status(500).json({ error: "Erro ao processar resposta do agente.", details: responseBodyText });
            }

        } else {
            pino.warn(`[server.js] Método A2A desconhecido '${a2aMethod}' recebido para taskId ${taskId}.`);
            return res.status(400).json({ error: `Método A2A desconhecido: ${a2aMethod}. Suportados: 'message/send', 'message/stream'.` });
        }

    } catch (error) {
        pino.error({ msg: `[server.js] Erro geral no backend ao processar requisição para taskId ${taskId} (método ${a2aMethod}).`, error: error.message, stack: error.stack });
        if (!res.headersSent) {
            res.status(500).json({ error: "Erro interno do servidor ao processar sua requisição.", details: error.message });
        }
    }
});

// Rota temporária para popular o banco de dados com posts de exemplo
app.post('/api/v1/blog/seed', async (req, res) => {
  try {
    // Verificar se já existem posts
    const checkPosts = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM BlogPosts', (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      });
    });

    if (checkPosts) {
      return res.status(400).json({ error: 'Já existem posts no banco de dados' });
    }

    // Dados dos posts de exemplo
    const examplePosts = [
      {
        title: 'Introdução ao Marketing Digital',
        slug: 'introducao-ao-marketing-digital',
        summary: 'Conceitos básicos de marketing digital para iniciantes',
        content_markdown: '# Introdução ao Marketing Digital\n\nEste é um post de exemplo sobre marketing digital.',
        cover_image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        estimated_read_time_minutes: 5,
        tags: ['marketing', 'iniciante']
      },
      {
        title: 'Automação de Vendas',
        slug: 'automacao-de-vendas',
        summary: 'Como implementar automação no seu processo de vendas',
        content_markdown: '# Automação de Vendas\n\nEste é um post de exemplo sobre automação de vendas.',
        cover_image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        estimated_read_time_minutes: 7,
        tags: ['vendas', 'automação']
      }
    ];

    // Inserir cada post
    for (const post of examplePosts) {
      await new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO BlogPosts 
          (title, slug, summary, content_markdown, cover_image_url, estimated_read_time_minutes, tags, published_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        db.run(sql, [
          post.title,
          post.slug,
          post.summary,
          post.content_markdown,
          post.cover_image_url,
          post.estimated_read_time_minutes,
          JSON.stringify(post.tags)
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.status(201).json({ message: 'Posts de exemplo adicionados com sucesso!', count: examplePosts.length });
  } catch (error) {
    pino.error({ msg: 'Erro ao popular banco de dados', error: error.message });
    res.status(500).json({ error: 'Erro ao popular banco de dados', details: error.message });
  }
});

// Rotas do Blog
app.get('/api/v1/blog/posts', BlogController.listPosts);
app.get('/api/v1/blog/posts/:slug', BlogController.getPost);
// Rotas de compatibilidade (sem v1)
app.get('/api/blog/posts', BlogController.listPosts);
app.get('/api/blog/posts/:slug', BlogController.getPost);

// Rotas de admin para geração de posts com Gemini AI
app.post('/api/v1/blog/admin/generate-post', BlogController.generateNewPostManually);
app.post('/api/v1/blog/admin/create-post', BlogController.createPostFromData);
app.get('/api/v1/blog/admin/suggest-topics', BlogController.suggestTopics);
app.post('/api/v1/blog/admin/generate-multiple', BlogController.generateMultiplePosts);

// Rota para streaming A2A com agente de blog (mantida para compatibilidade)
app.post('/api/v1/blog/stream', BlogController.streamWithAgent);

// Rotas de Autenticação Administrativa (Supabase)
const SupabaseAuthController = require('./SupabaseAuthController');
const supabaseAuthController = new SupabaseAuthController();

app.post('/api/v1/auth/login', supabaseAuthController.login.bind(supabaseAuthController));
app.get('/api/v1/auth/verify', supabaseAuthController.verifyToken.bind(supabaseAuthController));
app.post('/api/v1/auth/logout', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), supabaseAuthController.logout.bind(supabaseAuthController));
app.post('/api/v1/auth/users', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), supabaseAuthController.createUser.bind(supabaseAuthController));
app.get('/api/v1/auth/users', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), supabaseAuthController.listUsers.bind(supabaseAuthController));
app.put('/api/v1/auth/password', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), supabaseAuthController.updatePassword.bind(supabaseAuthController));

// Rotas antigas removidas - agora usando Supabase Auth

// Rotas Administrativas (protegidas com Supabase Auth)
app.get('/api/v1/admin/status', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getSystemStatus);
app.get('/api/v1/admin/system-stats', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getSystemStats);
app.post('/api/v1/admin/auto-generation/enable', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.enableAutoGeneration);
app.post('/api/v1/admin/auto-generation/disable', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.disableAutoGeneration);
app.post('/api/v1/admin/generate-post', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.generatePost);
app.get('/api/v1/admin/themes', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getThemes);
app.post('/api/v1/admin/themes', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.createTheme);
app.put('/api/v1/admin/themes/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateTheme);
app.delete('/api/v1/admin/themes/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.deleteTheme);
app.get('/api/v1/admin/stats', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getStats);
app.get('/api/v1/admin/posts', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getPosts);
app.delete('/api/v1/admin/posts/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.deletePost);
app.get('/api/v1/admin/settings', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getSettings);
app.put('/api/v1/admin/settings', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateSettings);

// Rotas de configurações de tracking
app.get('/api/v1/admin/tracking-config', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getTrackingConfig);
app.post('/api/v1/admin/tracking-config', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateTrackingConfig);
app.get('/api/v1/admin/tracking-events', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getTrackingEvents);

// Rotas de configurações de vídeo
app.get('/api/v1/admin/video-config', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getVideoConfig);
app.post('/api/v1/admin/video-config', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateVideoConfig);

// A2A Agents routes
app.get('/api/v1/admin/agents', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getAgents);
app.post('/api/v1/admin/agents', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.createAgent);
app.put('/api/v1/admin/agents/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateAgent);
app.delete('/api/v1/admin/agents/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.deleteAgent);

// Endpoint público para listar agentes ativos disponíveis
app.get('/api/v1/agents', async (req, res) => {
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: agents, error } = await supabase
            .from('a2a_agents')
            .select('agent_id, name, description, status')
            .eq('status', 'active')
            .order('name');

        if (error) {
            pino.error(`[server.js] Erro ao buscar agentes: ${error.message}`);
            return res.status(500).json({ error: 'Erro ao buscar agentes disponíveis' });
        }

        pino.info(`[server.js] Retornando ${agents?.length || 0} agentes ativos`);
        res.json({ agents: agents || [] });
    } catch (error) {
        pino.error(`[server.js] Erro geral ao buscar agentes: ${error.message}`);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas do Scheduler
const SchedulerController = require('./SchedulerController');
app.use('/api/scheduler', SchedulerController);
app.post('/api/v1/admin/scheduler/start', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.startScheduler);
app.post('/api/v1/admin/scheduler/stop', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.stopScheduler);
app.post('/api/v1/admin/generate-single-post', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.generateSinglePost);

// Rotas de SEO
const SEOController = require('./SEOController');
app.use('/api/seo', SEOController);

// Rotas de Leads do Diagnóstico
const diagnosticLeadsRoutes = require('./routes/diagnosticLeads');
app.use('/api/v1/diagnostic-leads', diagnosticLeadsRoutes);

// Catch-all handler: send back React's index.html file for SPA routing (only in production)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

app.listen(PORT, () => {
    pino.info(`[server.js] Servidor backend proxy A2A rodando em http://localhost:${PORT}`);
    pino.info(`[server.js] Permitindo requisições CORS de: ${frontendUrl}`);
    pino.info(`[server.js] Endpoint A2A: POST /api/v1/a2a/:agentId`);
    pino.info(`[server.js] Health check disponível em: http://localhost:${PORT}/health`);
    
    if (process.env.NODE_ENV === 'production') {
        pino.info(`[server.js] Servindo aplicação React em produção`);
    }

    // Iniciar o agendador de posts
    SchedulerService.startDailyPostGeneration(); 
});