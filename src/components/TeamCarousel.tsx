import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi // Importando o tipo
} from "@/components/ui/carousel"; // Assumindo que este é o carrossel da shadcn/ui
import TeamMember from "./TeamMember"; // O componente que otimizamos antes
import React, { useEffect, useState, FunctionComponent } from 'react';
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"; // Ícones para botões

interface TeamMemberData {
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedinUrl?: string; // Adicionado da otimização do TeamMember
}

// Seus dados do time (teamData) - mantidos como no seu exemplo
const teamData: TeamMemberData[] = [
  { name: "Guilherme Moura", role: "Fundador & CEO", bio: "Guilherme se destaca por sua vasta experiência em gestão e processos. Sua liderança e abordagem integrada impulsionaram o crescimento de mais de 150 empresas.", image: "/uploads/time/Guilherme Moura.png", linkedinUrl: "#" },
  { name: "Vitor Hugo", role: "Especialista em Performance", bio: "Especialista em otimização de processos e sistemas operacionais, liderando equipes e garantindo a excelência na entrega de resultados para nossos clientes.", image: "/uploads/time/Vitor Hugo.png", linkedinUrl: "#" },
  { name: "Pedro Manssur", role: "Gestor de Performance", bio: "Profissional com ampla experiência em planejar e executar campanhas digitais de alto impacto e conversão, maximizando o ROI dos clientes.", image: "/uploads/time/Pedro Manssur.png", linkedinUrl: "#" },
  { name: "Douglas Medeiros", role: "Especialista em Performance", bio: "Especialista em coordenar equipes e garantir que todos os projetos sejam entregues com qualidade e dentro do prazo estabelecido.", image: "/uploads/time/Douglas Medeiros.png", linkedinUrl: "#" },
  { name: "Daiane Jung", role: "Head de Operação", bio: "Especialista em análise de dados e métricas, contribuindo para o desenvolvimento de estratégias baseadas em resultados.", image: "/uploads/time/Daiane Jung.png", linkedinUrl: "#" },
  { name: "Débora de Paula", role: "CS (Sucesso do Cliente)", bio: "Criativa e inovadora, responsável por desenvolver materiais visuais impactantes que fortalecem a presença digital das marcas.", image: "/uploads/time/Débora de Paula.png", linkedinUrl: "#" },
  { name: "Edsara Augustin", role: "CS (Sucesso do Cliente)", bio: "Especialista em análise e otimização de campanhas, focada em melhorar continuamente os resultados dos nossos clientes.", image: "/uploads/time/Edsara Augustin.png", linkedinUrl: "#" },
  { name: "Fernanda Martins", role: "CS (Sucesso do Cliente)", bio: "Responsável por criar e gerenciar conteúdos estratégicos que geram engajamento e conversão para as marcas.", image: "/uploads/time/Fernanda Martins.png", linkedinUrl: "#" },
  { name: "Gabriel Heitner", role: "Gestor de Automação", bio: "Especialista em desenvolvimento de soluções digitais que otimizam processos e melhoram a experiência do usuário.", image: "/uploads/time/Gabriel Heitner.png", linkedinUrl: "#" },
  { name: "Izabella Loren", role: "CS (Sucesso do Cliente)", bio: "Focada em desenvolver e implementar estratégias de relacionamento que fortalecem o vínculo com os clientes.", image: "/uploads/time/Izabella Loren.png", linkedinUrl: "#" },
  { name: "João Pedro", role: "Gestor de Performance", bio: "Profissional dedicado à otimização de sites e conteúdos para melhorar o posicionamento orgânico das marcas.", image: "/uploads/time/João Pedro.png", linkedinUrl: "#" },
  { name: "Lucas Gabriel", role: "Social Seller", bio: "Especialista em análise e interpretação de dados para tomada de decisões estratégicas baseadas em resultados.", image: "/uploads/time/Lucas Gabriel.png", linkedinUrl: "#" },
  { name: "Marcelo Rodrigues", role: "CS (Sucesso do Cliente)", bio: "Profissional experiente em consultoria estratégica, ajudando empresas a alcançarem seus objetivos de crescimento.", image: "/uploads/time/Marcelo Rodrigues.png", linkedinUrl: "#" },
  { name: "Mateus Camilo", role: "Gestor de Performance", bio: "Focado em desenvolver e implementar soluções de automação que otimizam processos e aumentam a eficiência.", image: "/uploads/time/Mateus Camilo.png", linkedinUrl: "#" },
  { name: "Pedro Rodrigues", role: "Gestor de Performance", bio: "Especialista em gerenciamento de redes sociais e desenvolvimento de estratégias de engajamento digital.", image: "/uploads/time/Pedro Rodrigues.png", linkedinUrl: "#" },
  { name: "Priscila Koller", role: "Gestora de Projetos", bio: "Profissional dedicada ao planejamento e execução de projetos, garantindo resultados efetivos para os clientes.", image: "/uploads/time/Priscila Koller.png", linkedinUrl: "#" },
  { name: "Ramon Ribeiro", role: "Gestor de Performance", bio: "Profissional com vasta experiência em vendas B2B e desenvolvimento de estratégias comerciais efetivas.", image: "/uploads/time/Ramon Ribeiro.png", linkedinUrl: "#" },
  { name: "Renata Jung", role: "Head de Operação", bio: "Especialista em estratégias digitais integradas que geram resultados mensuráveis para os negócios.", image: "/uploads/time/Renata Jung.png", linkedinUrl: "#" },
  { name: "Riquele Sesterhenn", role: "Gestor de Performance", bio: "Responsável por garantir a excelência e qualidade em todos os processos e entregas aos clientes.", image: "/uploads/time/Riquele Sesterhenn.png", linkedinUrl: "#" },
  { name: "Rodrigo Jung", role: "Head Financeiro", bio: "Líder em inovação tecnológica, responsável por implementar soluções que impulsionam o crescimento digital.", image: "/uploads/time/Rodrigo Jung.png", linkedinUrl: "#" },
  { name: "Roger Moraes", role: "Social Media", bio: "Focado em estratégias de crescimento acelerado e otimização de resultados para os clientes.", image: "/uploads/time/Roger Moraes.png", linkedinUrl: "#" },
  { name: "Yago Borges", role: "Gestor de CRM", bio: "Especialista em análise e otimização de campanhas digitais para maximizar o retorno sobre investimento.", image: "/uploads/time/Yago Borges.png", linkedinUrl: "#" },
  { name: "Íthalo de Marco", role: "Gestor de Performance", bio: "Profissional completo em desenvolvimento web, criando soluções tecnológicas inovadoras e eficientes.", image: "/uploads/time/Íthalo de Marco.png", linkedinUrl: "#" }
];


const TeamCarousel: FunctionComponent = () => { // Especificando tipo do componente
  const [api, setApi] = useState<CarouselApi | undefined>(); // Tipando api como opcional
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  
  // Criar o plugin autoplay usando useRef para manter a referência
  const autoplayPlugin = React.useRef(
    Autoplay({ 
      delay: 5000, // Aumentar um pouco o delay
      stopOnInteraction: true, 
      stopOnMouseEnter: true, // Pausar no hover
    })
  );

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateState = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);
    }
    
    updateState(); // Chamada inicial
    api.on("select", updateState); // Atualiza no evento 'select'
    api.on("reInit", updateState); // Atualiza ao reinicializar (ex: mudança de tamanho da janela)

    // Cleanup
    return () => {
      api.off("select", updateState);
      api.off("reInit", updateState);
    };
  }, [api]);

  const handleMouseEnter = () => {
    if (autoplayPlugin.current) {
      autoplayPlugin.current.stop();
    }
  };

  const handleMouseLeave = () => {
    if (autoplayPlugin.current) {
      autoplayPlugin.current.play();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Container com max-width e padding */}
      <Carousel
        opts={{
          align: "start",
          loop: true,
          // slidesToScroll: 'auto', // ou 1, dependendo do efeito desejado com diferentes basis
        }}
        plugins={[autoplayPlugin.current]}
        className="w-full relative group/carousel" // group/carousel para o hover dos botões
        setApi={setApi}
        onMouseEnter={handleMouseEnter} // Pausa autoplay no hover do carrossel
        onMouseLeave={handleMouseLeave} // Reinicia autoplay no mouse leave
      >
        <CarouselContent className="-ml-4 md:-ml-6"> {/* Ajuste de margem negativa */}
          {teamData.map((member, index) => (
            <CarouselItem key={index} className="pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 min-w-[300px] sm:min-w-0"> 
            {/* basis-full para mobile, depois ajusta. Adicionado min-w em mobile. */}
              <div className="p-1 h-full"> {/* Padding para criar gutter entre items */}
                <TeamMember
                  name={member.name}
                  role={member.role}
                  bio={member.bio}
                  image={member.image}
                  linkedinUrl={member.linkedinUrl}
                  className="h-full" // Garante que TeamMember ocupe a altura do CarouselItem
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navegação customizada (setas) */}
        <div className="absolute inset-y-0 -left-4 sm:-left-6 md:-left-8 flex items-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <CarouselPrevious className="bg-white/80 hover:bg-white text-slate-700 hover:text-[#2A15EB] shadow-lg border-none w-10 h-10 sm:w-12 sm:h-12 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2A15EB] focus-visible:ring-offset-2">
                <ChevronLeftIcon className="h-6 w-6"/>
            </CarouselPrevious>
        </div>
        <div className="absolute inset-y-0 -right-4 sm:-right-6 md:-right-8 flex items-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <CarouselNext className="bg-white/80 hover:bg-white text-slate-700 hover:text-[#2A15EB] shadow-lg border-none w-10 h-10 sm:w-12 sm:h-12 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2A15EB] focus-visible:ring-offset-2">
                <ChevronRightIcon className="h-6 w-6"/>
            </CarouselNext>
        </div>

      </Carousel>
      {/* Indicador de Posição e Dots (opcional, mas bom para UX) */}
      <div className="flex items-center justify-center gap-2 pt-6 md:pt-8">
            {/* <span className="text-sm font-medium text-slate-600">
             Membro {current} de {count}
            </span> */}
            {api && Array(count).fill(0).map((_, i) => (
                <button
                    key={i}
                    onClick={() => api.scrollTo(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ease-out
                                ${i === current - 1 ? 'bg-[#2A15EB] scale-125' : 'bg-slate-300 hover:bg-slate-400'}`}
                    aria-label={`Ir para slide ${i + 1}`}
                />
            ))}
        </div>
    </div>
  );
};

export default TeamCarousel;