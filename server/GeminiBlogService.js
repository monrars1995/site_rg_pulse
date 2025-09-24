const { GoogleGenerativeAI } = require('@google/generative-ai');
const pino = require('pino')();
const { getBlogRepository } = require('./BlogRepositoryFactory');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');

class GeminiBlogService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não encontrada nas variáveis de ambiente');
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    // Usando Gemini 2.5 Pro Preview
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    // Modelo para geração de imagens
    this.imageModel = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-preview-image-generation'
    });
    this.blogRepository = getBlogRepository();
    
    // Esquema para validar a resposta do Gemini
    this.responseSchema = Joi.object({
      title: Joi.string().required(),
      summary: Joi.string().required(),
      content_markdown: Joi.string().required(),
      cover_image_url: Joi.string().uri().required(),
      estimated_read_time_minutes: Joi.number().integer().min(1).required(),
      tags: Joi.array().items(Joi.string()).required(),
      suggested_slug: Joi.string().optional()
    });
    
    pino.info('[GeminiBlogService] Serviço inicializado com Gemini 2.0 Flash Experimental');
  }

  /**
   * Gera um slug amigável a partir de um título
   */
  generateSlug(title) {
    if (!title) return '';
    return title
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[\s\W-]+/g, '-') // Substitui espaços e caracteres especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens no início/fim
  }

  /**
   * Gera uma imagem usando o Gemini 2.0 nativo
   */
  async generateImage(topic, title) {
    try {
      const imagePrompt = `Crie uma imagem profissional e moderna para um post de blog sobre "${topic}". 
      A imagem deve ser:
      - Visualmente atrativa e profissional
      - Relacionada ao tema de marketing digital e negócios
      - Com cores vibrantes mas elegantes
      - Adequada para redes sociais e blog corporativo
      - Estilo fotográfico profissional, 16:9 aspect ratio
      
      Título do post: ${title}`;
      
      const result = await this.imageModel.generateContent({
        contents: [{ 
          role: 'user',
          parts: [{ text: imagePrompt }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      });
      
      const response = await result.response;
      
      // Procura por dados de imagem na resposta
      for (const candidate of response.candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            // Salva a imagem localmente
            const imageData = part.inlineData.data;
            const buffer = Buffer.from(imageData, 'base64');
            const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
            const imagePath = path.join(__dirname, '..', 'public', 'uploads', 'blog', fileName);
            
            // Cria o diretório se não existir
            const dir = path.dirname(imagePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(imagePath, buffer);
            
            const imageUrl = `/uploads/blog/${fileName}`;
            pino.info(`[GeminiBlogService] Imagem gerada e salva: ${imageUrl}`);
            return imageUrl;
          }
        }
      }
      
      // Fallback para Unsplash se a geração falhar
      pino.warn('[GeminiBlogService] Falha na geração de imagem, usando fallback Unsplash');
      return this.generateUnsplashFallback(topic);
      
    } catch (error) {
      pino.error('[GeminiBlogService] Erro ao gerar imagem:', error);
      // Fallback para Unsplash
      return this.generateUnsplashFallback(topic);
    }
  }
  
  /**
   * Fallback para Unsplash quando a geração de imagem falha
   */
  generateUnsplashFallback(topic) {
    const signature = Date.now() + Math.random().toString(36).substring(2, 15);
    const keywords = topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').slice(0, 3).join(',');
    return `https://source.unsplash.com/1200x630/?${keywords}&sig=${signature}`;
  }

  /**
   * Gera o prompt para o Gemini baseado no tópico
   */
  generatePrompt(topic) {
    return `
Você é um especialista em marketing digital e criação de conteúdo para blogs corporativos da RG Pulse. 
Crie um post completo e envolvente sobre o tema: "${topic}"

O post deve ser:
- Informativo e prático com insights acionáveis
- Focado em resultados e performance empresarial
- Direcionado para empresários, CEOs e profissionais de marketing
- Com linguagem profissional mas acessível
- Rico em dados, estatísticas e exemplos reais
- Estruturado com subtítulos claros e listas
- Otimizado para SEO e engajamento

Estrutura do conteúdo:
1. Introdução impactante (problema/oportunidade)
2. Desenvolvimento com 3-4 pontos principais
3. Exemplos práticos e cases de sucesso
4. Dicas acionáveis e estratégias
5. Conclusão com call-to-action

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "title": "Título atrativo e otimizado para SEO (máximo 60 caracteres)",
  "summary": "Resumo conciso e envolvente do post (máximo 160 caracteres)",
  "content_markdown": "Conteúdo completo em markdown com pelo menos 1200 palavras, incluindo subtítulos (##), listas, negrito (**texto**) e formatação adequada",
  "cover_image_url": "PLACEHOLDER_IMAGE",
  "estimated_read_time_minutes": "Tempo estimado de leitura baseado no conteúdo",
  "tags": ["3-5 tags relevantes para SEO e categorização"],
  "suggested_slug": "slug-otimizado-para-url-seo"
}

IMPORTANTE: 
- Retorne APENAS o JSON válido, sem texto adicional
- Use aspas duplas para strings
- Escape caracteres especiais adequadamente
- O conteúdo deve ser original e de alta qualidade
    `;
  }

  /**
   * Gera conteúdo usando a API Gemini
   */
  async generateContent(topic, options = {}) {
    try {
      const { tone = 'profissional', targetAudience = 'empresários' } = options;
      
      pino.info(`[GeminiBlogService] Gerando conteúdo para o tópico: ${topic}`);
      
      const prompt = this.generatePrompt(topic, tone, targetAudience);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      pino.info(`[GeminiBlogService] Resposta recebida do Gemini`);
      
      // Tenta extrair JSON da resposta
      let jsonContent;
      try {
        // Remove possíveis marcadores de código
        const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
        jsonContent = JSON.parse(cleanText);
      } catch (parseError) {
        pino.error(`[GeminiBlogService] Erro ao fazer parse da resposta JSON:`, parseError);
        throw new Error('Resposta do Gemini não está em formato JSON válido');
      }
      
      // Substitui o placeholder da imagem por uma URL válida temporária
      if (jsonContent.cover_image_url === 'PLACEHOLDER_IMAGE') {
        jsonContent.cover_image_url = 'https://via.placeholder.com/1200x630/0066cc/ffffff?text=Blog+Post';
      }
      
      // Valida a estrutura da resposta
      const { error, value } = this.responseSchema.validate(jsonContent);
      if (error) {
        pino.error(`[GeminiBlogService] Resposta do Gemini não atende ao esquema:`, error.details);
        throw new Error(`Resposta inválida do Gemini: ${error.details[0].message}`);
      }
      
      // Gera slug se não fornecido
      if (!value.suggested_slug) {
        value.suggested_slug = this.generateSlug(value.title);
      }
      
      pino.info(`[GeminiBlogService] Conteúdo gerado com sucesso: ${value.title}`);
      return value;
      
    } catch (error) {
      pino.error(`[GeminiBlogService] Erro ao gerar conteúdo:`, error);
      throw error;
    }
  }

  /**
   * Gera um slug único verificando se já existe no banco
   */
  async generateUniqueSlug(baseSlug) {
    const blogRepository = getBlogRepository();
    let uniqueSlug = baseSlug;
    let counter = 1;
    
    // Verifica se o slug já existe
    while (true) {
      try {
        const existingPost = await blogRepository.getPostBySlug(uniqueSlug);
        if (!existingPost) {
          // Slug está disponível
          break;
        }
        // Slug já existe, tenta com sufixo numérico
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      } catch (error) {
        // Se der erro na consulta, assume que o slug está disponível
        pino.warn(`[GeminiBlogService] Erro ao verificar slug existente: ${error.message}`);
        break;
      }
    }
    
    return uniqueSlug;
  }

  /**
   * Cria um novo post de blog
   */
  async createBlogPost(topic, options = {}) {
    try {
      pino.info(`[GeminiBlogService] Iniciando geração de post para tópico: ${topic}`);
      
      // Gera o conteúdo usando o Gemini
      const generatedContent = await this.generateContent(topic, options);
      
      // Gera a imagem usando Gemini 2.0
      pino.info(`[GeminiBlogService] Gerando imagem para o post: ${generatedContent.title}`);
      const imageUrl = await this.generateImage(topic, generatedContent.title);
      
      // Gera slug único
      const uniqueSlug = await this.generateUniqueSlug(generatedContent.suggested_slug || generatedContent.title);
      
      // Prepara os dados do post
      const postData = {
        title: generatedContent.title,
        content: generatedContent.content_markdown,
        summary: generatedContent.summary,
        cover_image_url: imageUrl, // Usa a imagem gerada pelo Gemini
        estimated_read_time_minutes: generatedContent.estimated_read_time_minutes,
        tags: generatedContent.tags,
        slug: uniqueSlug,
        status: 'published',
        published_at: new Date().toISOString(),
        theme: topic
      };
      
      // Salva no banco de dados
      const savedPost = await this.blogRepository.createPost(postData);
      
      pino.info(`[GeminiBlogService] Post criado com sucesso: ${savedPost.id} (slug: ${uniqueSlug})`);
      return savedPost;
      
    } catch (error) {
      pino.error(`[GeminiBlogService] Erro ao criar post:`, error);
      throw error;
    }
  }

  /**
   * Gera múltiplos posts baseados em uma lista de tópicos
   */
  async generateMultiplePosts(topics, options = {}) {
    const results = [];
    const errors = [];
    
    for (const topic of topics) {
      try {
        const post = await this.createBlogPost(topic, options);
        results.push(post);
        
        // Delay entre requisições para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        pino.error(`[GeminiBlogService] Erro ao gerar post para tópico '${topic}':`, error);
        errors.push({ topic, error: error.message });
      }
    }
    
    return { results, errors };
  }

  /**
   * Sugere tópicos baseados em tendências de marketing digital
   */
  async suggestTopics(count = 5) {
    try {
      const prompt = `
Você é um especialista em marketing digital. Sugira ${count} tópicos relevantes e atuais para posts de blog sobre marketing digital, performance e estratégias empresariais.

Os tópicos devem ser:
- Relevantes para empresários e profissionais de marketing
- Atuais e baseados em tendências
- Específicos e acionáveis
- Focados em resultados e performance

Retorne APENAS um array JSON com os tópicos:
["Tópico 1", "Tópico 2", "Tópico 3", ...]
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extrai o array JSON
      const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
      const topics = JSON.parse(cleanText);
      
      if (!Array.isArray(topics)) {
        throw new Error('Resposta não é um array válido');
      }
      
      pino.info(`[GeminiBlogService] ${topics.length} tópicos sugeridos`);
      return topics;
      
    } catch (error) {
      pino.error(`[GeminiBlogService] Erro ao sugerir tópicos:`, error);
      throw error;
    }
  }
}

module.exports = GeminiBlogService;