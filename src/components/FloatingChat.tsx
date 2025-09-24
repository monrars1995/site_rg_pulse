// src/components/FloatingChat.tsx
import React, { useState, useEffect, useRef, FormEvent, FunctionComponent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperAirplaneIcon, XMarkIcon, CpuChipIcon as BotIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { initAgentStream, StreamUpdateHandler } from '../utils/agentApi'; // IMPORTANTE

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error'; 
}

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const FloatingChat: FunctionComponent<FloatingChatProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentAgentResponseText, setCurrentAgentResponseText] = useState(''); // Acumula texto do agente durante o stream
  const [agentTaskStatus, setAgentTaskStatus] = useState<string>('');
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null); 
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<null | HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null); // Para gerenciar o AbortController do fetch

  // Buscar agentes disponíveis quando o componente for montado
  useEffect(() => {
    const fetchAvailableAgents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_API_URL}/api/v1/agents`);
        if (response.ok) {
          const data = await response.json();
          setAvailableAgents(data.agents || []);
          // Seleciona automaticamente o primeiro agente disponível
          if (data.agents && data.agents.length > 0) {
            setSelectedAgentId(data.agents[0].agent_id);
            console.log(`[FloatingChat] Agente selecionado automaticamente: ${data.agents[0].name} (${data.agents[0].agent_id})`);
          }
        } else {
          console.error('[FloatingChat] Erro ao buscar agentes disponíveis:', response.status);
        }
      } catch (error) {
        console.error('[FloatingChat] Erro ao buscar agentes disponíveis:', error);
      }
    };

    fetchAvailableAgents();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (messages.length === 0 && !isStreaming) {
        setMessages([{ 
            id: `agent-greeting-${Date.now()}`, 
            text: "Olá! 👋 Sou Anna Pulse. Como posso te ajudar?", 
            sender: 'agent', 
            timestamp: new Date() 
        }]);
      }
    } else {
      // Se o chat for fechado, aborta a conexão de stream ativa
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.log("[FloatingChat] Chat closed by user, aborting active stream via AbortController.");
        abortControllerRef.current.abort();
        abortControllerRef.current = null; // Limpa a referência
      }
      setIsStreaming(false); // Garante que pare o indicador de streaming visualmente
      setAgentTaskStatus(''); // Reseta o status da tarefa
      setCurrentAgentResponseText(''); // Limpa qualquer texto parcial
    }

    // Cleanup on component unmount
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.log("[FloatingChat] Component unmounting, aborting active stream via AbortController.");
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen]); // Reage à abertura/fechamento do chat

  // Scroll para a última mensagem
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(scrollToBottom, [messages, currentAgentResponseText]); // Scrolla quando novas mensagens ou texto parcial chegam

  // Callback para atualizações do stream do agentApi.ts
  const handleStreamUpdate: StreamUpdateHandler = (update) => {
    console.log('[FloatingChat] Stream update received:', JSON.stringify(update, null, 2));
    console.log('[FloatingChat] Current state - isStreaming:', isStreaming, 'agentTaskStatus:', agentTaskStatus, 'currentAgentResponseText length:', currentAgentResponseText.length);
    if (update.sessionId && update.sessionId !== sessionId) {
        setSessionId(update.sessionId);
    }
    if (update.state) {
        setAgentTaskStatus(update.state);
    }

    if (update.error) {
        console.error("[FloatingChat] Stream update error received:", update.error);
        setAgentTaskStatus('failed');
        setMessages(prev => [...prev, {
            id: `agent-error-stream-${Date.now()}`,
            text: `Desculpe, ocorreu um erro: ${update.error.message || String(update.error)}`,
            sender: 'agent',
            timestamp: new Date()
        }]);
        setCurrentAgentResponseText('');
        setIsStreaming(false);
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = null;
        return; 
    }

    if (update.complete) {
        console.log('[FloatingChat] Processing complete event');
        console.log('[FloatingChat] Complete event details:', { text: update.text, source: update.source, state: update.state });
        setCurrentAgentResponseText(prevAccumulatedText => {
            console.log('[FloatingChat] prevAccumulatedText in complete handler:', prevAccumulatedText);
            let finalText = prevAccumulatedText; // prevAccumulatedText já contém apenas texto de 'artifact'
            // Adiciona o último pedaço de texto do evento 'complete', APENAS se for 'artifact'
            if (update.text && update.source === 'artifact') { 
                finalText += update.text;
                console.log('[FloatingChat] Added text from complete event:', update.text);
            }
            finalText = finalText.trim();

            console.log(`[FloatingChat] Stream complete. Final artifact text processed: "${finalText}". From prevAccumulated: "${prevAccumulatedText}", from update.text (source: ${update.source}): "${update.text || ''}"`);

            if (finalText) {
                console.log('[FloatingChat] Adding final message to messages array:', finalText);
                setMessages(prevMsgs => {
                    const newMessage = {
                        id: `agent-complete-${Date.now()}`,
                        text: finalText,
                        sender: 'agent' as const,
                        timestamp: new Date()
                    };
                    console.log('[FloatingChat] New message object:', newMessage);
                    console.log('[FloatingChat] Previous messages count:', prevMsgs.length);
                    const updatedMessages = [...prevMsgs, newMessage];
                    console.log('[FloatingChat] Updated messages count:', updatedMessages.length);
                    return updatedMessages;
                });
            } else if (agentTaskStatus === 'working' && !finalText && !update.error) {
                // Se o stream completou sem texto de artefato, mas estava 'working' e sem erro, pode ser um placeholder.
                // No entanto, a mensagem "Ok." pode ser genérica demais se o agente não enviou nada.
                // Considerar se essa lógica de placeholder ainda é necessária ou se pode ser removida/ajustada.
                // Por ora, manteremos para consistência com o comportamento anterior em caso de não-artefato.
                setMessages(prevMsgs => [...prevMsgs, {
                    id: `agent-placeholder-${Date.now()}`,
                    text: "Ok.", // Ou talvez uma mensagem mais informativa se o status for 'completed' sem texto.
                    sender: 'agent',
                    timestamp: new Date()
                }]);
            }
            return ''; // Reset currentAgentResponseText
        });

        setIsStreaming(false);
        setAgentTaskStatus(update.state || 'completed'); 
        setTimeout(() => inputRef.current?.focus(), 100);
        
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
            // O controller deve ser abortado pelo agentApi.ts no evento final
        }
        abortControllerRef.current = null;

    } else if (update.text && update.source === 'artifact') { 
        // Acumula texto APENAS se for de um 'artifact'
        console.log('[FloatingChat] Accumulating artifact text:', update.text);
        console.log('[FloatingChat] Before accumulation - currentAgentResponseText:', currentAgentResponseText);
        setCurrentAgentResponseText(prev => {
            const newText = prev + update.text;
            console.log('[FloatingChat] After accumulation - newText:', newText);
            console.log('[FloatingChat] Setting currentAgentResponseText to:', newText);
            return newText;
        });
    } else if (update.text && update.source === 'status') {
        // Textos de 'status' (como "Processing your request...") são ignorados para currentAgentResponseText
        console.log(`[FloatingChat] Received status text, ignoring for display: "${update.text}"`);
    }
  };

  // Enviar mensagem do usuário
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const messageText = inputValue.trim();
    // Permite enviar nova mensagem se a anterior falhou ou completou, ou se não estiver streamando
    if (!messageText || (isStreaming && agentTaskStatus !== 'completed' && agentTaskStatus !== 'failed' && agentTaskStatus !== 'canceled')) {
        return;
    }

    if (!selectedAgentId) {
        console.error("[FloatingChat] Nenhum agente disponível ou selecionado!");
        setMessages(prev => [...prev, {id: `error-config-${Date.now()}`, text: "Erro: Nenhum assistente disponível no momento.", sender: 'agent', timestamp: new Date()}]);
        return;
    }

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsStreaming(true);
    setAgentTaskStatus('submitted');
    setCurrentAgentResponseText(''); // Limpa o texto parcial da resposta anterior do agente

    // Aborta qualquer stream anterior antes de iniciar um novo
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.log("[FloatingChat] Aborting previous stream before sending new message.");
        abortControllerRef.current.abort();
    }

    try {
      // initAgentStream agora retorna o AbortController
      const controller = await initAgentStream(selectedAgentId, messageText, sessionId, handleStreamUpdate);
      abortControllerRef.current = controller; // Armazena o novo controller
      
      // Atualiza o status da mensagem do usuário para 'sent' se initAgentStream não lançou um erro síncrono imediato.
      // A confirmação real de que o backend recebeu virá com os updates do stream.
      setMessages(prev => prev.map(msg => msg.id === newUserMessage.id ? {...msg, status: 'sent'} : msg));

    } catch (error) { 
      // Este catch é para erros SÍNCRONOS inesperados ao chamar initAgentStream.
      // Erros de API/rede DENTRO de initAgentStream são tratados por onStreamUpdate.
      console.error('[FloatingChat] Erro inesperado e síncrono ao chamar initAgentStream:', error);
      setAgentTaskStatus('failed');
      setMessages(prev => [...prev.map(msg => msg.id === newUserMessage.id ? {...msg, status: 'error'} : msg),
        {id: `agent-init-error-${Date.now()}`, text: "Não foi possível iniciar comunicação com o assistente.", sender: 'agent', timestamp: new Date()}
      ]);
      setIsStreaming(false);
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          abortControllerRef.current.abort(); // Garante que aborte se um controller foi setado e algo deu errado
          abortControllerRef.current = null;
      }
    }
  };
  
  const chatPanelVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 28, duration: 0.4 } },
    exit: { opacity: 0, y: 40, scale: 0.95, transition: { duration: 0.25, ease: "easeOut" } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={chatPanelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-x-0 bottom-0 md:inset-x-auto md:bottom-24 md:right-6 lg:right-8 w-full h-[85vh] md:w-[420px] md:max-w-[90vw] md:h-[75vh] md:max-h-[650px] bg-white rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col border border-slate-200 z-[998]"
        >
          <header className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-t-2xl md:rounded-t-xl flex justify-between items-center shadow-lg flex-shrink-0">
            <div className="flex items-center space-x-3">
                <BotIcon className="h-7 w-7 text-white/90" />
                <h3 className="font-semibold text-xl">Anna Pulse</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Fechar chat">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </header>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-100 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`max-w-[85%] p-3 rounded-2xl shadow-md ${ msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-lg' : 'bg-white text-slate-800 rounded-bl-lg border border-slate-200'}`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-xs mt-1.5 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'} text-right`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'user' && msg.status === 'error' && <span className="ml-1 text-red-300">(Falha)</span>}
                  </p>
                </motion.div>
              </div>
            ))}
            {/* Exibe o texto parcial do agente enquanto o stream chega */}
            {isStreaming && currentAgentResponseText && (
              <div className="flex justify-start">
                 <motion.div 
                    key="streaming-agent-response" 
                    initial={{ opacity: 0.8, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-[85%] p-3 rounded-2xl shadow-md bg-white text-slate-800 rounded-bl-lg border border-slate-200"
                  >
                    <p className="text-sm whitespace-pre-wrap">{currentAgentResponseText}</p>
                 </motion.div>
              </div>
            )}
            {/* Indicador de "Digitando..." do Agente */}
            {isStreaming && agentTaskStatus === 'working' && !currentAgentResponseText && (
                <div className="flex justify-start">
                    <motion.div 
                        key="agent-typing"
                        className="p-3 rounded-2xl bg-slate-200 text-slate-600 shadow-md rounded-bl-lg"
                    >
                        <div className="typing-indicator"><span></span><span></span><span></span></div>
                    </motion.div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-3 sm:p-4 flex items-center space-x-2 bg-slate-50 rounded-b-2xl md:rounded-b-xl flex-shrink-0">
            <input
              ref={inputRef} type="text" value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={isStreaming && agentTaskStatus !== 'completed' && agentTaskStatus !== 'failed' && agentTaskStatus !== 'canceled'}
              className="flex-grow p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow focus:shadow-lg disabled:bg-slate-100"
            />
            <button 
              type="submit" 
              className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={(!inputValue.trim() || isStreaming) && agentTaskStatus !== 'completed' && agentTaskStatus !== 'failed' && agentTaskStatus !== 'canceled'}
              aria-label="Enviar mensagem"
            >
              {(isStreaming && agentTaskStatus !== 'completed' && agentTaskStatus !== 'failed' && agentTaskStatus !== 'canceled') ? 
                <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 
                <PaperAirplaneIcon className="h-5 w-5 transform -rotate-45" />
              }
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default FloatingChat;