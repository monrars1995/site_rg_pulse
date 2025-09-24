// src/components/CTAButton.tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FunctionComponent, ReactNode } from 'react';

interface CTAButtonProps {
  text: string;
  to?: string; // Para react-router Link (navegação interna)
  href?: string; // Para tag <a> (navegação externa ou âncoras)
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement | HTMLSpanElement>; // Para botões ou links que precisam de ação JS
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "green"; // Adicionada variante "green"
  size?: "small" | "medium" | "large";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  target?: string; // Para tag <a>
  rel?: string; // Para tag <a>
  disabled?: boolean;
  type?: "button" | "submit" | "reset"; // Especificamente para o elemento <button>
  'aria-label'?: string; // Exemplo
  // Para permitir passar qualquer outra prop HTML válida sem erro de tipo
  [key: string]: any; 
}

const CTAButton: FunctionComponent<CTAButtonProps> = ({
  text,
  to,
  href,
  onClick,
  className = '',
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  target,
  rel,
  disabled = false, // Default para false
  type = "button",  // Default type para button
  ...rest // Captura quaisquer outras props HTML ou de eventos
}) => {
  
  // --- Estilos Base ---
  const baseClasses = `
    inline-flex items-center justify-center 
    font-semibold rounded-xl /* Usando rounded-xl para consistência com StyledButton */
    transition-all duration-300 ease-out 
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  // --- Estilos de Tamanho ---
  let sizeClasses = "";
  switch (size) {
    case "small":
      sizeClasses = "px-5 py-2.5 text-sm"; // Ajustado para melhor proporção
      break;
    case "large":
      sizeClasses = "px-8 py-4 text-lg"; // Consistente com StyledButton
      break;
    default: // medium
      sizeClasses = "px-7 py-3 text-md"; // Ligeiramente maior que seu original (px-6 py-3)
  }

  // --- Estilos de Variante ---
  let variantClasses = "";
  switch (variant) {
    case "secondary": // Ideal para fundo claro
      variantClasses = `
        bg-white text-[#2A15EB] border-2 border-slate-300 
        hover:bg-slate-50 hover:border-[#2A15EB] hover:text-[#2A15EB]
        focus-visible:ring-[#2A15EB] shadow-sm hover:shadow-md
      `;
      break;
    case "outline": // Ideal para fundo escuro ou colorido
      variantClasses = `
        bg-transparent border-2 border-white text-white 
        hover:bg-white hover:text-[#2A15EB] 
        focus-visible:ring-white shadow-sm hover:shadow-md
      `;
      break;
    case "green": // Variante verde que você tinha
        variantClasses = `
          bg-green-500 text-white hover:bg-green-600 
          focus-visible:ring-green-500 shadow-md hover:shadow-lg
        `;
        break;
    default: // primary
      variantClasses = `
        bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#DE1CFB] text-white 
        hover:shadow-xl focus-visible:ring-[#05D7FB]
        bg-[length:200%_auto] hover:bg-[right_center] /* Animação sutil do gradiente */
      `;
      // A animação hover:from-[#05D7FB] hover:via-[#DE1CFB] hover:to-[#2A15EB]
      // é boa, mas hover:bg-[right_center] com background-size maior dá um slide effect. Teste!
  }

  const motionProps = {
    whileHover: { y: -2, scale: 1.03, transition: { type: "spring", stiffness: 350, damping: 15 } },
    whileTap: { y: 0, scale: 0.97, transition: { type: "spring", stiffness: 400, damping: 20 } },
  };

  const content = (
    <>
      {icon && iconPosition === "left" && <span className={`mr-2 ${size === 'small' ? '-ml-0.5' : '-ml-1'}`}>{icon}</span>}
      {text}
      {icon && iconPosition === "right" && <span className={`ml-2 ${size === 'small' ? '-mr-0.5' : '-mr-1'}`}>{icon}</span>}
    </>
  );

  const combinedClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`;

  if (to) { // Navegação interna com react-router-dom
    return (
      <Link to={to} 
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined} // onClick para Link
        className={combinedClasses} // Aplicando classes ao Link diretamente
        aria-disabled={disabled} // Para acessibilidade
        {...rest} // Outras props de Link, como 'state'
      >
        <motion.span 
            className="inline-flex items-center justify-center w-full h-full"
            {...(disabled ? {} : motionProps)} // Não aplica motionProps se desabilitado
        >
            {content}
        </motion.span>
      </Link>
    );
  }

  if (href) { // Navegação externa ou âncoras
    return (
      <motion.a
        href={href}
        target={target || "_blank"}
        rel={rel || (target === "_blank" ? "noopener noreferrer" : undefined)} // Adiciona noopener noreferrer por padrão para _blank
        className={combinedClasses}
        onClick={onClick}
        aria-disabled={disabled}
        {...(disabled ? {} : motionProps)}
        {...rest}
      >
        {content}
      </motion.a>
    );
  }

  // Botão padrão
  return (
    <motion.button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled}
      {...(disabled ? {} : motionProps)}
      {...rest}
    >
      {content}
    </motion.button>
  );
};

export default CTAButton;