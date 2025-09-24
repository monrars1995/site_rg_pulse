// src/pages/DiagnosticoPage.tsx
import { useState, useEffect, useRef, FunctionComponent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WhatsAppButton from '../components/WhatsAppButton';
import QualificationQuiz from '../components/QualificationQuiz';
import { quizQuestionsConfig, QuizFormData, QuizSubmissionResponse } from '../config/quizConfig';
// Removido import do agente - agora salvamos direto no Supabase 
import CalendarScheduler from '../components/CalendarScheduler'; 
import { ArrowRightIcon, ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolidIcon, LightBulbIcon } from '@heroicons/react/24/solid';

// --- DEFINIÇÕES DE ANIMAÇÃO ---
const pageTransitionVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0, transition: { type: "tween", ease: "circOut", duration: 0.4 } }),
  center: { zIndex: 1, x: 0, opacity: 1, transition: { type: "tween", ease: "circOut", duration: 0.4 } },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0, transition: { type: "tween", ease: "circIn", duration: 0.3 } }),
};
const itemFadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};
const contentContainerStagger = (staggerChildren = 0.1, delayChildren = 0.2) => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren, delayChildren, when: "beforeChildren" } }
});
// --- FIM DEFINIÇÕES DE ANIMAÇÃO ---

const DiagnosticoPage: FunctionComponent = () => {
  type ViewState = 'intro' | 'quiz' | 'calendar' | 'finalMessage';
  const [currentView, setCurrentView] = useState<ViewState>('intro');
  const [qualificationData, setQualificationData] = useState<QuizSubmissionResponse | null>(null);
  const [animationDirection, setAnimationDirection] = useState(1); 
  const isInteractionBlocked = useRef(false);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalBodyOverflow; };
  }, []);

  // ***** FUNÇÃO startQuiz DEFINIDA AQUI *****
  const startQuiz = () => {
    if (isInteractionBlocked.current) return;
    isInteractionBlocked.current = true; // Previne clique duplo
    setAnimationDirection(1); // Define a direção da animação para "avançar"
    setCurrentView('quiz');
    setTimeout(() => { isInteractionBlocked.current = false; }, 500); // Libera após a transição
  };
  // ***** FIM DA DEFINIÇÃO DE startQuiz *****

  const handleQuizSubmit = async (quizFormData: QuizFormData): Promise<QuizSubmissionResponse> => {
    if (isInteractionBlocked.current) return { success: false, message: "Processando requisição anterior." };
    isInteractionBlocked.current = true;

    try {
      // Mapear dados do quiz para o formato esperado pela API
      const leadData = {
        fullName: quizFormData.nomeCompleto,
        companyName: quizFormData.nomeEmpresa,
        role: quizFormData.cargo === 'Outro' ? quizFormData.outroCargo : quizFormData.cargo,
        segment: quizFormData.segmento === 'Outro' ? quizFormData.outroSegmento : quizFormData.segmento,
        revenue: quizFormData.faturamento,
        challenge: quizFormData.desafioPrincipal === 'Outro desafio' ? quizFormData.outroDesafio : quizFormData.desafioPrincipal,
        hasMarketingTeam: quizFormData.investimentoMarketing !== 'Não investe atualmente' ? 'Sim' : 'Não',
        marketingInvestment: quizFormData.investimentoMarketing,
        monthlyTrafficInvestment: quizFormData.investimentoMarketing,
        currentResults: quizFormData.processoComercial,
        phone: quizFormData.whatsapp,
        email: quizFormData.email,
        qualificationScore: calculateQualificationScore(quizFormData),
        qualificationResult: determineQualification(quizFormData),
        source: 'diagnostic_quiz_v2',
        additionalInfo: {
          urgencia: quizFormData.urgencia,
          abertoPlano: quizFormData.abertoPlano,
          site: quizFormData.site,
          instagram: quizFormData.instagram
        }
      };

      // Salvar no Supabase via API
       const response = await fetch('http://localhost:3002/api/v1/diagnostic-leads/submit', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(leadData)
       });

      const result = await response.json();

      if (!response.ok) {
        console.error('Erro ao salvar lead:', result);
        const errorResponse: QuizSubmissionResponse = { 
          success: false, 
          message: result.message || 'Erro ao salvar suas informações. Tente novamente.' 
        };
        setQualificationData(errorResponse);
        return errorResponse;
      }

      // Determinar se o lead está qualificado baseado nas respostas
      const isQualified = leadData.qualificationResult === 'qualified';
      
      const successResponse: QuizSubmissionResponse = {
        success: true,
        qualified: isQualified,
        message: isQualified 
          ? 'Parabéns! Seu perfil está alinhado com nossas soluções. Vamos agendar uma conversa?' 
          : 'Obrigado pelas informações! Nossa equipe analisará seu perfil e entrará em contato se houver alinhamento.',
        scheduleLink: isQualified ? 'https://calendly.com/rgpulse/consultoria-estrategica' : undefined
      };
      
      setQualificationData(successResponse);
      return successResponse;

    } catch (error: any) {
      console.error('Erro inesperado ao salvar lead:', error);
      const errorResponse: QuizSubmissionResponse = { 
        success: false, 
        message: 'Erro de conexão. Verifique sua internet e tente novamente.' 
      };
      setQualificationData(errorResponse);
      return errorResponse;
    } finally {
      isInteractionBlocked.current = false;
    }
  };

  // Função para calcular pontuação de qualificação
  const calculateQualificationScore = (formData: QuizFormData): number => {
    let score = 0;
    
    // Pontuação baseada no faturamento
    if (formData.faturamento === 'R$ 150 mil a R$ 500 mil') score += 30;
    else if (formData.faturamento === 'Acima de R$ 500 mil') score += 40;
    else if (formData.faturamento === 'R$ 50 mil a R$ 150 mil') score += 20;
    
    // Pontuação baseada no investimento em marketing
    if (formData.investimentoMarketing === 'R$ 5.000 a R$ 15.000/mês') score += 25;
    else if (formData.investimentoMarketing === 'Acima de R$ 15.000/mês') score += 30;
    else if (formData.investimentoMarketing === 'R$ 1.000 a R$ 5.000/mês') score += 15;
    
    // Pontuação baseada na urgência
    if (formData.urgencia === 'Imediata, resultados rápidos!') score += 20;
    else if (formData.urgencia === 'Nas próximas semanas') score += 15;
    
    // Pontuação baseada na abertura ao plano
    if (formData.abertoPlano === 'Sim, totalmente!') score += 15;
    else if (formData.abertoPlano === 'Sim, dependendo da proposta') score += 10;
    
    return score;
  };

  // Função para determinar qualificação
  const determineQualification = (formData: QuizFormData): string => {
    const score = calculateQualificationScore(formData);
    
    if (score >= 70) return 'qualified';
    else if (score >= 40) return 'potential';
    else return 'unqualified';
  };

  const handleQuizProcessComplete = (response: QuizSubmissionResponse) => {
    // ... (lógica como antes) ...
    if (response.success && response.qualified) {
      setAnimationDirection(1);
      setCurrentView('calendar');
    } else {
      setAnimationDirection(1);
      setCurrentView('finalMessage');
    }
  };

  const handleSchedulingComplete = (details: { date: Date, time: string }) => {
    // ... (lógica como antes) ...
    setQualificationData(prev => ({
        ...(prev ?? { success: true, qualified: true }),
        message: `Diagnóstico agendado com sucesso para ${details.date.toLocaleDateString('pt-BR')} às ${details.time}. Verifique seu e-mail para a confirmação e próximos passos!`
    }));
    setAnimationDirection(1);
    setCurrentView('finalMessage');
  };

  const resetFlow = () => {
    // ... (lógica como antes) ...
    setAnimationDirection(-1);
    setCurrentView('intro');
    setQualificationData(null);
  };

  const navigateToHome = () => { // Mantido
    document.body.style.overflow = 'auto';
    window.location.href = '/';
  };

  return (
    <div id="diagnostico-page-wrapper" className="h-dvh w-screen overflow-hidden fixed inset-0 bg-slate-100">
      <WhatsAppButton onClick={() => {/* Ação WhatsApp */}} className="!z-[100] fixed bottom-6 right-6 md:bottom-8 md:right-8" />
      
      <main className="h-full w-full relative">
        <AnimatePresence mode="wait" custom={animationDirection}>
          
          {/* ETAPA INTRODUTÓRIA */}
          {currentView === 'intro' && (
            <motion.section
              key="diagnostico-intro"
              custom={animationDirection} variants={pageTransitionVariants}
              initial="enter" animate="center" exit="exit"
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-white p-6 bg-gradient-to-br from-[#2A15EB] to-[#05D7FB]"
            >
              <motion.div 
                className="text-center max-w-2xl"
                variants={contentContainerStagger(0.15, 0.2)} 
                initial="hidden"
                animate="visible"
              >
                <motion.div className="mb-8" variants={itemFadeInUp}>
                  <LightBulbIcon className="w-16 h-16 md:w-20 md:h-20 text-sky-300 mx-auto" />
                </motion.div>
                <motion.h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight" variants={itemFadeInUp}>
                  Pronto para Desbloquear o Crescimento do Seu Negócio?
                </motion.h1>
                <motion.p className="text-lg sm:text-xl text-sky-100/90 mb-10 leading-relaxed" variants={itemFadeInUp}>
                  Descubra em poucos minutos os pontos de melhoria no seu sistema de vendas e receba um direcionamento claro para escalar seus resultados.
                </motion.p>
                <motion.button 
                    onClick={startQuiz} // <<<<<< FUNÇÃO USADA AQUI
                    className="px-10 py-4 bg-white text-[#2A15EB] rounded-xl font-semibold text-lg hover:bg-opacity-95 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center mx-auto group"
                    variants={itemFadeInUp}
                    whileHover={{y:-3}}
                    whileTap={{y:0, scale:0.97}}
                >
                  Iniciar Diagnóstico Gratuito <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </motion.button>
                 <motion.p className="text-xs text-sky-200/70 mt-8" variants={itemFadeInUp}>
                    Sem compromisso. Respostas 100% confidenciais.
                 </motion.p>
              </motion.div>
            </motion.section>
          )}

          {/* ETAPA DO QUIZ */}
          {currentView === 'quiz' && (
            // ... (JSX da view do quiz como antes) ...
            <motion.div
              key="quiz-view-wrapper"
              custom={animationDirection} variants={pageTransitionVariants}
              initial="enter" animate="center" exit="exit"
              className="absolute inset-0 w-full h-full flex items-center justify-center p-2 xs:p-3 sm:p-4 bg-slate-100"
            >
              <QualificationQuiz 
                onSubmitQuiz={handleQuizSubmit} 
                onQuizComplete={handleQuizProcessComplete}
              />
            </motion.div>
          )}

          {/* ETAPA DO CALENDÁRIO */}
          {currentView === 'calendar' && qualificationData?.success && qualificationData?.qualified && (
            // ... (JSX da view do calendário como antes) ...
             <motion.div
                key="calendar-view-wrapper"
                custom={animationDirection} variants={pageTransitionVariants}
                initial="enter" animate="center" exit="exit"
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-200 overflow-y-auto"
            >
                <CalendarScheduler 
                    onScheduled={handleSchedulingComplete} 
                    externalScheduleLink={qualificationData.scheduleLink} 
                />
                <motion.button
                    onClick={resetFlow} 
                    className="mt-6 px-6 py-2.5 text-sm text-slate-700 hover:text-slate-900 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md hover:shadow-lg"
                    initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.5}}
                    whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                >
                    <ArrowLeftIcon className="w-4 h-4"/> Voltar para Introdução
                </motion.button>
            </motion.div>
          )}
          
          {/* ETAPA DE MENSAGEM FINAL */}
          {currentView === 'finalMessage' && qualificationData && (
            // ... (JSX da view de mensagem final como antes) ...
            <motion.div
                key="final-message-wrapper"
                custom={animationDirection} variants={pageTransitionVariants}
                initial="enter" animate="center" exit="exit"
                className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center text-white p-6
                            ${qualificationData.success && qualificationData.qualified && qualificationData.message?.includes("agendado com sucesso") 
                                ? 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700' 
                            : qualificationData.success && qualificationData.qualified
                                ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700' 
                                : 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800' }`}
            >
                <motion.div className="text-center max-w-lg" variants={contentContainerStagger(0.15,0.1)} initial="hidden" animate="visible"> {/* Correção: usando contentContainerStagger como função */}
                    <motion.div 
                        className="p-4 inline-block bg-white/20 rounded-full mb-6 shadow-lg" 
                        variants={itemFadeInUp}
                        initial={{scale:0}} animate={{scale:1}} transition={{type:"spring", stiffness:200, damping:15, delay:0.1}}
                    >
                        {qualificationData.success && qualificationData.qualified ? 
                            <CheckSolidIcon className="w-12 h-12 text-white"/> : 
                            <InformationCircleIcon className="w-12 h-12 text-white"/>}
                    </motion.div>
                    <motion.h2 className="text-3xl sm:text-4xl font-bold mb-4" variants={itemFadeInUp}>
                        {qualificationData.message && qualificationData.message.includes("agendado com sucesso") ? "Agendamento Confirmado!" : 
                         qualificationData.success && qualificationData.qualified ? "Pré-Qualificação Aprovada!" : 
                         "Obrigado!"}
                    </motion.h2>
                    <motion.p className="text-lg sm:text-xl text-white/90 mb-10 leading-relaxed" variants={itemFadeInUp}>
                        {qualificationData.message || (qualificationData.success && qualificationData.qualified ? "Você deu o primeiro passo! Verifique seu e-mail para mais detalhes." : "Suas informações foram recebidas e nossa equipe entrará em contato em breve caso haja alinhamento.")}
                    </motion.p>
                    <motion.button
                        onClick={navigateToHome} 
                        className={`px-8 py-3.5 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl
                                    ${qualificationData.success && qualificationData.qualified ? 'bg-white text-green-700 hover:bg-green-50' 
                                    : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        variants={itemFadeInUp}
                        whileHover={{scale:1.05, y: -2}} whileTap={{scale:0.95, y:0}}
                    >
                        Ir para a Página Inicial
                    </motion.button>
                </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DiagnosticoPage;