
import { useState } from 'react';

const steps = [
  {
    title: "Marketing",
    description: "Estratégias de atração e qualificação de leads para seu negócio",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    )
  },
  {
    title: "Vendas",
    description: "Processos eficientes para converter leads em clientes satisfeitos",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Pós-Venda",
    description: "Retenção e fidelização que transformam clientes em promotores da marca",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>
    )
  }
];

const SalesProcess = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="my-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="w-full md:w-1/3">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`p-6 rounded-lg cursor-pointer transition-all duration-300 ${
                  activeStep === index 
                    ? 'bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white shadow-lg transform scale-105' 
                    : 'bg-white border border-gray-200 hover:border-rgblue'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-center space-x-4">
                  <div className={activeStep === index ? 'text-white' : 'text-rgblue'}>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{step.title}</h3>
                    <p className={`text-sm mt-1 ${activeStep === index ? 'text-white' : 'text-gray-600'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-full md:w-2/3 bg-white p-8 rounded-xl shadow-lg">
          {activeStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">Estratégias de Marketing Digital Eficientes</h3>
              <p className="text-gray-600">
                Nossas estratégias de marketing são projetadas para atrair leads qualificados para seu negócio. 
                Utilizamos uma combinação de tráfego pago, SEO, marketing de conteúdo e muito mais para garantir 
                que seu funil de vendas esteja sempre cheio com potenciais clientes interessados no que você oferece.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Tráfego Pago Estratégico</h4>
                  <p className="text-sm text-gray-600 mt-2">Campanhas otimizadas para maximizar o ROI em plataformas como Google Ads e Meta Ads.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Automação de Marketing</h4>
                  <p className="text-sm text-gray-600 mt-2">Fluxos automáticos que nutrem leads e os preparam para o processo de venda.</p>
                </div>
              </div>
            </div>
          )}
          
          {activeStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">Processos de Vendas Otimizados</h3>
              <p className="text-gray-600">
                Implementamos processos de vendas eficientes que aumentam significativamente suas taxas de conversão. 
                Nossa abordagem inclui scripts de vendas otimizados, treinamento da equipe comercial, e ferramentas 
                de gestão que tornam o processo de venda mais eficaz e previsível.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">CRM Personalizado</h4>
                  <p className="text-sm text-gray-600 mt-2">Sistemas de gestão de relacionamento adaptados às necessidades específicas do seu negócio.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Treinamento de Vendas</h4>
                  <p className="text-sm text-gray-600 mt-2">Capacitação da sua equipe com técnicas avançadas de vendas e negociação.</p>
                </div>
              </div>
            </div>
          )}
          
          {activeStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">Excelência em Pós-Venda</h3>
              <p className="text-gray-600">
                Nosso foco em pós-venda transforma clientes em promotores da sua marca. Desenvolvemos estratégias 
                de relacionamento contínuo, sistemas de suporte eficientes e programas de fidelidade que maximizam 
                o valor do cliente ao longo do tempo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Programas de Fidelidade</h4>
                  <p className="text-sm text-gray-600 mt-2">Estratégias para aumentar a retenção e maximizar o valor do ciclo de vida do cliente.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Feedback e Melhoria</h4>
                  <p className="text-sm text-gray-600 mt-2">Sistemas para coletar e implementar insights dos clientes, melhorando continuamente seu produto ou serviço.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesProcess;
