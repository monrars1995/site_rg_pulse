// src/components/FloatingChatButton.tsx
import { FunctionComponent } from 'react';
import { motion } from 'framer-motion';
// Usaremos um ícone de chat do Heroicons
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid'; // Ícone de chat preenchido

interface FloatingChatButtonProps {
  onClick: () => void; // Função para abrir/fechar o chat
  className?: string;
  isOpen?: boolean; // Opcional, para mudar o ícone se o chat estiver aberto
}

const FloatingChatButton: FunctionComponent<FloatingChatButtonProps> = ({ 
  onClick,
  className = "",
  isOpen = false, // Default para ícone de abrir chat
}) => {

  return (
    <motion.button 
      type="button"
      onClick={onClick}
      className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-full p-3.5 md:p-4 shadow-xl z-[999] group
                  hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 ease-out
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 
                  ${className}`}
      aria-label={isOpen ? "Fechar chat" : "Abrir chat de suporte"}
      initial={{ scale: 0, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.7 // Um pouco mais de delay para o botão do chat
      }}
      whileHover={{ 
        scale: 1.1, 
        boxShadow: "0px 8px 20px rgba(0, 100, 255, 0.3)", // Sombra mais pronunciada no hover
        transition: { type: "spring", stiffness: 300, damping: 12 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { type: "spring", stiffness: 400, damping: 15 }
      }}
    >
      <motion.div
        key={isOpen ? 'close' : 'chat'} // Para animar a troca de ícone se necessário (não implementado aqui)
        initial={{ rotate: isOpen ? 0 : -10, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness:300, damping:15 }}
      >
        {/* Poderíamos trocar o ícone se isOpen fosse true, ex: XMarkIcon */}
        <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 md:h-8 md:h-8" />
      </motion.div>
    </motion.button>
  );
};

export default FloatingChatButton;