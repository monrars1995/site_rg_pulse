// src/pages/Index.tsx
import { useEffect, useState, FunctionComponent } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
// import WhatsAppButton from '../components/WhatsAppButton'; // REMOVIDO - substituído pelo chat flutuante
import SalesProcess from '../components/SalesProcess';
import VideoSection from '../components/VideoSection';
import TestimonialCard from '../components/TestimonialCard';
import TeamCarousel from '../components/TeamCarousel';
import Partners from '../components/Partners';
import LeadForm from '../components/LeadForm';
import HowWeWork from '../components/HowWeWork';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// NOVOS IMPORTS PARA O CHAT FLUTUANTE
import FloatingChatButton from '../components/FloatingChatButton'; // Verifique o caminho
import FloatingChat from '../components/FloatingChat';             // Verifique o caminho

// Importando ícones do Heroicons (ajustando conforme o original e adicionando/confirmando os do chat)
import {
  MegaphoneIcon,
  CurrencyDollarIcon,
  ArrowPathIcon as ArrowPathIconOutline, // Se o ícone do chat `ArrowPathIcon` for Solid
  ChartBarSquareIcon,
  ChartPieIcon,
  AdjustmentsHorizontalIcon,
  PresentationChartLineIcon,
  AcademicCapIcon,
  // EnvelopeOpenIcon, // Não parecia estar em uso direto no JSX original
  CpuChipIcon,
  SparklesIcon,
  UserGroupIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
  // LightBulbIcon, // Não parecia estar em uso direto no JSX original
  // BuildingStorefrontIcon, // Não parecia estar em uso direto no JSX original
  ChatBubbleOvalLeftEllipsisIcon, // Usado na seção Anna e para o botão de chat
  ChartBarIcon
} from '@heroicons/react/24/outline';

// --- DADOS DOS COMPONENTES ---
const servicesData = [
  { title: "Estratégia de Marketing Digital", description: "Desenvolvemos planos de marketing sob medida, focados em atrair seu público ideal e gerar leads de alta qualidade consistentemente.", icon: <ChartPieIcon className="w-10 h-10" />, colorFrom: "from-blue-500", colorTo: "to-indigo-600" },
  { title: "Automação de Vendas e CRM", description: "Otimizamos seu processo comercial com ferramentas e fluxos automatizados que aumentam a conversão e melhoram o follow-up.", icon: <AdjustmentsHorizontalIcon className="w-10 h-10" />, colorFrom: "from-sky-500", colorTo: "to-cyan-600" },
  { title: "Gestão de Tráfego Pago", description: "Criamos e gerenciamos campanhas de alta performance no Google, Meta e outras plataformas para maximizar seu ROI e captar leads qualificados.", icon: <PresentationChartLineIcon className="w-10 h-10" />, colorFrom: "from-purple-500", colorTo: "to-pink-600" },
  { title: "Consultoria Estratégica de Vendas", description: "Análise completa do seu sistema de vendas atual, identificando gargalos e oportunidades, com um plano de ação claro para otimizar resultados.", icon: <AcademicCapIcon className="w-10 h-10" />, colorFrom: "from-emerald-500", colorTo: "to-green-600" }
];

const heroPillars = [
    { title: "Marketing", description: "Gere leads qualificados", icon: <MegaphoneIcon className="w-6 h-6" />, gradient: "from-[#2A15EB] to-[#05D7FB]", hoverGradient: "hover:to-[#7C3AED]" },
    { title: "Vendas", description: "Aumente suas conversões", icon: <CurrencyDollarIcon className="w-6 h-6" />, gradient: "from-[#05D7FB] to-[#7C3AED]", hoverGradient: "hover:to-[#DE1CFB]" },
    { title: "Pós-Venda", description: "Fidelize seus clientes", icon: <ArrowPathIconOutline className="w-6 h-6" />, gradient: "from-[#7C3AED] to-[#DE1CFB]", hoverGradient: "hover:to-[#2A15EB]" },
    { title: "Resultados", description: "Maximize seu ROI", icon: <ChartBarSquareIcon className="w-6 h-6" />, gradient: "from-[#DE1CFB] to-[#2A15EB]", hoverGradient: "hover:to-[#05D7FB]" }
];

const testimonialsData = [
  { name: "Carlos Silva", company: "Tech Solutions", content: "A RG Pulse revolucionou nosso sistema de vendas. Em 3 meses, dobramos a conversão e cortamos o CAC em 40%. Impressionante!", rating: 5 },
  { name: "Mariana Costa", company: "Agência Digital Vision", content: "A visão holística da RG Pulse é o grande diferencial. Integraram marketing, vendas e pós-venda de forma coesa, trazendo resultados incríveis.", rating: 5 },
  { name: "Roberto Almeida", company: "E-commerce StorePro", content: "Finalmente uma parceria que entende de resultado. Nosso ROI nunca foi tão alto. A RG Pulse sabe o que faz.", rating: 5 }
];

// --- DEFINIÇÕES DE ANIMAÇÃO ---
const fadeInUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] } }
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } }
};
const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren, delayChildren }
    }
});

const applyMotionViewport = (animationVariants: any, delay = 0, amountVisible = 0.2) => ({
    variants: animationVariants,
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: amountVisible },
    transition: { 
      delay, 
      duration: animationVariants.visible?.transition?.duration || 0.6, 
      ease: animationVariants.visible?.transition?.ease || "easeOut"
    }
});

const getFadeInUpProps = (delay = 0, amountVisible = 0.2) => 
    applyMotionViewport(fadeInUp, delay, amountVisible);

const getScaleInProps = (delay = 0, amountVisible = 0.2) => 
    applyMotionViewport(scaleIn, delay, amountVisible);

// --- COMPONENTE STYLED BUTTON (COMO NO SEU ORIGINAL) ---
interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "green" | "outline";
    icon?: React.ReactNode;
    size?: "normal" | "large";
    asLink?: boolean;
    to?: string;
  }

const StyledButton: FunctionComponent<StyledButtonProps> = ({ children, onClick, className = "", variant = "primary", icon, size="normal", asLink = false, to = "#", ...props }) => {
    const baseStyle = "inline-flex items-center justify-center rounded-xl font-semibold text-lg transition-all duration-300 ease-out shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
    const paddingStyle = size === "large" ? "px-8 py-4" : "px-7 py-3.5";
    
    let variantStyle = "";
    // Definindo primaryStyle aqui para que possa ser usado no default do switch
    const primaryStyleDefinition = `bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white hover:from-[#05D7FB] hover:to-[#2A15EB] focus-visible:ring-[#05D7FB]`;

    switch(variant) {
        case "primary":
            variantStyle = primaryStyleDefinition;
            break;
        case "secondary": 
            variantStyle = `bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400 focus-visible:ring-[#2A15EB]`;
            break;
        case "outline": 
            variantStyle = `bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#2A15EB] focus-visible:ring-white`;
            break;
        case "green":
             variantStyle = `bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500`;
             break;
        default:
            variantStyle = primaryStyleDefinition; // Usando a variável definida
    }

    const motionPropsInternal = {
        whileHover: { y: -2, boxShadow: "0 8px 15px rgba(0,0,0,0.1)" },
        whileTap: { y: 0, scale:0.98, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
        transition: { type: "spring", stiffness: 300, damping: 20 }
    };
    
    if (asLink && to) {
        return (
            <Link to={to}>
                 <motion.span // Mudado de button para span para semântica de link
                    className={`${baseStyle} ${paddingStyle} ${variantStyle} ${className}`}
                    {...motionPropsInternal}
                    // Não pode passar {...props} de button para um span diretamente se houver props de button.
                    // Se precisar de props HTML genéricas, ok. Senão, omita.
                >
                    {icon && <span className="mr-2 -ml-1">{icon}</span>}
                    {children}
                </motion.span>
            </Link>
        );
    }

    return (
      <motion.button
        onClick={onClick}
        className={`${baseStyle} ${paddingStyle} ${variantStyle} ${className}`}
        {...motionPropsInternal}
        {...props} // Props de button
      >
        {icon && <span className="mr-2 -ml-1">{icon}</span>}
        {children}
      </motion.button>
    );
};

const Index: FunctionComponent = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  // ESTADO PARA O CHAT
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // FUNÇÃO PARA ALTERNAR O CHAT
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 antialiased selection:bg-[#2A15EB] selection:text-white relative">
      <Navbar />
      {/* WhatsAppButton ORIGINAL REMOVIDO */}
      
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-48 lg:pb-36 bg-gradient-to-b from-white via-sky-50 to-blue-100 text-slate-800 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
             <svg width="100%" height="100%"><defs><pattern id="pattHomeHero" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="rgba(0,50,150,0.3)"/></pattern></defs><rect width="100%" height="100%" fill="url(#pattHomeHero)"></rect></svg>
        </div>
        <div className="container mx-auto px-6 sm:px-8 relative z-10">
          <motion.div 
            className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16"
            variants={staggerContainer(0.1, 0)}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="lg:w-6/12 text-center lg:text-left"
              variants={fadeInUp}
            >
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-[3.8rem] xl:text-6xl font-extrabold leading-tight mb-6 tracking-tighter"
                variants={fadeInUp}
              >
                <span className="block">VENDER NÃO É UM DOM,</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#7C3AED]">
                  É UM PROCESSO!
                </span>
              </motion.h1>
              <motion.p 
                className="text-lg sm:text-xl text-slate-600 mb-10 max-w-xl lg:max-w-none mx-auto lg:mx-0 leading-relaxed"
                variants={fadeInUp}
              >
                Aceleramos negócios no ambiente digital com sistemas de vendas completos e otimizados, do marketing ao pós-venda.
              </motion.p>
              <motion.div variants={fadeInUp}>
                <StyledButton 
                  onClick={() => setIsFormOpen(true)}
                  variant="primary"
                  size="large"
                  icon={<SparklesIcon className="w-6 h-6" />}
                >
                  Quero Vender Mais!
                </StyledButton>
              </motion.div>
            </motion.div>
            
            <motion.div 
                className="lg:w-6/12 relative mt-10 lg:mt-0"
                variants={scaleIn}
            >
              <div className="relative p-4 sm:p-6 bg-gradient-to-br from-sky-100/70 via-blue-100/70 to-purple-100/70 rounded-2xl shadow-2xl backdrop-blur-sm">
                <motion.div 
                    className="grid grid-cols-2 gap-4 sm:gap-5"
                    variants={staggerContainer(0.15, 0.2)}
                    initial="hidden"
                    animate="visible"
                >
                  {heroPillars.map((pillar) => (
                    <motion.div
                      key={pillar.title}
                      className={`bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-5 sm:p-6 group transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${pillar.hoverGradient?.replace("to-", "hover:bg-gradient-to-br from-white via-transparent hover:")}`}
                      variants={fadeInUp}
                      whileHover={{ y: -3 }}
                    >
                      <div className="flex items-center mb-2.5">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${pillar.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          {pillar.icon}
                        </div>
                        <h3 className={`font-bold text-lg ml-3 text-transparent bg-clip-text bg-gradient-to-r ${pillar.gradient} group-hover:bg-gradient-to-r ${pillar.hoverGradient} transition-all duration-300`}>{pillar.title}</h3>
                      </div>
                      <p className="text-slate-600 text-sm sm:text-base group-hover:text-slate-700 transition-colors duration-300">{pillar.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
                <div className="absolute -bottom-5 -right-5 w-20 h-20 bg-[#05D7FB]/20 rounded-full filter blur-xl animate-pulse animation-delay-1000 pointer-events-none"></div>
                <div className="absolute -top-8 -left-8 w-28 h-28 bg-[#2A15EB]/15 rounded-full filter blur-2xl animate-pulse pointer-events-none"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <section id="o-que-fazemos" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="text-center mb-12 md:mb-16" {...getFadeInUpProps(0,0.1)}>
            <Cog6ToothIcon className="w-12 h-12 text-[#2A15EB] mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">Nossas Soluções Integradas</h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Otimizamos seu sistema de vendas completo, integrando estratégias de marketing, automação comercial e excelência no pós-venda para maximizar seus resultados.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
            variants={staggerContainer(0.07)} 
            {...applyMotionViewport(staggerContainer(0.07),0.1,0.05)} 
          >
            {servicesData.map((service) => (
              <motion.div 
                key={service.title}
                className={`bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 group border-t-4 ${service.colorFrom.replace("from-","border-")}`}
                variants={fadeInUp}
              >
                 <div className={`inline-flex items-center justify-center mb-5 w-16 h-16 rounded-full bg-gradient-to-br ${service.colorFrom} ${service.colorTo} text-white shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800">{service.title}</h3>
                <p className="text-sm text-slate-500 leading-normal flex-grow">{service.description}</p>
                <Link to="/o-que-fazemos" className="mt-4 inline-flex items-center text-sm text-[#2A15EB] font-medium group-hover:text-[#05D7FB] transition-colors">
                    Saiba mais <ArrowRightIcon className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5"/>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <HowWeWork />
      
      <VideoSection 
        configKey="home"
        sectionClassName="bg-slate-50 py-16 md:py-24"
        titleClassName="text-3xl md:text-4xl font-semibold text-slate-800"
        videoBoxShadow="shadow-2xl"
        ctaComponent={(buttonProps) => <StyledButton {...buttonProps} onClick={() => setIsFormOpen(true)} />}
      />
      
      <section className="py-16 md:py-24 bg-gradient-to-br from-sky-50 via-blue-100 to-purple-100">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
             {...getFadeInUpProps(0,0.1)}
          >
            <motion.div className="inline-block p-3 bg-white rounded-full mb-6 shadow-lg" {...getScaleInProps(0.1)}>
                <CpuChipIcon className="w-10 h-10 text-[#2A15EB]"/>
            </motion.div>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-5 text-slate-800" {...getFadeInUpProps(0.2)}
            >
              Conheça a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] to-[#05D7FB]">Anna</span>: Nossa IA para Vendas
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed" {...getFadeInUpProps(0.3)}
            >
              A Anna é a Inteligência Artificial da RG Pulse que transforma a forma como sua empresa conversa com leads, qualifica oportunidades e avança nas vendas — tudo de forma automática, inteligente e com a sua marca.
            </motion.p>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10"
              variants={staggerContainer(0.1)} {...applyMotionViewport(staggerContainer(0.1),0.4,0.1)}
            >
              {[
                  {icon:<ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7"/>, title:"Atendimento Ágil"}, 
                  {icon:<SparklesIcon className="w-7 h-7"/>, title:"Qualificação Inteligente"}, 
                  {icon:<ChartBarIcon className="w-7 h-7"/>, title:"Resultados Reais"}
                ].map(item=>(
                <motion.div key={item.title} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center text-center" variants={fadeInUp}>
                    <div className="p-3 mb-3 bg-gradient-to-r from-blue-100 to-purple-100 text-[#2A15EB] rounded-full">{item.icon}</div>
                    <h3 className="text-lg font-semibold mb-1 text-slate-700">{item.title}</h3>
                </motion.div>
              ))}
            </motion.div>
            <motion.div {...getFadeInUpProps(0.5)}>
              <StyledButton asLink to="/anna" variant="primary" size="large" icon={<CpuChipIcon className="w-6 h-6" />}>
                Descobrir a Anna
              </StyledButton>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="text-center mb-12 md:mb-16" {...getFadeInUpProps(0,0.1)}>
            <UserGroupIcon className="w-12 h-12 text-[#2A15EB] mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800">Nossos Clientes Confiam na Gente</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Conheça o depoimento de quem já transformou seu sistema de vendas com a RG Pulse.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12"
            variants={staggerContainer(0.1)} {...applyMotionViewport(staggerContainer(0.1),0.1,0.05)}
          >
            {testimonialsData.map((testimonial) => (
              <motion.div key={testimonial.name} variants={fadeInUp}>
                <TestimonialCard 
                  name={testimonial.name}
                  company={testimonial.company}
                  content={testimonial.content}
                  rating={testimonial.rating}
                  className="h-full bg-white shadow-lg hover:shadow-xl transition-shadow rounded-xl border border-slate-100"
                />
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div className="text-center" {...getFadeInUpProps(0.3,0.1)}>
            <StyledButton 
              asLink
              to="/depoimentos"
              variant="secondary"
            >
              Ver Todos os Depoimentos
            </StyledButton>
          </motion.div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-6 sm:px-8">
          <motion.div className="text-center mb-12 md:mb-16" {...getFadeInUpProps(0,0.1)}>
            <UserGroupIcon className="w-12 h-12 text-[#2A15EB] mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800">Conheça Nossos Especialistas</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              A equipe RG Pulse combina expertise técnica com visão estratégica para entregar o melhor resultado para o seu negócio.
            </p>
          </motion.div>
          <motion.div {...getFadeInUpProps(0.1, 0.05)}>
            <TeamCarousel />
          </motion.div>
        </div>
      </section>
      
      <Partners />
      
      <Footer />

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            key="leadFormModalWrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{duration: 0.3, ease: "easeInOut"}}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" // z-index alto para o modal
            onClick={() => setIsFormOpen(false)} 
          >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20, transition: {duration: 0.2} }}
                transition={{ type: "spring", stiffness: 300, damping: 25}}
                onClick={(e) => e.stopPropagation()} 
             >
                <LeadForm 
                onClose={() => setIsFormOpen(false)} 
                />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOVO CHAT FLUTUANTE */}
      <FloatingChatButton onClick={toggleChat} isOpen={isChatOpen} />
      <FloatingChat 
        isOpen={isChatOpen} 
        onClose={toggleChat} 
        agentName="Assistente RG Pulse" 
        initialMessage="Olá! 👋 Bem-vindo(a) à RG Pulse. Como posso te ajudar hoje?"
      />
    </div>
  );
};

export default Index;