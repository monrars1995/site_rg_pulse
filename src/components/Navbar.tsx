// src/components/Navbar.tsx
import { useState, useEffect, FunctionComponent } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu as MenuIcon, X as XIcon } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'O que fazemos', path: '/o-que-fazemos' },
  { name: 'Na prática', path: '/na-pratica' },
  { name: 'Cases', path: '/cases' },
  { name: 'Anna', path: '/anna' }, // Adicionando Anna aos itens de navegação se ainda não estiver
  { name: 'Blog', path: '/blog' },
];

// --- ANIMAÇÕES ---
const fadeInUp = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};
const staggerContainer = (staggerChildren = 0.05, delayChildren = 0) => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren, delayChildren }
    }
});
const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeOut", when: "afterChildren" } },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: "easeIn", when: "beforeChildren" } }
};
const navItemMobileVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } }
};
// --- FIM ANIMAÇÕES ---

const Navbar: FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  if (location.pathname === '/diagnostico') {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isOpen) setIsOpen(false);
  }, [location.pathname, isOpen]); // Adicionado isOpen à dependência

  // --- DEFINIÇÃO DE heroTopIsLight ---
  const pagesWithLightHeroTop = ['/', '/o-que-fazemos', '/na-pratica', '/cases', '/blog', '/anna']; // '/anna' ADICIONADO
  const isCurrentPageHeroLight = pagesWithLightHeroTop.includes(location.pathname);
  const heroTopIsLight = true; // Sempre true para manter consistência visual

  const navLinkInactiveColor = "text-slate-700 hover:text-[#2A15EB]";
  const activeColor = "text-[#2A15EB]";

  const getNavLinkClasses = ({ isActive }: { isActive: boolean }): string => {
    const baseClasses = "px-1 py-2 text-md font-medium transition-colors duration-200 relative group";
    return isActive ? `${baseClasses} ${activeColor}` : `${baseClasses} ${navLinkInactiveColor}`;
  };
  // --- FIM DAS DEFINIÇÕES DE ESTILO CONDICIONAL ---
  
  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `block py-3.5 px-4 text-md transition-colors duration-200 rounded-md
     ${isActive ? 'bg-[#2A15EB] text-white font-semibold' : 'text-slate-700 hover:bg-slate-100 hover:text-[#2A15EB]'}`;

  const logoFilterClass = ""; // Sempre visível sem filtros

  const buttonDiagnosticClasses = `px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ease-out shadow-md hover:shadow-lg active:scale-95 transform hover:-translate-y-0.5 bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white hover:opacity-90`;
  
  const mobileIconColorClasses = 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500';

  return (
    <motion.nav 
      className={`fixed top-0 left-0 w-full z-40 transition-shadow duration-300 ease-out
                  ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/90 backdrop-blur-sm shadow-md'}`}
      initial={false}
      animate={{ 
        paddingTop: scrolled ? '0.6rem' : '1rem',
        paddingBottom: scrolled ? '0.6rem' : '1rem',
      }}
      transition={{ duration: 0.2, ease: "circOut" }}
    >
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2A15EB] rounded-sm" onClick={() => isOpen && setIsOpen(false)}>
            <img 
              alt="RG Pulse Logo" 
              className={`h-12 md:h-14 w-auto transition-all duration-300 ${logoFilterClass}`}
              src="/lovable-uploads/2090b567-4c0a-4dd3-9c17-e129d38841c5.png"
            />
          </Link>

          <motion.ul
            className="hidden md:flex items-center space-x-5 lg:space-x-7"
            variants={staggerContainer(0.07, 0.1)}
            initial="hidden"
            animate="visible"
          >
            {navItems.map((item) => (
              <motion.li key={item.name} variants={fadeInUp} className="relative">
                <NavLink 
                  to={item.path} 
                  className={getNavLinkClasses}
                >
                  {item.name}
                  {location.pathname === item.path && (
                    <motion.div
                      className="absolute -bottom-0.5 left-0 right-0 h-[3px] bg-[#2A15EB]"
                      layoutId="active-nav-underline"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="absolute -bottom-0.5 left-0 w-full h-[3px] bg-slate-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-left"/>
                </NavLink>
              </motion.li>
            ))}
            <motion.li variants={fadeInUp}>
              <Link 
                to="/diagnostico" 
                className={buttonDiagnosticClasses}
              >
                Diagnóstico Gratuito
              </Link>
            </motion.li>
          </motion.ul>

          <div className="md:hidden">
            <motion.button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${mobileIconColorClasses}`}
                aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
                whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={isOpen ? "x-icon-mobile" : "menu-icon-mobile"}
                  initial={{ rotate: -90, opacity:0, scale:0.8 }}
                  animate={{ rotate: 0, opacity:1, scale:1 }}
                  exit={{ rotate: 90, opacity:0, scale:0.8 }}
                  transition={{ duration: 0.2, ease:"circOut" }}
                >
                  {isOpen ? <XIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
            {isOpen && (
            <motion.div 
                key="mobile-menu-panel"
                className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-lg border-t border-slate-100 overflow-y-auto max-h-[calc(100vh-4.5rem)]"
                variants={mobileMenuVariants}
                initial="closed"
                animate="open"
                exit="closed"
            >
                <motion.ul variants={staggerContainer(0.07, 0.1)} className="py-3 px-2 space-y-1">
                    {navItems.map((item) => (
                        <motion.li key={item.name} variants={navItemMobileVariants}>
                            <NavLink 
                                to={item.path} 
                                className={mobileNavLinkClasses} 
                                onClick={() => setIsOpen(false)}
                            >
                            {item.name}
                            </NavLink>
                        </motion.li>
                    ))}
                    <motion.li variants={navItemMobileVariants} className="pt-3 px-2">
                        <Link 
                            to="/diagnostico" 
                            className="block w-full text-center py-3 px-4 bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white rounded-lg font-semibold text-md hover:opacity-90 transition-opacity shadow-md active:scale-95" 
                            onClick={() => setIsOpen(false)}
                        >
                        Diagnóstico Gratuito
                        </Link>
                    </motion.li>
                </motion.ul>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;