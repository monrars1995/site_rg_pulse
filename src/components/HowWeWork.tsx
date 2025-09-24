import { motion } from 'framer-motion';

const HowWeWork = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] bg-clip-text text-transparent">
            Como trabalhamos
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 transform hover:scale-105"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold ml-4 bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] bg-clip-text text-transparent">
                O que a nossa empresa vende?
              </h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                A RG Pulse vende uma assessoria em sistema de vendas que abrange marketing, comercial e pós-vendas.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Fornecemos uma abordagem holística e integrada que vai além dos métodos tradicionais de marketing digital.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Nosso foco está em otimizar e acelerar o crescimento das empresas no ambiente digital, garantindo que 
                cada aspecto do sistema de vendas seja eficaz e alinhado com os objetivos estratégicos dos nossos clientes.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 transform hover:scale-105"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#05D7FB] to-[#DE1CFB] flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold ml-4 bg-gradient-to-r from-[#05D7FB] to-[#DE1CFB] bg-clip-text text-transparent">
                Qual é a nossa solução?
              </h3>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-300">
                <h4 className="font-semibold text-gray-900 mb-2">Análise Completa</h4>
                <p className="text-gray-600">
                  Consultoria completa que analisa e melhora todas as etapas do funil de vendas.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-300">
                <h4 className="font-semibold text-gray-900 mb-2">Estratégias Personalizadas</h4>
                <p className="text-gray-600">
                  Utilizamos dados e análises para criar estratégias que incluem tráfego pago estratégico e otimização de conversão.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-300">
                <h4 className="font-semibold text-gray-900 mb-2">Resultados Comprovados</h4>
                <p className="text-gray-600">
                  Transformamos clientes em compradores recorrentes e promotores da marca, aumentando significativamente o ROI.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowWeWork;