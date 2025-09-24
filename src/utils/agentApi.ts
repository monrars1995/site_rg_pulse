// src/utils/agentApi.ts

/**
 * Interface para a resposta esperada do agente A2A após o processamento.
 * Esta é a estrutura que o `parts[0].text` do agente deve conter como uma string JSON.
 */
export interface AgentA2AResponse {
  qualified?: boolean; // Usado pelo agente qualificador
  message: string;
  scheduleLink?: string; // Usado pelo agente qualificador
  // Outros campos podem ser adicionados conforme necessário para diferentes agentes
}

/**
 * Interface para a resposta da função sendToAgent.
 * Inclui o status da chamada e a resposta processada do agente.
 */
export interface SendToAgentResult {
  success: boolean;
  data?: AgentA2AResponse; // Resposta parseada do agente
  rawMessage?: string; // Mensagem bruta do agente se o parse falhar
  error?: string; // Mensagem de erro em caso de falha na chamada ou no agente
}

interface A2AJsonRpcPayload {
  jsonrpc: "2.0";
  method: string;
  params: {
    id: string; // taskId
    sessionId: string;
    message: {
      role: "user" | "assistant" | "system";
      parts: Array<{ type: "text"; text: string } | { type: "image"; mediaType: string; url: string }>;
    };
  };
  id: string; // callId
}

const serverUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';

/**
 * Interface para atualização de stream do agente.
 * Esta interface define o formato dos dados que o callback receberá durante o streaming.
 */
export interface StreamUpdate {
  source?: 'artifact' | 'status';
  text?: string;
  state?: string;
  sessionId?: string;
  error?: Error | {message: string};
  complete?: boolean;
}

/**
 * Tipo do handler de callback para atualizações de stream.
 */
export type StreamUpdateHandler = (update: StreamUpdate) => void;

/**
 * Inicia um stream com o agente A2A e retorna um AbortController
 * para permitir a interrupção do stream quando necessário.
 * 
 * @param agentId O ID do agente A2A para o qual enviar a mensagem
 * @param messageText O conteúdo da mensagem de texto a ser enviada ao agente
 * @param sessionId Um ID de sessão opcional (se não fornecido, um novo será gerado)
 * @param onStreamUpdate Callback para receber atualizações do stream
 * @returns Promise com AbortController que pode ser usado para cancelar o stream
 */
export const initAgentStream = async (
  agentId: string,
  messageText: string,
  sessionId?: string | null,
  onStreamUpdate?: StreamUpdateHandler
): Promise<AbortController> => {
  // Cria um novo controlador para gerenciar o cancelamento do stream
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Usa o sessionId fornecido ou cria um novo
  const actualSessionId = sessionId || `session-${crypto.randomUUID()}`;
  const taskId = crypto.randomUUID();
  const callId = `call-${crypto.randomUUID()}`;

  // Define o payload JSON-RPC para a requisição
  const payload: A2AJsonRpcPayload = {
    jsonrpc: "2.0",
    method: "message/stream", // Correção: Usar message/stream para streaming
    params: {
      id: taskId,
      sessionId: actualSessionId,
      message: {
        role: "user",
        parts: [{ type: "text", text: messageText }],
      },
    },
    id: callId,
  };

  // Função para informar atualizações se o callback estiver definido
  const updateStream = (update: StreamUpdate) => {
    if (onStreamUpdate) {
      onStreamUpdate(update);
    }
  };

  try {
    // Informa que o stream está iniciando
    updateStream({ state: 'starting', sessionId: actualSessionId });
    
    const response = await fetch(`${serverUrl}/api/v1/a2a/${agentId}`, { // Correção: Remover /stream da URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(payload),
      signal: signal, // Permite o cancelamento via AbortController
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status}` }));
      console.error(`Error from backend for agent ${agentId}:`, errorData);
      updateStream({ 
        state: 'failed', 
        error: new Error(errorData.message || `Server error: ${response.status}`) 
      });
      return controller; // Retorna o controller mesmo com erro para consistência
    }

    // Informa que o agente está processando
    updateStream({ state: 'working', source: 'status', text: 'Processing...' });
    
    // Configura leitor de stream para processar a resposta como SSE
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    // Processa a stream de eventos
    if (reader) {
      // Função recursiva para processar os chunks da stream
      const processStream = async () => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            // Stream finalizada
            updateStream({ state: 'completed' });
            return;
          }
          
          // Decodifica o chunk recebido
          const chunk = decoder.decode(value, { stream: true });
          
          // Processa linhas do formato SSE: "data: {...}"
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const dataString = line.substring(5).trim();
                console.log('[agentApi] Raw SSE data received:', dataString);
                const data = JSON.parse(dataString);
                console.log('[agentApi] Parsed SSE data:', JSON.stringify(data, null, 2));
                console.log('[agentApi] Data type check - jsonrpc:', data.jsonrpc, 'result:', !!data.result);
                
                // Processa diferentes tipos de eventos no formato JSON-RPC
                if (data.jsonrpc === '2.0' && data.result) {
                  const result = data.result;
                  
                  // Processa eventos de artifact (conteúdo da resposta)
                  if (result.artifact && result.artifact.parts) {
                    console.log('[agentApi] Processing artifact:', result.artifact);
                    const textParts = result.artifact.parts
                      .filter(part => part.type === 'text')
                      .map(part => part.text)
                      .join('');
                    
                    console.log('[agentApi] Extracted text from artifact:', textParts);
                    if (textParts) {
                      console.log('[agentApi] Sending artifact update to callback');
                      updateStream({ 
                        source: 'artifact', 
                        text: textParts,
                        state: 'working' 
                      });
                    }
                  }
                  
                  // Processa eventos de status
                  if (result.status) {
                    const status = result.status;
                    let statusText = '';
                    
                    // Extrai texto da mensagem se disponível
                    if (status.message && status.message.parts) {
                      statusText = status.message.parts
                        .filter(part => part.type === 'text')
                        .map(part => part.text)
                        .join('');
                    }
                    
                    updateStream({ 
                      source: 'status', 
                      text: statusText || status.state || '',
                      state: status.state || 'working' 
                    });
                    
                    // Se o status é 'completed' e final é true, finaliza o stream
                    console.log('[agentApi] Status check - state:', status.state, 'final:', result.final);
                    if (status.state === 'completed' && result.final === true) {
                      console.log('[agentApi] Stream completed, sending final update');
                      updateStream({ 
                        state: 'completed',
                        complete: true 
                      });
                      return;
                    }
                  }
                  
                  // Processa erros se houver
                  if (result.error) {
                    updateStream({ 
                      error: new Error(result.error.message || 'Unknown error'),
                      state: 'failed' 
                    });
                    return;
                  }
                } else {
                  // Formato legado ou outros formatos
                  if (data.type === 'artifact') {
                    updateStream({ 
                      source: 'artifact', 
                      text: data.content || '',
                      state: 'working' 
                    });
                  } else if (data.type === 'status') {
                    updateStream({ 
                      source: 'status', 
                      text: data.message || '',
                      state: data.state || 'working' 
                    });
                  } else if (data.type === 'error') {
                    updateStream({ 
                      error: new Error(data.message || 'Unknown error'),
                      state: 'failed' 
                    });
                    return;
                  }
                }
              } catch (parseError) {
                console.warn('Error parsing SSE data:', parseError, 'Original line:', line);
              }
            }
          }
          
          // Continue processing
          processStream();
        } catch (streamError) {
          // Checa se o erro foi causado por cancelamento proposital
          if (signal.aborted) {
            updateStream({ state: 'canceled' });
          } else {
            console.error('Stream processing error:', streamError);
            updateStream({ 
              error: streamError instanceof Error ? streamError : new Error(String(streamError)),
              state: 'failed' 
            });
          }
        }
      };
      
      // Inicia o processamento da stream
      processStream().catch(error => {
        console.error('Unhandled error in stream processing:', error);
        updateStream({ 
          error: error instanceof Error ? error : new Error(String(error)),
          state: 'failed' 
        });
      });
    } else {
      updateStream({ 
        error: new Error('Stream not available from server response'),
        state: 'failed' 
      });
    }
  } catch (error: any) {
    // Captura erros de rede ou outros erros antes/durante a inicialização do stream
    if (signal.aborted) {
      updateStream({ state: 'canceled' });
    } else {
      console.error(`Error communicating with agent ${agentId}:`, error);
      updateStream({ 
        error: error instanceof Error ? error : new Error(String(error)),
        state: 'failed' 
      });
    }
  }
  
  return controller;
};

/**
 * Envia uma mensagem para um agente A2A específico através do endpoint do backend.
 *
 * @param agentId O ID do agente A2A para o qual enviar a mensagem.
 * @param messageText O conteúdo da mensagem de texto a ser enviada ao agente.
 * @param method O método JSON-RPC a ser usado (padrão: "message/send").
 * @returns Uma promessa que resolve com o resultado da interação com o agente.
 */
export const sendToA2AAgent = async (
  agentId: string,
  messageText: string,
  method: string = "message/send"
): Promise<SendToAgentResult> => {
  const taskId = crypto.randomUUID();
  const sessionId = `session-${crypto.randomUUID()}`;
  const callId = `call-${crypto.randomUUID()}`;

  const payload: A2AJsonRpcPayload = {
    jsonrpc: "2.0",
    method: method,
    params: {
      id: taskId,
      sessionId: sessionId,
      message: {
        role: "user",
        parts: [{ type: "text", text: messageText }],
      },
    },
    id: callId,
  };

  console.log(`Enviando para A2A Agent [${agentId}] via backend:`, payload);

  try {
    const response = await fetch(`${serverUrl}/api/v1/a2a/${agentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
      console.error(`Erro na resposta do backend para o agente ${agentId}:`, errorData);
      return { success: false, error: errorData.message || `Erro do servidor: ${response.status}` };
    }

    const backendResponseJson = await response.json();
    console.log(`Resposta do backend (A2A Agent ${agentId}):`, backendResponseJson);

    if (backendResponseJson.error) {
      console.error(`Erro JSON-RPC do agente A2A ${agentId}:`, backendResponseJson.error);
      return { success: false, error: backendResponseJson.error.message || "Erro ao processar com o agente." };
    }

    const agentMessagePart = backendResponseJson.result?.status?.message?.parts?.[0]?.text;
    if (!agentMessagePart) {
      console.warn(`Formato de resposta do agente A2A ${agentId} inesperado: parte da mensagem ausente. Resposta completa:`, backendResponseJson.result);
      return { 
        success: true, 
        rawMessage: backendResponseJson.result?.status?.message?.parts?.[0]?.text || "Resposta do agente vazia ou em formato não textual.",
        data: { message: backendResponseJson.result?.status?.message?.parts?.[0]?.text || "Resposta do agente vazia ou em formato não textual." }
      };
    }

    try {
      const agentJsonResponse: AgentA2AResponse = JSON.parse(agentMessagePart);
      return {
        success: true,
        data: agentJsonResponse,
      };
    } catch (parseError) {
      console.warn(`Erro ao fazer parse da resposta JSON do agente ${agentId}:`, parseError, "Conteúdo recebido:", agentMessagePart);
      return { 
        success: true, 
        rawMessage: agentMessagePart,
        data: { message: agentMessagePart } 
      };
    }

  } catch (error: any) {
    console.error(`Erro ao comunicar com o agente ${agentId}:`, error);
    return { success: false, error: error.message || "Ocorreu um erro de comunicação. Tente novamente." };
  }
};

/**
 * Interface para atualizações da stream do blog agent
 */
export interface BlogStreamUpdate {
  type: 'status' | 'content' | 'error' | 'completed' | 'cancelled' | 'unknown';
  content: string;
  status: string;
  error?: string;
  result?: any;
  message?: string;
}

/**
 * Inicia uma stream A2A com o agente de blog via backend
 * @param prompt - Prompt para o agente
 * @param onUpdate - Callback para atualizações da stream
 * @param abortController - Controller para cancelar a stream
 * @returns Promise que resolve quando a stream termina
 */
export async function initBlogAgentStream(
  prompt: string,
  onUpdate: (update: BlogStreamUpdate) => void,
  abortController?: AbortController
): Promise<void> {
  const backendUrl = serverUrl;
  const endpoint = `${backendUrl}/api/v1/blog/stream`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ prompt }),
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(`Erro ${response.status}: ${errorData.error || 'Falha na requisição'}`);
    }

    if (!response.body) {
      throw new Error('Resposta não contém body para streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[BlogAgentStream] Stream finalizada');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Mantém linha incompleta no buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              console.log('[BlogAgentStream] Stream marcada como concluída');
              continue;
            }

            try {
              const eventData = JSON.parse(data);
              
              // Chama o callback com os dados do evento
              onUpdate({
                type: eventData.type || 'unknown',
                content: eventData.content || '',
                status: eventData.status || 'unknown',
                error: eventData.error,
                result: eventData.result,
                message: eventData.message
              });
              
            } catch (parseError) {
              console.warn('[BlogAgentStream] Erro ao fazer parse de evento:', parseError, 'Data:', data);
              // Continua processando outros eventos
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('[BlogAgentStream] Stream cancelada pelo usuário');
      onUpdate({
        type: 'cancelled',
        content: '',
        status: 'cancelled',
        message: 'Stream cancelada pelo usuário'
      });
    } else {
      console.error('[BlogAgentStream] Erro na stream:', error);
      onUpdate({
        type: 'error',
        content: '',
        status: 'error',
        error: error.message || 'Erro desconhecido na stream',
        message: 'Erro na comunicação com o agente'
      });
      throw error;
    }
  }
}

