import { ReactNode, FunctionComponent } from 'react';
import { motion } from 'framer-motion'; // Importar para animações opcionais mais ricas

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string; // Para customização externa
  // Opcional: para quando o card for um link
  href?: string; 
  target?: string;
  rel?: string;
}

const ServiceCard: FunctionComponent<ServiceCardProps> = ({ 
  title, 
  description, 
  icon, 
  className = "",
  href,
  target,
  rel
}) => {

  const cardContent = (
    <>
      {/* Barra superior decorativa com animação */}
      <motion.div 
        className="h-1.5 bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#DE1CFB]"
        // Animação da altura da barra com framer-motion
        // (A alternativa Tailwind com group-hover:h-3 já é boa)
        // variants={{ rest: { height: "6px" }, hover: { height: "10px" } }}
        // transition={{ duration: 0.3, ease: "circOut" }}
      />
      <div className="p-6 md:p-8 flex flex-col items-center text-center flex-grow"> {/* flex-grow e items-center/text-center */}
        <motion.div 
          className="text-[#2A15EB] mb-5 p-3 bg-slate-100/70 rounded-full group-hover:bg-white transition-colors duration-300"
          // Animação do ícone
          variants={{
            rest: { scale: 1, rotate: 0 },
            hover: { scale: 1.15, rotate: -3, 
                     transition: { type: "spring", stiffness: 300, damping: 15 } 
                   }
          }}
        >
          {/* Ícone agora está centralizado e com um fundo */}
          {icon} 
        </motion.div>
        <motion.h3 
          className="text-xl lg:text-2xl font-semibold mb-3 text-slate-800 group-hover:text-white transition-colors duration-300"
          // variants={{ rest: { color: "#1e293b" }, hover: { color: "#ffffff" } }} // slate-800
          // transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h3>
        <motion.p 
          className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-100 transition-colors duration-300 line-clamp-4" // line-clamp se quiser limitar descrição
          // variants={{ rest: { color: "#475569" }, hover: { color: "#f1f5f9" } }} // slate-600, slate-100
          // transition={{ duration: 0.3 }}
        >
          {description}
        </motion.p>
      </div>
    </>
  );

  const commonClasses = `
    bg-white rounded-2xl overflow-hidden shadow-lg 
    transition-all duration-300 ease-out 
    group cursor-pointer h-full flex flex-col 
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2A15EB]
    hover:shadow-xl hover:-translate-y-1
    hover:bg-gradient-to-br hover:from-[#2A15EB] hover:to-[#05D7FB] 
    ${className}
  `;
  // hover:bg-gradient-to-br de azul para ciano (cores da marca)


  if (href) {
    return (
      <motion.a
        href={href}
        target={target || "_blank"}
        rel={rel || "noopener noreferrer"}
        className={commonClasses}
        initial="rest" // Estado inicial para variantes
        whileHover="hover" // Estado no hover para variantes
        variants={{ // Variantes para a animação do card como um todo se desejar
            rest: { scale: 1 },
            hover: { scale: 1.03, y:-4 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {cardContent}
      </motion.a>
    );
  }

  return (
    <motion.div
      className={commonClasses}
      initial="rest"
      whileHover="hover"
      variants={{
        rest: { scale: 1 },
        hover: { scale: 1.03, y:-4 }
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {cardContent}
    </motion.div>
  );
};

export default ServiceCard;