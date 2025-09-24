import React, { FunctionComponent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid'; // Usando ícones solid para mais destaque

interface VideoSectionProps {
  videoUrl?: string; // URL para o embed do YouTube (ex: https://www.youtube.com/embed/VIDEO_ID)
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string; // Pode ser um link externo ou uma âncora para um formulário na página
  thumbnailUrl?: string; // URL da imagem de thumbnail customizada
  sectionClassName?: string; // Classes adicionais para a seção
  titleClassName?: string;
  videoBoxShadow?: string; // Classe de sombra para o box do vídeo
  configKey?: 'home' | 'inpractice'; // Chave para buscar configuração do admin
}

interface VideoConfig {
  home_video_url: string;
  home_video_title: string;
  home_video_subtitle: string;
  home_video_cta_text: string;
  home_video_cta_href: string;
  inpractice_video_url: string;
  inpractice_video_title: string;
  inpractice_video_subtitle: string;
  inpractice_video_cta_text: string;
  inpractice_video_cta_href: string;
}

const VideoSection: FunctionComponent<VideoSectionProps> = ({ 
  videoUrl: propVideoUrl, 
  title: propTitle, 
  subtitle: propSubtitle, 
  ctaText: propCtaText, 
  ctaHref: propCtaHref, 
  thumbnailUrl,
  sectionClassName = "bg-gradient-to-b from-slate-50 via-white to-slate-100 py-16 md:py-24",
  titleClassName = "text-3xl md:text-4xl lg:text-5xl font-bold",
  videoBoxShadow = "shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(42,21,235,0.25)]",
  configKey
}) => {
  const [showVideo, setShowVideo] = useState(!thumbnailUrl); // Mostra vídeo direto se não houver thumbnail
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Busca configurações do admin se configKey for fornecida
  useEffect(() => {
    if (configKey) {
      setLoading(true);
      fetch('/api/v1/admin/video-config')
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Falha ao buscar configurações');
        })
        .then(data => {
          if (data.config) {
            setConfig(data.config);
          }
        })
        .catch(error => {
          console.error('Erro ao buscar configurações de vídeo:', error);
          // Define valores padrão quando a API falhar
          setConfig({
            home_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            home_video_title: 'Transforme Seu Negócio com IA',
            home_video_subtitle: 'Descubra como nossa solução pode revolucionar seus resultados',
            home_video_cta_text: 'Quero uma Consultoria Gratuita',
            home_video_cta_href: '#lead-form',
            inpractice_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            inpractice_video_title: 'Veja Nossa Metodologia em Ação',
            inpractice_video_subtitle: 'Cases reais de transformação digital',
            inpractice_video_cta_text: 'Agendar Demonstração',
            inpractice_video_cta_href: '#lead-form'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [configKey]);

  // Determina os valores a serem usados (props ou config do admin)
  const getConfigValue = (propValue: string | undefined, configValue: string | undefined): string => {
    return propValue || configValue || '';
  };

  // Valores padrão para quando não há configuração do admin
  const defaultValues = {
    home: {
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Transforme Seu Negócio com IA',
      subtitle: 'Descubra como nossa solução pode revolucionar seus resultados',
      ctaText: 'Quero uma Consultoria Gratuita',
      ctaHref: '#lead-form'
    },
    inpractice: {
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Veja Nossa Metodologia em Ação',
      subtitle: 'Cases reais de transformação digital',
      ctaText: 'Agendar Demonstração',
      ctaHref: '#lead-form'
    }
  };

  const videoUrl = configKey && config ? 
    (configKey === 'home' ? config.home_video_url : config.inpractice_video_url) : 
    propVideoUrl || (configKey ? defaultValues[configKey].videoUrl : '');
    
  const title = configKey && config ? 
    (configKey === 'home' ? config.home_video_title : config.inpractice_video_title) : 
    propTitle || (configKey ? defaultValues[configKey].title : '');
    
  const subtitle = configKey && config ? 
    (configKey === 'home' ? config.home_video_subtitle : config.inpractice_video_subtitle) : 
    propSubtitle || (configKey ? defaultValues[configKey].subtitle : '');
    
  const ctaText = configKey && config ? 
    (configKey === 'home' ? config.home_video_cta_text : config.inpractice_video_cta_text) : 
    propCtaText || (configKey ? defaultValues[configKey].ctaText : '');
    
  const ctaHref = configKey && config ? 
    (configKey === 'home' ? config.home_video_cta_href : config.inpractice_video_cta_href) : 
    propCtaHref || (configKey ? defaultValues[configKey].ctaHref : '');

  // Se está carregando, mostra um placeholder
  if (loading) {
    return (
      <section className={sectionClassName}>
        <div className="container mx-auto px-6 sm:px-8">
          <div className="text-center mb-10 md:mb-14">
            <div className="h-12 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse max-w-3xl mx-auto"></div>
          </div>
          <div className="max-w-4xl mx-auto bg-gray-200 rounded-2xl aspect-video animate-pulse"></div>
        </div>
      </section>
    );
  }

  // Se não tem dados suficientes, usa valores padrão
  if (!videoUrl && !title) {
    return null;
  }

  // Animações
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const handlePlayClick = () => {
    setShowVideo(true);
  };

  // Extrai o ID do vídeo para o link de "Assistir no YouTube"
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = getYouTubeVideoId(videoUrl);


  return (
    <section className={sectionClassName}>
      <div className="container mx-auto px-6 sm:px-8">
        <motion.div 
          className="text-center mb-10 md:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          <motion.h2 
            className={`${titleClassName} mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#7C3AED]`}
            variants={fadeInUp}
          >
            {title}
          </motion.h2>
          {subtitle && (
            <motion.p 
              className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>
        
        <motion.div 
          className={`max-w-4xl mx-auto bg-slate-800 rounded-2xl overflow-hidden 
                      ${videoBoxShadow} 
                      transform transition-all duration-300 ease-out hover:-translate-y-1.5`}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="aspect-video relative group">
            {showVideo ? (
              <iframe 
                src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`} // Parâmetros para melhor UX
                title="Video Player RG Pulse" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                loading="lazy"
              />
            ) : thumbnailUrl && (
              <>
                <img 
                    src={thumbnailUrl} 
                    alt={`Thumbnail para ${title}`} 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out group-hover:opacity-80"
                    loading="lazy"
                />
                <div 
                  className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center cursor-pointer"
                  onClick={handlePlayClick}
                >
                  <motion.div 
                    className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300"
                    whileHover={{ scale: 1.1, boxShadow: "0px 0px 20px rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlayCircleIcon className="w-16 h-16 md:w-20 md:h-20 text-white opacity-90 group-hover:opacity-100 transform group-hover:scale-105 transition-all duration-300" />
                  </motion.div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.div 
            className="text-center mt-10 md:mt-12"
            initial={{opacity:0, y:10}}
            whileInView={{opacity:1, y:0}}
            viewport={{once: true, amount: 0.5}}
            transition={{delay:0.2, duration:0.5}}
        >
          <a 
            href={ctaText === "Assistir no YouTube" && videoId ? `https://www.youtube.com/watch?v=${videoId}` : ctaHref} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center py-3 px-7 font-semibold text-md md:text-lg rounded-xl 
                       bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white 
                       transform transition-all duration-300 hover:scale-105 hover:shadow-xl 
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#05D7FB] group"
          >
            {ctaText === "Assistir no YouTube" && videoId ? "Assistir no YouTube" : ctaText}
            <ArrowRightIcon 
              className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" 
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;