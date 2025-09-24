import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  Code, 
  Globe, 
  Target,
  Facebook,
  BarChart3,
  Smartphone,
  Monitor,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Video,
  Play
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TrackingConfig {
  id?: string;
  gtm_id?: string;
  gtm_enabled: boolean;
  facebook_pixel_id?: string;
  facebook_pixel_enabled: boolean;
  google_analytics_id?: string;
  google_analytics_enabled: boolean;
  custom_scripts?: string;
  created_at?: string;
  updated_at?: string;
}

interface TrackingEvent {
  id: string;
  event_name: string;
  event_type: 'pageview' | 'click' | 'form_submit' | 'purchase' | 'custom';
  description: string;
  parameters: Record<string, any>;
  enabled: boolean;
  created_at: string;
}

interface VideoConfig {
  home_video_url?: string;
  home_video_title?: string;
  home_video_subtitle?: string;
  home_video_cta_text?: string;
  home_video_cta_href?: string;
  inpractice_video_url?: string;
  inpractice_video_title?: string;
  inpractice_video_subtitle?: string;
  inpractice_video_cta_text?: string;
  inpractice_video_cta_href?: string;
}

const SettingsManager: React.FC = () => {
  const [config, setConfig] = useState<TrackingConfig>({
    gtm_enabled: false,
    facebook_pixel_enabled: false,
    google_analytics_enabled: false
  });
  const [videoConfig, setVideoConfig] = useState<VideoConfig>({
    home_video_url: 'https://www.youtube.com/embed/SECKq_9AAwA',
    home_video_title: 'Transforme Seu Negócio com o Sistema RG Pulse',
    home_video_subtitle: 'Descubra como nossa metodologia pode revolucionar seus resultados',
    home_video_cta_text: 'Quero conhecer o sistema',
    home_video_cta_href: '#lead-form',
    inpractice_video_url: 'https://www.youtube.com/embed/SECKq_9AAwA',
    inpractice_video_title: 'Desvendando o Sistema RG Pulse',
    inpractice_video_subtitle: 'Uma visão detalhada de como otimizamos cada etapa da sua jornada de vendas',
    inpractice_video_cta_text: 'Quero este sistema para mim',
    inpractice_video_cta_href: 'https://wa.me/5548999555389'
  });
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tracking');
  const [testMode, setTestMode] = useState(false);
  const [savingVideos, setSavingVideos] = useState(false);

  useEffect(() => {
    fetchTrackingConfig();
    fetchTrackingEvents();
    fetchVideoConfig();
  }, []);

  const fetchTrackingConfig = async () => {
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${backendUrl}/api/v1/admin/tracking-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || {
          gtm_enabled: false,
          facebook_pixel_enabled: false,
          google_analytics_enabled: false
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de tracking.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingEvents = async () => {
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${backendUrl}/api/v1/admin/tracking-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  };

  const saveTrackingConfig = async () => {
    setSaving(true);
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${backendUrl}/api/v1/admin/tracking-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações de tracking salvas com sucesso!"
        });
        fetchTrackingConfig();
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchVideoConfig = async () => {
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${backendUrl}/api/v1/admin/video-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setVideoConfig(prev => ({ ...prev, ...data.config }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de vídeo:', error);
    }
  };

  const saveVideoConfig = async () => {
    setSavingVideos(true);
    try {
      const authSession = localStorage.getItem('auth_session');
      const session = authSession ? JSON.parse(authSession) : null;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${backendUrl}/api/v1/admin/video-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoConfig)
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações de vídeo salvas com sucesso!"
        });
        fetchVideoConfig();
      } else {
        throw new Error('Erro ao salvar configurações de vídeo');
      }
    } catch (error) {
      console.error('Erro ao salvar vídeos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de vídeo.",
        variant: "destructive"
      });
    } finally {
      setSavingVideos(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copiado!",
        description: "Código copiado para a área de transferência."
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const generateGTMCode = () => {
    if (!config.gtm_id) return '';
    
    return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${config.gtm_id}');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${config.gtm_id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
  };

  const generateFacebookPixelCode = () => {
    if (!config.facebook_pixel_id) return '';
    
    return `<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${config.facebook_pixel_id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${config.facebook_pixel_id}&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->`;
  };

  const testTrackingImplementation = async () => {
    setTestMode(true);
    try {
      // Simular teste de implementação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = {
        gtm: config.gtm_enabled && config.gtm_id ? 'success' : 'disabled',
        facebook: config.facebook_pixel_enabled && config.facebook_pixel_id ? 'success' : 'disabled',
        analytics: config.google_analytics_enabled && config.google_analytics_id ? 'success' : 'disabled'
      };
      
      toast({
        title: "Teste Concluído",
        description: `GTM: ${results.gtm}, Facebook: ${results.facebook}, Analytics: ${results.analytics}`
      });
    } catch (error) {
      console.error('Erro no teste:', error);
    } finally {
      setTestMode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Configurações de Tracking
          </h2>
          <p className="text-gray-600 mt-1">Configure Google Tag Manager, Facebook Pixel e outras ferramentas de análise</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={testTrackingImplementation}
            disabled={testMode}
            className="flex items-center gap-2"
          >
            {testMode ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            Testar Implementação
          </Button>
          <Button
            onClick={saveTrackingConfig}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
          <TabsTrigger 
            value="tracking" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
          >
            <Target className="h-4 w-4" />
            Tracking
          </TabsTrigger>
          <TabsTrigger 
            value="videos" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
          >
            <Video className="h-4 w-4" />
            Vídeos
          </TabsTrigger>
          <TabsTrigger 
            value="events" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
          >
            <BarChart3 className="h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium"
          >
            <Code className="h-4 w-4" />
            Código
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google Tag Manager */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold">Google Tag Manager</span>
                    <Badge 
                      variant={config.gtm_enabled ? "default" : "secondary"} 
                      className={`ml-2 ${config.gtm_enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                    >
                      {config.gtm_enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="gtm-enabled"
                    checked={config.gtm_enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, gtm_enabled: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="gtm-enabled" className="text-sm font-medium">
                    Habilitar Google Tag Manager
                  </Label>
                </div>
                
                {config.gtm_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="gtm-id" className="text-sm font-medium">
                      GTM Container ID
                    </Label>
                    <Input
                      id="gtm-id"
                      placeholder="GTM-XXXXXXX"
                      value={config.gtm_id || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, gtm_id: e.target.value }))}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      Encontre seu Container ID no Google Tag Manager (formato: GTM-XXXXXXX)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facebook Pixel */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                    <Facebook className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold">Facebook Pixel</span>
                    <Badge 
                      variant={config.facebook_pixel_enabled ? "default" : "secondary"} 
                      className={`ml-2 ${config.facebook_pixel_enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                    >
                      {config.facebook_pixel_enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="facebook-enabled"
                    checked={config.facebook_pixel_enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, facebook_pixel_enabled: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="facebook-enabled" className="text-sm font-medium">
                    Habilitar Facebook Pixel
                  </Label>
                </div>
                
                {config.facebook_pixel_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="facebook-id" className="text-sm font-medium">
                      Pixel ID
                    </Label>
                    <Input
                      id="facebook-id"
                      placeholder="123456789012345"
                      value={config.facebook_pixel_id || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, facebook_pixel_id: e.target.value }))}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      Encontre seu Pixel ID no Facebook Business Manager
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Analytics */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold">Google Analytics</span>
                    <Badge 
                      variant={config.google_analytics_enabled ? "default" : "secondary"} 
                      className={`ml-2 ${config.google_analytics_enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                    >
                      {config.google_analytics_enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="analytics-enabled"
                    checked={config.google_analytics_enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, google_analytics_enabled: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="analytics-enabled" className="text-sm font-medium">
                    Habilitar Google Analytics
                  </Label>
                </div>
                
                {config.google_analytics_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="analytics-id" className="text-sm font-medium">
                      Measurement ID
                    </Label>
                    <Input
                      id="analytics-id"
                      placeholder="G-XXXXXXXXXX"
                      value={config.google_analytics_id || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      Encontre seu Measurement ID no Google Analytics (formato: G-XXXXXXXXXX)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scripts Personalizados */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Scripts Personalizados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-scripts" className="text-sm font-medium">
                    Código HTML/JavaScript Adicional
                  </Label>
                  <Textarea
                    id="custom-scripts"
                    placeholder="<!-- Adicione scripts personalizados aqui -->"
                    value={config.custom_scripts || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, custom_scripts: e.target.value }))}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Adicione scripts de terceiros, pixels personalizados ou código de tracking adicional
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Eventos de Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Gerenciamento de eventos personalizados em desenvolvimento</p>
                <p className="text-sm text-gray-400 mt-2">
                  Em breve você poderá configurar eventos personalizados para tracking avançado
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* GTM Code Preview */}
            {config.gtm_enabled && config.gtm_id && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                      Código Google Tag Manager
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateGTMCode(), 'gtm')}
                      className="flex items-center gap-2"
                    >
                      {copiedField === 'gtm' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copiar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{generateGTMCode()}</code>
                  </pre>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-1">Instruções de Implementação:</p>
                        <ul className="text-blue-700 space-y-1 list-disc list-inside">
                          <li>Cole o primeiro script no &lt;head&gt; da sua página</li>
                          <li>Cole o segundo script (noscript) logo após a tag &lt;body&gt;</li>
                          <li>Teste a implementação usando o Google Tag Assistant</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Facebook Pixel Code Preview */}
            {config.facebook_pixel_enabled && config.facebook_pixel_id && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      Código Facebook Pixel
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateFacebookPixelCode(), 'facebook')}
                      className="flex items-center gap-2"
                    >
                      {copiedField === 'facebook' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copiar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{generateFacebookPixelCode()}</code>
                  </pre>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-1">Instruções de Implementação:</p>
                        <ul className="text-blue-700 space-y-1 list-disc list-inside">
                          <li>Cole este código no &lt;head&gt; da sua página</li>
                          <li>Teste usando o Facebook Pixel Helper</li>
                          <li>Configure eventos personalizados conforme necessário</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Summary */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Status da Configuração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      config.gtm_enabled && config.gtm_id ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-sm">Google Tag Manager</p>
                      <p className="text-xs text-gray-500">
                        {config.gtm_enabled && config.gtm_id ? 'Configurado' : 'Não configurado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      config.facebook_pixel_enabled && config.facebook_pixel_id ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-sm">Facebook Pixel</p>
                      <p className="text-xs text-gray-500">
                        {config.facebook_pixel_enabled && config.facebook_pixel_id ? 'Configurado' : 'Não configurado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      config.google_analytics_enabled && config.google_analytics_id ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-sm">Google Analytics</p>
                      <p className="text-xs text-gray-500">
                        {config.google_analytics_enabled && config.google_analytics_id ? 'Configurado' : 'Não configurado'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configurações de Vídeo</h2>
              <p className="text-gray-600 mt-1">Configure os vídeos exibidos nas páginas Home e Na Prática</p>
            </div>
            <Button
              onClick={saveVideoConfig}
              disabled={savingVideos}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {savingVideos ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Vídeos
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vídeo da Home */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold">Vídeo da Home</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="home-video-url" className="text-sm font-medium">
                    URL do Vídeo (YouTube Embed)
                  </Label>
                  <Input
                    id="home-video-url"
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    value={videoConfig.home_video_url || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, home_video_url: e.target.value }))}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Use o formato de embed do YouTube (https://www.youtube.com/embed/VIDEO_ID)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="home-video-title" className="text-sm font-medium">
                    Título do Vídeo
                  </Label>
                  <Input
                    id="home-video-title"
                    placeholder="Título do vídeo"
                    value={videoConfig.home_video_title || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, home_video_title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="home-video-subtitle" className="text-sm font-medium">
                    Subtítulo do Vídeo
                  </Label>
                  <Input
                    id="home-video-subtitle"
                    placeholder="Subtítulo do vídeo"
                    value={videoConfig.home_video_subtitle || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, home_video_subtitle: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="home-video-cta-text" className="text-sm font-medium">
                    Texto do Botão CTA
                  </Label>
                  <Input
                    id="home-video-cta-text"
                    placeholder="Texto do botão"
                    value={videoConfig.home_video_cta_text || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, home_video_cta_text: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="home-video-cta-href" className="text-sm font-medium">
                    Link do Botão CTA
                  </Label>
                  <Input
                    id="home-video-cta-href"
                    placeholder="#lead-form ou URL completa"
                    value={videoConfig.home_video_cta_href || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, home_video_cta_href: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vídeo da Página Na Prática */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold">Vídeo Na Prática</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inpractice-video-url" className="text-sm font-medium">
                    URL do Vídeo (YouTube Embed)
                  </Label>
                  <Input
                    id="inpractice-video-url"
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    value={videoConfig.inpractice_video_url || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, inpractice_video_url: e.target.value }))}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Use o formato de embed do YouTube (https://www.youtube.com/embed/VIDEO_ID)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inpractice-video-title" className="text-sm font-medium">
                    Título do Vídeo
                  </Label>
                  <Input
                    id="inpractice-video-title"
                    placeholder="Título do vídeo"
                    value={videoConfig.inpractice_video_title || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, inpractice_video_title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inpractice-video-subtitle" className="text-sm font-medium">
                    Subtítulo do Vídeo
                  </Label>
                  <Input
                    id="inpractice-video-subtitle"
                    placeholder="Subtítulo do vídeo"
                    value={videoConfig.inpractice_video_subtitle || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, inpractice_video_subtitle: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inpractice-video-cta-text" className="text-sm font-medium">
                    Texto do Botão CTA
                  </Label>
                  <Input
                    id="inpractice-video-cta-text"
                    placeholder="Texto do botão"
                    value={videoConfig.inpractice_video_cta_text || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, inpractice_video_cta_text: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inpractice-video-cta-href" className="text-sm font-medium">
                    Link do Botão CTA
                  </Label>
                  <Input
                    id="inpractice-video-cta-href"
                    placeholder="URL do WhatsApp ou link personalizado"
                    value={videoConfig.inpractice_video_cta_href || ''}
                    onChange={(e) => setVideoConfig(prev => ({ ...prev, inpractice_video_cta_href: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsManager;