import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download
} from 'lucide-react';

interface Lead {
  id: number;
  full_name: string;
  company_name: string;
  role: string;
  segment: string;
  revenue: string;
  challenge: string;
  has_marketing_team: string;
  marketing_team_size?: string;
  marketing_investment: string;
  monthly_traffic_investment: string;
  current_results: string;
  phone: string;
  email: string;
  qualification_score?: number;
  qualification_result?: string;
  agent_response?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
  source: string;
  created_at: string;
  updated_at: string;
}

interface LeadsStats {
  totalLeads: number;
  statusStats: Record<string, number>;
  recentLeads: number;
  todayLeads: number;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LeadsManager = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  
  // Filtros e paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    segment: 'all',
    revenue: ''
  });

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    converted: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    converted: 'Convertido',
    rejected: 'Rejeitado'
  };

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [currentPage, filters]);

  const fetchLeads = async () => {
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== 'all'))
      });

      const response = await fetch(`${backendUrl}/api/v1/diagnostic-leads?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        const data: LeadsResponse = result.data;
        setLeads(data.leads);
        setTotalPages(data.totalPages);
      } else {
        console.error('Erro ao buscar leads');
      }
    } catch (error) {
      console.error('Erro ao conectar com API de leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${backendUrl}/api/v1/diagnostic-leads/stats/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos leads:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedLead) return;

    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${backendUrl}/api/v1/diagnostic-leads/${selectedLead.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusUpdate)
      });

      if (response.ok) {
        setShowStatusDialog(false);
        setStatusUpdate({ status: '', notes: '' });
        fetchLeads();
        fetchStats();
      } else {
        console.error('Erro ao atualizar status do lead');
      }
    } catch (error) {
      console.error('Erro ao conectar com API:', error);
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm('Tem certeza que deseja deletar este lead?')) return;

    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${backendUrl}/api/v1/diagnostic-leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchLeads();
        fetchStats();
      } else {
        console.error('Erro ao deletar lead');
      }
    } catch (error) {
      console.error('Erro ao conectar com API:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportLeads = () => {
    const csvContent = [
      ['Nome', 'Empresa', 'Cargo', 'Segmento', 'Faturamento', 'Email', 'Telefone', 'Status', 'Data'].join(','),
      ...leads.map(lead => [
        lead.full_name,
        lead.company_name,
        lead.role,
        lead.segment,
        lead.revenue,
        lead.email,
        lead.phone,
        statusLabels[lead.status],
        formatDate(lead.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_diagnostico_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayLeads}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimos 30 dias</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentLeads}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.statusStats.converted || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, empresa ou email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.segment} onValueChange={(value) => setFilters({ ...filters, segment: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os segmentos</SelectItem>
                <SelectItem value="tecnologia">Tecnologia</SelectItem>
                <SelectItem value="saude">Saúde</SelectItem>
                <SelectItem value="educacao">Educação</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="varejo">Varejo</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportLeads} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads do Diagnóstico ({leads.length})
          </CardTitle>
          <CardDescription>
            Gerencie os leads capturados através do formulário de diagnóstico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{lead.full_name}</h3>
                      <Badge className={statusColors[lead.status]}>
                        {statusLabels[lead.status]}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{lead.company_name} - {lead.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{lead.phone}</span>
                      </div>
                      <div>
                        <span className="font-medium">Segmento:</span> {lead.segment}
                      </div>
                      <div>
                        <span className="font-medium">Faturamento:</span> {lead.revenue}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                    
                    {lead.challenge && (
                      <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
                        <span className="font-medium">Desafio:</span> {lead.challenge}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowLeadDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLead(lead);
                        setStatusUpdate({ status: lead.status, notes: lead.agent_response || '' });
                        setShowStatusDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteLead(lead.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {leads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum lead encontrado</p>
              </div>
            )}
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Lead */}
      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Informações completas do lead capturado
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome Completo</label>
                  <p className="text-sm text-gray-600">{selectedLead.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Empresa</label>
                  <p className="text-sm text-gray-600">{selectedLead.company_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Cargo</label>
                  <p className="text-sm text-gray-600">{selectedLead.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Segmento</label>
                  <p className="text-sm text-gray-600">{selectedLead.segment}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Faturamento</label>
                  <p className="text-sm text-gray-600">{selectedLead.revenue}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={statusColors[selectedLead.status]}>
                    {statusLabels[selectedLead.status]}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-gray-600">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <p className="text-sm text-gray-600">{selectedLead.phone}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Principal Desafio</label>
                <p className="text-sm text-gray-600 mt-1">{selectedLead.challenge}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tem Equipe de Marketing</label>
                  <p className="text-sm text-gray-600">{selectedLead.has_marketing_team === 'sim' ? 'Sim' : 'Não'}</p>
                </div>
                {selectedLead.marketing_team_size && (
                  <div>
                    <label className="text-sm font-medium">Tamanho da Equipe</label>
                    <p className="text-sm text-gray-600">{selectedLead.marketing_team_size}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Investimento em Marketing</label>
                  <p className="text-sm text-gray-600">{selectedLead.marketing_investment}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Investimento em Tráfego</label>
                  <p className="text-sm text-gray-600">{selectedLead.monthly_traffic_investment}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Resultados Atuais</label>
                <p className="text-sm text-gray-600 mt-1">{selectedLead.current_results}</p>
              </div>
              
              {selectedLead.qualification_result && (
                <div>
                  <label className="text-sm font-medium">Resultado da Qualificação</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedLead.qualification_result}</p>
                </div>
              )}
              
              {selectedLead.agent_response && (
                <div>
                  <label className="text-sm font-medium">Resposta do Agente</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedLead.agent_response}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <label className="font-medium">Criado em</label>
                  <p>{formatDate(selectedLead.created_at)}</p>
                </div>
                <div>
                  <label className="font-medium">Atualizado em</label>
                  <p>{formatDate(selectedLead.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Atualização de Status */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Lead</DialogTitle>
            <DialogDescription>
              Altere o status e adicione observações sobre o lead
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="qualified">Qualificado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Observações</label>
              <Textarea
                placeholder="Adicione observações sobre o contato ou qualificação..."
                value={statusUpdate.notes}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!statusUpdate.status}>
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsManager;