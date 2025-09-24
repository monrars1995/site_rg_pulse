const pino = require('pino')();

/**
 * Classe responsável por processar e validar respostas do agente A2A
 * Implementa múltiplas estratégias de parsing para garantir robustez
 */
class AgentResponseHandler {
  constructor() {
    this.logger = pino;
  }

  /**
   * Extrai o conteúdo de texto da resposta do agente
   * Tenta múltiplas estruturas possíveis de resposta
   * @param {object} responseJson - Resposta JSON do agente
   * @param {string} taskId - ID da tarefa para logging
   * @returns {string} Conteúdo de texto extraído
   */
  extractTextContent(responseJson, taskId) {
    this.logger.info({ 
      msg: '[AgentResponseHandler] Extraindo conteúdo de texto da resposta', 
      taskId,
      responseStructure: this._analyzeResponseStructure(responseJson)
    });

    // Estratégia 1: result.status.message.parts[]
    if (this._hasPath(responseJson, 'result.status.message.parts')) {
      this.logger.info({ msg: '[AgentResponseHandler] Usando estrutura result.status.message.parts', taskId });
      const textPart = responseJson.result.status.message.parts.find(part => part.type === 'text');
      if (textPart?.text) {
        return textPart.text;
      }
    }

    // Estratégia 2: result.message.parts[]
    if (this._hasPath(responseJson, 'result.message.parts')) {
      this.logger.info({ msg: '[AgentResponseHandler] Usando estrutura result.message.parts', taskId });
      const textPart = responseJson.result.message.parts.find(part => part.type === 'text');
      if (textPart?.text) {
        return textPart.text;
      }
    }

    // Estratégia 3: result.response.content
    if (this._hasPath(responseJson, 'result.response.content')) {
      this.logger.info({ msg: '[AgentResponseHandler] Usando estrutura result.response.content', taskId });
      return responseJson.result.response.content;
    }

    // Estratégia 4: result.content
    if (this._hasPath(responseJson, 'result.content')) {
      this.logger.info({ msg: '[AgentResponseHandler] Usando estrutura result.content', taskId });
      return responseJson.result.content;
    }

    // Estratégia 5: result como string direta
    if (responseJson.result && typeof responseJson.result === 'string') {
      this.logger.info({ msg: '[AgentResponseHandler] Usando result como string direta', taskId });
      return responseJson.result;
    }

    // Estratégia 6: data.content (algumas APIs usam 'data' em vez de 'result')
    if (this._hasPath(responseJson, 'data.content')) {
      this.logger.info({ msg: '[AgentResponseHandler] Usando estrutura data.content', taskId });
      return responseJson.data.content;
    }

    // Estratégia 7: response.text (estrutura alternativa)
    if (this._hasPath(responseJson, 'response.text')) {
      this.logger.info({ msg: '[AgentResponseHandler] Usando estrutura response.text', taskId });
      return responseJson.response.text;
    }

    // Estratégia 8: Buscar recursivamente por qualquer campo 'text' ou 'content'
    const foundText = this._findTextRecursively(responseJson);
    if (foundText) {
      this.logger.info({ msg: '[AgentResponseHandler] Encontrado texto via busca recursiva', taskId });
      return foundText;
    }

    this.logger.error({ 
      msg: '[AgentResponseHandler] Nenhuma estrutura de resposta reconhecida encontrada', 
      response: responseJson, 
      taskId 
    });
    throw new Error('Formato de resposta inesperado da API A2A - nenhum conteúdo de texto encontrado.');
  }

  /**
   * Processa e limpa o JSON retornado pelo agente
   * Implementa múltiplas estratégias de parsing
   * @param {string} jsonString - String JSON bruta
   * @param {string} taskId - ID da tarefa para logging
   * @returns {object} Objeto JSON parseado
   */
  parseAgentJSON(jsonString, taskId) {
    if (!jsonString || typeof jsonString !== 'string') {
      throw new Error('Conteúdo de texto inválido ou vazio recebido do agente.');
    }

    this.logger.info({ 
      msg: '[AgentResponseHandler] Iniciando parse do JSON do agente', 
      taskId,
      contentLength: jsonString.length,
      preview: jsonString.substring(0, 200) + '...'
    });

    // Estratégia 1: Parse direto
    try {
      const parsed = JSON.parse(jsonString);
      this.logger.info({ msg: '[AgentResponseHandler] Parse direto bem-sucedido', taskId });
      return parsed;
    } catch (e) {
      this.logger.info({ msg: '[AgentResponseHandler] Parse direto falhou, tentando limpeza', error: e.message, taskId });
    }

    // Estratégia 2: Limpeza básica
    try {
      const cleaned = this._basicCleanup(jsonString);
      const parsed = JSON.parse(cleaned);
      this.logger.info({ msg: '[AgentResponseHandler] Parse com limpeza básica bem-sucedido', taskId });
      return parsed;
    } catch (e) {
      this.logger.info({ msg: '[AgentResponseHandler] Parse com limpeza básica falhou', error: e.message, taskId });
    }

    // Estratégia 3: Extração por regex
    try {
      const extracted = this._extractJSONByRegex(jsonString);
      const parsed = JSON.parse(extracted);
      this.logger.info({ msg: '[AgentResponseHandler] Parse com extração por regex bem-sucedido', taskId });
      return parsed;
    } catch (e) {
      this.logger.info({ msg: '[AgentResponseHandler] Parse com extração por regex falhou', error: e.message, taskId });
    }

    // Estratégia 4: Limpeza avançada
    try {
      const cleaned = this._advancedCleanup(jsonString);
      const parsed = JSON.parse(cleaned);
      this.logger.info({ msg: '[AgentResponseHandler] Parse com limpeza avançada bem-sucedido', taskId });
      return parsed;
    } catch (e) {
      this.logger.info({ msg: '[AgentResponseHandler] Parse com limpeza avançada falhou', error: e.message, taskId });
    }

    // Estratégia 5: Tentativa de reconstrução
    try {
      const reconstructed = this._reconstructJSON(jsonString);
      const parsed = JSON.parse(reconstructed);
      this.logger.info({ msg: '[AgentResponseHandler] Parse com reconstrução bem-sucedido', taskId });
      return parsed;
    } catch (e) {
      this.logger.info({ msg: '[AgentResponseHandler] Parse com reconstrução falhou', error: e.message, taskId });
    }

    this.logger.error({ 
      msg: '[AgentResponseHandler] Todas as estratégias de parse falharam', 
      jsonString: jsonString.substring(0, 500) + '...', 
      taskId 
    });
    throw new Error('Não foi possível fazer parse do JSON após múltiplas tentativas.');
  }

  /**
   * Verifica se um caminho existe no objeto
   * @param {object} obj - Objeto a verificar
   * @param {string} path - Caminho no formato 'a.b.c'
   * @returns {boolean}
   */
  _hasPath(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj) !== null;
  }

  /**
   * Analisa a estrutura da resposta para logging
   * @param {object} response - Resposta a analisar
   * @returns {object} Análise da estrutura
   */
  _analyzeResponseStructure(response) {
    const analysis = {
      hasResult: !!response.result,
      hasData: !!response.data,
      hasResponse: !!response.response
    };

    if (response.result) {
      analysis.resultType = typeof response.result;
      analysis.resultKeys = typeof response.result === 'object' ? Object.keys(response.result) : null;
    }

    return analysis;
  }

  /**
   * Busca recursivamente por campos de texto
   * @param {any} obj - Objeto a buscar
   * @param {number} depth - Profundidade atual (para evitar loops infinitos)
   * @returns {string|null} Texto encontrado ou null
   */
  _findTextRecursively(obj, depth = 0) {
    if (depth > 10) return null; // Evitar loops infinitos
    
    if (typeof obj === 'string' && obj.length > 50) {
      // Verificar se parece com JSON
      if (obj.trim().startsWith('{') && obj.trim().endsWith('}')) {
        return obj;
      }
    }

    if (typeof obj === 'object' && obj !== null) {
      // Verificar campos comuns primeiro
      const commonFields = ['text', 'content', 'message', 'data', 'body'];
      for (const field of commonFields) {
        if (obj[field] && typeof obj[field] === 'string' && obj[field].length > 50) {
          return obj[field];
        }
      }

      // Buscar recursivamente
      for (const key in obj) {
        const result = this._findTextRecursively(obj[key], depth + 1);
        if (result) return result;
      }
    }

    return null;
  }

  /**
   * Limpeza básica do JSON
   * @param {string} jsonString - String JSON a limpar
   * @returns {string} JSON limpo
   */
  _basicCleanup(jsonString) {
    return jsonString
      .replace(/```json\s*/g, '') // Remove marcadores de código
      .replace(/```\s*/g, '') // Remove marcadores de código
      .replace(/^[^{]*/, '') // Remove tudo antes do primeiro {
      .replace(/[^}]*$/, '') // Remove tudo depois do último }
      .trim();
  }

  /**
   * Extração de JSON por regex
   * @param {string} text - Texto a processar
   * @returns {string} JSON extraído
   */
  _extractJSONByRegex(text) {
    // Tentar encontrar um JSON válido na string
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Nenhum JSON encontrado no texto');
    }
    return jsonMatch[0];
  }

  /**
   * Limpeza avançada do JSON
   * @param {string} jsonString - String JSON a limpar
   * @returns {string} JSON limpo
   */
  _advancedCleanup(jsonString) {
    let cleaned = jsonString
      // Remove comentários de linha
      .replace(/\/\/.*$/gm, '')
      // Remove comentários de bloco
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove quebras de linha desnecessárias
      .replace(/\n\s*\n/g, '\n')
      // Remove espaços extras
      .replace(/\s+/g, ' ')
      // Remove caracteres de controle
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();

    // Encontrar o primeiro { e o último }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned;
  }

  /**
   * Tentativa de reconstrução do JSON
   * @param {string} jsonString - String JSON a reconstruir
   * @returns {string} JSON reconstruído
   */
  _reconstructJSON(jsonString) {
    // Esta é uma estratégia mais agressiva para casos extremos
    // Tenta extrair campos conhecidos e reconstruir o JSON
    
    const fields = {
      title: this._extractField(jsonString, 'title'),
      summary: this._extractField(jsonString, 'summary'),
      content_markdown: this._extractField(jsonString, 'content_markdown'),
      cover_image_url: this._extractField(jsonString, 'cover_image_url'),
      estimated_read_time_minutes: this._extractNumericField(jsonString, 'estimated_read_time_minutes'),
      tags: this._extractArrayField(jsonString, 'tags'),
      suggested_slug: this._extractField(jsonString, 'suggested_slug')
    };

    // Verificar se conseguimos extrair os campos essenciais
    if (!fields.title || !fields.summary || !fields.content_markdown) {
      throw new Error('Não foi possível extrair campos essenciais para reconstrução');
    }

    return JSON.stringify(fields);
  }

  /**
   * Extrai um campo de string do texto
   * @param {string} text - Texto a processar
   * @param {string} fieldName - Nome do campo
   * @returns {string|null} Valor do campo
   */
  _extractField(text, fieldName) {
    const patterns = [
      new RegExp(`"${fieldName}"\s*:\s*"([^"]+)"`, 'i'),
      new RegExp(`'${fieldName}'\s*:\s*'([^']+)'`, 'i'),
      new RegExp(`${fieldName}\s*:\s*"([^"]+)"`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extrai um campo numérico do texto
   * @param {string} text - Texto a processar
   * @param {string} fieldName - Nome do campo
   * @returns {number|null} Valor do campo
   */
  _extractNumericField(text, fieldName) {
    const pattern = new RegExp(`"${fieldName}"\s*:\s*(\d+)`, 'i');
    const match = text.match(pattern);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Extrai um campo de array do texto
   * @param {string} text - Texto a processar
   * @param {string} fieldName - Nome do campo
   * @returns {Array|null} Valor do campo
   */
  _extractArrayField(text, fieldName) {
    const pattern = new RegExp(`"${fieldName}"\s*:\s*\[([^\]]+)\]`, 'i');
    const match = text.match(pattern);
    if (match) {
      try {
        return JSON.parse(`[${match[1]}]`);
      } catch (e) {
        // Tentar parsing manual
        return match[1].split(',').map(item => item.trim().replace(/["']/g, ''));
      }
    }
    return [];
  }
}

module.exports = AgentResponseHandler;