// src/pages/Cases.tsx
import { useEffect, FunctionComponent } from 'react'; // Removido useState se não for usado aqui
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
// import CTAButton from '../components/CTAButton'; // Usaremos StyledButton
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import {
  LightBulbIcon,
  FlagIcon,
  ChartBarIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  SparklesIcon // Para o botão de CTA
} from '@heroicons/react/24/outline';

const casesData = [
  { id: "tech-solutions", title: "Tech Solutions", industry: "Tecnologia B2B", challenge: "Baixa taxa de conversão de leads MQL para SQL e dificuldade em escalar as vendas.", solution: "Reestruturação do funil de vendas com automação de marketing (HubSpot), qualificação aprimorada por SDRs e implementação de playbooks comerciais.", results: [ { metric: "+120%", label: "Aumento na Taxa de Conversão (Lead > Venda)" }, { metric: "-35%", label: "Redução no Custo por Aquisição de Cliente (CAC)" }, { metric: "3 meses", label: "Tempo para Retorno Sobre Investimento (ROI)" } ], testimonial: { name: "Carlos Silva", position: "Diretor Comercial, Tech Solutions", content: "A parceria com a RG Pulse não apenas transformou nosso sistema de vendas, mas injetou uma nova energia em nossa equipe. Os resultados foram além das expectativas.", image: "/avatars/carlos.svg" }, logo: "/logos/tech-solutions-logo.svg" },
  { id: "agencia-digital-vision", title: "Agência Digital Vision", industry: "Marketing e Publicidade", challenge: "Processo comercial desorganizado, falta de visibilidade do funil e ciclo de vendas longo.", solution: "Implementação completa do CRM Pipedrive, criação de dashboards de performance e treinamento intensivo da equipe comercial em vendas consultivas.", results: [ { metric: "+80%", label: "Aumento na Taxa de Fechamento de Propostas" }, { metric: "-25%", label: "Redução no Ciclo Médio de Vendas" }, { metric: "9.2/10", label: "Nota de Satisfação dos Clientes (CSAT)" } ], testimonial: { name: "Mariana Costa", position: "CEO, Agência Digital Vision", content: "A RG Pulse nos deu clareza e controle. A visão holística deles sobre o processo de vendas e a implementação do CRM foram divisores de água para nossa operação.", image: "/avatars/mariana.svg" }, logo: "/logos/agencia-vision-logo.svg" },
  { id: "ecommerce-express", title: "E-commerce Express", industry: "Varejo Online - Moda", challenge: "Alto custo de aquisição de clientes (CAC) e baixo valor de tempo de vida do cliente (LTV).", solution: "Otimização de campanhas de Google Ads e Meta Ads com foco em segmentação avançada, e implementação de uma estratégia de e-mail marketing para retenção e remarketing.", results: [ { metric: "-45%", label: "Redução no Custo por Aquisição (CAC)" }, { metric: "+60%", label: "Aumento no Retorno Sobre Investimento em Ads (ROAS)" }, { metric: "+30%", label: "Crescimento na Taxa de Compra Recorrente" } ], testimonial: { name: "Roberto Almeida", position: "Diretor de Marketing, E-commerce Express", content: "Encontrar a RG Pulse foi como achar uma agulha no palheiro. Eles realmente entendem de performance e otimização. Nossos números nunca foram tão bons.", image: "/avatars/roberto.svg" }, logo: "/logos/ecommerce-express-logo.svg" }
];

// --- DEFINIÇÕES DE ANIMAÇÃO AQUI, DENTRO OU ANTES DO COMPONENTE ---
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren, delayChildren } }
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
const getFadeInUpProps = (delay = 0, amountVisible = 0.15) => // amount ajustado
    applyMotionViewport(fadeInUp, delay, amountVisible);
// --- FIM DAS DEFINIÇÕES DE ANIMAÇÃO ---

// --- Componente StyledButton (Reutilizado) ---
interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "green" | "outline";
    icon?: React.ReactNode;
    size?: "normal" | "large";
    asLink?: boolean;
    to?: string; 
    href?: string;
  }

const StyledButton: FunctionComponent<StyledButtonProps> = ({ children, onClick, className = "", variant = "primary", icon, size="normal", asLink = false, to, href, ...props }) => {
    const baseStyle = "inline-flex items-center justify-center rounded-xl font-semibold text-lg transition-all duration-300 ease-out shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
    const paddingStyle = size === "large" ? "px-8 py-4" : "px-7 py-3.5";
    
    let variantStyle = "";
    switch(variant) {
        case "primary":
            variantStyle = `bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white hover:from-[#05D7FB] hover:to-[#2A15EB] focus-visible:ring-[#05D7FB]`;
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
            variantStyle = primaryStyle;
    }

    const motionPropsInternal = {
        whileHover: { y: -2, boxShadow: "0 8px 15px rgba(0,0,0,0.1)" },
        whileTap: { y: 0, scale:0.98, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
        transition: { type: "spring", stiffness: 300, damping: 20 }
    };
    
    if (asLink && to) {
        return (
            <Link to={to}>
                 <motion.span
                    className={`${baseStyle} ${paddingStyle} ${variantStyle} ${className}`}
                    {...motionPropsInternal}
                >
                    {icon && <span className="mr-2 -ml-1">{icon}</span>}
                    {children}
                </motion.span>
            </Link>
        );
    }
    if (asLink && href) {
        return (
             <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseStyle} ${paddingStyle} ${variantStyle} ${className}`}
                {...motionPropsInternal}
                {...props}
            >
                {icon && <span className="mr-2 -ml-1">{icon}</span>}
                {children}
            </motion.a>
        );
    }

    return (
      <motion.button
        onClick={onClick}
        className={`${baseStyle} ${paddingStyle} ${variantStyle} ${className}`}
        {...motionPropsInternal}
        {...props}
      >
        {icon && <span className="mr-2 -ml-1">{icon}</span>}
        {children}
      </motion.button>
    );
};


const Cases: FunctionComponent = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 antialiased selection:bg-[#2A15EB] selection:text-white">
      <Navbar />
      <WhatsAppButton onClick={() => {/* Implementar ação desejada */}}/>
      
      <main className="flex-grow pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 
                       bg-gradient-to-b from-white via-sky-100 to-blue-200
                       text-slate-800 overflow-hidden">
           <div className="absolute inset-0 opacity-[0.03]">
             <svg width="100%" height="100%"><defs><pattern id="pattCasesHero" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.5" fill="rgba(0,80,180,0.3)"/></pattern></defs><rect width="100%" height="100%" fill="url(#pattCasesHero)"></rect></svg>
           </div>
          <div className="container mx-auto px-6 sm:px-8 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              variants={staggerContainer(0.1,0)} initial="hidden" animate="visible"
            >
              <motion.div 
                className="inline-block mb-6 p-3.5 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-full shadow-lg"
                variants={fadeInUp}
                transition={{ type: "spring", stiffness: 180, damping: 12 }} // delay herdado
              >
                <ShieldCheckIcon className="w-10 h-10 text-[#2A15EB]" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 tracking-tight
                           text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#7C3AED]"
                variants={fadeInUp}
              >
                Cases de Sucesso Comprovados
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                Descubra como a RG Pulse ajudou empresas como a sua a superar desafios e alcançar resultados extraordinários com sistemas de vendas otimizados.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Cases Grid */}
        <section className="py-16 md:py-24 bg-slate-100"> {/* Fundo ligeiramente diferente */}
          <div className="container mx-auto px-6 sm:px-8">
            {casesData.length === 0 && (
                <motion.div className="text-center py-12" {...getFadeInUpProps()}>
                    <p className="text-xl text-slate-500">Nossos cases de sucesso estão sendo atualizados. Volte em breve!</p>
                </motion.div>
            )}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-1 gap-10 md:gap-12 max-w-4xl mx-auto"
              variants={staggerContainer(0.15,0)} {...applyMotionViewport(staggerContainer(0.15,0),0,0.05)} // Corrigido aqui, passando staggerContainer como variante
            >
              {casesData.map((caseItem) => (
                <motion.article 
                  key={caseItem.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-shadow duration-300 border border-slate-200/80"
                  variants={fadeInUp} // Filhos do staggerContainer
                >
                  <div className="md:flex">
                    <div className="md:w-1/3 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 md:p-8 text-white flex flex-col justify-between rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                      <div>
                        {caseItem.logo && (
                            <img src={caseItem.logo} alt={`${caseItem.title} logo`} className="h-8 mb-5 opacity-80 group-hover:opacity-100 transition-opacity" />
                        )}
                        <h3 className="text-2xl lg:text-3xl font-bold mb-1 group-hover:text-sky-300 transition-colors">{caseItem.title}</h3>
                        <p className="text-sm text-sky-200/80 mb-6">{caseItem.industry}</p>
                        
                        {caseItem.testimonial && (
                            <div className="mt-auto border-t border-slate-600 pt-5">
                                <blockquote className="italic text-slate-300 text-sm mb-3 relative pl-5
                                                         before:content-['“'] before:absolute before:left-0 before:top-0 before:text-3xl before:text-sky-400/70 before:-mt-2
                                                         after:content-['”'] after:absolute after:right-0 after:bottom-0 after:text-3xl after:text-sky-400/70 after:-mb-4">
                                    {caseItem.testimonial.content}
                                </blockquote>
                                <div className="flex items-center mt-3">
                                    {caseItem.testimonial.image ? (
                                        <img 
                                        src={caseItem.testimonial.image} 
                                        alt={caseItem.testimonial.name}
                                        className="w-10 h-10 rounded-full mr-3 border-2 border-sky-400/50"
                                        />
                                    ) : (
                                        <UserCircleIcon className="w-10 h-10 text-slate-400 mr-3"/>
                                    )}
                                    <div>
                                        <p className="font-semibold text-sm text-white">{caseItem.testimonial.name}</p>
                                        <p className="text-xs text-sky-300/80">{caseItem.testimonial.position}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-2/3 p-6 md:p-8">
                        <div className="mb-6">
                        <h4 className="font-semibold text-slate-700 mb-2 flex items-center text-lg">
                            <FlagIcon className="w-6 h-6 mr-2 text-[#2A15EB]" />
                            Desafio
                        </h4>
                        <p className="text-slate-600 text-md leading-relaxed">{caseItem.challenge}</p>
                        </div>

                        <div className="mb-6">
                        <h4 className="font-semibold text-slate-700 mb-2 flex items-center text-lg">
                            <LightBulbIcon className="w-6 h-6 mr-2 text-[#05D7FB]" />
                            Nossa Solução
                        </h4>
                        <p className="text-slate-600 text-md leading-relaxed">{caseItem.solution}</p>
                        </div>

                        <div>
                        <h4 className="font-semibold text-slate-700 mb-3 flex items-center text-lg">
                            <ChartBarIcon className="w-6 h-6 mr-2 text-purple-500" />
                            Resultados Alcançados
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {caseItem.results.map((result, idx) => (
                            <motion.div 
                                key={idx}
                                className="bg-gradient-to-r from-slate-100 to-slate-200 p-4 rounded-lg text-center border border-slate-200"
                                initial={{ opacity: 0, scale:0.9 }}
                                whileInView={{ opacity: 1, scale:1 }}
                                viewport={{once:true, amount:0.5}}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                            >
                                <div className="text-2xl font-bold text-[#2A15EB] mb-0.5">{result.metric}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">{result.label}</div>
                            </motion.div>
                            ))}
                        </div>
                        </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-6 sm:px-8 text-center">
            <motion.div {...getFadeInUpProps(0,0.2)}>
              <h2 className="text-3xl md:text-4xl font-bold mb-5 text-slate-800">Pronto para Escrever Sua Própria História de Sucesso?</h2>
              <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Descubra como o sistema de vendas da RG Pulse pode impulsionar sua empresa a alcançar resultados extraordinários, assim como fizemos por nossos clientes.
              </p>
              <StyledButton 
                href="https://wa.me/5548999555389" 
                variant="primary"
                size="large"
                icon={<SparklesIcon className="w-6 h-6"/>}
                asLink
              >
                Fale com um Especialista
              </StyledButton>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cases;