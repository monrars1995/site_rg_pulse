// src/components/CalendarScheduler.tsx
import { FunctionComponent } from 'react';
import { motion } from 'framer-motion';
import { CalendarDaysIcon, ArrowRightIcon, ExternalLinkIcon as LinkIcon } from '@heroicons/react/24/outline'; // Usando LinkIcon para link externo

interface CalendarSchedulerProps {
  onScheduled: (details: { date: Date; time: string; notes?: string }) => void;
  externalScheduleLink?: string; // Ex: Link do Calendly
  userName?: string; // Para personalizar a mensagem ou pré-preencher no Calendly
  userEmail?: string; // Para pré-preencher no Calendly
}

const CalendarScheduler: FunctionComponent<CalendarSchedulerProps> = ({ 
  onScheduled, 
  externalScheduleLink,
  userName,
  userEmail 
}) => {

  // Constrói a URL do Calendly com parâmetros de pré-preenchimento
  const buildCalendlyUrl = () => {
    if (!externalScheduleLink) return undefined;
    try {
      const url = new URL(externalScheduleLink);
      if (userName) url.searchParams.set('name', userName);
      if (userEmail) url.searchParams.set('email', userEmail);
      // Adicione outros parâmetros se o Calendly suportar e você os tiver
      // url.searchParams.set('a1', customAnswer1); 
      return url.toString();
    } catch (e) {
      console.error("Invalid externalScheduleLink URL:", externalScheduleLink);
      return externalScheduleLink; // Retorna o original se houver erro
    }
  };

  const finalScheduleLink = buildCalendlyUrl();

  // Se um link externo (como Calendly) for fornecido, mostra o iframe ou um botão para ele
  if (finalScheduleLink) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Cabeçalho opcional */}
        <div className="p-6 border-b border-slate-200 text-center">
            <CalendarDaysIcon className="w-12 h-12 text-[#2A15EB] mx-auto mb-3"/>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Agende seu Diagnóstico</h2>
            <p className="text-sm text-slate-500 mt-1">Escolha o melhor dia e horário para nossa conversa estratégica.</p>
        </div>
        
        {/* Embed do Calendly */}
        {/* Ajuste min-height para a experiência ideal do Calendly */}
        <div className="flex-grow" style={{ minHeight: '600px' }}> 
          <iframe 
            src={finalScheduleLink}
            width="100%" 
            height="100%" 
            frameBorder="0"
            title="Agendamento de Diagnóstico Estratégico - RG Pulse"
            className="overflow-hidden"
          ></iframe>
        </div>
         <p className="p-4 text-xs text-center text-slate-400 border-t border-slate-200">
            Você será redirecionado para o Calendly para finalizar o agendamento.
        </p>
      </motion.div>
    );
  }

  // Placeholder se NÃO houver link externo (para um calendário customizado)
  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95, y:10 }}
        animate={{ opacity: 1, scale: 1, y:0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto border border-slate-200"
    >
        <CalendarDaysIcon className="w-16 h-16 text-[#2A15EB] mb-6" />
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Agende seu Diagnóstico</h2>
        <p className="text-slate-600 mb-8">
            Parabéns! Você foi pré-qualificado. Por favor, selecione o melhor dia e horário para nossa conversa estratégica.
        </p>
        
        <div className="my-8 p-6 bg-slate-100 rounded-lg w-full text-slate-500 italic text-sm">
            <p>Integração com seu sistema de calendário customizado apareceria aqui.</p>
            <p className="mt-2">Por exemplo, um seletor de datas e horários disponíveis.</p>
        </div>

        {/* Botão de exemplo para simular agendamento */}
        <button
            onClick={() => onScheduled({ date: new Date(), time: "14:00", notes: "Agendado via placeholder" })}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
        >
            Confirmar Agendamento (Exemplo) <ArrowRightIcon className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
    </motion.div>
  );
};

export default CalendarScheduler; // <<<<---- EXPORTAÇÃO PADRÃO AQUI