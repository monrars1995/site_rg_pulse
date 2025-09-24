import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PostCard from '../../components/Blog/PostCard';
import BlogSidebar from '../../components/Blog/BlogSidebar';

// Interfaces para o blog
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  image?: string;
  published_at?: string;
  date?: string;
  estimated_read_time_minutes?: number;
  readTime?: string;
  category?: string;
  theme?: string;
  tags?: string[];
  author?: {
    name: string;
    avatar?: string;
  };
}

// Função para buscar posts do blog
const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const response = await fetch('/api/v1/blog/posts');
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    
    // Garantir que retornamos um array válido
    if (!Array.isArray(data)) {
      console.warn('API não retornou um array, tentando extrair posts:', data);
      return Array.isArray(data.posts) ? data.posts : [];
    }
    
    // Validar e filtrar posts válidos
    return data.filter((post: any) => {
      return post && typeof post === 'object' && post.title && post.slug;
    });
  } catch (error) {
    console.error('Erro ao buscar posts do blog:', error);
    throw error;
  }
};

// Animações
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const staggerContainer = (staggerChildren: number, delayChildren: number = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

const BlogListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'Todos');
  const [isFiltering, setIsFiltering] = useState(false);

  // Função para buscar posts recentes
  const fetchRecentPosts = async (): Promise<BlogPost[]> => {
    const response = await fetch('/api/v1/blog/posts?limit=5');
    if (!response.ok) {
      throw new Error('Erro ao buscar posts recentes');
    }
    return response.json();
  };

  // Query para buscar todos os posts
  const {
    data: posts = [],
    isLoading,
    isError,
    error
  } = useQuery<BlogPost[], Error>({
    queryKey: ['blogPosts'],
    queryFn: fetchBlogPosts,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });

  // Query para buscar posts recentes
  const {
    data: recentPosts = []
  } = useQuery<BlogPost[], Error>({
    queryKey: ['recentBlogPosts'],
    queryFn: fetchRecentPosts,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  // Categorias únicas baseadas nos temas dos posts
  const categories = useMemo(() => {
    const uniqueCategories = new Set(['Todos']);
    posts.forEach(post => {
      if (post.category) {
        uniqueCategories.add(post.category);
      }
      if (post.theme) {
        uniqueCategories.add(post.theme);
      }
    });
    return Array.from(uniqueCategories);
  }, [posts]);

  // Tags únicas dos posts
  const availableTags = useMemo(() => {
    const uniqueTags = new Set<string>();
    posts.forEach(post => {
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    return Array.from(uniqueTags);
  }, [posts]);

  // Posts filtrados
  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    
    return posts.filter(post => {
      const matchesSearch = !searchTerm || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.summary && post.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'Todos' || 
        post.category === selectedCategory ||
        post.theme === selectedCategory ||
        (post.tags && post.tags.includes(selectedCategory));
      
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, selectedCategory]);

  // Função para lidar com mudança de categoria
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setIsFiltering(true);
    
    // Atualizar URL
    if (category === 'Todos') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  // Effect para animação de filtragem
  useEffect(() => {
    if (isFiltering) {
      const timer = setTimeout(() => setIsFiltering(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isFiltering]);

  // Função placeholder para newsletter
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar lógica de newsletter
    console.log('Newsletter subscription submitted');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-6 sm:px-8 py-16 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Carregando artigos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-6 sm:px-8 py-16 text-center">
            <h1 className="text-4xl font-bold mb-8 text-slate-800">Blog</h1>
            <p className="text-lg text-red-500">Erro ao carregar postagens: {error?.message}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100">
          <div className="container mx-auto px-6 sm:px-8 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer(0.15, 0)}
            >
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-800 leading-tight"
                variants={fadeInUp}
              >
                Blog RG Pulse
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                Insights, estratégias e tendências em marketing digital, inteligência artificial e transformação digital para impulsionar seu negócio.
              </motion.p>
              
              {/* Search Bar */}
              <motion.div 
                className="max-w-md mx-auto relative"
                variants={fadeInUp}
              >
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar artigos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2A15EB] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Blog Posts Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Sidebar */}
              <div className="lg:w-1/4">
                <BlogSidebar 
                  categories={categories}
                  tags={availableTags}
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategoryChange}
                  recentPosts={recentPosts}
                />
              </div>

              {/* Main Content */}
              <div className="lg:w-3/4">
                <AnimatePresence mode="wait">
                  {isFiltering ? (
                    <motion.div 
                      key="filtering"
                      className="flex justify-center items-center py-16"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="w-8 h-8 border-4 border-[#2A15EB] border-t-transparent rounded-full animate-spin"></div>
                    </motion.div>
                  ) : (
                    <>
                      {Array.isArray(filteredPosts) && filteredPosts.length > 0 ? (
                        <>
                          {/* Indicador de filtro ativo */}
                          {selectedCategory !== 'Todos' && (
                            <motion.div 
                              className="mb-6 flex items-center gap-2 text-sm"
                              initial={{opacity: 0, y: -10}}
                              animate={{opacity: 1, y: 0}}
                              transition={{duration: 0.3}}
                            >
                              <span className="text-slate-600">Filtrando por:</span>
                              <span className={`px-3 py-1 rounded-full text-white font-medium ${
                                availableTags.includes(selectedCategory) 
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                                  : 'bg-gradient-to-r from-[#2A15EB] to-[#05D7FB]'
                              }`}>
                                {availableTags.includes(selectedCategory) ? '#' : ''}{selectedCategory}
                              </span>
                              <button
                                onClick={() => handleCategoryChange('Todos')}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                title="Limpar filtro"
                              >
                                ✕
                              </button>
                            </motion.div>
                          )}

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
                                'Marketing Digital': 'from-blue-500 to-cyan-500',
                                'IA Generativa': 'from-purple-500 to-pink-500',
                                'SEO': 'from-green-500 to-emerald-500',
                                'Conteúdo': 'from-orange-500 to-red-500',
                                'default': 'from-[#2A15EB] to-[#05D7FB]'
                              };
                              
                              return (
                                <motion.article
                                  key={postKey}
                                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-slate-100 flex flex-col"
                                  variants={fadeInUp}
                                  whileHover={{ y: -4 }}
                                >
                                  {post.cover_image_url && (
                                    <div className="aspect-video overflow-hidden">
                                      <img 
                                        src={post.cover_image_url} 
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = '/placeholder.svg';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-medium text-xs text-white bg-gradient-to-r ${
                                        categoryColors[post.category as keyof typeof categoryColors] || categoryColors.default
                                      }`}>
                                        {post.category || post.theme || 'Artigo'}
                                      </span>
                                      <span>{new Date(post.published_at || post.date || '').toLocaleDateString('pt-BR')}</span>
                                      <span>•</span>
                                      <span>{post.estimated_read_time_minutes ? `${post.estimated_read_time_minutes} min` : post.readTime || '5 min'} de leitura</span>
                                    </div>
                                    <Link to={`/blog/${post.slug}`}>
                                      <h2 className="text-lg sm:text-xl font-semibold mb-2 text-slate-800 group-hover:text-[#2A15EB] transition-colors line-clamp-2 leading-snug">
                                        {post.title}
                                      </h2>
                                    </Link>
                                    <p className="text-slate-600 mb-4 line-clamp-3 text-sm flex-grow leading-relaxed">
                                      {post.summary || post.excerpt || 'Clique para ler mais...'}
                                    </p>
                                    <Link 
                                      to={`/blog/${post.slug}`} 
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
                        </>
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
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#2A15EB] to-[#05D7FB]">
          <div className="container mx-auto px-6 sm:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer(0.15, 0)}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4 text-white"
                variants={fadeInUp}
              >
                Fique por dentro das novidades
              </motion.h2>
              <motion.p 
                className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto"
                variants={fadeInUp}
              >
                Receba insights exclusivos sobre marketing digital, IA e transformação digital diretamente no seu e-mail.
              </motion.p>
              <motion.form 
                onSubmit={handleNewsletterSubmit}
                className="max-w-md mx-auto flex gap-3"
                variants={fadeInUp}
              >
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-[#2A15EB] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Inscrever
                </button>
              </motion.form>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogListPage;
