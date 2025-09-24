import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  TrendingUp, 
  Hash, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  FileText,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Target,
  Globe,
  Brain,
  Zap,
  X
} from 'lucide-react';

interface SEOData {
  id: string;
  post_id: string;
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  keywords?: string[];
  seo_score?: number;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  twitter_title?: string;
  twitter_description?: string;
  created_at: string;
  updated_at: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  seo_score?: number;
}

interface SEOReport {
  summary: {
    totalPosts: number;
    averageScore: number;
    topPerformers: number;
    needsImprovement: number;
  };
  trends: any[];
  recommendations: string[];
  generatedAt: string;
}

interface SEOAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggested_keywords?: string[];
  title_analysis?: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  content_analysis?: {
    score: number;
    readability: number;
    keyword_density: number;
    issues: string[];
    suggestions: string[];
  };
}

const SEOManager: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [seoReport, setSeoReport] = useState<SEOReport | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SEOAnalysis | null>(null);

  // Estados para formulário de SEO
  const [formData, setFormData] = useState({
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    keywords: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    twitter_title: '',
    twitter_description: ''
  });

  useEffect(() => {
    loadPosts();
    loadSEOReport();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch('/api/v1/admin/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSEOReport = async () => {
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch('/api/seo/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSeoReport(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório de SEO:', error);
    }
  };

  const analyzePost = async (postId: string) => {
    try {
      setAnalyzing(true);
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch(`/api/seo/analyze/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Atualizar o score do post na lista
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, seo_score: data.data.score }
            : post
        ));
        loadSEOReport(); // Recarregar relatório
      }
    } catch (error) {
      console.error('Erro ao analisar SEO:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const loadPostSEO = async (postId: string) => {
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch(`/api/seo/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSeoData(data.data);
        if (data.data) {
          setFormData({
            meta_title: data.data.meta_title || '',
            meta_description: data.data.meta_description || '',
            focus_keyword: data.data.focus_keyword || '',
            keywords: data.data.keywords ? data.data.keywords.join(', ') : '',
            canonical_url: data.data.canonical_url || '',
            og_title: data.data.og_title || '',
            og_description: data.data.og_description || '',
            twitter_title: data.data.twitter_title || '',
            twitter_description: data.data.twitter_description || ''
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar SEO do post:', error);
    }
  };

  const saveSEOSettings = async () => {
    if (!selectedPost) return;

    try {
      setLoading(true);
      const payload = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      };

      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch(`/api/seo/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setIsEditDialogOpen(false);
        loadPostSEO(selectedPost.id);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de SEO:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizePost = async (postId: string) => {
    try {
      setLoading(true);
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch(`/api/seo/optimize/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        loadPostSEO(postId);
        analyzePost(postId);
      }
    } catch (error) {
      console.error('Erro ao otimizar post:', error);
    } finally {
      setLoading(false);
    }
  };

  // === FUNÇÕES DE IA ===

  const optimizeWithAI = async (postId: string) => {
    try {
      setLoading(true);
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch(`/api/seo/optimize-ai/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Atualizar o score do post na lista
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, seo_score: data.data.newScore }
            : post
        ));
        loadPostSEO(postId);
        loadSEOReport();
        alert('Post otimizado com IA com sucesso!');
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao otimizar com IA:', error);
      alert('Erro ao otimizar com IA. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async (postId: string) => {
    try {
      setAnalyzing(true);
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch(`/api/seo/analyze-ai/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const analysis = data.data.aiAnalysis;
        
        // Definir o resultado da análise e abrir o modal
        setAnalysisResult(analysis);
        setIsAnalysisModalOpen(true);
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao analisar com IA:', error);
      alert('Erro ao analisar com IA. Tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const optimizeBulkWithAI = async () => {
    const selectedPostIds = posts
      .filter(post => post.seo_score === undefined || post.seo_score < 70)
      .slice(0, 5) // Limitar a 5 posts por vez
      .map(post => post.id);

    if (selectedPostIds.length === 0) {
      alert('Nenhum post precisa de otimização.');
      return;
    }

    if (!confirm(`Deseja otimizar ${selectedPostIds.length} posts com IA? Isso pode levar alguns minutos.`)) {
      return;
    }

    try {
      setLoading(true);
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const response = await fetch('/api/seo/optimize-ai/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postIds: selectedPostIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        const { successful, failed, summary } = data.data;
        
        alert(`Otimização em lote concluída!\n\n` +
          `Total: ${summary.total}\n` +
          `Sucessos: ${summary.successful}\n` +
          `Falhas: ${summary.failed}`);
        
        loadPosts();
        loadSEOReport();
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro na otimização em lote:', error);
      alert('Erro na otimização em lote. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Modal de Análise de SEO */}
      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Análise de SEO com IA
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAnalysisModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {analysisResult && (
            <div className="space-y-6">
              {/* Score Principal */}
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(analysisResult.score)}`}>
                  {analysisResult.score}/100
                </div>
                <div className="text-lg text-gray-600">Score de SEO</div>
                <Badge 
                  variant={getScoreBadgeVariant(analysisResult.score)}
                  className="mt-2"
                >
                  {analysisResult.score >= 80 ? 'Excelente' : 
                   analysisResult.score >= 60 ? 'Bom' : 'Precisa Melhorar'}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Pontos Fortes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      Pontos Fortes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(analysisResult.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Pontos Fracos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Pontos Fracos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(analysisResult.weaknesses || []).map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recomendações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Target className="w-5 h-5" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(analysisResult.recommendations || []).map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Palavras-chave Sugeridas */}
              {analysisResult.suggested_keywords && analysisResult.suggested_keywords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <Hash className="w-5 h-5" />
                      Palavras-chave Sugeridas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.suggested_keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-purple-600 border-purple-200">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Análise do Título */}
              {analysisResult.title_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-600">
                      <FileText className="w-5 h-5" />
                      Análise do Título
                      <Badge variant="outline" className="ml-2">
                        {analysisResult.title_analysis?.score || 0}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisResult.title_analysis?.issues && analysisResult.title_analysis.issues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Problemas Identificados:</h4>
                        <ul className="space-y-1">
                          {analysisResult.title_analysis.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.title_analysis?.suggestions && analysisResult.title_analysis.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Sugestões:</h4>
                        <ul className="space-y-1">
                          {analysisResult.title_analysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Análise do Conteúdo */}
              {analysisResult.content_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-teal-600">
                      <BarChart3 className="w-5 h-5" />
                      Análise do Conteúdo
                      <Badge variant="outline" className="ml-2">
                        {analysisResult.content_analysis?.score || 0}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysisResult.content_analysis?.readability || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Legibilidade</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600">
                          {analysisResult.content_analysis?.keyword_density || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Densidade de Palavras-chave</div>
                      </div>
                    </div>
                    
                    {analysisResult.content_analysis?.issues && analysisResult.content_analysis.issues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Problemas Identificados:</h4>
                        <ul className="space-y-1">
                          {analysisResult.content_analysis.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysisResult.content_analysis?.suggestions && analysisResult.content_analysis.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Sugestões:</h4>
                        <ul className="space-y-1">
                          {analysisResult.content_analysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Botão de Ação */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => setIsAnalysisModalOpen(false)}
                  className="px-8"
                >
                  OK
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resto do componente continua igual... */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Estatísticas de SEO */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Score SEO Médio</p>
                    <p className="text-2xl font-bold text-green-600">
                      {seoReport?.summary.averageScore?.toFixed(0) || 0}/100
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Posts</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {seoReport?.summary.totalPosts || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Top Performers</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {seoReport?.summary.topPerformers || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Precisam Melhorar</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {seoReport?.summary.needsImprovement || 0}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recomendações */}
          {seoReport?.recommendations && seoReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recomendações de SEO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seoReport.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm text-blue-800">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gerenciamento de SEO por Post</span>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={optimizeBulkWithAI} 
                    variant="default" 
                    size="sm"
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Otimizar com IA (Lote)
                  </Button>
                  <Button onClick={loadPosts} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{post.title}</h3>
                      <p className="text-sm text-gray-500">/{post.slug}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                          {post.status}
                        </Badge>
                        {post.seo_score !== undefined && (
                          <Badge className={getScoreBadgeColor(post.seo_score)}>
                            SEO: {post.seo_score}/100
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => analyzePost(post.id)}
                        disabled={analyzing}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analisar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => analyzeWithAI(post.id)}
                        disabled={analyzing}
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Analisar IA
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post);
                          loadPostSEO(post.id);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar SEO
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => optimizePost(post.id)}
                        disabled={loading}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Otimizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => optimizeWithAI(post.id)}
                        disabled={loading}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Otimizar IA
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Pesquisa de Palavras-chave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Digite uma palavra-chave para pesquisar..." className="flex-1" />
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisar
                  </Button>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Hash className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Funcionalidade de pesquisa de palavras-chave em desenvolvimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          {/* Seção de Ferramentas de IA */}
          <Card className="border-2 border-gradient-to-r from-purple-200 to-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Brain className="h-6 w-6" />
                Ferramentas de IA para SEO
              </CardTitle>
              <p className="text-sm text-gray-600">
                Utilize inteligência artificial para otimizar automaticamente o SEO dos seus posts.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-blue-800">Otimização Inteligente</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    A IA analisa seu conteúdo e otimiza automaticamente títulos, descrições e palavras-chave.
                  </p>
                  <Button 
                    onClick={optimizeBulkWithAI}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {loading ? 'Otimizando...' : 'Otimizar Posts com IA'}
                  </Button>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-800">Análise Avançada</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Receba insights detalhados sobre pontos fortes, fracos e recomendações específicas.
                  </p>
                  <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                    💡 Use os botões "Analisar IA" em cada post para análises individuais
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Como funciona a IA</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Analisa o conteúdo do post e identifica oportunidades de melhoria</li>
                      <li>• Gera títulos e descrições otimizados para SEO</li>
                      <li>• Sugere palavras-chave relevantes baseadas no conteúdo</li>
                      <li>• Fornece recomendações específicas para melhorar o ranking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ferramentas Tradicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Sitemap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Gere e atualize o sitemap do seu site para melhorar a indexação.
                </p>
                <Button className="w-full">
                  Gerar Sitemap
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Robots.txt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Configure o arquivo robots.txt para controlar o acesso dos crawlers.
                </p>
                <Button className="w-full">
                  Gerar Robots.txt
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar SEO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações de SEO - {selectedPost?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="social">Redes Sociais</TabsTrigger>
                <TabsTrigger value="advanced">Avançado</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="meta_title">Título SEO (Meta Title)</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="Título otimizado para SEO (máx. 60 caracteres)"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.meta_title.length}/60 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="meta_description">Meta Descrição</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Descrição que aparecerá nos resultados de busca (máx. 160 caracteres)"
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.meta_description.length}/160 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="focus_keyword">Palavra-chave Principal</Label>
                    <Input
                      id="focus_keyword"
                      value={formData.focus_keyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, focus_keyword: e.target.value }))}
                      placeholder="Palavra-chave principal do post"
                    />
                  </div>

                  <div>
                    <Label htmlFor="keywords">Palavras-chave Secundárias</Label>
                    <Input
                      id="keywords"
                      value={formData.keywords}
                      onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="Palavras-chave separadas por vírgula"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Open Graph (Facebook)</h3>
                  <div>
                    <Label htmlFor="og_title">Título OG</Label>
                    <Input
                      id="og_title"
                      value={formData.og_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, og_title: e.target.value }))}
                      placeholder="Título para compartilhamento no Facebook"
                    />
                  </div>
                  <div>
                    <Label htmlFor="og_description">Descrição OG</Label>
                    <Textarea
                      id="og_description"
                      value={formData.og_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, og_description: e.target.value }))}
                      placeholder="Descrição para compartilhamento no Facebook"
                      rows={3}
                    />
                  </div>

                  <h3 className="font-medium mt-6">Twitter Cards</h3>
                  <div>
                    <Label htmlFor="twitter_title">Título Twitter</Label>
                    <Input
                      id="twitter_title"
                      value={formData.twitter_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, twitter_title: e.target.value }))}
                      placeholder="Título para compartilhamento no Twitter"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter_description">Descrição Twitter</Label>
                    <Textarea
                      id="twitter_description"
                      value={formData.twitter_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, twitter_description: e.target.value }))}
                      placeholder="Descrição para compartilhamento no Twitter"
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="canonical_url">URL Canônica</Label>
                  <Input
                    id="canonical_url"
                    value={formData.canonical_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, canonical_url: e.target.value }))}
                    placeholder="URL canônica do post (opcional)"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveSEOSettings} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SEOManager;