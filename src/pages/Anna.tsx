// src/pages/AnnaPage.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, FunctionComponent } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import NeuralNetworkVisual from '../components/NeuralNetworkVisual';

// Importando ícones do Heroicons (v2 - outline)
import {
  ChatBubbleOvalLeftEllipsisIcon,
  BeakerIcon, 
  PuzzlePieceIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  TrophyIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CheckIcon, 
  DevicePhoneMobileIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AnnaPage = () => {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setIsLoading(false), 300); // Simulação de loading
    return () => clearTimeout(timer);
  }, []);

  // Variantes de animação base
  const fadeInUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } }
  };
  
  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  // Helper para aplicar animações com viewport
  const applyMotionViewport = (animationVariants: any, delay = 0, amountVisible = 0.2) => ({
    variants: animationVariants,
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: false, amount: amountVisible }, // once: false PARA RE-ANIMAR
    transition: { 
      delay, 
      duration: animationVariants.visible?.transition?.duration, 
      ease: animationVariants.visible?.transition?.ease 
    }
  });
  
  const getFadeInUpProps = (delay = 0, amountVisible = 0.2) => 
    applyMotionViewport(fadeInUp, delay, amountVisible);
  
  const getScaleInProps = (delay = 0, amountVisible = 0.2) => 
    applyMotionViewport(scaleIn, delay, amountVisible);
  
  const features = [
    { icon: <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7"/>, title: 'Atende com agilidade e empatia', description: 'Recebe leads via WhatsApp, Instagram ou site, com fluxos de conversa que seguem o tom da sua marca e resolvem as principais dúvidas.' },
    { icon: <BeakerIcon className="w-7 h-7"/>, title: 'Qualifica com inteligência de verdade', description: 'Coleta dados estratégicos, aplica perguntas-chave e entrega para seu time os leads mais prontos para avançar — já organizados, com histórico e perfil.' },
    { icon: <PuzzlePieceIcon className="w-7 h-7"/>, title: 'Integra com seu CRM e automações', description: 'Envia os dados para onde for necessário: Hubspot, Pipedrive, Notion, planilha ou até mesmo grupos internos.' },
    { icon: <CpuChipIcon className="w-7 h-7"/>, title: 'Aprende e evolui com base em dados reais', description: 'A Anna não é estática. Ela melhora com o tempo, ajusta fluxos e se adapta ao comportamento do seu público.' }
  ];

  const benefits = [
    'Economiza horas da sua equipe com atendimento inicial e repetitivo',
    'Evita perder leads por demora ou falta de follow-up imediato',
    'Qualifica leads 24/7, mesmo fora do horário comercial e feriados',
    'Reduz custos operacionais com pré-vendedores e triagem manual',
    'Aumenta a taxa de conversão com atendimento personalizado e instantâneo'
  ];

  const niches = ['E-commerce', 'Imobiliárias', 'Saúde e Bem-estar', 'Educação', 'Serviços B2B', 'Agências Digitais'];

  const metrics = [
    { value: '70%', label: 'Aumento médio no aproveitamento de leads qualificados' },
    { value: '<10s', label: 'Tempo médio de primeira resposta ao lead' },
    { value: '65%', label: 'Redução no tempo gasto pela equipe com qualificação inicial' }
  ];
  
  const implementationSteps = [
    { number: 1, title: "Diagnóstico", description: "Analisamos sua jornada atual e pontos de contato.", icon: <MagnifyingGlassIcon className="w-6 h-6 text-white"/>},
    { number: 2, title: "Customização", description: "Ajustamos fluxos, tom de voz, e integrações.", icon: <PuzzlePieceIcon className="w-6 h-6 text-white"/>},
    { number: 3, title: "Treinamento", description: "Acompanhamos os primeiros dias e refinamos.", icon: <BeakerIcon className="w-6 h-6 text-white"/>},
    { number: 4, title: "Otimização", description: "Monitoramos performance e evoluímos a IA.", icon: <CpuChipIcon className="w-6 h-6 text-white"/>}
  ];
  
  const subBenefits = [
    { icon: <SparklesIcon className="w-7 h-7 text-[#2A15EB]" />, text: 'Implantação Ágil e Assistida' },
    { icon: <DevicePhoneMobileIcon className="w-7 h-7 text-[#2A15EB]" />, text: 'Integração Multicanal Flexível' },
    { icon: <CpuChipIcon className="w-7 h-7 text-[#2A15EB]" />, text: 'IA Proprietária + GPT Avançado' }
  ];

  interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "green" | "outline";
    icon?: React.ReactNode;
    size?: "normal" | "large";
  }

  const StyledButton: FunctionComponent<StyledButtonProps> = ({ children, onClick, className = "", variant = "primary", icon, size="normal", ...props }) => {
    const baseStyle = "inline-flex items-center justify-center rounded-xl font-semibold text-lg transition-all duration-300 ease-out shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
    const paddingStyle = size === "large" ? "px-8 py-4" : "px-7 py-3.5";
    
    const primaryStyle = `bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white hover:from-[#05D7FB] hover:to-[#2A15EB] focus-visible:ring-[#05D7FB]`;
    const secondaryStyle = `bg-white text-[#2A15EB] hover:bg-slate-100 focus-visible:ring-[#2A15EB]`;
    const outlineStyle = `bg-transparent border-2 border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white focus-visible:ring-slate-700`; // Ajustado para fundo claro
    const greenStyle = `bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500`;

    let variantStyle;
    if (variant === "secondary") variantStyle = secondaryStyle;
    else if (variant === "green") variantStyle = greenStyle;
    else if (variant === "outline") variantStyle = outlineStyle;
    else variantStyle = primaryStyle;

    return (
      <motion.button
        onClick={onClick}
        className={`${baseStyle} ${paddingStyle} ${variantStyle} ${className}`}
        whileHover={{ y: -2, boxShadow: "0 8px 15px rgba(0,0,0,0.1)" }}
        whileTap={{ y: 0, scale:0.98, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
      >
        {icon && <span className="mr-2 -ml-1">{icon}</span>}
        {children}
      </motion.button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#2A15EB]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 antialiased selection:bg-[#2A15EB] selection:text-white">
      <Navbar />
      <WhatsAppButton onClick={() => setIsWhatsAppModalOpen(true)} />

      {/* Hero Section - GRADIENTE AJUSTADO */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 lg:pt-48 lg:pb-32 
                       bg-gradient-to-b from-white via-sky-50 to-[#BFDBFE] /* de branco para azul bem claro */
                       text-slate-800 overflow-hidden"> {/* texto escuro para contraste com topo claro */}
        <div className="absolute inset-0 opacity-[0.02]">
             <svg width="100%" height="100%"><defs><pattern id="pattHero" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(50,50,150,0.5)"></circle></pattern></defs><rect width="100%" height="100%" fill="url(#pattHero)"></rect></svg>
        </div>
        <div className="container mx-auto px-6 sm:px-8 relative z-10">
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-16"
            variants={staggerContainer} initial="hidden" animate="visible"
          >
            <motion.div 
              className="md:w-6/12 lg:w-5/12 text-center md:text-left"
              variants={fadeInUp}
            >
              <motion.h1 
                className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold mb-4 tracking-tighter
                           text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#7C3AED]" // Gradiente para o H1
                variants={fadeInUp}
              >
                Conheça a Anna
              </motion.h1>
              <motion.h2 
                className="text-xl sm:text-2xl lg:text-3xl font-medium mb-8 text-slate-600" // Texto mais escuro
                variants={fadeInUp}
              >
                A Inteligência Artificial da RG Pulse para Vendas Inteligentes
              </motion.h2>
              <motion.p 
                className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed" // Texto mais escuro
                variants={fadeInUp}
              >
                Transforme seu atendimento em uma máquina de qualificação e vendas — 24/7, com a voz e estratégia da sua marca.
              </motion.p>
              <motion.div variants={fadeInUp}>
                {/* Botão principal da Hero (agora é primary porque o fundo no topo é claro) */}
                <StyledButton 
                  onClick={() => setIsWhatsAppModalOpen(true)} 
                  variant="primary" // Mudado de "outline"
                  icon={<DevicePhoneMobileIcon className="w-5 h-5"/>} 
                  size="large"
                >
                  Testar Anna Agora
                </StyledButton>
              </motion.div>
            </motion.div>

            <motion.div 
              className="md:w-6/12 lg:w-7/12 flex justify-center items-center mt-12 md:mt-0"
              variants={scaleIn}
            >
              <div className="w-full max-w-md h-[300px] sm:h-[350px] md:h-[400px] lg:max-w-lg lg:h-[450px] xl:max-w-xl xl:h-[500px] relative">
                 <NeuralNetworkVisual />
              </div>
            </motion.div>
          </motion.div>
        </div>
        {/* Blobs para o novo gradiente */}
         <div className="absolute -bottom-1/4 -left-20 w-80 h-80 bg-[#05D7FB]/20 rounded-full filter blur-3xl opacity-60 animate-blob pointer-events-none animation-delay-4000"></div>
         <div className="absolute -top-1/4 -right-20 w-96 h-96 bg-[#A855F7]/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000 pointer-events-none"></div>
      </section>

      {/* --- RESTANTE DAS SEÇÕES --- */}
      {/* (Quem é a Anna, Features, Benefits, etc. - código idêntico ao da sua última versão, pois o foco da correção foi o Hero e os helpers de animação) */}

      {/* Quem é a Anna Section */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="max-w-3xl mx-auto text-center" {...getFadeInUpProps(0, 0.1)}>
            <motion.div className="inline-block p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6 shadow" {...getScaleInProps(0.1)}>
                <CpuChipIcon className="w-10 h-10 text-[#2A15EB]"/>
            </motion.div>
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-5 text-slate-800" {...getFadeInUpProps(0.2)}>Quem é a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] to-[#05D7FB]">Anna</span>?</motion.h2>
            <motion.p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed" {...getFadeInUpProps(0.3)}>
              Anna é a Inteligência Artificial da RG Pulse, projetada para transformar a interação da sua empresa com leads, otimizar a qualificação de oportunidades e acelerar as vendas – tudo automaticamente, com personalização e estratégia.
            </motion.p>
            <motion.div className="text-lg md:text-xl font-medium text-slate-700 bg-slate-100 p-6 rounded-xl border border-slate-200 shadow-sm" {...getFadeInUpProps(0.4)}>
              <p className="mb-2">Ela vai além de um simples chatbot.</p>
              <p>É uma assistente comercial virtual completa, que aprende com o seu negócio e se integra como um membro valioso da sua equipe e processos.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="max-w-4xl mx-auto text-center mb-12 md:mb-16" {...getFadeInUpProps(0,0.1)}>
            <motion.div className="inline-block p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4 shadow" {...getScaleInProps(0.1)}>
                <MagnifyingGlassIcon className="w-10 h-10 text-[#2A15EB]"/>
            </motion.div>
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800" {...getFadeInUpProps(0.2)}>O que a Anna faz na prática?</motion.h2>
            <motion.p className="text-lg text-slate-600" {...getFadeInUpProps(0.3)}>Descubra como ela otimiza cada etapa do seu funil de vendas.</motion.p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto"
            variants={staggerContainer} {...applyMotionViewport(staggerContainer,0,0.05)}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 flex"
                variants={fadeInUp}
              >
                <div className="flex-shrink-0 p-3.5 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg mr-5 mt-1 self-start shadow">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-[0.95rem]">{feature.description}</p> 
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="max-w-4xl mx-auto text-center mb-12 md:mb-16" {...getFadeInUpProps(0,0.1)}>
             <motion.div className="inline-block p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4 shadow" {...getScaleInProps(0.1)}>
                <RocketLaunchIcon className="w-10 h-10 text-[#2A15EB]"/>
            </motion.div>
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800" {...getFadeInUpProps(0.2)}>Por que sua empresa precisa da Anna?</motion.h2>
            <motion.p className="text-lg text-slate-600" {...getFadeInUpProps(0.3)}>Vantagens que se traduzem em crescimento e eficiência operacional.</motion.p>
          </motion.div>
          <motion.div 
            className="max-w-3xl mx-auto grid grid-cols-1 gap-4"
            variants={staggerContainer} {...applyMotionViewport(staggerContainer,0,0.05)}
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit}
                className="flex items-start gap-3.5 p-4 sm:p-5 bg-slate-50 hover:bg-sky-50 border border-slate-200/70 hover:border-sky-300 rounded-xl transition-colors duration-200 shadow-sm"
                variants={fadeInUp}
              >
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5 shadow-sm">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={3}/>
                </div>
                <p className="text-md md:text-lg text-slate-700 leading-normal">{benefit}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Diferencial Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#111827] via-[#2A15EB] to-[#1e0a52] text-white">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="max-w-4xl mx-auto text-center" {...getFadeInUpProps(0,0.05)}>
             <motion.div className="inline-block p-3 bg-amber-400/20 border border-amber-400/50 rounded-full mb-6 shadow" {...getScaleInProps(0.1)}>
                <TrophyIcon className="w-10 h-10 text-amber-400"/>
            </motion.div>
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-violet-300" {...getFadeInUpProps(0.1)}>
              Diferente de Tudo que Você Já Viu
            </motion.h2>
            <motion.p className="text-xl text-slate-300 mb-10 leading-relaxed" {...getFadeInUpProps(0.2)}>
              Esqueça os bots frios e limitados. A Anna une IA proprietária com o poder do GPT para uma experiência humana, estratégica e perfeitamente adaptada ao seu negócio.
            </motion.p>
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left mb-12"
                variants={staggerContainer} {...applyMotionViewport(staggerContainer,0.3,0.05)}
            >
                <motion.div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/80 shadow-lg" variants={fadeInUp}>
                    <h3 className="text-xl font-semibold text-rose-400 mb-3 flex items-center">
                        <span className="text-2xl mr-2">🚫</span> Bots Comuns
                    </h3>
                    <ul className="space-y-1.5 text-slate-300 text-md">
                        <li>Respostas genéricas e robóticas</li>
                        <li>Fluxos rígidos e inflexíveis</li>
                        <li>Baixa capacidade de qualificação</li>
                        <li>Não aprendem com interações</li>
                        <li>Frustram seus clientes</li>
                    </ul>
                </motion.div>
                <motion.div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/80 shadow-lg" variants={fadeInUp}>
                    <h3 className="text-xl font-semibold text-sky-400 mb-3 flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-2 text-sky-400"/> Anna by RG Pulse
                    </h3>
                    <ul className="space-y-1.5 text-slate-300 text-md">
                        <li>Comunicação empática e personalizada</li>
                        <li>Fluxos dinâmicos e inteligentes</li>
                        <li>Qualificação profunda e estratégica</li>
                        <li>Evolução contínua com dados reais</li>
                        <li>Encantam seus clientes</li>
                    </ul>
                </motion.div>
            </motion.div>
            
            <motion.p className="text-lg text-slate-300 mb-6" {...getFadeInUpProps(0.4)}>Especializada em converter leads em nichos como:</motion.p>
            <motion.div 
                className="flex flex-wrap justify-center gap-3 md:gap-4"
                variants={staggerContainer} {...applyMotionViewport(staggerContainer,0.45,0.05)}
            >
              {niches.map((niche) => (
                <motion.div
                  key={niche}
                  className="bg-white/10 hover:bg-white/20 transition-colors text-sm sm:text-md font-medium py-2.5 px-5 rounded-full backdrop-blur-sm border border-white/20 cursor-default"
                  variants={fadeInUp}
                >
                  {niche}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Teste Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div 
            className="max-w-3xl mx-auto text-center bg-slate-50 p-8 sm:p-10 md:p-12 rounded-2xl shadow-xl border border-slate-200" 
            {...getScaleInProps(0, 0.1)}
            >
             <motion.div className="inline-block p-3 bg-gradient-to-r from-green-100 to-teal-100 rounded-full mb-4 shadow" {...getScaleInProps(0.1)}>
                <DevicePhoneMobileIcon className="w-10 h-10 text-green-500"/>
            </motion.div>
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800" {...getFadeInUpProps(0.2)}>Quer Ver a Anna em Ação?</motion.h2>
            <motion.p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed" {...getFadeInUpProps(0.3)}>
              Experimente nossa IA interativa e veja como ela pode transformar seu atendimento. É rápido, fácil e sem compromisso!
            </motion.p>
            <motion.div {...getFadeInUpProps(0.4)}>
                <StyledButton onClick={() => setIsWhatsAppModalOpen(true)} variant="green" icon={<DevicePhoneMobileIcon className="w-5 h-5"/>} size="large">
                Testar Anna no WhatsApp
                </StyledButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Implementation Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="max-w-4xl mx-auto text-center mb-12 md:mb-16" {...getFadeInUpProps(0, 0.1)}>
            <motion.div className="inline-block p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4 shadow" {...getScaleInProps(0.1)}>
                <BriefcaseIcon className="w-10 h-10 text-[#2A15EB]"/>
            </motion.div>
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800" {...getFadeInUpProps(0.2)}>Como Implementar a Anna?</motion.h2>
            <motion.p className="text-lg text-slate-600" {...getFadeInUpProps(0.3)}>Nosso processo é simples e colaborativo para garantir resultados rápidos.</motion.p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto"
            variants={staggerContainer} {...applyMotionViewport(staggerContainer,0.2, 0.05)}
          >
            {implementationSteps.map((step, index) => (
              <motion.div
                key={step.number}
                className="bg-white p-6 rounded-xl shadow-lg text-center flex flex-col items-center transform hover:scale-105 transition-transform duration-300 min-h-[220px]"
                variants={fadeInUp}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2A15EB] to-[#05D7FB] text-white rounded-full mx-auto mb-5 text-xl font-bold shadow-md">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-700">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-normal flex-grow">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mt-12 md:mt-16 max-w-4xl mx-auto"
            variants={staggerContainer} {...applyMotionViewport(staggerContainer,0.3,0.1)}
          >
            {subBenefits.map(item => (
              <motion.div key={item.text} className="p-5 bg-white rounded-lg shadow-md flex flex-col items-center justify-start hover:shadow-lg transition-shadow min-h-[150px]" variants={fadeInUp}>
                <div className="p-2 bg-slate-100 rounded-full mb-3">{item.icon}</div>
                <p className="text-md text-slate-700 font-medium text-center">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="max-w-4xl mx-auto text-center mb-12 md:mb-16" {...getFadeInUpProps(0,0.1)}>
            <motion.div className="inline-block p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4 shadow" {...getScaleInProps(0.1)}>
                <ChartBarIcon className="w-10 h-10 text-[#2A15EB]"/>
            </motion.div>
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800" {...getFadeInUpProps(0.2)}>Resultados que Falam por Si</motion.h2>
            <motion.p className="text-lg text-slate-600" {...getFadeInUpProps(0.3)}>Métricas reais de clientes que já usam a Anna para impulsionar seus negócios.</motion.p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
            variants={staggerContainer} {...applyMotionViewport(staggerContainer, 0.2, 0.05)}
          >
            {metrics.map((metric) => (
              <motion.div
                key={metric.label}
                className="bg-gradient-to-br from-[#2A15EB] to-[#05D7FB] p-8 rounded-2xl text-white shadow-xl transform hover:scale-105 hover:-translate-y-1.5 transition-all duration-300 text-center flex flex-col justify-center items-center min-h-[220px] sm:min-h-[240px]"
                variants={fadeInUp}
              >
                <motion.h3 
                  className="text-5xl lg:text-6xl font-bold mb-3 tracking-tighter"
                  initial={{ opacity:0, y: 15 }} 
                  whileInView={{ opacity:1, y: 0 }}
                  viewport={{ once: false }} 
                  transition={{ delay: 0.2, type: "spring", stiffness:120, damping:12 }}
                >
                  {metric.value}
                </motion.h3>
                <p className="text-md lg:text-lg opacity-90 leading-normal max-w-xs">{metric.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-r from-[#0F172A] via-[#2A15EB] to-[#052071] text-white">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="max-w-3xl mx-auto text-center" {...getScaleInProps(0, 0.1)}>
             <motion.div className="inline-block p-3 bg-sky-400/20 border border-sky-400/50 rounded-full mb-6 shadow" {...getScaleInProps(0.1)}>
                <ChatBubbleOvalLeftEllipsisIcon className="w-10 h-10 text-sky-300"/>
            </motion.div>
            <motion.h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight" {...getFadeInUpProps(0.2)}>
              Pronto para <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-violet-300">Elevar</span> seu Atendimento?
            </motion.h2>
            <motion.p className="text-lg md:text-xl text-slate-300/90 mb-10 leading-relaxed" {...getFadeInUpProps(0.3)}>
              Chega de perder tempo e leads com atendimento manual. Deixe a Anna cuidar da linha de frente enquanto sua equipe foca no que realmente importa: fechar negócios.
            </motion.p>
            <motion.div {...getFadeInUpProps(0.4)}>
                <StyledButton onClick={() => setIsWhatsAppModalOpen(true)} variant="secondary" icon={<SparklesIcon className="w-5 h-5"/>} size="large">
                Quero uma Demonstração
                </StyledButton>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <AnimatePresence>
        {isWhatsAppModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{duration:0.3, ease:"easeInOut"}}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setIsWhatsAppModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y:15 }}
              animate={{ scale: 1, opacity: 1, y:0 }}
              exit={{ scale: 0.85, opacity: 0, y:15 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
               <DevicePhoneMobileIcon className="w-16 h-16 text-green-500 mx-auto mb-5"/>
              <h3 className="text-2xl font-semibold text-slate-800 mb-3">Converse com a Anna</h3>
              <p className="text-slate-600 mb-6 text-md">Você será redirecionado para o WhatsApp para iniciar uma conversa e testar a nossa IA.</p>
              <a 
                href="https://wa.me/SEUNUMERODOWHATSAPP?text=Ol%C3%A1%2C%20gostaria%20de%20testar%20a%20Anna%20da%20RG%20Pulse!" // <<<<<< SUBSTITUA SEUNUMERODOWHATSAPP
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-green-500 text-white rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 active:scale-95"
                onClick={() => setIsWhatsAppModalOpen(false)}
              >
                 <DevicePhoneMobileIcon className="w-5 h-5 mr-2"/> Iniciar Conversa
              </a>
              <button 
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="mt-5 text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default AnnaPage;