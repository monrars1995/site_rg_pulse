const express = require('express');
const DiagnosticLeadsRepository = require('../DiagnosticLeadsRepository');
const AdminController = require('../AdminController');
const SupabaseAuthController = require('../SupabaseAuthController');

const supabaseAuthController = new SupabaseAuthController();

const router = express.Router();
const leadsRepo = new DiagnosticLeadsRepository();

// Inicializar schema ao carregar as rotas
leadsRepo.initializeSchema();

// Rota pública para salvar lead do formulário de diagnóstico
router.post('/submit', async (req, res) => {
  try {
    const leadData = req.body;
    
    // Validar dados obrigatórios
    const requiredFields = [
      'fullName', 'companyName', 'role', 'segment', 'revenue',
      'challenge', 'hasMarketingTeam', 'marketingInvestment',
      'monthlyTrafficInvestment', 'currentResults', 'phone', 'email'
    ];
    
    const missingFields = requiredFields.filter(field => !leadData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    const savedLead = await leadsRepo.createLead(leadData);
    
    res.status(201).json({
      success: true,
      message: 'Lead salvo com sucesso',
      data: {
        id: savedLead.id,
        email: savedLead.email,
        company_name: savedLead.company_name
      }
    });
  } catch (error) {
    console.error('Erro ao salvar lead:', error);
    
    // Verificar se é erro de email duplicado
    if (error.code === '23505' && error.constraint === 'diagnostic_leads_email_key') {
      return res.status(409).json({
        success: false,
        message: 'Este email já foi cadastrado anteriormente'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao salvar lead'
    });
  }
});

// Rotas administrativas (requerem autenticação)

// Buscar todos os leads com filtros e paginação
router.get('/', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      segment,
      revenue,
      search,
      dateFrom,
      dateTo
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (segment) filters.segment = segment;
    if (revenue) filters.revenue = revenue;
    if (search) filters.search = search;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const result = await leadsRepo.getAllLeads(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar leads'
    });
  }
});

// Buscar lead por ID
router.get('/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await leadsRepo.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead não encontrado'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Erro ao buscar lead por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar lead'
    });
  }
});

// Atualizar status do lead
router.patch('/:id/status', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status inválido. Valores aceitos: ${validStatuses.join(', ')}`
      });
    }

    const updatedLead = await leadsRepo.updateLeadStatus(id, status, notes);
    
    res.json({
      success: true,
      message: 'Status do lead atualizado com sucesso',
      data: updatedLead
    });
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao atualizar lead'
    });
  }
});

// Buscar estatísticas dos leads
router.get('/stats/overview', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), async (req, res) => {
  try {
    const stats = await leadsRepo.getLeadsStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos leads:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar estatísticas'
    });
  }
});

// Deletar lead
router.delete('/:id', supabaseAuthController.authenticateAdmin.bind(supabaseAuthController), async (req, res) => {
  try {
    const { id } = req.params;
    await leadsRepo.deleteLead(id);
    
    res.json({
      success: true,
      message: 'Lead deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar lead:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao deletar lead'
    });
  }
});

module.exports = router;