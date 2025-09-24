// src/pages/BlogPage.tsx
import { useEffect, useState, ChangeEvent, FormEvent, FunctionComponent } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, TagIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

// Interface para tipar os posts do blog vindos da API
interface BlogPost {
  id: number;
  title: string;
  summary?: string;
  excerpt?: string; // Para compatibilidade com dados antigos
  category?: string; // Para compatibilidade com dados antigos
  readTime?: string; // Para compatibilidade com dados antigos
  date?: string; // Para compatibilidade com dados antigos
  cover_image_url?: string;
  image?: string; // Para compatibilidade com dados antigos
  slug: string;
  content_markdown?: string;
  estimated_read_time_minutes?: number;
  tags?: string[];
  published_at: string;
  created_at?: string;
  updated_at?: string;
}

// Função para buscar os posts da API
const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    console.log('Iniciando busca de posts da API...');
    const response = await fetch('/api/v1/blog/posts', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Resposta recebida:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.text();
        console.error('Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
      } catch (e) {
        console.error('Erro ao processar resposta de erro:', e);
        errorData = 'Não foi possível ler o corpo do erro';
      }
      throw new Error(`Erro ao carregar os posts: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Dados recebidos da API:', JSON.stringify(data, null, 2));
    
    // Garante que sempre retornamos um array
    if (!data) {
      console.warn('A API retornou null ou undefined');
      return [];
    }
    
    let result = Array.isArray(data) ? data : [data];
    
    // Processa cada post para garantir que tenha um ID e slug válidos
    result = result.map((post, index) => {
      // Se não houver ID, gera um ID único baseado no índice e timestamp
      const id = post.id || `post-${Date.now()}-${index}`;
      
      // Se não houver slug, gera um slug a partir do título ou ID
      let slug = post.slug;
      if (!slug) {
        slug = (post.title || id)
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
          .replace(/\s+/g, '-')     // Substitui espaços por hífens
          .replace(/-+/g, '-')       // Remove múltiplos hífens consecutivos
          .replace(/^-+|-+$/g, '');  // Remove hífens do início e fim
      }
      
      // Garante que o slug não esteja vazio
      if (!slug) slug = `post-${id}`;
      
      return {
        ...post,
        id,
        slug,
        title: post.title || 'Sem título',
        excerpt: post.excerpt || '',
        category: post.category || 'Geral',
        image: post.image || '/placeholder-blog.jpg',
        date: post.date || new Date().toISOString().split('T')[0],
        readTime: post.readTime || '5 min de leitura'
      };
    });
    
    console.log('Dados processados:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    throw error; // Rejeita a promise para que o React Query possa lidar com o erro
  }
};

const categories = [
  'Todos', 'Marketing Digital', 'Vendas', 'Automação', 'Gestão', 'Cases'
];

// Dados estáticos removidos - agora usando dados reais da API


// --- ANIMAÇÕES ---
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};
const staggerContainer = (staggerChildren = 0.07, delayChildren = 0) => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren, delayChildren } }
});
// --- FIM ANIMAÇÕES ---

const BlogPage: FunctionComponent = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  // Usando useQuery para buscar os posts da API
  const { data: blogPostsResponse, isLoading, isError, error } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: fetchBlogPosts,
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => {
      // Garante que sempre retornamos um array, mesmo que a resposta seja inválida
      if (!data) return [];
      return Array.isArray(data) ? data : [];
    }
  });

  // Garante que blogPosts seja sempre um array
  const blogPosts = Array.isArray(blogPostsResponse) ? blogPostsResponse : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Adiciona um pequeno delay ao filtrar para UX, especialmente com AnimatePresence
    if (searchTerm !== '' || selectedCategory !== 'Todos') {
      setIsFiltering(true);
      const timer = setTimeout(() => setIsFiltering(false), 250);
      return () => clearTimeout(timer);
    } else {
      setIsFiltering(false);
    }
  }, [searchTerm, selectedCategory]);

  // Filtra os posts com base na categoria selecionada e no termo de busca
  const filteredPosts = blogPosts.filter((post: BlogPost) => {
    // Verifica se o post é válido
    if (!post) return false;
    
    // Verifica a categoria - usa tags ou category para compatibilidade
    const postCategory = (post.tags && post.tags.length > 0 ? post.tags[0] : post.category) || '';
    const matchesCategory = selectedCategory === 'Todos' || postCategory === selectedCategory;
    
    // Se não houver termo de busca, retorna apenas a correspondência da categoria
    if (!searchTerm.trim()) return matchesCategory;
    
    // Verifica o termo de busca
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const postTitle = post.title || '';
    const postExcerpt = post.summary || post.excerpt || '';
    const postTags = post.tags ? post.tags.join(' ') : '';
    
    const matchesSearch = 
      postTitle.toLowerCase().includes(lowerSearchTerm) ||
      postExcerpt.toLowerCase().includes(lowerSearchTerm) ||
      postCategory.toLowerCase().includes(lowerSearchTerm) ||
      postTags.toLowerCase().includes(lowerSearchTerm);
    
    return matchesCategory && matchesSearch;
  });

  const handleNewsletterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Lógica de submissão real aqui (ex: API call)
    alert('Inscrição na newsletter enviada! (funcionalidade de exemplo)');
  };

  // Renderização condicional para estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-700">Carregando posts do blog...</p>
            <p className="text-sm text-slate-500 mt-2">Conectando ao servidor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-md bg-white p-6 rounded-lg shadow-lg">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Erro ao carregar o blog</h2>
            <p className="text-slate-600 mb-2">Não foi possível conectar ao servidor de posts.</p>
            <p className="text-sm text-slate-500 mb-4">Verifique se o servidor backend está rodando em http://localhost:3000</p>
            
            <div className="bg-slate-50 p-3 rounded-md text-left text-sm font-mono text-slate-600 mb-4">
              <p>Erro: {error instanceof Error ? error.message : 'Erro desconhecido'}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-none"
              >
                Tentar novamente
              </button>
              {import.meta.env.DEV && (
                <button 
                  onClick={() => fetchBlogPosts()}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex-1 sm:flex-none"
                >
                  Tentar sem API
                </button>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 antialiased selection:bg-[#2A15EB] selection:text-white">
      <Navbar />
      <WhatsAppButton onClick={() => { /* Sua ação aqui */}} />
      
      <main className="flex-grow pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 
                       bg-gradient-to-b from-white via-sky-50 to-blue-100 
                       text-slate-800 overflow-hidden">
           <div className="absolute inset-0 opacity-[0.04]">
             <svg width="100%" height="100%"><defs><pattern id="pattBlogHeroPage" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="rgba(0,50,150,0.3)"/></pattern></defs><rect width="100%" height="100%" fill="url(#pattBlogHeroPage)"></rect></svg>
           </div>
          <div className="container mx-auto px-6 sm:px-8 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              variants={staggerContainer(0.1,0)} initial="hidden" animate="visible"
            >
              <motion.div 
                className="inline-block mb-6 p-3.5 bg-gradient-to-r from-sky-100 to-blue-100 rounded-full shadow-lg"
                variants={fadeInUp} 
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 12 }}
              >
                <PencilSquareIcon className="w-10 h-10 text-[#2A15EB]" />
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 tracking-tight 
                           text-transparent bg-clip-text bg-gradient-to-r from-[#2A15EB] via-[#05D7FB] to-[#7C3AED]"
                variants={fadeInUp}
              >
                Blog RG Pulse
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                Insights, estratégias e cases de sucesso para impulsionar o crescimento do seu negócio no universo digital.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-6 sm:px-8">
            <motion.div 
              className="mb-10 md:mb-12 bg-white p-5 sm:p-6 rounded-xl shadow-lg border border-slate-200"
              initial={{opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{duration: 0.4, ease: "easeOut"}}
            >
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="w-full lg:w-auto lg:flex-1 relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="search" // type="search" para melhor semântica e funcionalidade
                    placeholder="Buscar por artigos, temas..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3.5 pl-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A15EB] focus:border-transparent transition-all text-md placeholder-slate-400 shadow-sm hover:border-slate-400"
                  />
                </div>
                <div className="flex flex-wrap justify-center lg:justify-end gap-2 items-center w-full lg:w-auto">
                  <TagIcon className="w-5 h-5 text-slate-500 hidden sm:block mr-1 shrink-0" />
                  <div className="flex flex-wrap justify-center lg:justify-end gap-2">
                    {categories.map((category) => (
                        <motion.button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                            ${selectedCategory === category
                            ? 'bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white shadow-md focus-visible:ring-[#05D7FB]'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 focus-visible:ring-slate-400'}`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        >
                        {category}
                        </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <div id="blog-posts-grid" className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {isFiltering ? (
                  <motion.div
                    key="filtering"
                    className="flex flex-col justify-center items-center text-center py-20"
                    initial={{opacity:0}} 
                    animate={{opacity:1}} 
                    exit={{opacity:0}} 
                    transition={{duration:0.2}}
                  >
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500">Buscando artigos...</p>
                  </motion.div>
                ) : (
                  <>
                    {Array.isArray(filteredPosts) && filteredPosts.length > 0 ? (
                      <motion.div 
                        key={`${selectedCategory}-${searchTerm}`}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                        variants={staggerContainer(0.06, 0)}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        {filteredPosts.map((post, index) => {
                          const postKey = `post-${post.id || index}-${post.slug || ''}`;
                          const categoryColors = {
                            'Cases': 'from-emerald-500 to-green-600',
                            'Marketing Digital': 'from-sky-500 to-blue-600',
                            'Vendas': 'from-purple-500 to-violet-600',
                            'Automação': 'from-amber-500 to-yellow-600',
                            'Gestão': 'from-rose-500 to-red-600'
                          };
                          
                          return (
                            <motion.article
                              key={postKey}
                              className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 will-change-transform border border-transparent hover:border-blue-200"
                              variants={fadeInUp}
                              layout
                            >
                              <Link 
                                to={`/blog/${post.slug}`}
                                className="block aspect-video overflow-hidden rounded-t-xl"
                              >
                                <motion.img 
                                  src={post.cover_image_url || post.image || '/api/placeholder/400/300'} 
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-blog.jpg';
                                  }}
                                />
                              </Link>
                              <div className="p-5 sm:p-6 flex flex-col flex-grow">
                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-slate-500">
                                  <span 
                                    className={`inline-block px-2.5 py-0.5 rounded-full font-medium text-xs text-white bg-gradient-to-r ${
                                      categoryColors[post.category as keyof typeof categoryColors] || 'from-slate-400 to-slate-500'
                                    }`}
                                  >
                                    {post.tags && post.tags.length > 0 ? post.tags[0] : post.category}
                                  </span>
                                  <span>•</span>
                                  <span>{new Date(post.published_at || post.date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{post.estimated_read_time_minutes ? `${post.estimated_read_time_minutes} min` : post.readTime || '5 min'} de leitura</span>
                                </div>
                                <Link to={`/blog-api/${post.slug}`}>
                                  <h2 className="text-lg sm:text-xl font-semibold mb-2 text-slate-800 group-hover:text-[#2A15EB] transition-colors line-clamp-2 leading-snug">
                                    {post.title}
                                  </h2>
                                </Link>
                                <p className="text-slate-600 mb-4 line-clamp-3 text-sm flex-grow leading-relaxed">
                                  {post.summary || post.excerpt || 'Clique para ler mais...'}
                                </p>
                                <Link 
                                  to={`/blog-api/${post.slug}`} 
                                  className="inline-flex items-center text-sm text-[#2A15EB] font-medium group-hover:text-[#05D7FB] transition-colors mt-auto self-start group/link"
                                >
                                  Ler artigo completo
                                  <svg 
                                    className="w-4 h-4 ml-1 transition-transform duration-200 group-hover/link:translate-x-0.5" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M14 5l7 7m0 0l-7 7m7-7H3" 
                                    />
                                  </svg>
                                </Link>
                              </div>
                            </motion.article>
                          );
                        })}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="no-posts-found"
                        className="text-center py-16"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                      >
                        <svg 
                          className="w-16 h-16 text-slate-300 mx-auto mb-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1.5} 
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                        <p className="text-xl text-slate-500">Nenhum artigo encontrado.</p>
                        <p className="text-slate-400">Tente uma busca diferente ou explore nossas categorias.</p>
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="max-w-xl mx-auto text-center bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200">
              <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: 0.2}} variants={staggerContainer(0.1,0)}>
                <motion.div className="inline-block p-3 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-full mb-5 shadow" variants={fadeInUp}>
                    <svg className="w-10 h-10 text-[#2A15EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </motion.div>
                <motion.h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-800" variants={fadeInUp}>Mantenha-se Atualizado</motion.h2>
                <motion.p className="text-md md:text-lg text-slate-600 mb-8" variants={fadeInUp}>
                  Receba em primeira mão nossos últimos artigos, insights e novidades sobre marketing e vendas direto no seu e-mail.
                </motion.p>
                <motion.form 
                    className="flex flex-col sm:flex-row gap-3 items-center justify-center" 
                    onSubmit={handleNewsletterSubmit}
                    variants={staggerContainer(0.1, 0.1)} // Stagger para input e botão
                >
                  <motion.input
                    type="email" name="email_newsletter" // Adicionado name
                    placeholder="Seu melhor e-mail" required
                    className="flex-1 w-full sm:max-w-md px-5 py-3.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2A15EB] focus:border-transparent transition-all text-md placeholder-slate-400 shadow-sm hover:border-slate-400"
                    variants={fadeInUp}
                  />
                  <motion.button
                    type="submit"
                    className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#05D7FB] focus-visible:ring-offset-2 active:scale-95"
                    whileHover={{ y: -2, transition: {duration:0.15} }}
                    whileTap={{ scale: 0.98, transition: {duration:0.1} }}
                    variants={fadeInUp}
                  >
                    Inscrever-se
                  </motion.button>
                </motion.form>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPage;