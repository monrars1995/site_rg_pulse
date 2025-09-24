// src/pages/PrivacyPolicy.tsx
import { useEffect, FunctionComponent } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { motion } from 'framer-motion';

// Ícones opcionais para os títulos das seções (se quiser adicionar)
import {
  InformationCircleIcon, // Para Introdução ou Atualizações
  DocumentTextIcon,      // Para Coleta de Dados ou Uso
  ShieldCheckIcon,       // Para Proteção de Dados
  UserIcon,              // Para Seus Direitos
  EnvelopeIcon,          // Para Contato
  BookOpenIcon,           // Icone para o header da página
} from '@heroicons/react/24/outline';


// --- Definições de Animação (consistente com outras páginas) ---
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren, delayChildren } }
});

const applyMotionProps = (variants: any, delay: number = 0, amount: number = 0.1) => ({
  initial:"hidden",
  whileInView:"visible",
  viewport: { once: true, amount },
  variants,
  transition: { delay, ...variants.visible?.transition }
});
// --- Fim Definições de Animação ---


const PrivacyPolicy: FunctionComponent = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Estilo para seções
  const sectionStyle = "mb-10 md:mb-12 pb-8 border-b border-slate-200 last:border-b-0 last:pb-0 last:mb-0";
  const headingStyle = "text-2xl md:text-3xl font-semibold mb-4 text-slate-800 flex items-center";
  const paragraphStyle = "text-slate-600 mb-4 leading-relaxed text-base md:text-lg";
  const listStyle = "list-disc space-y-2 pl-6 text-slate-600 mb-4 text-base md:text-lg";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 antialiased selection:bg-[#2A15EB] selection:text-white">
      <Navbar />
      <WhatsAppButton onClick={() => {/* Ação do botão WhatsApp */}}/>
      
      <main className="flex-grow pt-20 md:pt-28 pb-16 md:pb-24"> {/* Aumentado padding top */}
        {/* Hero-like Header Section */}
        <motion.header 
            className="py-16 md:py-20 bg-gradient-to-b from-white via-sky-50 to-blue-100 text-slate-800 mb-12 md:mb-16 border-b border-slate-200"
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1, 0)}
        >
          <div className="container mx-auto px-6 sm:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div 
                className="inline-block mb-5 p-3.5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full shadow-lg"
                variants={fadeInUp}
                transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 12 }}
              >
                <BookOpenIcon className="w-10 h-10 text-[#2A15EB]" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight
                           text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#7C3AED]"
                variants={fadeInUp}
              >
                Política de Privacidade
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-slate-600"
                variants={fadeInUp}
              >
                Seu guia sobre como cuidamos da sua privacidade e dados na RG Pulse.
              </motion.p>
            </div>
          </div>
        </motion.header>

        <div className="container mx-auto px-6 sm:px-8">
          <motion.div 
            className="max-w-3xl mx-auto bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200"
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1, 0.3)} // Stagger para as seções internas
            >

            <section className={sectionStyle} {...applyMotionProps(fadeInUp, 0)}>
              <h2 className={headingStyle}>
                <InformationCircleIcon className="w-7 h-7 mr-3 text-[#2A15EB]" />
                1. Introdução
              </h2>
              <p className={paragraphStyle}>
                A RG Pulse ("nós", "nosso") está comprometida em proteger a privacidade e os dados pessoais de todos os usuários e clientes ("você", "seu") que interagem com nosso website, serviços e comunicações. Esta Política de Privacidade descreve de forma clara como coletamos, utilizamos, armazenamos, compartilhamos e protegemos suas informações pessoais. Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política.
              </p>
            </section>

            <section className={sectionStyle} {...applyMotionProps(fadeInUp, 0.1)}>
              <h2 className={headingStyle}>
                <DocumentTextIcon className="w-7 h-7 mr-3 text-[#2A15EB]" />
                2. Coleta de Dados Pessoais
              </h2>
              <p className={paragraphStyle}>
                Coletamos diferentes tipos de informações para diversos propósitos, visando sempre fornecer e melhorar nossos serviços para você. Os tipos de dados pessoais que podemos coletar incluem:
              </p>
              <ul className={listStyle}>
                <li><strong>Informações de Contato:</strong> Nome, endereço de e-mail, número de telefone, nome da empresa, cargo.</li>
                <li><strong>Dados de Navegação:</strong> Endereço IP, tipo e versão do navegador, páginas visitadas em nosso site, tempo gasto nessas páginas, horários de acesso e outros dados de diagnóstico através de cookies e tecnologias similares.</li>
                <li><strong>Informações Fornecidas Voluntariamente:</strong> Quaisquer dados que você nos fornece ao preencher formulários, participar de pesquisas, interagir com nosso suporte ou em comunicações diretas.</li>
                <li><strong>Informações de Terceiros:</strong> Poderemos receber informações sobre você de outras fontes, como parceiros de marketing ou plataformas de mídia social, se você interagir conosco através delas.</li>
              </ul>
              <p className={paragraphStyle}>
                A coleta ocorre quando você visita nosso website, se cadastra para receber nossa newsletter, preenche formulários de contato, solicita orçamentos, contrata nossos serviços, ou interage de qualquer outra forma com nossas plataformas digitais.
              </p>
            </section>

            <section className={sectionStyle} {...applyMotionProps(fadeInUp, 0.2)}>
              <h2 className={headingStyle}>
                <Cog6ToothIcon className="w-7 h-7 mr-3 text-[#2A15EB]" /> {/* Ícone diferente */}
                3. Uso das Suas Informações
              </h2>
              <p className={paragraphStyle}>
                As informações pessoais que coletamos são utilizadas para os seguintes propósitos:
              </p>
              <ul className={listStyle}>
                <li>Fornecer, operar e manter nossos serviços e website.</li>
                <li>Melhorar, personalizar e expandir nossos serviços e website.</li>
                <li>Entender e analisar como você utiliza nossos serviços e website.</li>
                <li>Desenvolver novos produtos, serviços, características e funcionalidades.</li>
                <li>Comunicar com você, diretamente ou através de um dos nossos parceiros, incluindo para atendimento ao cliente, para fornecer atualizações e outras informações relativas ao website, e para fins de marketing e promocionais (sempre com opção de opt-out).</li>
                <li>Processar suas transações e gerenciar seus pedidos.</li>
                <li>Enviar e-mails periódicos, como newsletters e informações sobre nossos serviços.</li>
                <li>Prevenir fraudes e garantir a segurança de nossas plataformas.</li>
                <li>Cumprir obrigações legais e regulatórias.</li>
              </ul>
            </section>

            <section className={sectionStyle} {...applyMotionProps(fadeInUp, 0.3)}>
              <h2 className={headingStyle}>
                <ShieldCheckIcon className="w-7 h-7 mr-3 text-[#2A15EB]" />
                4. Proteção e Segurança dos Dados
              </h2>
              <p className={paragraphStyle}>
                A segurança dos seus dados é de extrema importância para nós. Implementamos um conjunto de medidas de segurança técnicas, administrativas e físicas apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação, perda ou destruição. Estas medidas incluem, mas não se limitam a:
              </p>
              <ul className={listStyle}>
                <li>Criptografia de dados em trânsito e em repouso, quando aplicável.</li>
                <li>Controles de acesso rigorosos para limitar o acesso aos seus dados apenas a funcionários autorizados e que necessitam da informação para desempenhar suas funções.</li>
                <li>Monitoramento regular de nossos sistemas e infraestrutura para detectar vulnerabilidades e potenciais ameaças.</li>
                <li>Políticas internas de segurança da informação e treinamento para nossos colaboradores.</li>
              </ul>
              <p className={paragraphStyle}>
                Apesar de nossos esforços, nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro. Portanto, embora nos esforcemos para usar meios comercialmente aceitáveis para proteger suas informações pessoais, não podemos garantir sua segurança absoluta.
              </p>
            </section>

            <section className={sectionStyle} {...applyMotionProps(fadeInUp, 0.4)}>
              <h2 className={headingStyle}>
                <UserIcon className="w-7 h-7 mr-3 text-[#2A15EB]" />
                5. Seus Direitos de Privacidade
              </h2>
              <p className={paragraphStyle}>
                De acordo com a legislação aplicável, como a Lei Geral de Proteção de Dados (LGPD) no Brasil, você possui diversos direitos em relação aos seus dados pessoais. Estes incluem:
              </p>
              <ul className={listStyle}>
                <li><strong>Direito de Acesso:</strong> Solicitar uma cópia dos dados pessoais que temos sobre você.</li>
                <li><strong>Direito de Retificação:</strong> Solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
                <li><strong>Direito de Exclusão (ou "Direito ao Esquecimento"):</strong> Solicitar a exclusão de seus dados pessoais de nossos bancos de dados, observadas as exceções legais.</li>
                <li><strong>Direito de Oposição:</strong> Opor-se ao tratamento de seus dados pessoais em determinadas situações.</li>
                <li><strong>Direito à Portabilidade:</strong> Solicitar a transferência de seus dados pessoais para outro fornecedor de serviço ou produto.</li>
                <li><strong>Direito de Revogação do Consentimento:</strong> Retirar seu consentimento para o tratamento de dados a qualquer momento, quando o tratamento for baseado em consentimento.</li>
                <li><strong>Direito de Não Ser Sujeito a Decisões Automatizadas:</strong> Solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais que afetem seus interesses.</li>
              </ul>
              <p className={paragraphStyle}>
                Para exercer qualquer um desses direitos, entre em contato conosco através dos canais informados na seção "Contato".
              </p>
            </section>
            
            <section className={sectionStyle} {...applyMotionProps(fadeInUp, 0.5)}>
              <h2 className={headingStyle}>
                <EnvelopeIcon className="w-7 h-7 mr-3 text-[#2A15EB]" />
                6. Informações de Contato
              </h2>
              <p className={paragraphStyle}>
                Se você tiver alguma dúvida sobre esta Política de Privacidade, sobre como tratamos seus dados pessoais, ou se desejar exercer seus direitos, por favor, entre em contato conosco:
              </p>
              <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                <p className="text-slate-700 mb-2">
                  <strong>RG Pulse - Consultoria e Marketing</strong>
                </p>
                <p className={paragraphStyle.replace("mb-4", "mb-2")}> {/* Ajustando margem */}
                  <strong>E-mail:</strong>{' '}
                  <a href="mailto:contato@rgpulse.com.br" className="text-[#2A15EB] hover:text-[#05D7FB] transition-colors">
                    contato@rgpulse.com.br
                  </a>
                </p>
                <p className={paragraphStyle.replace("mb-4", "mb-0")}>
                  <strong>WhatsApp:</strong>{' '}
                  <a 
                    href="https://wa.me/5548999555389?text=Ol%C3%A1%2C%20tenho%20uma%20dúvida%20sobre%20a%20Política%20de%20Privacidade." 
                    className="text-[#2A15EB] hover:text-[#05D7FB] transition-colors"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    +55 48 99955-5389
                  </a>
                </p>
                {/* Adicionar endereço físico se relevante */}
              </div>
            </section>

            <motion.section {...applyMotionProps(fadeInUp, 0.6)} className="mb-0 pb-0"> {/* mb-0 pb-0 para a última seção */}
              <h2 className={headingStyle}>
                <InformationCircleIcon className="w-7 h-7 mr-3 text-[#2A15EB]" />
                7. Atualizações da Política
              </h2>
              <p className={paragraphStyle}>
                Reservamo-nos o direito de modificar esta Política de Privacidade a qualquer momento. Quaisquer alterações entrarão em vigor imediatamente após a publicação da política revisada em nosso website. Recomendamos que você revise esta página periodicamente para se manter informado sobre como protegemos suas informações.
              </p>
              <p className={`${paragraphStyle} text-sm text-slate-500`}>
                Data da última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </motion.section>
            </div> {/* Fim do div com classe prose */}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;