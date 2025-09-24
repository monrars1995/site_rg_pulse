// src/components/LeadForm.tsx
import { useState, useEffect, ChangeEvent, FormEvent, FunctionComponent } from 'react';
import { X, Check, AlertCircle, ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  ramo: string;
  faturamento: string;
  site: string;
  instagram: string;
  linkedin: string;
}

interface LeadFormProps {
  isOpen: boolean; // <<<---- PROP isOpen REINTRODUZIDA AQUI
  onClose: () => void;
}

const totalSteps = 3;

const stepVariants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 50 : -50 }), // Direção para slide
  visible: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -50 : 50 }),
};
const stepTransition = { type: "spring", stiffness: 300, damping: 30, duration: 0.3 };


const LeadForm: FunctionComponent<LeadFormProps> = ({ isOpen, onClose }) => { // <<<---- isOpen AGORA É UMA PROP
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nome: '', email: '', telefone: '', empresa: '', ramo: '',
    faturamento: '', site: '', instagram: '', linkedin: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [direction, setDirection] = useState(1); // Direção padrão para primeira entrada do step

  // Resetar formulário quando ele é aberto (se isOpen mudar para true)
  // E limpar o status de submit ao fechar.
  useEffect(() => {
    if (isOpen) { // AGORA isOpen VEM DAS PROPS E FUNCIONA
        console.log("LeadForm isOpen effect: Resetting form state");
        setStep(1);
        setFormData({
            nome: '', email: '', telefone: '', empresa: '', ramo: '',
            faturamento: '', site: '', instagram: '', linkedin: ''
        });
        setErrors({});
        setSubmitStatus(null);
        setAttemptedNext({}); // Limpa tentativas
    } else {
        // Quando o formulário é fechado, podemos querer resetar o submitStatus também
        // para que não mostre a mensagem de sucesso/erro na próxima vez que abrir.
        // Isso já é feito pelo bloco 'if (isOpen)' quando reabre.
    }
  }, [isOpen]); // O useEffect depende de isOpen

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case 'nome':
        return value.trim().length < 3 ? 'Nome completo é obrigatório (mín. 3 caracteres).' : '';
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Formato de e-mail inválido.' : '';
      case 'telefone':
        return !/^\(?([1-9]{2})\)? ?(?:[2-8]|9[1-9])[0-9]{3}\-?[0-9]{4}$/.test(value.replace(/\D/g,'')) ? 'Telefone inválido (use (XX) XXXXX-XXXX).' : '';
      case 'empresa':
        return value.trim().length < 2 ? 'Nome da empresa é obrigatório.' : '';
      case 'ramo':
        return !value ? 'Segmento é obrigatório.' : '';
      case 'faturamento':
        return !value ? 'Faturamento é obrigatório.' : '';
      case 'site':
        return value && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*\/?$/.test(value) ? 'URL do site inválida.' : '';
      case 'instagram':
        return value && (value.startsWith('@') ? value.length < 2 : value.length < 1) ? 'Usuário do Instagram inválido.' : '';
      case 'linkedin':
        return value && !/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[\w\-_\.]+\/?$/.test(value) ? 'URL do LinkedIn inválida.' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as { name: keyof FormData, value: string };
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name] || attemptedNext[step]) {
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    }
  };
  
  const [attemptedNext, setAttemptedNext] = useState<{[key: number]: boolean}>({});

  const validateStep = (currentStepNum: number): boolean => {
    let isValid = true;
    const currentErrors: Partial<FormData> = {};
    const fieldsToValidate: (keyof FormData)[] = [];

    if (currentStepNum === 1) fieldsToValidate.push('nome', 'email', 'telefone');
    else if (currentStepNum === 2) fieldsToValidate.push('empresa', 'ramo', 'faturamento');
    
    fieldsToValidate.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) {
            currentErrors[field] = error;
            isValid = false;
        }
    });
    setErrors(prev => ({ ...prev, ...currentErrors })); // Atualiza todos os erros da etapa atual
    return isValid;
  };

  const handleNext = () => {
    setAttemptedNext(prev => ({...prev, [step]: true}));
    if (validateStep(step)) {
      if (step < totalSteps) {
        setDirection(1); 
        setStep(prev => prev + 1);
        // Não precisa resetar attemptedNext para o próximo step aqui,
        // a validação acontece ao clicar em próximo/enviar
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAttemptedNext(prev => ({...prev, [step]: true})); // step aqui é 3
    if (!validateStep(totalSteps)) { 
        return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // const response = await fetch('https://programa8.rgpulse.com.br/webhook-test/leads', {
      //   method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      // });

      // if (response.ok) { // SIMULANDO SUCESSO
      if (true) { // Sempre sucesso para teste
        setSubmitStatus('success');
        // O onClose e reset será chamado pela tela de sucesso ou após um timeout
        setTimeout(() => {
            onClose(); 
            // Reset do formulário movido para o useEffect ou após fechamento completo
        }, 2500); // Fecha após 2.5s da mensagem de sucesso
      } else {
        // const errorData = await response.json().catch(() => ({ message: "Falha ao enviar. Status: " + response.status }));
        // throw new Error(errorData.message || 'Falha ao enviar formulário');
        throw new Error('Falha simulada ao enviar formulário'); // Para teste
      }
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStepContent = (currentStepNum: number) => {
    const inputClass = (name: keyof FormData) => 
        `w-full px-4 py-3 border rounded-lg transition-all duration-200 text-sm 
         placeholder-slate-400 bg-slate-50/50 focus:bg-white
         ${errors[name] ? 'border-red-400 ring-1 ring-red-400 bg-red-50/50 focus:ring-red-500' 
                       : 'border-slate-300 focus:border-[#2A15EB] focus:ring-1 focus:ring-[#2A15EB]'}`;
    
    const errorMsg = (name: keyof FormData) => errors[name] && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {errors[name]}
        </motion.p>
    );

    switch(currentStepNum) {
        case 1: return (
            <div className="space-y-5">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
                  <input id="nome" type="text" name="nome" value={formData.nome} onChange={handleInputChange} onBlur={handleInputChange} className={inputClass('nome')} placeholder="Seu nome" required />
                  {errorMsg('nome')}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Seu Melhor E-mail *</label>
                  <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} onBlur={handleInputChange} className={inputClass('email')} placeholder="Ex: contato@suaempresa.com" required />
                  {errorMsg('email')}
                </div>
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-slate-700 mb-1">Telefone/WhatsApp *</label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 h-[46px] rounded-l-md border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-sm">
                      <img src="/br-flag.svg" alt="Brasil" className="w-5 h-4 mr-1.5" /> +55
                    </span>
                    <input id="telefone" type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} onBlur={handleInputChange} className={`${inputClass('telefone')} rounded-l-none`} placeholder="(XX) XXXXX-XXXX" required />
                  </div>
                  {errorMsg('telefone')}
                </div>
            </div>
        );
        case 2: return (
            <div className="space-y-5">
                <div>
                    <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa *</label>
                    <input id="empresa" type="text" name="empresa" value={formData.empresa} onChange={handleInputChange} onBlur={handleInputChange} className={inputClass('empresa')} placeholder="Nome da sua empresa" required />
                    {errorMsg('empresa')}
                </div>
                <div>
                    <label htmlFor="ramo" className="block text-sm font-medium text-slate-700 mb-1">Segmento de Atuação *</label>
                    <select id="ramo" name="ramo" value={formData.ramo} onChange={handleInputChange} onBlur={handleInputChange} className={inputClass('ramo')} required >
                        <option value="">Selecione o segmento</option>
                        <option value="tecnologia_software_saas">Tecnologia / Software / SaaS</option>
                        <option value="ecommerce_varejo_online">E-commerce / Varejo Online</option>
                        <option value="servicos_b2b">Serviços B2B (Consultoria, Agência, etc.)</option>
                        <option value="servicos_b2c">Serviços B2C (Saúde, Educação, Beleza, etc.)</option>
                        <option value="industria_fabricacao">Indústria / Fabricação</option>
                        <option value="imobiliario_construcao">Imobiliário / Construção</option>
                        <option value="franquias">Franquias</option>
                        <option value="agronegocio">Agronegócio</option>
                        <option value="outro">Outro</option>
                    </select>
                    {errorMsg('ramo')}
                </div>
                <div>
                    <label htmlFor="faturamento" className="block text-sm font-medium text-slate-700 mb-1">Faturamento Mensal Estimado *</label>
                    <select id="faturamento" name="faturamento" value={formData.faturamento} onChange={handleInputChange} onBlur={handleInputChange} className={inputClass('faturamento')} required >
                        <option value="">Selecione uma faixa</option>
                        <option value="ate_50k">Até R$ 50 mil</option>
                        <option value="50k_200k">R$ 50 mil a R$ 200 mil</option>
                        <option value="200k_500k">R$ 200 mil a R$ 500 mil</option>
                        <option value="500k_1M">R$ 500 mil a R$ 1 milhão</option>
                        <option value="acima_1M">Acima de R$ 1 milhão</option>
                        <option value="nda">Prefiro não informar no momento</option>
                    </select>
                     {errorMsg('faturamento')}
                </div>
            </div>
        );
        case 3: return (
            <div className="space-y-5">
                 <div>
                    <label htmlFor="site" className="block text-sm font-medium text-slate-700 mb-1">Website (opcional)</label>
                    <input id="site" type="url" name="site" value={formData.site} onChange={handleInputChange} onBlur={handleInputChange} className={inputClass('site')} placeholder="https://suaempresa.com.br" />
                    {errorMsg('site')}
                </div>
                 <div>
                    <label htmlFor="instagram" className="block text-sm font-medium text-slate-700 mb-1">Perfil do Instagram (opcional)</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm pointer-events-none">@</span> {/* pointer-events-none para permitir clique no input */}
                        <input id="instagram" type="text" name="instagram" value={formData.instagram} onChange={handleInputChange} onBlur={handleInputChange} className={`${inputClass('instagram')} pl-7`} placeholder="seuperfil" />
                    </div>
                    {errorMsg('instagram')}
                </div>
                 <div>
                    <label htmlFor="linkedin" className="block text-sm font-medium text-slate-700 mb-1">Página do LinkedIn (opcional)</label>
                    <input id="linkedin" type="url" name="linkedin" value={formData.linkedin} onChange={handleInputChange} onBlur={handleInputChange} className={inputClass('linkedin')} placeholder="linkedin.com/company/suaempresa" />
                    {errorMsg('linkedin')}
                </div>
            </div>
        );
        default: return null;
    }
  };

  return (
    <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-white shadow-2xl transform transition-all duration-300 ease-out">
        <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#2A15EB]"
            aria-label="Fechar formulário"
        >
            <X className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
            {submitStatus === 'success' ? (
                <motion.div 
                    key="success-message"
                    initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y:0 }} exit={{ opacity: 0, y:-10 }} transition={{duration:0.3, ease:"easeOut"}}
                    className="flex flex-col items-center justify-center py-10 text-center min-h-[380px]" // Min-height para consistência
                >
                    <motion.div 
                        initial={{scale:0}} animate={{scale:1}} transition={{delay:0.1, type:"spring", stiffness:200, damping:15}}
                        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 ring-4 ring-green-200"
                    >
                        <Check className="w-10 h-10 text-green-500" strokeWidth={3}/>
                    </motion.div>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">Enviado com Sucesso!</h2>
                    <p className="text-slate-600 mb-6">Obrigado pelo seu contato. Nossa equipe analisará suas informações e entrará em contato em breve.</p>
                </motion.div>
            ) : submitStatus === 'error' ? (
                <motion.div 
                    key="error-message"
                    initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y:0 }} exit={{ opacity: 0, y:-10 }} transition={{duration:0.3, ease:"easeOut"}}
                    className="flex flex-col items-center justify-center py-10 text-center min-h-[380px]"
                >
                    <motion.div 
                        initial={{scale:0}} animate={{scale:1}} transition={{delay:0.1, type:"spring", stiffness:200, damping:15}}
                        className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6 ring-4 ring-red-200"
                    >
                        <AlertCircle className="w-10 h-10 text-red-500" strokeWidth={2}/>
                    </motion.div>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">Ops! Algo deu errado.</h2>
                    <p className="text-slate-600 mb-6">Não foi possível enviar suas informações. Por favor, verifique sua conexão ou tente novamente mais tarde.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSubmitStatus(null)}
                            className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                        >
                            Tentar Novamente
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors text-sm"
                        >
                            Fechar
                        </button>
                    </div>
                </motion.div>
            ) : (
            <motion.div key="form-content"
                // As animações de entrada do formulário principal podem ser controladas pelo `motion.div` no Index.tsx
                // Se não, pode adicionar aqui: initial={{opacity:0}} animate={{opacity:1}}
            >
                <div className="mb-6 sm:mb-8">
                    <div className="flex justify-between items-center mb-1.5 px-1">
                        {['Contato', 'Empresa', 'Digital'].map((label, i) => (
                            <span key={i} className={`text-xs font-medium transition-colors ${step >= i + 1 ? 'text-[#2A15EB]' : 'text-slate-400'}`}>
                                {label}
                            </span>
                        ))}
                    </div>
                    <div className="relative w-full h-1.5 bg-slate-200 rounded-full">
                        <motion.div
                        className="absolute h-full bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] rounded-full"
                        initial={{ width: `${((1 - 1) / totalSteps) * 100}%` }} // Correção para iniciar em 0% para step 1
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                        transition={{ duration: 0.4, ease: 'circOut' }}
                        />
                    </div>
                </div>
                
                <motion.div className="mb-6 text-center" key={`header-${step}`} initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1, duration:0.3}}>
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-1">
                        {step === 1 && 'Suas Informações de Contato'}
                        {step === 2 && 'Sobre sua Empresa'}
                        {step === 3 && 'Sua Presença Digital (Opcional)'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {step === 1 && 'Precisamos destes dados para entrarmos em contato.'}
                        {step === 2 && 'Conte-nos um pouco sobre o seu negócio.'}
                        {step === 3 && 'Compartilhe seus canais para uma análise mais completa.'}
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <AnimatePresence mode="wait" initial={false} custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={stepTransition}
                            className="min-h-[300px] sm:min-h-[320px]" // Ajuste a altura mínima para os campos
                        >
                            {renderStepContent(step)}
                        </motion.div>
                    </AnimatePresence>

                    <div className={`flex mt-8 pt-6 border-t border-slate-200 ${step === 1 ? 'justify-end' : 'justify-between'}`}>
                        {step > 1 && (
                        <motion.button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </motion.button>
                        )}
                        {step < totalSteps ? (
                        <motion.button
                            type="button"
                            onClick={handleNext}
                            className="ml-auto px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm hover:shadow-md flex items-center gap-1.5"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Próximo <ArrowRight className="w-4 h-4" />
                        </motion.button>
                        ) : (
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            className={`ml-auto px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isSubmitting ? (
                                <> <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Enviando... </>
                            ) : (
                                <> <Send className="w-4 h-4 mr-1.5" /> Enviar Diagnóstico </>
                            )}
                        </motion.button>
                        )}
                    </div>
                </form>
            </motion.div>
            )} 
        </AnimatePresence>
    </div>
  );
};

export default LeadForm;