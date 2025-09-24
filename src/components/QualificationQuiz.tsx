// src/components/QualificationQuiz.tsx
import React, { useState, ChangeEvent, FormEvent, FunctionComponent, useEffect, useCallback, useRef, KeyboardEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftIcon as ChevronLeftIconHero,
    ArrowRightIcon as ChevronRightIconHero,
    CheckCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

import { QuizFormData, QuizQuestion, quizQuestionsConfig, QuizSubmissionResponse } from "../config/quizConfig";

// --- Tipos --- 
interface LogEntry {
    timestamp: string;
    action: string;
    details?: Record<string, unknown>;
    questionId?: string;
    error?: Error;
}

interface QualificationQuizProps {
    onSubmitQuiz: (formData: QuizFormData) => Promise<QuizSubmissionResponse>;
    onQuizComplete?: (response: QuizSubmissionResponse) => void;
    debugMode?: boolean;
}

// --- Configuração das Perguntas --- 
// totalQuizQuestions será definido usando useMemo mais abaixo

// --- ANIMAÇÕES ---
const stepAnimationVariants = { 
    enter: (direction: number) => ({ 
        x: direction > 0 ? '100%' : '-100%', 
        opacity: 0, 
        scale: 0.98 
    }), 
    center: { 
        x: 0, 
        opacity: 1, 
        scale: 1, 
        transition: { 
            type: "spring", 
            stiffness: 260, 
            damping: 25, 
            duration: 0.3 
        } 
    }, 
    exit: (direction: number) => ({ 
        x: direction < 0 ? '100%' : '-100%', 
        opacity: 0, 
        scale: 0.98, 
        transition: { 
            duration: 0.2, 
            ease: "circIn" 
        } 
    }), 
};

const optionCardMotionProps = { 
    whileHover:{ 
        scale: 1.015, 
        y: -2, 
        boxShadow: "0px 6px 18px rgba(60,30,240,0.09)", 
        transition: {
            type:'spring', 
            stiffness: 350, 
            damping: 15
        }
    }, 
    whileTap:{ 
        scale: 0.985 
    } 
};

const itemFadeInUp = { 
    hidden: { 
        opacity: 0, 
        y: 20 
    }, 
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { 
            duration: 0.45, 
            ease: "easeOut" 
        } 
    } 
};

const staggerContainer = (staggerChildren = 0.06, delayChildren = 0) => ({ 
    hidden: { 
        opacity: 0 
    }, 
    visible: { 
        opacity: 1, 
        transition: { 
            staggerChildren, 
            delayChildren, 
            when: "beforeChildren" 
        } 
    } 
});

// --- SISTEMA DE LOGGING ---
const logQuizAction = (action: string, details?: Record<string, unknown>, error?: Error) => {
    const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        action,
        details,
        error
    };
    
    // Log no console para desenvolvimento
    console.log(`📝 Quiz: ${action}`, logEntry);
    
    // Aqui poderíamos implementar logging para um serviço externo
    // if (process.env.REACT_APP_LOGGING_ENABLED === 'true') {
    //   sendLogToService(logEntry);
    // }
    
    return logEntry;
};

// Função auxiliar FORA do componente
const getNextQuestionDetails = (
    startIndex: number,
    direction: number,
    currentData: QuizFormData,
    allQuestions: QuizQuestion[]
): { nextVisibleIndex: number; skippedQuestionIds: (keyof QuizFormData)[] } => {
    let nextVisibleIndex = startIndex;
    const skippedQuestionIds: (keyof QuizFormData)[] = [];
    const questionsCount = allQuestions.length;
    while (nextVisibleIndex >= 0 && nextVisibleIndex < questionsCount) {
        const questionConfig = allQuestions[nextVisibleIndex];
        const shouldDisplay = questionConfig.conditionalDisplay
            ? questionConfig.conditionalDisplay(currentData)
            : true;
        if (shouldDisplay) {
            break;
        } else {
            skippedQuestionIds.push(questionConfig.id);
            nextVisibleIndex += direction;
        }
    }
    return { nextVisibleIndex, skippedQuestionIds };
};

const QualificationQuiz: FunctionComponent<QualificationQuizProps> = ({ 
    onSubmitQuiz, 
    onQuizComplete, 
    debugMode = false 
}) => {
    // --- STATE HOOKS ---
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [errors, setErrors] = useState<Partial<QuizFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'submitting' | 'success' | 'error' | null>(null);
    const [animationDirection, setAnimationDirection] = useState(1);
    const [touchedFields, setTouchedFields] = useState<Partial<{[key in keyof QuizFormData]: boolean}>>({});
    const [isLoadingConfig, setIsLoadingConfig] = useState(true); 

    // --- CONFIGURATION (MOVED UP AND MEMOIZED) ---
    const quizQuestionsConfigLocal = useMemo(() => {
        setIsLoadingConfig(true);
        // Usar a configuração importada diretamente
        console.log(`[QualificationQuiz] Config loaded, questions: ${quizQuestionsConfig.length}`);
        setIsLoadingConfig(false);
        return quizQuestionsConfig;
    }, []);

    // Função para inicializar formData com base em quizQuestionsConfig
    const createInitialFormData = useCallback((): QuizFormData => {
        // Criamos um objeto com todas as propriedades das perguntas
        const initialData: Partial<QuizFormData> = {};
        
        // Percorremos todas as perguntas e definimos valores vazios
        quizQuestionsConfigLocal.forEach(question => {
            initialData[question.id] = '';
        });
        
        return initialData as QuizFormData;
    }, [quizQuestionsConfigLocal]);
    
    const [formData, setFormData] = useState<QuizFormData>(() => {
        // Inicialização lazy para evitar problemas de dependência
        const initialData: Partial<QuizFormData> = {};
        quizQuestionsConfigLocal.forEach(question => {
            initialData[question.id] = '';
        });
        return initialData as QuizFormData;
    });

    const totalQuizQuestions = useMemo(() => quizQuestionsConfigLocal.length, [quizQuestionsConfigLocal]);
    
    const initialFormDataForQuiz = useMemo(() => {
        const initialData: Partial<QuizFormData> = {};
        if (quizQuestionsConfigLocal.length > 0) {
            quizQuestionsConfigLocal.forEach(q => {
                initialData[q.id] = q.initialValue !== undefined ? q.initialValue : '';
            });
        }
        return initialData as QuizFormData;
    }, [quizQuestionsConfigLocal]);

    // --- EFFECT TO RESET QUIZ STATE ON QUIZTYPE CHANGE (OR INITIAL LOAD) ---
    useEffect(() => {
        if (!isLoadingConfig && quizQuestionsConfigLocal.length > 0) { 
            setFormData(initialFormDataForQuiz);
            setCurrentQuestionIdx(0);
            setErrors({});
            setTouchedFields({});
            setSubmitStatus(null);
            setIsSubmitting(false);
            setAnimationDirection(1); 
            if (quizContainerRef.current) {
                quizContainerRef.current.scrollTop = 0;
            }
            logQuizAction('quiz_reset_and_initialized', { questionCount: quizQuestionsConfigLocal.length });
        }
    }, [initialFormDataForQuiz, isLoadingConfig, quizQuestionsConfigLocal, logQuizAction]);

    // --- REFS ---
    const quizContainerRef = useRef<HTMLDivElement>(null);
    const currentQuestionRef = useRef<HTMLDivElement>(null);

    // --- VALIDAÇÃO ---
    const validateField = useCallback((fieldName: keyof QuizFormData, value: string | undefined, currentDataForValidation: QuizFormData): string => {
        const fieldConfig = quizQuestionsConfigLocal.find(q => q.id === fieldName);
        if (!fieldConfig) return "";
        
        const shouldActuallyDisplay = fieldConfig.conditionalDisplay 
            ? fieldConfig.conditionalDisplay(currentDataForValidation) 
            : true;
            
        const isActuallyRequired = fieldConfig.required && 
            (typeof fieldConfig.required === 'boolean' ? fieldConfig.required : fieldConfig.required(currentDataForValidation));
        
        let err = "";
        const trimmedValue = String(value || '').trim();

        if (shouldActuallyDisplay && isActuallyRequired && !trimmedValue) {
            err = "Este campo é obrigatório.";
        } else if (trimmedValue.length > 0) { 
            if (fieldName === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) { 
                err = "Formato de e-mail inválido.";
            } else if (fieldName === "whatsapp") { 
                const cleaned = trimmedValue.replace(/\D/g, ''); 
                if (cleaned.length < 10 || cleaned.length > 11 || !/^[1-9]{2}9?[0-9]{8}$/.test(cleaned)) { 
                    err = "Telefone inválido. Use (XX) XXXXX-XXXX ou similar."; 
                } 
            } else if (fieldName === "nomeCompleto" && trimmedValue.length < 3) {
                err = "Nome completo min. 3 caracteres.";
            } else if (fieldName === "nomeEmpresa" && trimmedValue.length < 2) {
                err = "Nome da empresa muito curto.";
            } else if (shouldActuallyDisplay && isActuallyRequired && 
                    (fieldName === "outroSegmento" || fieldName === "outroCargo" || fieldName === "outroDesafio") && 
                    trimmedValue.length < 3) {
                err = "Especifique (mín. 3 caracteres).";
            } else if (fieldName === 'site' && trimmedValue && 
                    !/^(https?:\/\/)?([\ da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(trimmedValue)) { 
                err = 'URL do site inválida.';
            } else if (fieldName === 'instagram' && trimmedValue && 
                    !/^@?([\w.]{1,30})$/.test(trimmedValue.startsWith('@') ? trimmedValue.substring(1) : trimmedValue)) { 
                 err = 'Usuário do Instagram inválido (máx. 30 caracteres, letras, números, ., _).';
            }
            if (!err && fieldConfig.validation) {
                const customError = fieldConfig.validation(trimmedValue, currentDataForValidation);
                if (customError) err = customError;
            }
        }
        
        if (err) {
            logQuizAction('validation_error_in_validateField', { fieldName, error: err, value: trimmedValue });
        }
        return err;
    }, [quizQuestionsConfigLocal, logQuizAction]); 

    // --- LOGGING (Component Mount/Update & Global Keydown) ---
    useEffect(() => {
        if (!isLoadingConfig && totalQuizQuestions > 0) {
            logQuizAction('quiz_component_mounted_or_updated', { totalQuestions: totalQuizQuestions });
        }
        const handleGlobalKeydown = (e: KeyboardEvent) => {
            if (debugMode) {
                logQuizAction('key_pressed_global', { key: e.key, keyCode: e.which || e.keyCode });
            }
        };
        window.addEventListener('keydown', handleGlobalKeydown as unknown as EventListener);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeydown as unknown as EventListener);
            logQuizAction('quiz_component_unmounted');
        };
    }, [debugMode, totalQuizQuestions, isLoadingConfig, logQuizAction]); 
    
    // --- ACCESSIBILITY (Focus Management & Question Change Log) ---
    useEffect(() => {
        if (!isLoadingConfig && quizQuestionsConfigLocal.length > 0 && currentQuestionIdx < quizQuestionsConfigLocal.length) {
            if (currentQuestionRef.current) {
                currentQuestionRef.current.focus();
            }
            logQuizAction('question_changed_and_focused', { 
                questionIndex: currentQuestionIdx, 
                questionId: quizQuestionsConfigLocal[currentQuestionIdx]?.id 
            });
        }
    }, [currentQuestionIdx, quizQuestionsConfigLocal, isLoadingConfig, logQuizAction]); 
    
    const canProceedToNextQuestion = useCallback(() => {
        const currentQuestion = quizQuestionsConfigLocal[currentQuestionIdx];
        const value = formData[currentQuestion.id];
        const isRequired = currentQuestion.required && 
            (typeof currentQuestion.required === 'boolean' ? 
                currentQuestion.required : 
                currentQuestion.required(formData));
        return !isRequired || (value && String(value).trim() !== '');
    }, [currentQuestionIdx, formData, quizQuestionsConfigLocal]);

    const handleSubmit = useCallback(async (e?: FormEvent<HTMLFormElement>, dataForSubmission?: QuizFormData) => {
        if (e) e.preventDefault();
        const dataToSubmit = dataForSubmission || formData;
        logQuizAction('submit_attempt', { formData: dataToSubmit });
        let hasErrors = false;
        const newErrors: Partial<QuizFormData> = {};
        const newTouched: Record<keyof QuizFormData, boolean> = {} as Record<keyof QuizFormData, boolean>;
        quizQuestionsConfigLocal.forEach(question => {
            const shouldDisplay = !question.conditionalDisplay || question.conditionalDisplay(dataToSubmit);
            if (shouldDisplay) {
                const isRequiredCheck = question.required && 
                (typeof question.required === 'boolean' ? question.required : question.required(dataToSubmit));
                if (isRequiredCheck && (!dataToSubmit[question.id] || String(dataToSubmit[question.id]).trim() === '')) {
                    newErrors[question.id] = `Este campo é obrigatório`;
                    newTouched[question.id] = true;
                    hasErrors = true;
                } else {
                    const error = validateField(question.id, String(dataToSubmit[question.id]), dataToSubmit);
                    if (error) {
                        newErrors[question.id] = error;
                        newTouched[question.id] = true;
                        hasErrors = true;
                    }
                }
            }
        });
        if (hasErrors) {
            setErrors(newErrors);
            setTouchedFields(prev => ({...prev, ...newTouched}));
            const firstErrorIndex = quizQuestionsConfigLocal.findIndex(q => newErrors[q.id]);
            if (firstErrorIndex !== -1 && firstErrorIndex !== currentQuestionIdx) {
                setCurrentQuestionIdx(firstErrorIndex);
                setAnimationDirection(firstErrorIndex < currentQuestionIdx ? -1 : 1);
            }
            logQuizAction('submit_validation_failed', { errors: newErrors });
            return;
        }
        setIsSubmitting(true);
        setSubmitStatus('submitting');
        try {
            logQuizAction('submitting_to_api');
            const response = await onSubmitQuiz(dataToSubmit);
            logQuizAction('submit_success', { response });
            setSubmitStatus('success');
            if (onQuizComplete) onQuizComplete(response);
        } catch (error) {
            logQuizAction('submit_error', { error });
            console.error('Erro ao enviar quiz:', error);
            setSubmitStatus('error');
            setIsSubmitting(false);
        }
    }, [formData, currentQuestionIdx, validateField, onSubmitQuiz, onQuizComplete, quizQuestionsConfigLocal, setErrors, setTouchedFields, setCurrentQuestionIdx, setAnimationDirection, setIsSubmitting, setSubmitStatus, logQuizAction]);

    const handleBack = useCallback(() => {
        if (currentQuestionIdx === 0) return;
        const { nextVisibleIndex } = getNextQuestionDetails(
            currentQuestionIdx - 1, -1, formData, quizQuestionsConfigLocal
        );
        if (nextVisibleIndex >= 0) {
            setCurrentQuestionIdx(nextVisibleIndex);
            setAnimationDirection(-1);
            logQuizAction('navigation_back', { from: currentQuestionIdx, to: nextVisibleIndex });
        }
    }, [currentQuestionIdx, formData, quizQuestionsConfigLocal, setCurrentQuestionIdx, setAnimationDirection, logQuizAction]);

    const handleNext = useCallback(() => {
        const currentQuestion = quizQuestionsConfigLocal[currentQuestionIdx];
        const currentValue = formData[currentQuestion.id] || '';
        const validationError = validateField(currentQuestion.id, currentValue, formData);
        if (validationError) {
            setErrors(prev => ({ ...prev, [currentQuestion.id]: validationError }));
            setTouchedFields(prev => ({ ...prev, [currentQuestion.id]: true }));
            logQuizAction('validation_error_on_next', { questionId: currentQuestion.id, error: validationError });
            return;
        }
        const { nextVisibleIndex, skippedQuestionIds } = getNextQuestionDetails(
            currentQuestionIdx + 1, 1, formData, quizQuestionsConfigLocal
        );
        if (nextVisibleIndex < quizQuestionsConfigLocal.length) {
            setCurrentQuestionIdx(nextVisibleIndex);
            setAnimationDirection(1);
            if (skippedQuestionIds.length > 0) {
                const errorsCopy = { ...errors };
                skippedQuestionIds.forEach(id => { delete errorsCopy[id]; });
                setErrors(errorsCopy);
            }
            logQuizAction('navigation_next', { from: currentQuestionIdx, to: nextVisibleIndex, skipped: skippedQuestionIds });
        } else if (nextVisibleIndex === quizQuestionsConfigLocal.length) {
            handleSubmit();
        }
    }, [currentQuestionIdx, formData, errors, validateField, quizQuestionsConfigLocal, handleSubmit, setCurrentQuestionIdx, setAnimationDirection, setErrors, logQuizAction]);

    const handleRadioCardClick = useCallback((fieldName: keyof QuizFormData, optionValue: string) => {
        setFormData(prev => ({ ...prev, [fieldName]: optionValue }));
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
        if (errors[fieldName]) {
            setErrors(prev => { const newErrors = { ...prev }; delete newErrors[fieldName]; return newErrors; });
        }
        logQuizAction('option_selected', { fieldName, value: optionValue });
        setTimeout(() => {
            if (currentQuestionIdx < quizQuestionsConfigLocal.length - 1) {
                handleNext();
            } else {
                handleSubmit();
            }
        }, 350);
    }, [currentQuestionIdx, errors, quizQuestionsConfigLocal, handleNext, handleSubmit, setFormData, setTouchedFields, setErrors, logQuizAction]);

    const handleKeyNavigation = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        const { key } = e;
        const currentQuestion = quizQuestionsConfigLocal[currentQuestionIdx];
        if (key === 'Tab' && !e.shiftKey && currentQuestion.type === 'radio') {
            const lastOption = document.querySelector(`[name="${currentQuestion.id}"] + label:last-of-type`);
            if (document.activeElement === lastOption) { e.preventDefault(); handleNext(); }
        }
        if ((key === 'Enter' || key === ' ') && currentQuestion.type === 'radio' && (e.target as HTMLElement).hasAttribute('data-option-value')) {
            e.preventDefault();
            const optionValue = (e.target as HTMLElement).getAttribute('data-option-value') || '';
            handleRadioCardClick(currentQuestion.id, optionValue);
        }
        if (!isSubmitting) {
            if (key === 'ArrowRight' && currentQuestionIdx < quizQuestionsConfigLocal.length - 1) {
                if (canProceedToNextQuestion()) { handleNext(); }
            } else if (key === 'ArrowLeft' && currentQuestionIdx > 0) {
                handleBack();
            }
        }
        logQuizAction('key_navigation', { key, currentQuestionIdx });
    }, [currentQuestionIdx, isSubmitting, quizQuestionsConfigLocal, handleNext, handleRadioCardClick, canProceedToNextQuestion, handleBack, logQuizAction]);

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof QuizFormData]) {
            const validationError = validateField(name as keyof QuizFormData, value, formData);
            if (!validationError) {
                setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name as keyof QuizFormData]; return newErrors; });
            }
        }
    }, [formData, errors, validateField, setFormData, setErrors]);

    const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof QuizFormData;
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
        const validationError = validateField(fieldName, value, formData);
        if (validationError) {
            setErrors(prev => ({ ...prev, [fieldName]: validationError }));
            logQuizAction('validation_error_on_blur', { fieldName, error: validationError });
        } else if (errors[fieldName]) {
            setErrors(prev => { const newErrors = { ...prev }; delete newErrors[fieldName]; return newErrors; });
        }
    }, [formData, errors, validateField, setTouchedFields, setErrors, logQuizAction]);

    if (isLoadingConfig) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-lg shadow-xl bg-white text-slate-700 min-h-[400px] w-full max-w-2xl mx-auto">
                <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mb-4" aria-hidden="true"/> 
                <p className="mt-4 text-lg">Carregando quiz...</p>
            </div>
        );
    }

    if (quizQuestionsConfigLocal.length === 0) { 
        logQuizAction('critical_error_no_quiz_config_after_load');
        return (
            <div 
                className="flex flex-col items-center justify-center p-8 rounded-lg shadow-xl bg-white min-h-[400px] w-full max-w-2xl mx-auto"
                role="alert"
                aria-live="assertive"
            > 
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" /> 
                <h2 className="mt-4 text-2xl font-semibold text-slate-800">Erro na Configuração</h2> 
                <p className="text-slate-700">Não foi possível carregar as perguntas para o quiz. Verifique a configuração.</p> 
            </div> 
        );
    }

    // Estados de feedback para o usuário
    if (submitStatus === 'submitting') { 
        return (
            <div 
                className="flex flex-col items-center justify-center text-center p-10 h-[600px]"
                role="status"
                aria-live="polite"
            >
                <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mb-4" aria-hidden="true"/> 
                <p className="text-lg text-slate-700 font-semibold">Enviando...</p>
            </div>
        ); 
    }
    
    if (submitStatus === 'error') { 
        return (
            <div 
                className="flex flex-col items-center justify-center text-center p-10 h-[600px]"
                role="alert"
                aria-live="assertive"
            >
                <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" aria-hidden="true"/> 
                <p className="text-xl text-slate-800 font-semibold">Ops! Algo deu errado.</p> 
                <button 
                    onClick={() => { setSubmitStatus(null); setIsSubmitting(false); }}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Tentar novamente"
                >
                    Tentar Novamente
                </button>
            </div>
        ); 
    }
    
    // Configuração da pergunta atual
    const currentQuestionConfig = quizQuestionsConfigLocal[currentQuestionIdx];
    const isRequired = currentQuestionConfig.required && 
        (typeof currentQuestionConfig.required === 'boolean' ? 
            currentQuestionConfig.required : 
            currentQuestionConfig.required(formData));
    
    return (
        <div 
            ref={quizContainerRef}
            className="w-full max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-2xl border border-slate-100 flex flex-col" 
            style={{height: 'clamp(700px, 92vh, 900px)'}}
            onKeyDown={handleKeyNavigation}
            role="form"
            aria-labelledby="quiz-heading"
        >
            <div className="mb-8 md:mb-10">
                <div className="flex items-center mb-4 justify-between">
                    <h1 id="quiz-heading" className="text-2xl font-bold text-slate-900">Qualificação de Perfil</h1>
                    <div className="text-sm text-slate-500 font-semibold">Pergunta {currentQuestionIdx + 1} de {quizQuestionsConfigLocal.length}</div>
                </div>
                <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                        className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" 
                        initial={{ width: '0%'}} 
                        animate={{ width: `${((currentQuestionIdx + 1) / quizQuestionsConfigLocal.length) * 100}%` }} 
                        transition={{ type:"spring", stiffness: 100, damping: 20, duration: 0.6 }} 
                    />
                </div>
            </div>
            <AnimatePresence mode="wait" custom={animationDirection} initial={false}>
                <motion.div 
                    ref={currentQuestionRef}
                    key={currentQuestionIdx} 
                    custom={animationDirection} 
                    variants={stepAnimationVariants} 
                    initial="enter" 
                    animate="center" 
                    exit="exit" 
                    className="flex flex-col flex-grow justify-between items-center w-full min-h-0"
                    tabIndex={-1}
                >
                    <div className="w-full flex flex-col items-center flex-grow mb-6 text-center overflow-y-auto py-6 px-2 custom-scrollbar">
                        <motion.h2 
                            key={`q-title-${currentQuestionIdx}`} 
                            initial={{opacity:0, y:20}} 
                            animate={{opacity:1,y:0}} 
                            transition={{delay:0.1, duration:0.4, ease:"easeOut"}} 
                            className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-800 leading-tight mb-3"
                        >
                            {currentQuestionConfig.questionText} {isRequired && <span className="text-red-500 ml-1" aria-label="obrigatório">*</span>}
                        </motion.h2>
                        {currentQuestionConfig.subtitle && (
                            <motion.p 
                                key={`q-subtitle-${currentQuestionIdx}`} 
                                initial={{opacity:0, y:15}} 
                                animate={{opacity:1,y:0}} 
                                transition={{delay:0.15, duration:0.4, ease:"easeOut"}} 
                                className="text-slate-600 text-lg md:text-xl mb-8"
                            >
                                {currentQuestionConfig.subtitle} 
                            </motion.p>
                        )}
                        <motion.div 
                            className={`w-full max-w-2xl mt-2 ${currentQuestionConfig.type === 'radio' ? 'space-y-3 sm:space-y-4' : 'space-y-2'}`} 
                            variants={staggerContainer(0.06, currentQuestionConfig.type === 'radio' ? 0.25 : 0.15)} 
                            initial="hidden" 
                            animate="visible"
                        >
                            {currentQuestionConfig.type === 'radio' && currentQuestionConfig.options && (
                                <div className={`grid gap-3 sm:gap-4 pt-1 ${currentQuestionConfig.columnsForOptions === 3 ? 'grid-cols-1 sm:grid-cols-3' : currentQuestionConfig.columnsForOptions === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                    {currentQuestionConfig.options.map(option => (
                                        <motion.button 
                                            type="button" 
                                            key={option.value} 
                                            onClick={() => handleRadioCardClick(currentQuestionConfig.id, option.value)}
                                            className={`relative flex flex-col items-start sm:items-center text-left sm:text-center p-5 sm:p-6 rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${formData[currentQuestionConfig.id] === option.value ? 'border-blue-600 bg-blue-50/80 text-blue-900' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50/80'}`}
                                            variants={itemFadeInUp}
                                            aria-pressed={formData[currentQuestionConfig.id] === option.value}
                                            aria-label={option.label}
                                            data-option-value={option.value}
                                        >
                                            {formData[currentQuestionConfig.id] === option.value && (
                                                <CheckCircleIconSolid className="absolute top-3 right-3 w-5 h-5 text-blue-600" aria-hidden="true"/>
                                            )}
                                            <span className="text-lg sm:text-xl font-medium mb-1">{option.label}</span>
                                            {option.description && <span className="text-sm text-slate-500">{option.description}</span>}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                            {(currentQuestionConfig.type === 'text' || currentQuestionConfig.type === 'email' || currentQuestionConfig.type === 'tel' || currentQuestionConfig.type === 'textarea') && (
                                <motion.div variants={itemFadeInUp}>
                                    {React.createElement(currentQuestionConfig.type === 'textarea' ? 'textarea' : 'input', { 
                                        id: currentQuestionConfig.id, 
                                        type: currentQuestionConfig.type === 'textarea' ? undefined : currentQuestionConfig.type, 
                                        name: currentQuestionConfig.id, 
                                        value: formData[currentQuestionConfig.id] || '', 
                                        onChange: handleInputChange, 
                                        onBlur: handleBlur, 
                                        placeholder: currentQuestionConfig.placeholder, 
                                        required: isRequired, 
                                        className: `w-full px-5 py-4 border rounded-lg text-lg placeholder-slate-400 bg-white focus:bg-white transition-all duration-150 ease-in-out shadow-sm ${errors[currentQuestionConfig.id] && touchedFields[currentQuestionConfig.id] ? 'border-red-500 ring-1 ring-red-500 bg-red-50/30 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 hover:border-slate-400'} ${currentQuestionConfig.type === 'textarea' ? 'min-h-[120px] py-3' : 'h-14'}`, 
                                        rows: currentQuestionConfig.type === 'textarea' ? 4 : undefined,
                                        'aria-invalid': errors[currentQuestionConfig.id] && touchedFields[currentQuestionConfig.id] ? 'true' : 'false',
                                        'aria-describedby': errors[currentQuestionConfig.id] && touchedFields[currentQuestionConfig.id] ? `error-${currentQuestionConfig.id}` : undefined
                                    })}
                                </motion.div>
                            )}
                            {errors[currentQuestionConfig.id] && touchedFields[currentQuestionConfig.id] && (
                                <p 
                                    id={`error-${currentQuestionConfig.id}`}
                                    className="text-sm text-red-600 mt-2 text-center flex items-center justify-center"
                                    role="alert"
                                >
                                    <ExclamationTriangleIcon className="w-5 h-5 mr-1.5 text-red-500" aria-hidden="true" />
                                    {errors[currentQuestionConfig.id]}
                                </p>
                            )}
                        </motion.div>
                    </div>
                    <div className={`flex w-full max-w-2xl mx-auto pt-6 pb-2 mt-auto ${currentQuestionIdx === 0 ? 'justify-end' : 'justify-between'} items-center`}>
                        {currentQuestionIdx > 0 && ( 
                            <motion.button 
                                type="button" 
                                onClick={handleBack} 
                                className="px-7 py-3 text-base font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-2.5 shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" 
                                {...optionCardMotionProps}
                                aria-label="Voltar para pergunta anterior"
                            > 
                                <ChevronLeftIconHero className="w-6 h-6" aria-hidden="true"/> 
                                Voltar 
                            </motion.button> 
                        )}
                        {currentQuestionConfig.type !== 'radio' && currentQuestionIdx < quizQuestionsConfigLocal.length - 1 && ( 
                            <motion.button 
                                type="button" 
                                onClick={handleNext} 
                                className="ml-auto px-7 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2" 
                                {...optionCardMotionProps}
                                aria-label="Ir para próxima pergunta"
                            > 
                                Próximo 
                                <ChevronRightIconHero className="w-6 h-6" aria-hidden="true"/> 
                            </motion.button> 
                        )}
                        {currentQuestionIdx === quizQuestionsConfigLocal.length - 1 && ( 
                            <motion.button 
                                type="button" 
                                onClick={(e) => handleSubmit(e as any)} 
                                disabled={isSubmitting} 
                                className="ml-auto px-7 py-3 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2" 
                                {...optionCardMotionProps}
                                aria-label="Enviar respostas e ver diagnóstico"
                            > 
                                {isSubmitting ? 
                                    <><ArrowPathIcon className="w-6 h-6 mr-2 animate-spin" aria-hidden="true"/> Processando...</> : 
                                    <><PaperAirplaneIcon className="w-6 h-6 mr-2 -rotate-45 transform" aria-hidden="true"/> Ver Meu Diagnóstico</>
                                } 
                            </motion.button> 
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default QualificationQuiz;
