import { motion, AnimatePresence } from 'framer-motion'; // Mantendo AnimatePresence por enquanto
import { useState, useEffect } from 'react';

// ... (interfaces FormData e DiagnosticoFormProps permanecem as mesmas) ...

interface FormData {
  fullName: string;
  companyName: string;
  role: string;
  segment: string;
  revenue: string;
  challenge: string;
  hasMarketingTeam: string;
  marketingTeamSize: string;
  marketingInvestment: string;
  monthlyTrafficInvestment: string;
  currentResults: string;
  phone: string;
  email: string;
}

interface DiagnosticoFormProps {
  onSubmit: (formData: FormData) => void;
}


const DiagnosticoForm = ({ onSubmit }: DiagnosticoFormProps) => {
  console.log("DiagnosticoForm rendering/mounted");

  const [formData, setFormData] = useState<FormData>({
    fullName: '', companyName: '', role: '', segment: '', revenue: '',
    challenge: '', hasMarketingTeam: '', marketingTeamSize: '', marketingInvestment: '',
    monthlyTrafficInvestment: '', currentResults: '', phone: '', email: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);

  const totalFormSteps = 3;

  useEffect(() => {
    console.log("useEffect for progress, currentStep:", currentStep);
    // Garante que o progresso inicial seja calculado corretamente para o step 1
    const newProgress = currentStep === 0 ? 0 : (currentStep / totalFormSteps) * 100;
    setProgress(newProgress);
    console.log("New progress:", newProgress);
  }, [currentStep, totalFormSteps]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isStepValid = () => {
    console.log("isStepValid called for step:", currentStep, "FormData:", formData);
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = !!(formData.fullName && formData.companyName && formData.role && formData.segment && formData.revenue);
        break;
      case 2:
        isValid = !!(formData.challenge && formData.hasMarketingTeam && (formData.hasMarketingTeam === 'nao' || formData.marketingTeamSize) && formData.marketingInvestment);
        break;
      case 3:
        isValid = !!(formData.monthlyTrafficInvestment && formData.currentResults && formData.phone && formData.email);
        break;
      default:
        isValid = false;
    }
    console.log("Step", currentStep, "is valid:", isValid);
    return isValid;
  };

  const handleNextStep = () => {
    console.log("handleNextStep called. Current step:", currentStep);
    if (isStepValid()) {
      if (currentStep < totalFormSteps) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
        console.log("Step not valid, cannot go next.");
        alert("Por favor, preencha todos os campos obrigatórios antes de avançar.");
    }
  };

  const handlePrevStep = () => {
    console.log("handlePrevStep called. Current step:", currentStep);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmitFormInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmitFormInternal called. Current step:", currentStep);
    if (currentStep === totalFormSteps && isStepValid()) {
      console.log("Submitting form data:", formData);
      
      // Salvar lead no Supabase
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002';
        const response = await fetch(`${backendUrl}/api/v1/diagnostic-leads/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Lead salvo com sucesso:', result.data);
        } else {
          console.warn('⚠️ Erro ao salvar lead:', result.message);
          // Continua com o fluxo mesmo se houver erro ao salvar
        }
      } catch (error) {
        console.error('❌ Erro ao conectar com API de leads:', error);
        // Continua com o fluxo mesmo se houver erro de conexão
      }
      
      // Continua com o fluxo original
      onSubmit(formData);
    } else {
      console.warn("Form submission failed: Not on final step or step not valid.");
      if (!isStepValid()) {
        alert("Por favor, preencha todos os campos obrigatórios para enviar.");
      }
    }
  };

  // Função para renderizar cada step individualmente
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0 }} // Simplificando animação
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Conteúdo da Etapa 1 como estava antes... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="fullName" className="block text-gray-700 font-medium mb-1.5 text-sm">Nome completo *</label>
                <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required />
              </div>
              <div>
                <label htmlFor="companyName" className="block text-gray-700 font-medium mb-1.5 text-sm">Nome da empresa *</label>
                <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="role" className="block text-gray-700 font-medium mb-1.5 text-sm">Cargo *</label>
                <input type="text" name="role" id="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required />
              </div>
              <div>
                <label htmlFor="segment" className="block text-gray-700 font-medium mb-1.5 text-sm">Segmento *</label>
                <select name="segment" id="segment" value={formData.segment} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required >
                  <option value="">Selecione</option>
                  <option value="tecnologia">Tecnologia</option> <option value="servicos">Serviços</option> <option value="varejo">Varejo</option> <option value="industria">Indústria</option> <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="revenue" className="block text-gray-700 font-medium mb-1.5 text-sm">Faturamento mensal *</label>
              <select name="revenue" id="revenue" value={formData.revenue} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required >
                <option value="">Selecione</option>
                <option value="ate50k">Até R$ 50 mil</option> <option value="50ka100k">R$ 50 mil a R$ 100 mil</option> <option value="100ka500k">R$ 100 mil a R$ 500 mil</option> <option value="500ka1m">R$ 500 mil a R$ 1 milhão</option> <option value="mais1m">Mais de R$ 1 milhão</option>
              </select>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Conteúdo da Etapa 2 como estava antes... */}
            <div>
              <label htmlFor="challenge" className="block text-gray-700 font-medium mb-1.5 text-sm">Qual seu principal desafio? *</label>
              <textarea name="challenge" id="challenge" value={formData.challenge} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" rows={3} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="hasMarketingTeam" className="block text-gray-700 font-medium mb-1.5 text-sm">Possui equipe de marketing? *</label>
                <select name="hasMarketingTeam" id="hasMarketingTeam" value={formData.hasMarketingTeam} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required >
                  <option value="">Selecione</option> <option value="sim">Sim</option> <option value="nao">Não</option>
                </select>
              </div>
              {formData.hasMarketingTeam === 'sim' && (
                <div>
                  <label htmlFor="marketingTeamSize" className="block text-gray-700 font-medium mb-1.5 text-sm">Tamanho da equipe de marketing *</label>
                  <select name="marketingTeamSize" id="marketingTeamSize" value={formData.marketingTeamSize} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required={formData.hasMarketingTeam === 'sim'}>
                    <option value="">Selecione</option> <option value="1-2">1-2 pessoas</option> <option value="3-5">3-5 pessoas</option> <option value="mais5">Mais de 5 pessoas</option>
                  </select>
                </div>
              )}
               {/* Para manter o layout consistente se "Não" for selecionado */}
              {formData.hasMarketingTeam !== 'sim' && <div className="hidden md:block"></div>} {/* Mudança aqui para ocultar se não for 'sim' */}
            </div>
            <div>
              <label htmlFor="marketingInvestment" className="block text-gray-700 font-medium mb-1.5 text-sm">Investimento atual em marketing *</label>
              <select name="marketingInvestment" id="marketingInvestment" value={formData.marketingInvestment} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required >
                <option value="">Selecione</option> <option value="ate5k">Até R$ 5 mil</option> <option value="5ka15k">R$ 5 mil a R$ 15 mil</option> <option value="15ka30k">R$ 15 mil a R$ 30 mil</option> <option value="mais30k">Mais de R$ 30 mil</option>
              </select>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Conteúdo da Etapa 3 como estava antes... */}
            <div>
              <label htmlFor="monthlyTrafficInvestment" className="block text-gray-700 font-medium mb-1.5 text-sm">Investimento mensal em tráfego pago *</label>
              <select name="monthlyTrafficInvestment" id="monthlyTrafficInvestment" value={formData.monthlyTrafficInvestment} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required>
                <option value="">Selecione</option> <option value="naoinvisto">Não invisto</option> <option value="ate3k">Até R$ 3 mil</option> <option value="3ka10k">R$ 3 mil a R$ 10 mil</option> <option value="10ka20k">R$ 10 mil a R$ 20 mil</option> <option value="mais20k">Mais de R$ 20 mil</option>
              </select>
            </div>
            <div>
              <label htmlFor="currentResults" className="block text-gray-700 font-medium mb-1.5 text-sm">Resultados atuais (se houver) e expectativas *</label>
              <textarea name="currentResults" id="currentResults" value={formData.currentResults} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" rows={3} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="phone" className="block text-gray-700 font-medium mb-1.5 text-sm">Telefone (com DDD) *</label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required placeholder="(XX) XXXXX-XXXX"/>
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-1.5 text-sm">Melhor e-mail para contato *</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all text-sm" required placeholder="seu@email.com" />
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmitFormInternal}
      className="bg-white rounded-xl shadow-xl p-6 sm:p-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      noValidate
    >
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <motion.div
            className="h-2.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" // Ajustado o gradiente
            initial={{ width: '0%' }} // Começa em 0% para animar a partir do zero
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.5 }}
          />
        </div>
        <div className="text-center text-sm text-gray-600">
          Etapa {currentStep} de {totalFormSteps}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {renderStepContent()}
      </AnimatePresence>

      <div className="mt-10 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4">
        {currentStep > 1 && (
          <motion.button
            type="button"
            onClick={handlePrevStep}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto px-6 py-2.5 text-[#4F46E5] font-semibold transition-colors rounded-lg border-2 border-[#E0E0E0] hover:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-opacity-50 text-sm"
          >
            Voltar
          </motion.button>
        )}
        {currentStep === 1 && <div className="w-full sm:w-auto order-1 sm:order-none"></div>}

        {currentStep < totalFormSteps && (
          <motion.button
            type="button"
            onClick={handleNextStep}
            disabled={!isStepValid()} // A desabilitação já ocorre, mas a lógica do onClick também valida
            whileHover={{ scale: 1.03,  opacity: isStepValid() ? 0.9 : 1 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full sm:w-auto order-first sm:order-last px-8 py-3 rounded-lg font-semibold transition-all text-sm shadow-md hover:shadow-lg ${
              isStepValid()
                ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Próximo
          </motion.button>
        )}

        {currentStep === totalFormSteps && (
          <motion.button
            type="submit" // Este é o único que submete o form
            disabled={!isStepValid()}
            whileHover={{ scale: 1.03, opacity: isStepValid() ? 0.9 : 1 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full sm:w-auto order-first sm:order-last px-8 py-3 rounded-lg font-semibold transition-all text-sm shadow-md hover:shadow-lg ${
              isStepValid()
                ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Enviar Diagnóstico
          </motion.button>
        )}
      </div>
      {!isStepValid() && currentStep === totalFormSteps && (
        <p className="text-xs text-red-500 mt-2 text-center">Preencha todos os campos obrigatórios para enviar.</p>
      )}
    </motion.form>
  );
};

export default DiagnosticoForm;