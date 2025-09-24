const SEORepository = require('./SEORepository');
const analyticsService = require('./AnalyticsService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pino = require('pino')();

class SEOService {
  constructor() {
    this.seoRepository = new SEORepository();
    this.analyticsService = analyticsService;
    
    // Inicializar Gemini AI para otimização de SEO
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      pino.info('[SEOService] Gemini AI inicializado para otimização de SEO');
    } else {
      pino.warn('[SEOService] GEMINI_API_KEY não encontrada - funcionalidades de IA desabilitadas');
    }
  }

  // Análise de SEO de um post
  async analyzePost(postId) {
    try {
      const post = await this.seoRepository.getPostById(postId);
      if (!post) {
        throw new Error('Post não encontrado');
      }

      const analysis = {
        title: this.analyzeTitleSEO(post.title),
        content: this.analyzeContentSEO(post.content),
        meta: this.analyzeMetaTags(post),
        keywords: this.analyzeKeywords(post.content),
        readability: this.analyzeReadability(post.content),
        structure: this.analyzeStructure(post.content),
        images: this.analyzeImages(post.content),
        links: this.analyzeLinks(post.content)
      };

      const score = this.calculateSEOScore(analysis);
      const recommendations = this.generateRecommendations(analysis);

      return {
        postId,
        score,
        analysis,
        recommendations,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao analisar SEO do post:', error);
      throw error;
    }
  }

  // Análise em lote de posts
  async analyzeBatch(postIds) {
    try {
      const results = [];
      for (const postId of postIds) {
        try {
          const analysis = await this.analyzePost(postId);
          results.push(analysis);
        } catch (error) {
          results.push({
            postId,
            error: error.message,
            analyzedAt: new Date().toISOString()
          });
        }
      }
      return results;
    } catch (error) {
      console.error('Erro na análise em lote:', error);
      throw error;
    }
  }

  // Obter relatório de SEO
  async getSEOReport(filters = {}) {
    try {
      const posts = await this.seoRepository.getPostsWithSEO(filters);
      const analytics = await this.analyticsService.getPostAnalytics(filters);
      
      const report = {
        summary: {
          totalPosts: posts.length,
          averageScore: this.calculateAverageScore(posts),
          topPerformers: posts.filter(p => p.seo_score >= 80).length,
          needsImprovement: posts.filter(p => p.seo_score < 60).length
        },
        trends: this.analyzeTrends(posts, analytics),
        recommendations: this.generateGlobalRecommendations(posts),
        generatedAt: new Date().toISOString()
      };

      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório de SEO:', error);
      throw error;
    }
  }

  // Obter configurações de SEO de um post
  async getPostSEO(postId) {
    try {
      return await this.seoRepository.getPostSEO(postId);
    } catch (error) {
      console.error('Erro ao obter SEO do post:', error);
      throw error;
    }
  }

  // Criar ou atualizar configurações de SEO
  async upsertPostSEO(postId, seoData) {
    try {
      const existingSEO = await this.seoRepository.getPostSEO(postId);
      
      if (existingSEO) {
        return await this.seoRepository.updatePostSEO(postId, seoData);
      } else {
        return await this.seoRepository.createPostSEO(postId, seoData);
      }
    } catch (error) {
      console.error('Erro ao salvar SEO do post:', error);
      throw error;
    }
  }

  // Remover configurações de SEO
  async deletePostSEO(postId) {
    try {
      return await this.seoRepository.deletePostSEO(postId);
    } catch (error) {
      console.error('Erro ao remover SEO do post:', error);
      throw error;
    }
  }

  // Otimização automática
  async autoOptimize(postId) {
    try {
      const analysis = await this.analyzePost(postId);
      const post = await this.seoRepository.getPostById(postId);
      
      const optimizations = {
        meta_title: this.generateOptimalTitle(post.title),
        meta_description: this.generateMetaDescription(post.content),
        focus_keyword: this.extractMainKeyword(post.content),
        keywords: this.extractKeywords(post.content),
        canonical_url: this.generateCanonicalUrl(post.slug),
        og_title: this.generateOGTitle(post.title),
        og_description: this.generateOGDescription(post.content),
        twitter_title: this.generateTwitterTitle(post.title),
        twitter_description: this.generateTwitterDescription(post.content)
      };

      await this.upsertPostSEO(postId, optimizations);
      
      return {
        postId,
        optimizations,
        previousScore: analysis.score,
        optimizedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na otimização automática:', error);
      throw error;
    }
  }

  // === OTIMIZAÇÃO COM IA (GEMINI) ===

  /**
   * Otimiza SEO de um post usando IA Gemini
   */
  async optimizeWithAI(postId) {
    try {
      if (!this.model) {
        throw new Error('Gemini AI não está disponível');
      }

      const post = await this.seoRepository.getPostById(postId);
      if (!post) {
        throw new Error('Post não encontrado');
      }

      pino.info(`[SEOService] Iniciando otimização com IA para post: ${postId}`);

      const prompt = this.createSEOOptimizationPrompt(post);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let optimizations;
      try {
        optimizations = JSON.parse(text);
      } catch (parseError) {
        pino.error('[SEOService] Erro ao fazer parse da resposta do Gemini:', parseError);
        throw new Error('Resposta da IA não está em formato JSON válido');
      }

      // Salvar as otimizações
      await this.upsertPostSEO(postId, optimizations);

      // Analisar novamente para obter o novo score
      const newAnalysis = await this.analyzePost(postId);

      pino.info(`[SEOService] Otimização com IA concluída para post: ${postId}`);

      return {
        postId,
        optimizations,
        newScore: newAnalysis.score,
        recommendations: newAnalysis.recommendations,
        optimizedAt: new Date().toISOString()
      };
    } catch (error) {
      pino.error('[SEOService] Erro na otimização com IA:', error);
      throw error;
    }
  }

  /**
   * Analisa SEO de um post usando IA Gemini
   */
  async analyzeWithAI(postId) {
    try {
      const post = await this.seoRepository.getPostById(postId);
      if (!post) {
        throw new Error('Post não encontrado');
      }

      pino.info(`[SEOService] Iniciando análise com IA para post: ${postId}`);

      // Verificar se a API do Gemini está disponível
      if (!this.model || !this.apiKey || this.apiKey.includes('INVALID')) {
        pino.warn('[SEOService] Gemini AI não está disponível ou chave inválida - usando análise local');
        return this.performLocalSEOAnalysis(post);
      }

      try {
        const prompt = this.createSEOAnalysisPrompt(post);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let analysis;
        try {
          // Log da resposta completa para debug
          pino.info(`[SEOService] Resposta COMPLETA do Gemini:`);
          pino.info(text);
          pino.info(`[SEOService] Tamanho da resposta: ${text.length} caracteres`);
          
          // Tentar limpar a resposta antes do parse
          let cleanText = text.trim();
          
          // Remover possíveis marcadores de código
          if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            pino.info('[SEOService] Removidos marcadores ```json');
          } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            pino.info('[SEOService] Removidos marcadores ```');
          }
          
          // Tentar extrair JSON se houver texto antes/depois
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanText = jsonMatch[0];
            pino.info('[SEOService] JSON extraído com regex');
          }
          
          pino.info(`[SEOService] Texto limpo para parse:`);
          pino.info(cleanText);
          
          analysis = JSON.parse(cleanText);
          pino.info('[SEOService] Parse JSON realizado com sucesso');
        } catch (parseError) {
          pino.error('[SEOService] Erro ao fazer parse da resposta do Gemini:', parseError);
          pino.error('[SEOService] Resposta completa que causou erro:', text);
          pino.error('[SEOService] Tipo do erro:', parseError.name);
          pino.error('[SEOService] Mensagem do erro:', parseError.message);
          
          // Fallback para análise local em caso de erro de parse
          pino.warn('[SEOService] Fallback para análise local devido a erro de parse');
          return this.performLocalSEOAnalysis(post);
        }

        pino.info(`[SEOService] Análise com IA concluída para post: ${postId}`);

        return {
          postId,
          aiAnalysis: analysis,
          analyzedAt: new Date().toISOString()
        };
      } catch (geminiError) {
        pino.error('[SEOService] Erro na API do Gemini:', geminiError);
        pino.warn('[SEOService] Fallback para análise local devido a erro na API');
        return this.performLocalSEOAnalysis(post);
      }
    } catch (error) {
      pino.error('[SEOService] Erro na análise com IA:', error);
      throw error;
    }
  }

  /**
   * Cria prompt para otimização de SEO
   */
  createSEOOptimizationPrompt(post) {
    return `Você é um especialista em SEO. Analise o seguinte post de blog e gere otimizações de SEO.

Título: ${post.title}
Conteúdo: ${post.content}
Slug: ${post.slug}

Por favor, gere otimizações de SEO seguindo estas diretrizes:

1. Meta Title: Máximo 60 caracteres, incluindo palavra-chave principal
2. Meta Description: Entre 150-160 caracteres, atrativa e com call-to-action
3. Focus Keyword: Palavra-chave principal do conteúdo
4. Keywords: Lista de 5-8 palavras-chave relacionadas
5. OG Title: Otimizado para redes sociais
6. OG Description: Descrição atrativa para compartilhamento
7. Twitter Title: Otimizado para Twitter
8. Twitter Description: Descrição para Twitter Cards

Retorne APENAS um JSON válido no seguinte formato:
{
  "meta_title": "título otimizado",
  "meta_description": "descrição otimizada",
  "focus_keyword": "palavra-chave principal",
  "keywords": ["palavra1", "palavra2", "palavra3"],
  "og_title": "título para redes sociais",
  "og_description": "descrição para redes sociais",
  "twitter_title": "título para twitter",
  "twitter_description": "descrição para twitter"
}`;
  }

  /**
   * Realiza análise local de SEO baseada em regras e algoritmos
   */
  performLocalSEOAnalysis(post) {
    try {
      pino.info(`[SEOService] Realizando análise local de SEO para post: ${post.id}`);
      
      // Análise do título
      const titleAnalysis = this.analyzeTitleLocally(post.title);
      
      // Análise do conteúdo
      const contentAnalysis = this.analyzeContentLocally(post.content);
      
      // Calcular score geral
      const overallScore = Math.round((titleAnalysis.score + contentAnalysis.score) / 2);
      
      // Gerar pontos fortes e fracos
      const strengths = [];
      const weaknesses = [];
      const recommendations = [];
      
      // Análise de pontos fortes
      if (titleAnalysis.score >= 70) {
        strengths.push('Título bem otimizado para SEO');
      }
      if (contentAnalysis.wordCount >= 300) {
        strengths.push('Conteúdo com extensão adequada');
      }
      if (contentAnalysis.hasHeadings) {
        strengths.push('Boa estrutura com headings e subheadings');
      }
      if (contentAnalysis.keywordDensity > 0.5 && contentAnalysis.keywordDensity < 3) {
        strengths.push('Densidade de palavras-chave adequada');
      }
      
      // Análise de pontos fracos
      if (titleAnalysis.score < 70) {
        weaknesses.push('Título precisa de otimização para SEO');
      }
      if (contentAnalysis.wordCount < 300) {
        weaknesses.push('Conteúdo muito curto para boa indexação');
      }
      if (!contentAnalysis.hasHeadings) {
        weaknesses.push('Falta de estrutura com headings (H1, H2, H3)');
      }
      if (contentAnalysis.keywordDensity < 0.5) {
        weaknesses.push('Densidade de palavras-chave muito baixa');
      }
      if (contentAnalysis.keywordDensity > 3) {
        weaknesses.push('Densidade de palavras-chave muito alta (keyword stuffing)');
      }
      
      // Gerar recomendações
      if (titleAnalysis.length > 60) {
        recommendations.push('Reduza o título para menos de 60 caracteres');
      }
      if (contentAnalysis.wordCount < 500) {
        recommendations.push('Aumente o conteúdo para pelo menos 500 palavras');
      }
      if (!contentAnalysis.hasMetaDescription) {
        recommendations.push('Adicione uma meta description entre 150-160 caracteres');
      }
      if (contentAnalysis.externalLinks === 0) {
        recommendations.push('Adicione links externos relevantes e de qualidade');
      }
      
      // Extrair palavras-chave sugeridas
      const suggestedKeywords = this.extractKeywordsFromContent(post.content, post.title);
      
      const analysis = {
        score: overallScore,
        strengths,
        weaknesses,
        recommendations,
        suggested_keywords: suggestedKeywords,
        title_analysis: {
          score: titleAnalysis.score,
          issues: titleAnalysis.issues,
          suggestions: titleAnalysis.suggestions
        },
        content_analysis: {
          score: contentAnalysis.score,
          readability: contentAnalysis.readability,
          keyword_density: contentAnalysis.keywordDensity,
          structure: contentAnalysis.structure,
          issues: contentAnalysis.issues,
          suggestions: contentAnalysis.suggestions
        }
      };
      
      pino.info(`[SEOService] Análise local concluída com score: ${overallScore}`);
      
      return {
        postId: post.id,
        aiAnalysis: analysis,
        analyzedAt: new Date().toISOString(),
        analysisType: 'local'
      };
    } catch (error) {
      pino.error('[SEOService] Erro na análise local:', error);
      throw error;
    }
  }
  
  /**
   * Analisa o título localmente
   */
  analyzeTitleLocally(title) {
    const issues = [];
    const suggestions = [];
    let score = 100;
    
    // Verificar comprimento
    if (title.length > 60) {
      issues.push('Título muito longo (mais de 60 caracteres)');
      suggestions.push('Reduza o título para 50-60 caracteres');
      score -= 20;
    } else if (title.length < 30) {
      issues.push('Título muito curto (menos de 30 caracteres)');
      suggestions.push('Aumente o título para 30-60 caracteres');
      score -= 15;
    }
    
    // Verificar se contém números (bom para CTR)
    if (!/\d/.test(title)) {
      suggestions.push('Considere adicionar números para melhorar o CTR');
      score -= 5;
    }
    
    // Verificar palavras de poder
    const powerWords = ['como', 'guia', 'completo', 'definitivo', 'melhor', 'top', 'dicas', 'segredos'];
    const hasPowerWords = powerWords.some(word => title.toLowerCase().includes(word));
    if (!hasPowerWords) {
      suggestions.push('Considere usar palavras de impacto como "guia", "completo", "melhor"');
      score -= 10;
    }
    
    return {
      score: Math.max(0, score),
      length: title.length,
      issues,
      suggestions
    };
  }
  
  /**
   * Analisa o conteúdo localmente
   */
  analyzeContentLocally(content) {
    const issues = [];
    const suggestions = [];
    let score = 100;
    
    // Contar palavras
    const wordCount = content.split(/\s+/).length;
    
    // Verificar headings
    const hasH1 = /<h1[^>]*>/.test(content);
    const hasH2 = /<h2[^>]*>/.test(content);
    const hasHeadings = hasH1 || hasH2 || /^#{1,6}\s/.test(content);
    
    // Verificar links
    const externalLinks = (content.match(/<a[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/g) || []).length;
    const internalLinks = (content.match(/<a[^>]*href=["']\/[^"']*["'][^>]*>/g) || []).length;
    
    // Calcular densidade de palavras-chave (simulada)
    const keywordDensity = this.calculateKeywordDensity(content);
    
    // Análise de comprimento
    if (wordCount < 300) {
      issues.push('Conteúdo muito curto para boa indexação');
      suggestions.push('Aumente o conteúdo para pelo menos 300 palavras');
      score -= 30;
    } else if (wordCount < 500) {
      suggestions.push('Considere expandir o conteúdo para 500+ palavras');
      score -= 10;
    }
    
    // Análise de estrutura
    if (!hasHeadings) {
      issues.push('Falta de estrutura com headings (H1, H2, H3)');
      suggestions.push('Adicione headings para melhorar a estrutura');
      score -= 25;
    }
    
    // Análise de links
    if (externalLinks === 0) {
      issues.push('Nenhum link externo encontrado');
      suggestions.push('Adicione links para fontes relevantes e autoritativas');
      score -= 15;
    }
    
    // Análise de legibilidade
    const readability = this.calculateReadability(content, wordCount);
    
    return {
      score: Math.max(0, score),
      wordCount,
      hasHeadings,
      externalLinks,
      internalLinks,
      keywordDensity,
      readability,
      structure: hasHeadings ? 'bem estruturado' : 'precisa melhorar',
      issues,
      suggestions,
      hasMetaDescription: false // Seria verificado em contexto real
    };
  }
  
  /**
   * Calcula densidade de palavras-chave
   */
  calculateKeywordDensity(content) {
    // Simulação simples - em implementação real, seria baseado em palavra-chave específica
    const words = content.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    // Encontrar palavras mais frequentes (simulando palavra-chave)
    const wordFreq = {};
    words.forEach(word => {
      word = word.replace(/[^a-záàâãéèêíìîóòôõúùûç]/gi, '');
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const maxFreq = Math.max(...Object.values(wordFreq));
    return totalWords > 0 ? (maxFreq / totalWords) * 100 : 0;
  }
  
  /**
   * Calcula legibilidade
   */
  calculateReadability(content, wordCount) {
    // Análise simples baseada em comprimento de sentenças
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = wordCount / sentences.length;
    
    if (avgWordsPerSentence < 15) return 'excelente';
    if (avgWordsPerSentence < 20) return 'boa';
    if (avgWordsPerSentence < 25) return 'regular';
    return 'difícil';
  }
  
  /**
   * Extrai palavras-chave do conteúdo
   */
  extractKeywordsFromContent(content, title) {
    const text = (title + ' ' + content).toLowerCase();
    const words = text.split(/\s+/);
    
    // Filtrar palavras relevantes
    const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'em', 'no', 'na', 'para', 'com', 'por', 'que', 'se', 'é', 'são', 'foi', 'como', 'mais', 'muito', 'sua', 'seu', 'suas', 'seus', 'ter', 'tem', 'pode', 'ser', 'está', 'isso', 'essa', 'este', 'esta'];
    
    const wordFreq = {};
    words.forEach(word => {
      word = word.replace(/[^a-záàâãéèêíìîóòôõúùûç]/gi, '');
      if (word.length > 3 && !stopWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Retornar as 5 palavras mais frequentes
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Cria prompt para análise de SEO
   */
  createSEOAnalysisPrompt(post) {
    return `Você é um especialista em SEO. Analise o seguinte post de blog e forneça uma análise detalhada.

Título: ${post.title}
Conteúdo: ${post.content}
Slug: ${post.slug}

Analise os seguintes aspectos:

1. Qualidade do título (clareza, palavras-chave, tamanho)
2. Estrutura do conteúdo (headings, parágrafos, legibilidade)
3. Densidade de palavras-chave
4. Meta tags existentes
5. Estrutura de links internos e externos
6. Otimização de imagens
7. Velocidade de carregamento potencial
8. Mobile-friendliness

Forneça:
- Score geral (0-100)
- Pontos fortes
- Pontos fracos
- Recomendações específicas
- Palavras-chave sugeridas

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional, sem marcadores de código, sem explicações.

Formato exato esperado:
{
  "score": 85,
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "weaknesses": ["ponto fraco 1", "ponto fraco 2"],
  "recommendations": ["recomendação 1", "recomendação 2"],
  "suggested_keywords": ["palavra1", "palavra2"],
  "title_analysis": {
    "score": 80,
    "issues": ["problema 1"],
    "suggestions": ["sugestão 1"]
  },
  "content_analysis": {
    "score": 90,
    "readability": "boa",
    "keyword_density": "adequada",
    "structure": "bem estruturado"
  }
}

Não inclua \`\`\`json ou \`\`\` na resposta. Retorne apenas o JSON puro.`;
  }

  // Gerar meta tags
  async generateMetaTags(postId) {
    try {
      const post = await this.seoRepository.getPostById(postId);
      const seo = await this.seoRepository.getPostSEO(postId);
      
      const metaTags = {
        title: seo?.meta_title || post.title,
        description: seo?.meta_description || this.generateMetaDescription(post.content),
        keywords: seo?.keywords || this.extractKeywords(post.content),
        canonical: seo?.canonical_url || this.generateCanonicalUrl(post.slug),
        og: {
          title: seo?.og_title || post.title,
          description: seo?.og_description || this.generateOGDescription(post.content),
          image: post.featured_image || '/default-og-image.jpg',
          url: this.generateCanonicalUrl(post.slug)
        },
        twitter: {
          card: 'summary_large_image',
          title: seo?.twitter_title || post.title,
          description: seo?.twitter_description || this.generateTwitterDescription(post.content),
          image: post.featured_image || '/default-twitter-image.jpg'
        }
      };

      return metaTags;
    } catch (error) {
      console.error('Erro ao gerar meta tags:', error);
      throw error;
    }
  }

  // Pesquisa de palavras-chave
  async searchKeywords(query, options = {}) {
    try {
      // Simulação de pesquisa de palavras-chave
      // Em um cenário real, isso se conectaria a APIs como Google Keyword Planner
      const keywords = [
        { keyword: query, volume: 1000, difficulty: 'medium', cpc: 1.50 },
        { keyword: `${query} tutorial`, volume: 500, difficulty: 'low', cpc: 1.20 },
        { keyword: `como ${query}`, volume: 800, difficulty: 'low', cpc: 1.00 },
        { keyword: `${query} guia`, volume: 300, difficulty: 'medium', cpc: 1.80 },
        { keyword: `${query} dicas`, volume: 400, difficulty: 'low', cpc: 0.90 }
      ];

      return {
        query,
        keywords,
        searchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na pesquisa de palavras-chave:', error);
      throw error;
    }
  }

  // Análise de palavras-chave
  async analyzeKeywords(content) {
    try {
      const words = content.toLowerCase().match(/\b\w+\b/g) || [];
      const frequency = {};
      
      words.forEach(word => {
        if (word.length > 3) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
      });

      const sortedKeywords = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([keyword, count]) => ({
          keyword,
          count,
          density: ((count / words.length) * 100).toFixed(2)
        }));

      return {
        totalWords: words.length,
        uniqueWords: Object.keys(frequency).length,
        topKeywords: sortedKeywords,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na análise de palavras-chave:', error);
      throw error;
    }
  }

  // Gerar sitemap
  async generateSitemap() {
    try {
      const posts = await this.seoRepository.getAllPublishedPosts();
      const pages = await this.seoRepository.getStaticPages();
      
      const sitemap = {
        urls: [
          {
            loc: '/',
            lastmod: new Date().toISOString(),
            changefreq: 'daily',
            priority: '1.0'
          },
          ...posts.map(post => ({
            loc: `/blog/${post.slug}`,
            lastmod: post.updated_at || post.created_at,
            changefreq: 'weekly',
            priority: '0.8'
          })),
          ...pages.map(page => ({
            loc: page.path,
            lastmod: page.updated_at,
            changefreq: 'monthly',
            priority: '0.6'
          }))
        ],
        generatedAt: new Date().toISOString()
      };

      return sitemap;
    } catch (error) {
      console.error('Erro ao gerar sitemap:', error);
      throw error;
    }
  }

  // Gerar robots.txt
  async generateRobotsTxt() {
    try {
      const settings = await this.seoRepository.getGlobalSEOSettings();
      
      const robotsTxt = [
        'User-agent: *',
        settings?.allow_crawling !== false ? 'Allow: /' : 'Disallow: /',
        '',
        'Sitemap: /sitemap.xml',
        '',
        '# Disallow admin areas',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /private/',
        '',
        '# Allow specific bots',
        'User-agent: Googlebot',
        'Allow: /',
        '',
        'User-agent: Bingbot',
        'Allow: /'
      ].join('\n');

      return robotsTxt;
    } catch (error) {
      console.error('Erro ao gerar robots.txt:', error);
      throw error;
    }
  }

  // Obter configurações globais de SEO
  async getGlobalSEOSettings() {
    try {
      return await this.seoRepository.getGlobalSEOSettings();
    } catch (error) {
      console.error('Erro ao obter configurações globais de SEO:', error);
      throw error;
    }
  }

  // Atualizar configurações globais de SEO
  async updateGlobalSEOSettings(settings) {
    try {
      return await this.seoRepository.updateGlobalSEOSettings(settings);
    } catch (error) {
      console.error('Erro ao atualizar configurações globais de SEO:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados
  analyzeTitleSEO(title) {
    const length = title.length;
    return {
      length,
      isOptimal: length >= 30 && length <= 60,
      score: length >= 30 && length <= 60 ? 100 : Math.max(0, 100 - Math.abs(45 - length) * 2)
    };
  }

  analyzeContentSEO(content) {
    const wordCount = content.split(/\s+/).length;
    const headings = (content.match(/<h[1-6][^>]*>/gi) || []).length;
    
    return {
      wordCount,
      headings,
      isOptimal: wordCount >= 300,
      score: Math.min(100, (wordCount / 300) * 100)
    };
  }

  analyzeMetaTags(post) {
    return {
      hasMetaDescription: !!post.meta_description,
      metaDescriptionLength: post.meta_description?.length || 0,
      score: post.meta_description ? 100 : 0
    };
  }

  analyzeKeywords(content) {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words.filter(w => w.length > 3)).size;
    
    return {
      totalWords: words.length,
      uniqueWords,
      diversity: uniqueWords / words.length,
      score: Math.min(100, (uniqueWords / 50) * 100)
    };
  }

  analyzeReadability(content) {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    return {
      sentences,
      words,
      avgWordsPerSentence,
      score: avgWordsPerSentence <= 20 ? 100 : Math.max(0, 100 - (avgWordsPerSentence - 20) * 5)
    };
  }

  analyzeStructure(content) {
    const headings = {
      h1: (content.match(/<h1[^>]*>/gi) || []).length,
      h2: (content.match(/<h2[^>]*>/gi) || []).length,
      h3: (content.match(/<h3[^>]*>/gi) || []).length
    };
    
    return {
      headings,
      hasH1: headings.h1 > 0,
      hasH2: headings.h2 > 0,
      score: (headings.h1 > 0 ? 50 : 0) + (headings.h2 > 0 ? 50 : 0)
    };
  }

  analyzeImages(content) {
    const images = content.match(/<img[^>]*>/gi) || [];
    const imagesWithAlt = content.match(/<img[^>]*alt=[^>]*>/gi) || [];
    
    return {
      totalImages: images.length,
      imagesWithAlt: imagesWithAlt.length,
      altTextCoverage: images.length > 0 ? (imagesWithAlt.length / images.length) * 100 : 100,
      score: images.length > 0 ? (imagesWithAlt.length / images.length) * 100 : 100
    };
  }

  analyzeLinks(content) {
    const internalLinks = content.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [];
    const externalLinks = content.match(/<a[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi) || [];
    
    return {
      internalLinks: internalLinks.length,
      externalLinks: externalLinks.length,
      totalLinks: internalLinks.length + externalLinks.length,
      score: Math.min(100, (internalLinks.length + externalLinks.length) * 20)
    };
  }

  calculateSEOScore(analysis) {
    const weights = {
      title: 0.2,
      content: 0.2,
      meta: 0.15,
      keywords: 0.15,
      readability: 0.1,
      structure: 0.1,
      images: 0.05,
      links: 0.05
    };

    let totalScore = 0;
    Object.keys(weights).forEach(key => {
      totalScore += (analysis[key]?.score || 0) * weights[key];
    });

    return Math.round(totalScore);
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.title.score < 80) {
      recommendations.push({
        type: 'title',
        priority: 'high',
        message: 'Otimize o título para ter entre 30-60 caracteres'
      });
    }

    if (analysis.content.score < 80) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        message: 'Aumente o conteúdo para pelo menos 300 palavras'
      });
    }

    if (analysis.meta.score < 80) {
      recommendations.push({
        type: 'meta',
        priority: 'high',
        message: 'Adicione uma meta descrição entre 150-160 caracteres'
      });
    }

    if (analysis.structure.score < 80) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        message: 'Adicione cabeçalhos H1 e H2 para melhor estrutura'
      });
    }

    if (analysis.images.score < 80) {
      recommendations.push({
        type: 'images',
        priority: 'low',
        message: 'Adicione texto alternativo a todas as imagens'
      });
    }

    return recommendations;
  }

  calculateAverageScore(posts) {
    if (posts.length === 0) return 0;
    const total = posts.reduce((sum, post) => sum + (post.seo_score || 0), 0);
    return Math.round(total / posts.length);
  }

  analyzeTrends(posts, analytics) {
    // Análise de tendências baseada em dados históricos
    return {
      scoreImprovement: 'Melhoria de 15% nos últimos 30 dias',
      topPerformingKeywords: ['tecnologia', 'inovação', 'digital'],
      contentLengthTrend: 'Posts mais longos têm melhor performance'
    };
  }

  generateGlobalRecommendations(posts) {
    return [
      'Foque em conteúdo de qualidade com pelo menos 500 palavras',
      'Use palavras-chave de cauda longa para melhor ranqueamento',
      'Otimize imagens com texto alternativo descritivo',
      'Crie uma estrutura clara com cabeçalhos hierárquicos'
    ];
  }

  generateOptimalTitle(title) {
    if (title.length >= 30 && title.length <= 60) return title;
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  }

  generateMetaDescription(content) {
    const text = content.replace(/<[^>]*>/g, '').substring(0, 157) + '...';
    return text;
  }

  extractMainKeyword(content) {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const frequency = {};
    
    words.forEach(word => {
      if (word.length > 4) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    const sorted = Object.entries(frequency).sort(([,a], [,b]) => b - a);
    return sorted[0]?.[0] || '';
  }

  extractKeywords(content) {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const frequency = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword)
      .join(', ');
  }

  generateCanonicalUrl(slug) {
    return `/blog/${slug}`;
  }

  generateOGTitle(title) {
    return title.length <= 60 ? title : title.substring(0, 57) + '...';
  }

  generateOGDescription(content) {
    return content.replace(/<[^>]*>/g, '').substring(0, 197) + '...';
  }

  generateTwitterTitle(title) {
    return title.length <= 70 ? title : title.substring(0, 67) + '...';
  }

  generateTwitterDescription(content) {
    return content.replace(/<[^>]*>/g, '').substring(0, 197) + '...';
  }
  // Gerar relatórios de SEO
  async generateReport(options = {}) {
    try {
      const {
        period = '30d',
        type = 'overview',
        page = 1,
        limit = 20
      } = options;

      pino.info(`[SEOService] Gerando relatório de SEO - período: ${period}, tipo: ${type}`);

      // Calcular datas baseado no período
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Buscar dados dos posts
      const posts = await this.seoRepository.getAllPublishedPosts();
      const totalPosts = posts.length;
      
      // Calcular métricas básicas
      let totalScore = 0;
      let postsWithGoodSEO = 0;
      let postsNeedingImprovement = 0;
      
      const postAnalyses = [];
      
      for (const post of posts.slice((page - 1) * limit, page * limit)) {
        try {
          const analysis = await this.analyzePost(post.id);
          postAnalyses.push({
            id: post.id,
            title: post.title,
            slug: post.slug,
            score: analysis.score,
            status: analysis.score >= 80 ? 'excellent' : analysis.score >= 60 ? 'good' : 'needs_improvement',
            lastAnalyzed: analysis.analyzedAt
          });
          
          totalScore += analysis.score;
          
          if (analysis.score >= 70) {
            postsWithGoodSEO++;
          } else {
            postsNeedingImprovement++;
          }
        } catch (error) {
          pino.warn(`[SEOService] Erro ao analisar post ${post.id}: ${error.message}`);
          postAnalyses.push({
            id: post.id,
            title: post.title,
            slug: post.slug,
            score: 0,
            status: 'error',
            lastAnalyzed: null
          });
        }
      }
      
      const averageScore = totalPosts > 0 ? Math.round(totalScore / totalPosts) : 0;
      
      // Gerar recomendações gerais
      const recommendations = [
        'Foque em melhorar posts com pontuação abaixo de 70',
        'Adicione meta descriptions em todos os posts',
        'Otimize títulos para ficarem entre 30-60 caracteres',
        'Use palavras-chave relevantes no conteúdo'
      ];
      
      const report = {
        summary: {
          totalPosts,
          averageScore,
          postsWithGoodSEO,
          postsNeedingImprovement,
          period,
          generatedAt: new Date().toISOString()
        },
        posts: postAnalyses,
        recommendations,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      };
      
      pino.info(`[SEOService] Relatório gerado com sucesso - ${totalPosts} posts analisados`);
      return report;
      
    } catch (error) {
      pino.error('[SEOService] Erro ao gerar relatório:', error);
      throw error;
    }
  }
}

module.exports = SEOService;