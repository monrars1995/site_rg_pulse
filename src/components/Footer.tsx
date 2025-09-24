// src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { FunctionComponent } from 'react';
import { motion } from 'framer-motion';

// Ícones Heroicons
import { 
    EnvelopeIcon, 
    PhoneIcon,
    DevicePhoneMobileIcon // Para WhatsApp na coluna de contato
} from '@heroicons/react/24/outline'; 

// Ícones Sociais (placeholders como antes, idealmente use react-icons ou SVGs como componentes)
const InstagramIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
const YouTubeIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
const WhatsAppSocialIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>;

const Footer: FunctionComponent = () => {
  const linkStyle = "text-slate-600 hover:text-[#2A15EB] transition-colors duration-200 text-base relative group after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[1.5px] after:bg-[#2A15EB] after:transition-all after:duration-300 group-hover:after:w-full";
  const socialIconStyle = "text-slate-500 hover:text-[#2A15EB] transition-all duration-300 transform hover:scale-110";

  return (
    <motion.footer 
        className="bg-gradient-to-b from-white via-slate-50 to-slate-100 py-16 md:py-20 border-t border-slate-200"
        initial={{ opacity: 0, y:20 }}
        whileInView={{ opacity: 1, y:0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-6 sm:px-8">
        {/* Conteúdo principal do Footer aqui, começando com o div de grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12">
          <div className="md:col-span-2 lg:col-span-1">
            <Link to="/" aria-label="Página Inicial RG Pulse">
                <img 
                src="/uploads/isotiporgpulse.png" 
                alt="RG Pulse Logo" 
                className="h-10 mb-5 transition-transform duration-300 hover:opacity-80"
                />
            </Link>
            <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-sm">
              Acelerando negócios no ambiente digital e tecnológico, com enfoque em otimizar sistema de vendas.
            </p>
            <div className="flex space-x-5">
              <a href="mailto:contato@rgpulse.com.br" className={socialIconStyle} aria-label="Email da RG Pulse">
                <EnvelopeIcon className="w-6 h-6" />
              </a>
              <a href="tel:+5548999555389" className={socialIconStyle} aria-label="Telefone da RG Pulse">
                <PhoneIcon className="w-6 h-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-5 text-slate-800">Navegação</h3>
            <ul className="space-y-3">
              <li><Link to="/" className={linkStyle}>Home</Link></li>
              <li><Link to="/o-que-fazemos" className={linkStyle}>O que fazemos</Link></li>
              <li><Link to="/na-pratica" className={linkStyle}>Na prática</Link></li>
              <li><Link to="/cases" className={linkStyle}>Cases de Sucesso</Link></li>
              <li><Link to="/blog" className={linkStyle}>Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-5 text-slate-800">Fale Conosco</h3>
            <ul className="space-y-3 text-base">
              <li className="flex items-start">
                <DevicePhoneMobileIcon className="w-5 h-5 text-[#2A15EB] mr-2.5 mt-0.5 flex-shrink-0" />
                <a 
                  href="https://wa.me/5548999555389" 
                  target="_blank" rel="noopener noreferrer" 
                  className={linkStyle}
                >
                  WhatsApp: +55 48 9955-5389
                </a>
              </li>
              <li className="flex items-start">
                <EnvelopeIcon className="w-5 h-5 text-[#2A15EB] mr-2.5 mt-0.5 flex-shrink-0" />
                <a href="mailto:contato@rgpulse.com.br" className={linkStyle}>
                  Email: contato@rgpulse.com.br
                </a>
              </li>
            </ul>
             <Link 
                to="/diagnostico"
                className="mt-6 inline-block px-6 py-2.5 bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
              >
                Diagnóstico Gratuito
              </Link>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-5 text-slate-800">Siga-nos</h3>
            <div className="flex space-x-4">
              <a href="https://instagram.com/rgpulse" target="_blank" rel="noopener noreferrer" className={socialIconStyle} aria-label="Instagram da RG Pulse">
                <InstagramIcon />
              </a>
              <a href="https://youtube.com/rgpulse" target="_blank" rel="noopener noreferrer" className={socialIconStyle} aria-label="YouTube da RG Pulse">
                <YouTubeIcon />
              </a>
              <a href="https://wa.me/5548999555389" target="_blank" rel="noopener noreferrer" className={socialIconStyle} aria-label="WhatsApp da RG Pulse">
                 <WhatsAppSocialIcon/>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-8 mt-8 text-center md:flex md:justify-between md:items-center">
          <p className="text-slate-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} RG Pulse. Todos os direitos reservados.
          </p>
          <Link to="/politica-de-privacidade" className="text-sm text-slate-500 hover:text-[#2A15EB] transition-colors duration-200">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;