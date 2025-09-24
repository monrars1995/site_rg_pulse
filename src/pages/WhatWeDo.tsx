import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SalesProcess from '../components/SalesProcess'; // Assumindo que este componente está estilizado
// import ServiceCard from '../components/ServiceCard'; // Removido, vamos renderizar diretamente
import CTAButton from '../components/CTAButton';     // Assumindo que este componente está estilizado
import WhatsAppButton from '../components/WhatsAppButton';
import { motion } from 'framer-motion';

// Importando ícones do Heroicons
import {
  ChartPieIcon, // Estratégia de Marketing
  AdjustmentsHorizontalIcon, // Automação de Vendas / CRM
  PresentationChartLineIcon, // Gestão de Tráfego
  AcademicCapIcon, // Consultoria Estratégica (ou LightBulbIcon)
  EnvelopeOpenIcon, // Automação de Marketing (ou InboxArrowDownIcon)
  BuildingStorefrontIcon, // Placeholder, pode ser LightBulbIcon para Solução
  QuestionMarkCircleIcon, // Placeholder, pode ser UsersIcon para "O que vendemos"
  LightBulbIcon, // Para Nossos Serviços & O que nossa empresa vende / Solução
} from '@heroicons/react/24/outline';

const servicesData = [
  {
    title: "Estratégia de Marketing Digital",
    description: "Desenvolvemos planos de marketing sob medida, focados em atrair seu público ideal e gerar leads de alta qualidade consistentemente.",
    icon: <ChartPieIcon className="w-10 h-10" />, // Ajustado tamanho
    colorFrom: "from-blue-500",
    colorTo: "to-indigo-600",
  },
  {
    title: "Automação de Vendas e CRM",
    description: "Otimizamos seu processo comercial com ferramentas e fluxos automatizados que aumentam a conversão e melhoram o follow-up.",
    icon: <AdjustmentsHorizontalIcon className="w-10 h-10" />,
    colorFrom: "from-sky-500",
    colorTo: "to-cyan-600",
  },
  {
    title: "Gestão de Tráfego Pago",
    description: "Criamos e gerenciamos campanhas de alta performance no Google, Meta e outras plataformas para maximizar seu ROI e captar leads qualificados.",
    icon: <PresentationChartLineIcon className="w-10 h-10" />,
    colorFrom: "from-purple-500",
    colorTo: "to-pink-600",
  },
  {
    title: "Consultoria Estratégica de Vendas",
    description: "Análise completa do seu sistema de vendas atual, identificando gargalos e oportunidades, com um plano de ação claro para otimizar resultados.",
    icon: <AcademicCapIcon className="w-10 h-10" />,
    colorFrom: "from-emerald-500",
    colorTo: "to-green-600",
  },
  {
    title: "Automação de Marketing e Nutrição",
    description: "Implementamos fluxos automatizados que nutrem seus leads de forma inteligente, preparando-os para a abordagem comercial no momento certo.",
    icon: <EnvelopeOpenIcon className="w-10 h-10" />,
    colorFrom: "from-amber-500",
    colorTo: "to-orange-600",
  },
  {
    title: "Tecnologia para Vendas (CRM)",
    description: "Ajudamos na escolha, implementação e otimização de sistemas de CRM para uma gestão eficiente do relacionamento com seus clientes.",
    icon: <AdjustmentsHorizontalIcon className="w-10 h-10" />, // Reutilizado, ou um ícone específico de CRM
    colorFrom: "from-rose-500",
    colorTo: "to-red-600",
  }
];

const WhatWeDo = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Animações Framer Motion
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const getMotionProps = (delay = 0, amount = 0.2) => ({
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, amount },
    variants: fadeInUp,
    transition: { delay, duration: 0.5 }
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 antialiased selection:bg-[#2A15EB] selection:text-white">
      <Navbar />
      <WhatsAppButton />
      
      <main className="flex-grow pt-20 md:pt-24"> {/* Ajuste padding top */}
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 
                       bg-gradient-to-b from-white via-sky-50 to-[#E0F2FE] 
                       text-slate-800 overflow-hidden">
           <div className="absolute inset-0 opacity-[0.03]">
             <svg width="100%" height="100%"><defs><pattern id="pattWhatWeDoHero" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill="rgba(50,100,200,0.4)"/></pattern></defs><rect width="100%" height="100%" fill="url(#pattWhatWeDoHero)"></rect></svg>
           </div>
          <div className="container mx-auto px-6 sm:px-8 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="inline-block mb-6 p-3.5 bg-gradient-to-r from-sky-100 to-blue-100 rounded-full shadow-lg"
                variants={fadeInUp} // Pode usar scaleIn aqui se preferir
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 12 }}
              >
                <LightBulbIcon className="w-10 h-10 text-[#2A15EB]" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 tracking-tight
                           text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#7C3AED]"
                variants={fadeInUp}
              >
                O Que Fazemos
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                Transformamos intenção em resultado. A RG Pulse não é só uma agência de marketing.
                Somos consultores operacionais de crescimento, especializados em montar sistemas
                de vendas completos que integram marketing, comercial e pós-venda para performance máxima.
              </motion.p>
            </motion.div>
          </div>
        </section>
        
        {/* Services Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-6 sm:px-8">
            <motion.div className="text-center mb-12 md:mb-16" {...getMotionProps(0,0.1)}>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800">Nossas Soluções Integradas</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Conheça nossa abordagem completa que vai além das soluções tradicionais de marketing digital, construindo um sistema robusto para o seu crescimento.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
            >
              {servicesData.map((service, index) => (
                <motion.div 
                  key={service.title}
                  className="bg-white rounded-2xl shadow-lg p-6 md:p-8 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 group"
                  variants={fadeInUp}
                >
                  <div className={`inline-flex items-center justify-center mb-5 w-16 h-16 rounded-xl bg-gradient-to-br ${service.colorFrom} ${service.colorTo} text-white shadow-md transform group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold mb-3 text-slate-800">{service.title}</h3>
                  <p className="text-slate-600 text-[0.95rem] leading-relaxed">{service.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* Process Section */}
        <section className="py-16 md:py-24 bg-slate-50"> {/* Fundo suave */}
          <div className="container mx-auto px-6 sm:px-8">
            <motion.div className="text-center mb-12 md:mb-16" {...getMotionProps(0,0.1)}>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800">Nosso Processo Estratégico</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Um sistema de vendas eficiente nasce da integração perfeita entre marketing, comercial e pós-venda.
                Veja como orquestramos cada etapa:
              </p>
            </motion.div>
            
            {/* SalesProcess deve ter suas próprias animações internas ou ser envolvido por motion.div */}
            <motion.div {...getMotionProps(0.1, 0.05)}>
                <SalesProcess />
            </motion.div>
          </div>
        </section>
        
        {/* Additional Info Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-6 sm:px-8">
             <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch" // items-stretch para mesma altura se possível
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              <motion.div 
                className="bg-slate-50 rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col"
                variants={fadeInUp}
              >
                 <div className="flex-shrink-0 inline-block p-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-4 self-start">
                    <BuildingStorefrontIcon className="w-8 h-8 text-[#2A15EB]" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] to-[#05D7FB]">
                  O Que Vendemos?
                </h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  A RG Pulse oferece uma assessoria completa em sistemas de vendas, unindo marketing, comercial e pós-venda. Criamos uma abordagem holística que transcende o marketing digital tradicional, focada em acelerar o crescimento sustentável da sua empresa no ambiente digital.
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-slate-50 rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col"
                variants={fadeInUp}
              >
                <div className="flex-shrink-0 inline-block p-2.5 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-full mb-4 self-start">
                    <LightBulbIcon className="w-8 h-8 text-[#05D7FB]" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#05D7FB] to-[#7C3AED]">
                  Nossa Solução Chave
                </h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  Entregamos uma consultoria 360° que analisa e otimiza seu funil de vendas completo: da atração qualificada de leads ao fechamento e fidelização. Usamos dados para criar estratégias personalizadas, incluindo tráfego pago inteligente, CRO e engajamento pós-venda, transformando clientes em promotores e maximizando seu ROI.
                </p>
              </motion.div>
            </motion.div>
            
            <motion.div className="mt-12 md:mt-16 text-center" {...getMotionProps(0.2,0.1)}>
              <CTAButton 
                text="Quero Otimizar Meu Sistema de Vendas"
                href="https://wa.me/5548999555389" // Seu WhatsApp
                // Passe classes para estilizar o botão, ex:
                // className="text-lg px-10 py-4"
              />
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default WhatWeDo;