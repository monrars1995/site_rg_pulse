// src/config/quizConfig.tsx
import React from 'react';
import {
    UserIcon,
    BuildingOffice2Icon,
    ArrowTrendingUpIcon,
    HandThumbUpIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

// --- Tipos ---
export interface QuizFormData {
  nomeCompleto: string; email: string; whatsapp: string; nomeEmpresa: string;
  cargo: string; outroCargo?: string; segmento: string; outroSegmento?: string;
  faturamento: string; desafioPrincipal: string; outroDesafio?: string;
  investimentoMarketing: string; processoComercial: string; urgencia: string;
  abertoPlano: string; site?: string; instagram?: string;
}
export interface QuizStepFieldOption { value: string; label: string; icon?: React.ReactNode;}
export interface QuizQuestion {
    id: keyof QuizFormData;
    questionText: string;
    subtitle?: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'radio';
    options?: QuizStepFieldOption[];
    placeholder?: string;
    required?: boolean | ((formData: QuizFormData) => boolean);
    conditionalDisplay?: (formData: QuizFormData) => boolean;
    columnsForOptions?: 1 | 2 | 3;
    icon?: React.ReactNode;
}
export interface QuizSubmissionResponse { success: boolean; qualified?: boolean; message?: string; scheduleLink?: string;}

// --- Configuração das Perguntas ---
export const quizQuestionsConfig: QuizQuestion[] = [
  { id: "nomeCompleto", type: "text", questionText: "Para começar, qual é o seu nome completo?", placeholder: "Ex: Patrícia Lemos", required: true, subtitle:"Nos diga como podemos te chamar.", icon: <UserIcon className="w-5 h-5 text-slate-400"/> },
  { id: "email", type: "email", questionText: "E o seu melhor e-mail comercial?", placeholder: "patricia.lemos@empresa.com", required: true, subtitle:"Usaremos para enviar seu diagnóstico e informações importantes.", icon: <UserIcon className="w-5 h-5 text-slate-400"/> },
  { id: "whatsapp", type: "tel", questionText: "Seu WhatsApp (com DDD)", placeholder: "(XX) 9XXXX-XXXX", required: true, subtitle:"Para um contato mais ágil, se necessário.", icon: <UserIcon className="w-5 h-5 text-slate-400"/> },
  { id: "nomeEmpresa", type: "text", questionText: "Qual o nome da sua empresa?", placeholder: "Ex: Tech Solutions Inc.", required: true, subtitle:"Queremos conhecer o seu negócio.", icon: <BuildingOffice2Icon className="w-5 h-5 text-slate-400"/>},
  { id: "cargo", type: "radio", questionText: "Sua posição na empresa?", options: [ {value:"Dono(a) / Fundador(a)", label:"Dono(a) / Fundador(a)"}, {value:"Sócio(a) / Diretor(a)", label:"Sócio(a) / Diretor(a)"}, {value:"Gestor(a) Marketing/Vendas", label:"Gestor(a) Marketing/Vendas"}, {value:"Colaborador(a) Estratégico", label:"Colaborador(a) Estratégico"}, {value:"Outro", label:"Outro"} ], required: true, columnsForOptions: 1, subtitle:"Para entendermos seu papel.", icon: <BuildingOffice2Icon className="w-5 h-5 text-slate-400"/>},
  { id: "outroCargo", type: "text", questionText: "Por favor, especifique sua posição:", placeholder: "Ex: Head de Inovação", conditionalDisplay: (fd) => fd.cargo === "Outro", required: (fd) => fd.cargo === "Outro", icon: <BuildingOffice2Icon className="w-5 h-5 text-slate-400"/>},
  { id: "segmento", type: "radio", questionText: "Em qual segmento sua empresa atua?", columnsForOptions: 2, options: [ {value:"Serviços Locais", label:"Serviços Locais"}, {value:"E-commerce", label:"E-commerce"}, {value:"Saúde (Clínica, Pet)", label:"Saúde (Clínica, Pet)"}, {value:"Imobiliária", label:"Imobiliária"},{value:"Indústria / Fabricação", label:"Indústria / Fabricação"},{value:"Educação / Consultoria", label:"Educação / Consultoria"},{value:"Agência / Marketing", label:"Agência / Marketing"}, {value:"Negócio Digital", label:"Negócio Digital (Info, SaaS)"}, {value:"Outro", label:"Outro"} ], required: true, subtitle:"Para entendermos seu mercado.", icon: <BuildingOffice2Icon className="w-5 h-5 text-slate-400"/> },
  { id: "outroSegmento", type: "text", questionText: "Qual o seu segmento?", placeholder: "Ex: Consultoria Financeira B2B", conditionalDisplay: (fd) => fd.segmento === "Outro", required: (fd) => fd.segmento === "Outro", icon: <BuildingOffice2Icon className="w-5 h-5 text-slate-400"/>},
  { id: "faturamento", type: "radio", questionText: "Faturamento médio mensal?", columnsForOptions:1, options: [ {value:"Até R$ 50 mil", label:"Até R$ 50 mil"}, {value:"R$ 50 mil a R$ 150 mil", label:"R$ 50 mil a R$ 150 mil"}, {value:"R$ 150 mil a R$ 500 mil", label:"R$ 150 mil a R$ 500 mil"}, {value:"Acima de R$ 500 mil", label:"Acima de R$ 500 mil"}, {value:"Prefiro não informar", label:"Prefiro não informar"} ], required: true, subtitle:"Isso nos ajuda a entender o porte da sua empresa.", icon: <BuildingOffice2Icon className="w-5 h-5 text-slate-400"/> },
  { id: "desafioPrincipal", type: "radio", questionText: "Seu maior desafio/gargalo hoje é...", columnsForOptions:1, options: [ {value:"Gerar Leads Qualificados", label:"Gerar Leads Qualificados"},  {value:"Converter Leads em Vendas", label:"Converter Leads em Vendas"},  {value:"Aumentar Retenção/LTV", label:"Aumentar Retenção/LTV"},  {value:"Posicionamento de Marca", label:"Posicionamento de Marca"},  {value:"Organizar Processos", label:"Organizar Processos (Mkt/Vendas)"},  {value:"Outro desafio", label:"Outro"} ], required: true, subtitle:"Identificando o principal ponto a ser trabalhado.", icon: <ArrowTrendingUpIcon className="w-5 h-5 text-slate-400"/> },
  { id: "outroDesafio", type: "textarea", questionText: "Qual seu outro desafio principal?", placeholder: "Descreva brevemente seu principal desafio comercial ou de marketing...", conditionalDisplay: (fd) => fd.desafioPrincipal === "Outro desafio", required: (fd) => fd.desafioPrincipal === "Outro desafio", icon: <ArrowTrendingUpIcon className="w-5 h-5 text-slate-400"/> },
  { id: "investimentoMarketing", type: "radio", questionText: "Investimento atual em marketing/vendas?", columnsForOptions:1, options: [ {value:"Não investe atualmente", label:"Não investe atualmente"}, {value:"Até R$ 1.000/mês", label:"Até R$ 1.000/mês"}, {value:"R$ 1.000 a R$ 5.000/mês", label:"R$ 1.000 a R$ 5.000/mês"}, {value:"R$ 5.000 a R$ 15.000/mês", label:"R$ 5.000 a R$ 15.000/mês"}, {value:"Acima de R$ 15.000/mês", label:"Acima de R$ 15.000/mês"} ], required: true, subtitle:"Para entendermos seu orçamento e estratégia.", icon: <ArrowTrendingUpIcon className="w-5 h-5 text-slate-400"/> },
  { id: "processoComercial", type: "radio", questionText: "Como descreve seu processo comercial?", columnsForOptions:1, options: [ {value:"Bem definido e com CRM", label:"Bem definido e com CRM"}, {value:"Definido, mas sem CRM", label:"Definido, mas sem CRM"}, {value:"Pouco definido / informal", label:"Pouco definido / informal"}, {value:"Não tenho processo definido", label:"Não tenho processo definido"} ], required: true, subtitle:"Ajuda a avaliar a maturidade da sua operação.", icon: <ArrowTrendingUpIcon className="w-5 h-5 text-slate-400"/> },
  { id: "urgencia", type: "radio", questionText: "Sua urgência para implementar melhorias?", columnsForOptions:1, options: [ {value:"Imediata, resultados rápidos!", label:"Imediata, resultados rápidos!"}, {value:"Nas próximas semanas", label:"Nas próximas semanas"}, {value:"Nos próximos 3 meses", label:"Nos próximos 3 meses"}, {value:"Sem urgência definida", label:"Sem urgência definida"} ], required: true, subtitle:"Qual sua expectativa de tempo?", icon: <SparklesIcon className="w-5 h-5 text-slate-400"/> }, 
  { id: "abertoPlano", type: "radio", questionText: "Está aberto(a) a um plano de ação personalizado?", columnsForOptions:1, options: [ {value:"Sim, totalmente!", label:"Sim, totalmente!"}, {value:"Sim, dependendo da proposta", label:"Sim, dependendo da proposta"}, {value:"Preciso de mais informações", label:"Preciso de mais informações"}, {value:"Não no momento", label:"Não no momento"} ], required: true, subtitle:"Para sabermos seu interesse em nossas soluções.", icon: <HandThumbUpIcon className="w-5 h-5 text-slate-400"/> },
  { id: "site", type: "text", questionText: "Seu site (opcional)", placeholder: "www.suaempresa.com.br", required: false, icon: <BuildingOffice2Icon className="w-5 h-5 text-slate-400"/>},
  { id: "instagram", type: "text", questionText: "Seu Instagram comercial (opcional)", placeholder: "@suaempresa", required: false, icon: <BuildingOffice2Icon className="w-5 h-5 text-slate-400"/>}
];
