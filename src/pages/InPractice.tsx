// src/pages/InPractice.tsx
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VideoSection from '../components/VideoSection';
import TestimonialCard from '../components/TestimonialCard';
import CTAButton from '../components/CTAButton';
import WhatsAppButton from '../components/WhatsAppButton';
import { motion } from 'framer-motion';

import { 
    MegaphoneIcon,
    CurrencyDollarIcon,
    ArrowPathIcon,
    Cog6ToothIcon 
} from '@heroicons/react/24/outline';


const testimonials = [
  { name: "Carlos Silva", company: "Tech Solutions", content: "A parceria com a RG Pulse transformou completamente nosso sistema de vendas. Em apenas 3 meses, dobramos nossa conversão e reduzimos o custo de aquisição de clientes em 40%.", rating: 5 },
  { name: "Mariana Costa", company: "Agência Digital", content: "O diferencial da RG Pulse é a visão holística do processo de vendas. Eles não apenas melhoraram nossas campanhas, mas integraram todo o sistema de marketing, vendas e pós-venda.", rating: 5 },
  { name: "Roberto Almeida", company: "E-commerce", content: "Depois de trabalhar com várias agências, encontramos na RG Pulse uma parceira que realmente entende o que é gerar resultado. Nosso ROI aumentou significativamente.", rating: 5 },
  { name: "Julia Mendes", company: "Consultoria", content: "Trabalhar com a RG Pulse foi um divisor de águas para o nosso negócio. Eles têm um entendimento profundo de como integrar marketing e vendas para resultados reais.", rating: 5 },
  { name: "Fernando Costa", company: "Indústria", content: "A abordagem da RG Pulse é única. Eles não vendem táticas isoladas, mas um sistema completo que funciona. Nossa receita aumentou mais de 70% no primeiro ano.", rating: 5 },
  { name: "Patricia Lemos", company: "Educação", content: "A equipe da RG Pulse entendeu perfeitamente nosso segmento e desenvolveu uma estratégia sob medida. Os resultados superaram todas as nossas expectativas.", rating: 5 }
];

const caseStudiesData = [
    {
      title: "Marketing Inteligente",
      description: "Geramos demanda qualificada com marketing digital orientado a performance, usando canais como Google, Meta, automações e conteúdo estratégico para atrair o cliente certo.",
      tags: ["Performance Ads", "Automação de MKT", "Conteúdo SEO", "Lead Generation"],
      icon: <MegaphoneIcon className="w-7 h-7" />,
      gradientFrom: "from-[#2A15EB]", // Azul RG
      gradientTo: "to-[#05D7FB]",   // Ciano RG
    },
    {
      title: "Comercial Estratégico",
      description: "Criamos um modelo comercial baseado em diagnóstico profundo, copy persuasiva e funis de venda otimizados. Cada lead tem um caminho claro e eficiente até a conversão.",
      tags: ["Diagnóstico de Vendas", "Copywriting", "Funis de Conversão", "CRM Setup"],
      gradientFrom: "from-[#05D7FB]", // Ciano RG
      gradientTo: "to-[#DE1CFB]",   // Roxo RG
      icon: <CurrencyDollarIcon className="w-7 h-7" />,
    },
    {
      title: "Pós-Venda que Fideliza",
      description: "Mapeamos a jornada do cliente pós-compra, ativamos o reengajamento e construímos um fluxo de acompanhamento que aumenta o LTV e gera novas oportunidades.",
      tags: ["Jornada do Cliente", "Reengajamento", "Retenção & LTV", "Upsell/Cross-sell"],
      gradientFrom: "from-[#DE1CFB]", // Roxo RG
      gradientTo: "to-[#2A15EB]",   // Azul RG
      icon: <ArrowPathIcon className="w-7 h-7" />,
    }
  ];


const InPractice = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      
      <main className="flex-grow pt-20 md:pt-24">
        {/* Header Section - GRADIENTE AJUSTADO */}
        <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 
                       bg-gradient-to-b from-white via-sky-50 to-[#E0F2FE] /* de branco para azul MUITO claro (sky-100) */
                       text-slate-800 overflow-hidden"> {/* Texto principal escuro */}
          <div className="absolute inset-0 opacity-[0.03]"> {/* Textura sutil */}
             <svg width="100%" height="100%"><defs><pattern id="pattPracticeHero" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse" ><path d="M8 0 H16 V8 H24 V16 H16 V24 H8 V16 H0 V8 H8Z" fill="rgba(50,50,150,0.3)" /></pattern></defs><rect width="100%" height="100%" fill="url(#pattPracticeHero)"></rect></svg>
        </div>
          <div className="container mx-auto px-6 sm:px-8 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              variants={staggerContainer}
              initial="hidden"
              animate="visible" // 'animate' em vez de whileInView para o primeiro elemento da página
            >
              <motion.div 
                className="inline-block mb-6 p-3 bg-gradient-to-r from-[#E0E7FF] to-[#DBEAFE] rounded-full shadow-lg" // Fundo do ícone mais claro
                variants={fadeInUp}
                custom={0} // delay não necessário se pai já está animando
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180, damping:15}}
              >
                <Cog6ToothIcon className="w-10 h-10 text-[#3B82F6]" /> {/* Ícone azul sobre fundo claro */}
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight 
                           text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#7C3AED]" // Seu gradiente RG Pulse
                variants={fadeInUp}
              >
                Na Prática: Nosso Sistema de Vendas
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                O que diferencia a RG Pulse não é apenas o tráfego. É o sistema completo que construímos para transformar leads em clientes fiéis.
              </motion.p>
            </motion.div>
          </div>
        </section>
        
        <VideoSection 
          configKey="inpractice"
          sectionClassName="py-16 md:py-20 bg-white" // Fundo branco para o vídeo
          titleClassName="text-3xl md:text-4xl font-semibold text-slate-800"
          // Se CTAButton for o seu, passe variant="primary" ou variant="secondary"
        />
        
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-6 sm:px-8">
            <motion.div className="text-center mb-12 md:mb-16" {...getMotionProps(0,0.1)}>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-800">Nossos Pilares em Ação</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Veja como aplicamos nossa expertise em Marketing, Comercial e Pós-Venda para construir sistemas que geram resultados consistentes.
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {caseStudiesData.map((item, index) => (
                <motion.div 
                  key={item.title}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5"
                  variants={fadeInUp}
                >
                  <div className={`h-2.5 bg-gradient-to-r ${item.gradientFrom} ${item.gradientTo}`}></div>
                  <div className="p-6 md:p-8 flex flex-col flex-grow">
                    <div className="flex items-center mb-5">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} text-white shadow-md mr-4 group-hover:scale-110 transition-transform duration-300`}>
                        {item.icon}
                      </div>
                      <h3 className="text-xl lg:text-2xl font-semibold text-slate-800">{item.title}</h3>
                    </div>
                    <p className="text-slate-600 mb-6 leading-relaxed text-md flex-grow">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {item.tags.map(tag => (
                        <span key={tag} className={`px-3 py-1.5 rounded-full text-xs font-medium 
                                                    ${index === 0 ? 'bg-blue-100 text-blue-700' : 
                                                     index === 1 ? 'bg-sky-100 text-sky-700'   : 
                                                                   'bg-purple-100 text-purple-700'} 
                                                    opacity-90 group-hover:opacity-100 transition-opacity`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div className="mt-12 md:mt-16 text-center" {...getMotionProps(0.3,0.1)}>
              <CTAButton 
                text="Quero um Sistema de Vendas Eficiente"
                href="https://wa.me/5548999555389" // Seu WhatsApp
              />
            </motion.div>
          </div>
        </section>
        
        <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="container mx-auto px-6 sm:px-8">
            <motion.div className="text-center mb-12 md:mb-16" {...getMotionProps(0,0.1)}>
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] bg-clip-text text-transparent"
                {...getMotionProps(0.1)}
              >
                Mais de 150 Clientes Satisfeitos
              </motion.h2>
              <motion.p 
                className="text-lg text-slate-600 max-w-2xl mx-auto"
                {...getMotionProps(0.2)}
              >
                Nossos clientes confiam na RG Pulse para transformar seus resultados. Veja o que eles dizem:
              </motion.p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
            >
              {testimonials.slice(0, 3).map((testimonial, index) => ( 
                <motion.div
                  key={index}
                  variants={fadeInUp}
                >
                  <TestimonialCard 
                    name={testimonial.name}
                    company={testimonial.company}
                    content={testimonial.content}
                    rating={testimonial.rating}
                    // Se TestimonialCard aceitar, passe classes para estilização:
                    // className="h-full bg-white shadow-lg hover:shadow-xl transition-shadow rounded-xl" 
                  />
                </motion.div>
              ))}
            </motion.div>
             {testimonials.length > 3 && (
                 <motion.div className="mt-10 text-center" {...getMotionProps(0.2)}>
                     <CTAButton 
                         text="Ver mais depoimentos"
                         href="/depoimentos" 
                         variant="secondary" // Certifique-se que CTAButton suporta variantes ou passe classes
                     />
                 </motion.div>
             )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default InPractice;