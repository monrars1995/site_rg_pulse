import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/authUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LeadsManager from '@/components/Admin/LeadsManager';
import SEOManager from '@/components/Admin/SEOManager';
import SettingsManager from '@/components/Admin/SettingsManager';
import { 
  BarChart3, 
  FileText, 
  Settings, 
  Users, 
  LogOut, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Wand2,
  Save,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Bot,
  Key,
  Link,
  AlertCircle,
  Copy,
  Check,
  Bell,
  Search,
  Shield,
  Target,
  Mail,
  Smartphone,
  Hash,
  AlertTriangle,
  ShieldAlert,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  published_at: string;
  status: 'published' | 'draft';
  theme: string;
}

interface SystemStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  lastGenerated: string;
}

interface Theme {
  id: number;
  name: string;
  description: string;
  prompt: string;
  active: boolean;
  keywords?: string[];
  tone?: string;
  targetAudience?: string;
  contentExamples?: string[];
  guidelines?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  agentId: string;
  endpoint: string;
  apiKey: string;
  active: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface ScheduledPost {
  id: string;
  title: string;
  content?: string;
  theme?: string;
  scheduled_for: string;
  status: 'scheduled' | 'pending' | 'published' | 'cancelled';
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [autoGenerationEnabled, setAutoGenerationEnabled] = useState(false);
  const [isTogglingAutoGeneration, setIsTogglingAutoGeneration] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    selectedTheme: 'random',
    customPrompt: '',
    useCustomPrompt: false
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentForm, setAgentForm] = useState({
    name: '',
    description: '',
    agentId: '',
    endpoint: '',
    apiKey: '',
    active: true
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    content: '',
    theme: '',
    scheduledFor: '',
    scheduledTime: ''
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchDashboardData();
      fetchThemes();
      fetchAgents();
      fetchScheduledPosts();
    }
  }, [isAuthenticated, loading, navigate]);

  const fetchDashboardData = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const [postsResponse, statsResponse] = await Promise.all([
        authenticatedFetch(`${backendUrl}/api/v1/admin/posts`),
        authenticatedFetch(`${backendUrl}/api/v1/admin/system-stats`)
      ]);

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        // Garantir que posts seja sempre um array
        if (Array.isArray(postsData.posts)) {
          setPosts(postsData.posts);
        } else {
          setPosts([]);
        }
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        // O backend retorna os dados dentro de um objeto 'data'
        setStats(statsData.data || statsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Em caso de erro, garantir que posts seja um array vazio
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await authenticatedFetch(`${backendUrl}/api/v1/admin/themes`);
      
      if (response.ok) {
        const data = await response.json();
        setThemes(data.themes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar temas:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const response = await authenticatedFetch(`${backendUrl}/api/v1/admin/agents`);
      
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      } else {
        // Se a API não existir ainda, usar dados mock
        setAgents([
          {
            id: '1',
            name: 'Anna Pulse Chat',
            description: 'Assistente principal do chat do site',
            agentId: import.meta.env.VITE_A2A_AGENT_ID || '',
            endpoint: 'https://api.a2a.ai/v1',
            apiKey: '***hidden***',
            active: true,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            usageCount: 156
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar agents:', error);
      // Fallback para dados mock
      setAgents([
        {
          id: '1',
          name: 'Anna Pulse Chat',
          description: 'Assistente principal do chat do site',
          agentId: import.meta.env.VITE_A2A_AGENT_ID || '',
          endpoint: 'https://api.a2a.ai/v1',
          apiKey: '***hidden***',
          active: true,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 156
        }
      ]);
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      setIsLoadingScheduled(true);
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const response = await authenticatedFetch(`${backendUrl}/api/scheduler/posts?limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setScheduledPosts(data.data?.posts || []);
      } else {
        console.error('Erro ao buscar posts agendados:', response.statusText);
        setScheduledPosts([]);
      }
    } catch (error) {
      console.error('Erro ao buscar posts agendados:', error);
      setScheduledPosts([]);
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  const handleSchedulePost = async () => {
    try {
      setIsScheduling(true);
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      // Combinar data e hora para criar o timestamp completo
      const scheduledDateTime = new Date(`${scheduleForm.scheduledFor}T${scheduleForm.scheduledTime}:00`);
      
      const scheduleData = {
        title: scheduleForm.title,
        content: scheduleForm.content || null,
        theme: scheduleForm.theme || null,
        scheduled_for: scheduledDateTime.toISOString()
      };
      
      const response = await authenticatedFetch(`${backendUrl}/api/scheduler/posts`, {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });
      
      if (response.ok) {
        toast({
          title: "Post agendado com sucesso!",
          description: `O post "${scheduleForm.title}" foi agendado para ${scheduledDateTime.toLocaleString('pt-BR')}.`,
        });
        
        // Resetar o formulário
        setScheduleForm({
          title: '',
          content: '',
          theme: '',
          scheduledFor: '',
          scheduledTime: ''
        });
        
        // Fechar o modal
        setShowScheduleDialog(false);
        
        // Recarregar a lista de posts agendados
        fetchScheduledPosts();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro ao agendar post",
          description: errorData.message || "Ocorreu um erro ao agendar o post.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao agendar post:', error);
      toast({
        title: "Erro ao agendar post",
        description: "Ocorreu um erro inesperado ao agendar o post.",
        variant: "destructive"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelScheduledPost = async (postId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const response = await authenticatedFetch(`${backendUrl}/api/scheduler/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Post cancelado",
          description: "O agendamento do post foi cancelado com sucesso.",
        });
        
        // Recarregar a lista de posts agendados
        fetchScheduledPosts();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro ao cancelar post",
          description: errorData.message || "Ocorreu um erro ao cancelar o agendamento.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao cancelar post agendado:', error);
      toast({
        title: "Erro ao cancelar post",
        description: "Ocorreu um erro inesperado ao cancelar o agendamento.",
        variant: "destructive"
      });
    }
  };

  const handleSaveAgent = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const method = editingAgent ? 'PUT' : 'POST';
      const url = editingAgent 
        ? `${backendUrl}/api/v1/admin/agents/${editingAgent.id}`
        : `${backendUrl}/api/v1/admin/agents`;
      
      // Mapear os campos do frontend para o formato esperado pelo backend
      const agentData = {
        name: agentForm.name,
        agent_id: agentForm.agentId,
        endpoint: agentForm.endpoint,
        api_key: agentForm.apiKey,
        status: agentForm.active ? 'active' : 'inactive',
        description: agentForm.description
      };

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(agentData)
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: `Agent ${editingAgent ? 'atualizado' : 'criado'} com sucesso.`,
        });
        fetchAgents();
        setShowAgentDialog(false);
        resetAgentForm();
      } else {
        throw new Error('Erro ao salvar agent');
      }
    } catch (error) {
      console.error('Erro ao salvar agent:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agent. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const response = await authenticatedFetch(`${backendUrl}/api/v1/admin/agents/${agentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Agent excluído com sucesso.",
        });
        fetchAgents();
      } else {
        throw new Error('Erro ao excluir agent');
      }
    } catch (error) {
      console.error('Erro ao excluir agent:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir agent. Tente novamente.",
        variant: "destructive"
      });
    }
    setShowDeleteConfirm(null);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      description: agent.description,
      agentId: agent.agentId || agent.agent_id || '',
      endpoint: agent.endpoint,
      apiKey: agent.apiKey || agent.api_key || '',
      active: agent.active || agent.status === 'active'
    });
    setShowAgentDialog(true);
  };

  const resetAgentForm = () => {
    setEditingAgent(null);
    setAgentForm({
      name: '',
      description: '',
      agentId: '',
      endpoint: '',
      apiKey: '',
      active: true
    });
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência.",
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_session');
    localStorage.removeItem('auth_user');
    navigate('/admin/login');
  };

  const generateNewPost = async () => {
    setIsGenerating(true);
    try {
      const requestBody: any = {};
      
      if (generateForm.useCustomPrompt && generateForm.customPrompt.trim()) {
        requestBody.customPrompt = generateForm.customPrompt.trim();
      } else if (generateForm.selectedTheme && generateForm.selectedTheme !== 'random') {
        requestBody.theme = parseInt(generateForm.selectedTheme);
      }
      
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const response = await authenticatedFetch(`${backendUrl}/api/v1/admin/generate-post`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Post gerado com sucesso:', result);
        setShowGenerateDialog(false);
        setGenerateForm({ selectedTheme: 'random', customPrompt: '', useCustomPrompt: false });
        await fetchDashboardData(); // Recarregar dados
      } else {
        const error = await response.json();
        console.error('Erro ao gerar post:', error);
        alert('Erro ao gerar post: ' + (error.details || error.error));
      }
    } catch (error) {
      console.error('Erro ao gerar post:', error);
      alert('Erro ao gerar post. Verifique a conexão.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const response = await authenticatedFetch(`${backendUrl}/api/v1/admin/posts/${postId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchDashboardData(); // Recarregar dados
      } else {
        throw new Error('Erro ao excluir post');
      }
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      alert('Não foi possível excluir o post.');
    }
  };

  const handleEditPost = (postId: number) => {
    // Por enquanto, redireciona para visualização
    // TODO: Implementar editor de posts
    const post = posts.find(p => p.id === postId);
    if (post) {
      window.open(`/blog/${post.slug}`, '_blank');
      alert('Funcionalidade em desenvolvimento. O editor de posts será implementado em breve.');
    }
  };

  const toggleAutoGeneration = async () => {
    setIsTogglingAutoGeneration(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const endpoint = autoGenerationEnabled ? '/api/v1/admin/scheduler/stop' : '/api/v1/admin/scheduler/start';
      const response = await authenticatedFetch(`${backendUrl}${endpoint}`, {
        method: 'POST'
      });

      if (response.ok) {
        setAutoGenerationEnabled(!autoGenerationEnabled);
        alert(`Geração automática ${!autoGenerationEnabled ? 'ativada' : 'desativada'} com sucesso!`);
      } else {
        throw new Error('Erro ao alterar configuração');
      }
    } catch (error) {
      console.error('Erro ao alterar geração automática:', error);
      alert('Erro ao alterar configuração de geração automática.');
    } finally {
      setIsTogglingAutoGeneration(false);
    }
  };

  const generateSinglePost = async () => {
    setIsGenerating(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      const response = await authenticatedFetch(`${backendUrl}/api/v1/admin/generate-single-post`, {
        method: 'POST',
        body: JSON.stringify({
          topic: 'Tópico automático baseado em tendências de marketing digital'
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        alert('Post gerado com sucesso!');
        fetchDashboardData(); // Recarrega os dados
      } else {
        throw new Error('Erro ao gerar post');
      }
    } catch (error) {
      console.error('Erro ao gerar post:', error);
      alert('Erro ao gerar post. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75"></div>
                <BarChart3 className="relative h-8 w-8 text-white bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-lg" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RG Pulse Admin
                </h1>
                <p className="text-xs text-gray-500">Painel de Administração</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Sistema Online</span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total de Posts</CardTitle>
              <FileText className="h-8 w-8 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalPosts || 0}</div>
              <p className="text-xs text-blue-100 mt-1">Posts no sistema</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Publicados</CardTitle>
              <TrendingUp className="h-8 w-8 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.publishedPosts || 0}</div>
              <p className="text-xs text-green-100 mt-1">Conteúdo ativo</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Rascunhos</CardTitle>
              <Edit className="h-8 w-8 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.draftPosts || 0}</div>
              <p className="text-xs text-orange-100 mt-1">Em desenvolvimento</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Último Gerado</CardTitle>
              <Calendar className="h-8 w-8 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {stats?.lastGenerated ? new Date(stats.lastGenerated).toLocaleDateString('pt-BR') : 'Nunca'}
              </div>
              <p className="text-xs text-purple-100 mt-1">Última atividade</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="posts" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
            >
              <FileText className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
            >
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger 
              value="scheduling" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
            >
              <Clock className="h-4 w-4" />
              Agendamento
            </TabsTrigger>
            <TabsTrigger 
              value="seo" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
            >
              <Target className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger 
              value="audit" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
            >
              <Shield className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger 
              value="leads" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
            >
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
            >
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Posts do Blog
                </h2>
                <p className="text-gray-600 mt-1">Gerencie e monitore todo o conteúdo do blog</p>
              </div>
              
              <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Gerar Novo Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Gerar Novo Post</DialogTitle>
                    <DialogDescription>
                      Configure as opções para gerar um novo post do blog.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="useCustomPrompt"
                        checked={generateForm.useCustomPrompt}
                        onChange={(e) => setGenerateForm(prev => ({ 
                          ...prev, 
                          useCustomPrompt: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <Label htmlFor="useCustomPrompt">Usar prompt personalizado</Label>
                    </div>
                    
                    {generateForm.useCustomPrompt ? (
                      <div className="grid gap-2">
                        <Label htmlFor="customPrompt">Prompt Personalizado</Label>
                        <Textarea
                          id="customPrompt"
                          placeholder="Descreva o tipo de conteúdo que você gostaria de gerar..."
                          value={generateForm.customPrompt}
                          onChange={(e) => setGenerateForm(prev => ({ 
                            ...prev, 
                            customPrompt: e.target.value 
                          }))}
                          rows={4}
                        />
                        <p className="text-sm text-gray-500">
                          Exemplo: "Escreva sobre estratégias de marketing digital para pequenas empresas"
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-2 w-full">
                        <Label htmlFor="theme">Tema</Label>
                        <Select 
                          value={generateForm.selectedTheme} 
                          onValueChange={(value) => setGenerateForm(prev => ({ 
                            ...prev, 
                            selectedTheme: value 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tema ou deixe em branco para aleatório" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="random">Tema Aleatório</SelectItem>
                            {themes.filter(theme => theme.active).map((theme) => (
                              <SelectItem key={theme.id} value={theme.id.toString()}>
                                {theme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {generateForm.selectedTheme && generateForm.selectedTheme !== 'random' && (
                          <div className="mt-2 p-4 bg-gray-50 rounded-md border">
                            {(() => {
                              const selectedTheme = themes.find(t => t.id.toString() === generateForm.selectedTheme);
                              if (!selectedTheme) return null;
                              
                              return (
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Descrição:</p>
                                    <p className="text-sm text-gray-600 mt-1">{selectedTheme.description}</p>
                                  </div>
                                  
                                  {selectedTheme.targetAudience && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Público-alvo:</p>
                                      <p className="text-sm text-gray-600 mt-1">{selectedTheme.targetAudience}</p>
                                    </div>
                                  )}
                                  
                                  {selectedTheme.tone && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Tom:</p>
                                      <p className="text-sm text-gray-600 mt-1 capitalize">{selectedTheme.tone}</p>
                                    </div>
                                  )}
                                  
                                  {selectedTheme.keywords && selectedTheme.keywords.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Palavras-chave:</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedTheme.keywords.slice(0, 6).map((keyword, index) => (
                                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                            {keyword}
                                          </span>
                                        ))}
                                        {selectedTheme.keywords.length > 6 && (
                                          <span className="text-xs text-gray-500">+{selectedTheme.keywords.length - 6} mais</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedTheme.contentExamples && selectedTheme.contentExamples.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Exemplos de conteúdo:</p>
                                      <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                        {selectedTheme.contentExamples.slice(0, 3).map((example, index) => (
                                          <li key={index} className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            {example}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowGenerateDialog(false)}
                      disabled={isGenerating}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={generateNewPost}
                      disabled={isGenerating || (generateForm.useCustomPrompt && !generateForm.customPrompt.trim())}
                    >
                      {isGenerating ? (
                        <>
                          <Activity className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Gerar Post
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Título
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 mr-2" />
                            Status
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            Tema
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Data
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            Ações
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-100">
                      {posts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-20"></div>
                                <FileText className="relative h-16 w-16 text-gray-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-xl font-semibold text-gray-700">Nenhum post encontrado</p>
                                <p className="text-gray-500">Gere seu primeiro post clicando no botão acima.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        posts.map((post, index) => (
                          <tr key={post.id} className="hover:bg-white/80 transition-all duration-200 group">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {post.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Slug: {post.slug}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                variant={post.status === 'published' ? 'default' : 'secondary'}
                                className={`${post.status === 'published' 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' 
                                  : 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-0'
                                } shadow-sm`}
                              >
                                {post.status === 'published' ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Publicado
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Rascunho
                                  </>
                                )}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700 font-medium">{post.theme}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {new Date(post.published_at).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(post.published_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                  title="Visualizar post"
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditPost(post.id)}
                                  title="Editar post"
                                  className="hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleDeletePost(post.id)}
                                  title="Excluir post"
                                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leads" className="space-y-4">
            <LeadsManager />
          </TabsContent>
          
          <TabsContent value="agents" className="space-y-4">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="relative">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Gerenciamento de Agents A2A
                        </span>
                        <p className="text-sm text-gray-600 font-normal mt-1">
                          Configure e gerencie seus assistentes de IA
                        </p>
                      </div>
                    </CardTitle>
                  </div>
                  <Button
                    onClick={() => {
                      resetAgentForm();
                      setShowAgentDialog(true);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Agent
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                      <tr>
                        <th className="text-left p-4 font-semibold text-purple-800">Nome</th>
                        <th className="text-left p-4 font-semibold text-purple-800">Agent ID</th>
                        <th className="text-left p-4 font-semibold text-purple-800">Endpoint</th>
                        <th className="text-left p-4 font-semibold text-purple-800">Status</th>
                        <th className="text-left p-4 font-semibold text-purple-800">Uso</th>
                        <th className="text-left p-4 font-semibold text-purple-800">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-gray-500">
                            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">Nenhum agent configurado</p>
                            <p className="text-sm">Adicione seu primeiro agent A2A para começar</p>
                          </td>
                        </tr>
                      ) : (
                        agents.map((agent) => (
                          <tr key={agent.id} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                            <td className="p-4">
                              <div>
                                <div className="font-semibold text-gray-800">{agent.name}</div>
                                <div className="text-sm text-gray-600">{agent.description}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                  {agent.agentId ? agent.agentId.substring(0, 8) : agent.agent_id ? agent.agent_id.substring(0, 8) : 'N/A'}...
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(agent.agentId || agent.agent_id || '', `agent-${agent.id}`)}
                                  className="h-6 w-6 p-0"
                                >
                                  {copiedField === `agent-${agent.id}` ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Link className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{agent.endpoint}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge 
                                variant={agent.active ? "default" : "secondary"}
                                className={agent.active 
                                  ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                  : "bg-gray-100 text-gray-600"
                                }
                              >
                                {agent.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                <div className="font-medium text-gray-800">{agent.usageCount} usos</div>
                                <div className="text-gray-500">
                                  {agent.lastUsed ? `Último: ${new Date(agent.lastUsed).toLocaleDateString('pt-BR')}` : 'Nunca usado'}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditAgent(agent)}
                                  title="Editar agent"
                                  className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setShowDeleteConfirm(agent.id)}
                                  title="Excluir agent"
                                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6">
              {/* Geração Automática */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -mr-16 -mt-16"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Geração Automática de Posts
                      </span>
                      <p className="text-sm text-gray-600 font-normal mt-1">
                        Configure a geração automática de posts do blog
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 relative">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${autoGenerationEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                          Ativar Geração Automática
                        </h4>
                        <p className="text-sm text-gray-600">
                          Posts serão gerados automaticamente 3 vezes ao dia (8h, 14h, 20h)
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Horários: 08:00, 14:00, 20:00
                          </span>
                          <span className="flex items-center">
                            <Activity className="h-3 w-3 mr-1" />
                            Status: {autoGenerationEnabled ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={autoGenerationEnabled ? "destructive" : "default"}
                        onClick={toggleAutoGeneration}
                        disabled={isTogglingAutoGeneration}
                        className={`min-w-[200px] ${autoGenerationEnabled 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        } text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                      >
                        {isTogglingAutoGeneration ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : autoGenerationEnabled ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Desativar Geração Automática
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Ativar Geração Automática
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="font-semibold mb-3 text-blue-800 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Status do Agendamento
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Próxima execução:</span>
                          <span className="font-medium text-blue-700">
                            {autoGenerationEnabled ? 'Calculando...' : 'Desativado'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Último post gerado:</span>
                          <span className="font-medium text-blue-700">
                            {stats?.lastGenerated ? new Date(stats.lastGenerated).toLocaleString('pt-BR') : 'Nunca'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <h4 className="font-semibold mb-3 text-green-800 flex items-center">
                        <Wand2 className="h-4 w-4 mr-2" />
                        Geração Manual
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Gere um post imediatamente sem aguardar o agendamento
                      </p>
                      <Button
                        variant="outline"
                        onClick={generateSinglePost}
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isGenerating ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Gerar Post Agora
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Configurações do Gemini */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -mr-16 -mt-16"></div>
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Configurações do Gemini AI
                      </span>
                      <p className="text-sm text-gray-600 font-normal mt-1">
                        Configurações do modelo de IA para geração de conteúdo
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 relative">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <label className="text-sm font-semibold text-gray-800">Modelo Atual</label>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Gemini 2.0 Flash Experimental</p>
                      <p className="text-xs text-gray-500 mt-1">Última atualização: Hoje</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        <label className="text-sm font-semibold text-gray-800">Geração de Imagens</label>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Ativada (Nativo Gemini)</p>
                      <p className="text-xs text-gray-500 mt-1">Resolução: 1024x1024</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <h4 className="font-semibold mb-4 text-gray-800 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                      Estatísticas de Uso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Posts Gerados</p>
                            <p className="text-2xl font-bold text-purple-600">{stats?.totalPosts || 0}</p>
                          </div>
                          <FileText className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Imagens Geradas</p>
                            <p className="text-2xl font-bold text-blue-600">{stats?.totalPosts || 0}</p>
                          </div>
                          <Eye className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                            <p className="text-2xl font-bold text-green-600">98%</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Configurações de Tracking */}
              <SettingsManager />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Analytics do Sistema
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Visualizações Hoje</p>
                        <p className="text-2xl font-bold text-blue-600">1,234</p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Usuários Únicos</p>
                        <p className="text-2xl font-bold text-green-600">567</p>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Rejeição</p>
                        <p className="text-2xl font-bold text-orange-600">23%</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tempo Médio</p>
                        <p className="text-2xl font-bold text-purple-600">3:45</p>
                      </div>
                      <Clock className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </div>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Gráficos detalhados em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Central de Notificações
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Configurações de Notificação</h3>
                      <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <span>Notificações por Email</span>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-purple-500" />
                          <span>Notificações Push</span>
                        </div>
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center py-8">
                    <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Sistema de notificações em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agendamento Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    Agendamento de Posts
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Posts Agendados</h3>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-green-500 to-teal-500"
                        onClick={() => setShowScheduleDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agendar Post
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {isLoadingScheduled ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                          <span className="ml-2 text-gray-600">Carregando posts agendados...</span>
                        </div>
                      ) : scheduledPosts.length > 0 ? (
                        scheduledPosts.map((post: ScheduledPost) => (
                          <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className="text-sm text-gray-600">
                                Agendado para: {new Date(post.scheduled_for).toLocaleString('pt-BR')}
                              </p>
                              {post.theme && (
                                <p className="text-xs text-gray-500 mt-1">Tema: {post.theme}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={
                                  post.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                  post.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                  post.status === 'published' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }
                              >
                                {post.status === 'scheduled' ? 'Agendado' :
                                 post.status === 'pending' ? 'Pendente' :
                                 post.status === 'published' ? 'Publicado' :
                                 post.status}
                              </Badge>
                              {(post.status === 'scheduled' || post.status === 'pending') && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      // Preencher o formulário com os dados do post para edição
                                      const scheduledDate = new Date(post.scheduled_for);
                                      setScheduleForm({
                                        title: post.title,
                                        content: post.content || '',
                                        theme: post.theme || '',
                                        scheduledFor: scheduledDate.toISOString().split('T')[0],
                                        scheduledTime: scheduledDate.toTimeString().slice(0, 5)
                                      });
                                      setShowScheduleDialog(true);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCancelScheduledPost(post.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500">Nenhum post agendado encontrado</p>
                          <p className="text-sm text-gray-400 mt-1">Clique em "Agendar Post" para criar um novo agendamento</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            <SEOManager />
          </TabsContent>

          {/* Auditoria Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    Auditoria e Segurança
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Logs Hoje</p>
                        <p className="text-2xl font-bold text-blue-600">1,456</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Alertas Ativos</p>
                        <p className="text-2xl font-bold text-yellow-600">3</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tentativas Bloqueadas</p>
                        <p className="text-2xl font-bold text-red-600">12</p>
                      </div>
                      <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Uptime</p>
                        <p className="text-2xl font-bold text-green-600">99.9%</p>
                      </div>
                      <Activity className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Atividades Recentes</h3>
                      <Button size="sm" className="bg-gradient-to-r from-red-500 to-pink-500">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Logs
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Login bem-sucedido - admin@rgpulse.com</span>
                        </div>
                        <span className="text-xs text-gray-500">há 2 min</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Post criado - "IA e Automação"</span>
                        </div>
                        <span className="text-xs text-gray-500">há 15 min</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Tentativa de acesso negada - IP: 192.168.1.100</span>
                        </div>
                        <span className="text-xs text-gray-500">há 1 hora</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center py-8">
                    <Shield className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Sistema de auditoria completo em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Modal para Adicionar/Editar Agent */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              {editingAgent ? 'Editar Agent A2A' : 'Novo Agent A2A'}
            </DialogTitle>
            <DialogDescription>
              {editingAgent 
                ? 'Atualize as configurações do agent A2A'
                : 'Configure um novo agent A2A para seu sistema'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Nome do Agent</Label>
                <Input
                  id="agent-name"
                  placeholder="Ex: Anna Pulse Chat"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-status">Status</Label>
                <Select 
                  value={agentForm.active ? 'true' : 'false'}
                  onValueChange={(value) => setAgentForm(prev => ({ ...prev, active: value === 'true' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-description">Descrição</Label>
              <Textarea
                id="agent-description"
                placeholder="Descreva a função deste agent..."
                value={agentForm.description}
                onChange={(e) => setAgentForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-id" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Agent ID
              </Label>
              <Input
                id="agent-id"
                placeholder="ID único do agent A2A"
                value={agentForm.agentId}
                onChange={(e) => setAgentForm(prev => ({ ...prev, agentId: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-endpoint" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Endpoint da API
              </Label>
              <Input
                id="agent-endpoint"
                placeholder="https://api.a2a.ai/v1"
                value={agentForm.endpoint}
                onChange={(e) => setAgentForm(prev => ({ ...prev, endpoint: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-api-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key
              </Label>
              <Input
                id="agent-api-key"
                type="password"
                placeholder="Chave de API para autenticação"
                value={agentForm.apiKey}
                onChange={(e) => setAgentForm(prev => ({ ...prev, apiKey: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">Informações Importantes:</p>
                  <ul className="text-blue-700 space-y-1 list-disc list-inside">
                    <li>O Agent ID deve ser único e válido na plataforma A2A</li>
                    <li>A API Key será criptografada e armazenada com segurança</li>
                    <li>Certifique-se de que o endpoint está correto e acessível</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAgentDialog(false);
                resetAgentForm();
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveAgent}
              disabled={!agentForm.name || !agentForm.agentId || !agentForm.endpoint}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingAgent ? 'Atualizar' : 'Criar'} Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir este agent? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <p className="text-sm text-red-800">
              <strong>Atenção:</strong> Excluir este agent pode afetar funcionalidades que dependem dele, 
              como o chat do site.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDeleteAgent(showDeleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Agendamento de Posts */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Agendar Novo Post
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do post que será gerado e publicado automaticamente na data e hora especificadas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-title">Título do Post</Label>
              <Input
                id="schedule-title"
                placeholder="Digite o título do post..."
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="schedule-theme">Tema (Opcional)</Label>
              <Select 
                value={scheduleForm.theme}
                onValueChange={(value) => setScheduleForm(prev => ({ ...prev, theme: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tema ou deixe em branco para tema aleatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tema Aleatório</SelectItem>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.name}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="schedule-content">Conteúdo Personalizado (Opcional)</Label>
              <Textarea
                id="schedule-content"
                placeholder="Deixe em branco para gerar conteúdo automaticamente com IA, ou digite um conteúdo personalizado..."
                value={scheduleForm.content}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Data de Publicação</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleForm.scheduledFor}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Horário de Publicação</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleForm.scheduledTime}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>
            </div>
            
            {scheduleForm.scheduledFor && scheduleForm.scheduledTime && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <Clock className="h-4 w-4 inline mr-1" />
                  O post será publicado em: {' '}
                  <strong>
                    {new Date(`${scheduleForm.scheduledFor}T${scheduleForm.scheduledTime}:00`).toLocaleString('pt-BR')}
                  </strong>
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowScheduleDialog(false);
                setScheduleForm({
                  title: '',
                  content: '',
                  theme: '',
                  scheduledFor: '',
                  scheduledTime: ''
                });
              }}
              disabled={isScheduling}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSchedulePost}
              disabled={!scheduleForm.title || !scheduleForm.scheduledFor || !scheduleForm.scheduledTime || isScheduling}
              className="bg-gradient-to-r from-green-500 to-teal-500"
            >
              {isScheduling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Agendando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;