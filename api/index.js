// Vercel Serverless Function para o backend
const express = require('express');
const cors = require('cors');

// Configurar dotenv para carregar variáveis de ambiente
require('dotenv').config();

// Importar todos os controladores e serviços
const BlogController = require('../server/BlogController');
const AdminController = require('../server/AdminController');
const SupabaseAuthController = require('../server/SupabaseAuthController');
const SchedulerController = require('../server/SchedulerController');
const SEOController = require('../server/SEOController');
const diagnosticLeadsRoutes = require('../server/routes/diagnosticLeads');

const app = express();

// Configuração CORS para Vercel - Incluindo ambos os domínios
const allowedOrigins = [
    'https://site-rg-pulse.vercel.app',
    'https://site-rg-pulse-omega.vercel.app',
    'https://rgpulse.com.br',
    'https://front.rgpulse.com.br',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:8082'
];

const corsOptions = { 
    origin: function (origin, callback) {
        // Permite requisições sem origin (ex: mobile apps, Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`❌ CORS bloqueado para origem: ${origin}`);
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware para log de requisições
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path} - Origin: ${req.get('origin') || 'N/A'}`);
    next();
});

// Middleware para tratamento de erros global
app.use((err, req, res, next) => {
    console.error('❌ Erro na API:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// Health check - removido prefixo /api pois já está na rota
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'vercel',
        supabase_url: process.env.SUPABASE_URL ? 'configured' : 'missing',
        supabase_key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing'
    });
});

// Rotas do Blog - removido prefixo /api pois já está na rota
app.get('/v1/blog/posts', async (req, res) => {
    try {
        console.log('🔍 Iniciando listagem de posts do blog');
        await BlogController.listPosts(req, res);
    } catch (error) {
        console.error('❌ Erro na rota /v1/blog/posts:', error);
        res.status(500).json({ error: 'Erro ao buscar posts do blog', details: error.message });
    }
});

app.get('/v1/blog/posts/:slug', BlogController.getPost);
app.get('/blog/posts', BlogController.listPosts);
app.get('/blog/posts/:slug', BlogController.getPost);
app.post('/v1/blog/admin/generate-post', BlogController.generateNewPostManually);
app.post('/v1/blog/admin/create-post', BlogController.createPostFromData);
app.get('/v1/blog/admin/suggest-topics', BlogController.suggestTopics);
app.post('/v1/blog/admin/generate-multiple', BlogController.generateMultiplePosts);
app.post('/v1/blog/stream', BlogController.streamWithAgent);

// Rotas de Autenticação
const supabaseAuthController = new SupabaseAuthController();
app.post('/v1/auth/login', supabaseAuthController.login.bind(supabaseAuthController));
app.get('/v1/auth/verify', supabaseAuthController.verifyToken.bind(supabaseAuthController));
app.post('/v1/auth/logout', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), supabaseAuthController.logout.bind(supabaseAuthController));
app.post('/v1/auth/users', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), supabaseAuthController.createUser.bind(supabaseAuthController));
app.get('/v1/auth/users', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), supabaseAuthController.listUsers.bind(supabaseAuthController));
app.put('/v1/auth/password', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), supabaseAuthController.updatePassword.bind(supabaseAuthController));

// Rotas de Admin
app.get('/v1/admin/status', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getSystemStatus);
app.get('/v1/admin/system-stats', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getSystemStats);
app.post('/v1/admin/auto-generation/enable', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.enableAutoGeneration);
app.post('/v1/admin/auto-generation/disable', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.disableAutoGeneration);
app.post('/v1/admin/generate-post', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.generatePost);
app.get('/v1/admin/themes', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getThemes);
app.post('/v1/admin/themes', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.createTheme);
app.put('/v1/admin/themes/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateTheme);
app.delete('/v1/admin/themes/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.deleteTheme);
app.get('/v1/admin/stats', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getStats);
app.get('/v1/admin/posts', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getPosts);
app.delete('/v1/admin/posts/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.deletePost);
app.get('/v1/admin/settings', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getSettings);
app.put('/v1/admin/settings', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateSettings);
app.get('/v1/admin/tracking-config', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getTrackingConfig);
app.post('/v1/admin/tracking-config', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateTrackingConfig);
app.get('/v1/admin/tracking-events', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getTrackingEvents);
app.get('/v1/admin/video-config', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getVideoConfig);
app.post('/v1/admin/video-config', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateVideoConfig);
app.get('/v1/admin/agents', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.getAgents);
app.post('/v1/admin/agents', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.createAgent);
app.put('/v1/admin/agents/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.updateAgent);
app.delete('/v1/admin/agents/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.deleteAgent);
app.post('/v1/admin/scheduler/start', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.startScheduler);
app.post('/v1/admin/scheduler/stop', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.stopScheduler);
app.post('/v1/admin/generate-single-post', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), AdminController.generateSinglePost);

// Rotas de Agentes
app.get('/v1/agents', async (req, res) => {
    try {
        console.log('🔍 Buscando agentes disponíveis');
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        const { data: agents, error } = await supabase
            .from('a2a_agents')
            .select('*')
            .eq('active', true);

        if (error) {
            console.error('❌ Erro ao buscar agentes:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        console.log(`✅ Encontrados ${agents?.length || 0} agentes ativos`);
        res.json({ agents: agents || [] });
    } catch (error) {
        console.error('❌ Erro ao buscar agentes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas do Scheduler
app.use('/scheduler', SchedulerController);

// Rotas de SEO
app.use('/seo', SEOController);

// Rotas de Diagnostic Leads
app.use('/v1/diagnostic-leads', diagnosticLeadsRoutes);

// Rota A2A (se necessária)
app.post('/v1/a2a/:agentId', async (req, res) => {
    // Implementação da rota A2A se necessária
    res.status(501).json({ error: 'A2A endpoint not implemented in serverless environment' });
});

// Export para Vercel
module.exports = app;