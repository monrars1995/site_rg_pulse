import { FunctionComponent } from 'react';
import { motion } from 'framer-motion'; // Para animações mais ricas, se desejar

interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedinUrl?: string; // Opcional: link para o LinkedIn
  className?: string; // Para permitir classes customizadas
}

const TeamMember: FunctionComponent<TeamMemberProps> = ({ name, role, bio, image, linkedinUrl, className = "" }) => {
  return (
    <motion.div 
      className={`bg-white rounded-xl overflow-hidden shadow-lg group flex flex-col h-full ${className}`} // h-full para cards de mesma altura em um grid
      whileHover={{ y: -4, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1), 0 6px 12px -6px rgba(0,0,0,0.07)" }} // Efeito de "levantar" e sombra mais pronunciada
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Barra de Gradiente Decorativa */}
      <div className="h-1.5 bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#DE1CFB] group-hover:opacity-80 transition-opacity duration-300"></div>
      
      <div className="aspect-[4/5] relative overflow-hidden"> {/* Proporção mais comum para retratos */}
        <img 
          src={image} 
          alt={`Foto de ${name}, ${role} na RG Pulse`} // Texto alt mais descritivo
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" // object-cover pode ser melhor para retratos
          // loading="lazy" // Para otimizar o carregamento de imagens
        />
        {/* Opcional: Overlay sutil na imagem para adicionar profundidade ou contraste para texto sobreposto (não aplicável aqui) */}
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> */}
      </div>
      
      <div className="p-5 md:p-6 flex flex-col flex-grow"> {/* flex-grow para que esta parte expanda se necessário */}
        <h3 className="text-xl lg:text-2xl font-bold mb-1 text-slate-800 group-hover:text-[#2A15EB] transition-colors duration-300">
          {name}
        </h3>
        <p className="text-sm font-semibold text-[#2A15EB] mb-3 uppercase tracking-wider"> {/* Estilo mais forte para o cargo */}
          {role}
        </p>
        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow"> {/* line-clamp e flex-grow */}
          {bio}
        </p>
        
        {/* Opcional: Link para LinkedIn */}
        {linkedinUrl && (
          <a 
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center text-xs text-slate-500 hover:text-[#2A15EB] transition-colors group"
            aria-label={`Perfil de ${name} no LinkedIn`}
          >
            Ver perfil no LinkedIn
            <svg className="w-3 h-3 ml-1.5 transform transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default TeamMember;