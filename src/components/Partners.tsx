import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css'; 
import 'slick-carousel/slick/slick-theme.css'; // Mantém o tema base se gostar das setas/dots padrão
import { FunctionComponent } from 'react'; // Para tipagem
import { motion } from 'framer-motion'; // Para animações de entrada da seção

// Estilos customizados para as setas do react-slick (se você quiser escondê-las ou estilizá-las)
// Você precisaria adicionar um arquivo CSS ou usar styled-components/Tailwind para aplicar estes.
// Exemplo:
// .partners-slider .slick-prev, .partners-slider .slick-next {
//   width: 30px;
//   height: 30px;
//   z-index: 1;
// }
// .partners-slider .slick-prev:before, .partners-slider .slick-next:before {
//   font-size: 30px;
//   color: #2A15EB; /* Cor da marca */
// }
// .partners-slider .slick-prev { left: -35px; }
// .partners-slider .slick-next { right: -35px; }
// Para esconder as setas:
// .partners-slider .slick-prev, .partners-slider .slick-next { display: none !important; }


interface Partner {
  name: string;
  logo: string;
  url?: string; // Opcional: link para o site do parceiro
}

const partnersData: Partner[] = [ // Renomeado para 'partnersData'
  { name: "Zoppy", logo: "/uploads/marcas/Logo-Zoppy.svg", url: "https://www.zoppy.com.br/" },
  { name: "Monday", logo: "/uploads/marcas/Logo-monday.com-2.png", url: "https://monday.com/" },
  { name: "Adstart", logo: "/uploads/marcas/adstart.svg", url: "#" }, // Adicionar URLs reais
  { name: "Dinamize", logo: "/uploads/marcas/dinamize.webp", url: "#" },
  { name: "Kommo", logo: "/uploads/marcas/kommo_logo.svg", url: "#" },
  { name: "BW Commerce", logo: "/uploads/marcas/logo-bw-commerce.png", url: "#" },
  { name: "Mailbiz", logo: "/uploads/marcas/mailbiz.png", url: "#" },
  { name: "Martz", logo: "/uploads/marcas/martz.png", url: "#" },
  { name: "RockFunnels", logo: "/uploads/marcas/rockfunnels.webp", url: "#" },
  { name: "Sellflux", logo: "/uploads/marcas/sellflux.png", url: "#" },
  // Adicione mais parceiros se necessário
];

const Partners: FunctionComponent = () => {
  const settings = {
    dots: false, // Geralmente não se usa dots para carrossel de logos infinito
    infinite: true,
    speed: 800, // Velocidade de transição mais suave
    slidesToShow: 6, // Padrão para telas grandes
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500, // Um pouco mais rápido para manter o movimento
    pauseOnHover: true,
    swipeToSlide: true, // Permite arrastar para mudar slides
    arrows: false, // Esconder setas padrão se o carrossel for contínuo e autoplay
    cssEase: 'linear', // Para um movimento de autoplay mais contínuo e suave
    responsive: [
      {
        breakpoint: 1280, // xl
        settings: {
          slidesToShow: 5,
        }
      },
      {
        breakpoint: 1024, // lg
        settings: {
          slidesToShow: 4,
        }
      },
      {
        breakpoint: 768, // md
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 640, // sm
        settings: {
          slidesToShow: 2,
          arrows: false, // Pode ser bom esconder setas em telas pequenas
        }
      }
    ]
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <motion.div 
        className="py-16 md:py-20 bg-slate-50" // Fundo ligeiramente diferente para a seção
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
    >
      <div className="container mx-auto px-4">
        <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-14 text-slate-800"
            variants={fadeInUp}
        >
            Nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] to-[#05D7FB]">Parceiros</span> de Confiança
        </motion.h2>
        
        {/* A classe 'partners-slider' pode ser usada para customizar as setas/dots via CSS se desejar */}
        <Slider {...settings} className="partners-slider"> 
          {partnersData.map((partner, index) => (
            <div key={index} className="px-3 sm:px-4 outline-none focus:outline-none"> {/* Padding entre os itens */}
              <motion.div 
                className="flex items-center justify-center p-4 h-28 md:h-32 bg-white rounded-lg shadow-md 
                           border border-slate-100 hover:shadow-lg transition-all duration-300 
                           transform hover:scale-105 group" // Adicionado group
                variants={fadeInUp} // Animação de entrada para cada card
              >
                <a 
                  href={partner.url || '#'} // Link para o site do parceiro
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Visitar site de ${partner.name}`}
                  className="flex items-center justify-center w-full h-full outline-none focus:outline-none"
                >
                  <img 
                    src={partner.logo} 
                    alt={`Logo ${partner.name}`} 
                    className="max-h-12 md:max-h-14 w-auto object-contain 
                               filter grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 
                               transition-all duration-300 ease-in-out"
                    loading="lazy" // Adicionado lazy loading
                  />
                </a>
              </motion.div>
            </div>
          ))}
        </Slider>
      </div>
    </motion.div>
  );
};

export default Partners;