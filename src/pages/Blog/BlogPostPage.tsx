import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { BlogPostDetail } from '../../types/blog';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BlogSidebar from '../../components/Blog/BlogSidebar';
import SocialShareButtons from '../../components/Blog/SocialShareButtons';

// Componentes para customizar a renderização do Markdown seguindo nossa identidade visual
const markdownComponents: any = {
  h1: (props: any) => <h1 className="text-4xl font-bold my-8 text-slate-800 border-b-2 border-slate-200 pb-4" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-bold my-6 text-slate-700" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-semibold my-5 text-slate-700" {...props} />,
  h4: (props: any) => <h4 className="text-xl font-semibold my-4 text-slate-600" {...props} />,
  p: (props: any) => <p className="my-4 text-lg leading-relaxed text-slate-600" {...props} />,
  a: (props: any) => <a className="text-[#2A15EB] hover:text-[#05D7FB] underline transition-colors duration-200" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside my-6 pl-4 text-lg text-slate-600 space-y-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside my-6 pl-4 text-lg text-slate-600 space-y-2" {...props} />,
  li: (props: any) => <li className="my-2 leading-relaxed" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-[#2A15EB] bg-slate-50 pl-6 pr-4 py-4 italic my-6 text-slate-600 rounded-r-lg" {...props} />
  ),
  code: (props: any) => {
    const { inline, className, children, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <pre className="bg-slate-900 text-slate-100 p-6 rounded-xl overflow-x-auto my-6 text-sm shadow-lg">
        <code className={`${className} language-${match[1]}`} {...rest}>
          {String(children).replace(/\n$/, '')}
        </code>
      </pre>
    ) : (
      <code className="bg-slate-100 text-[#2A15EB] px-2 py-1 rounded text-sm font-medium" {...rest}>
        {children}
      </code>
    );
  },
  img: (props: any) => (
    <img className="max-w-full h-auto my-8 rounded-xl shadow-lg mx-auto" {...props} />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full bg-white border border-slate-200 rounded-lg" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200" {...props} />
  ),
  td: (props: any) => (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-b border-slate-200" {...props} />
  ),
  hr: (props: any) => <hr className="my-8 border-slate-200" {...props} />,
};

const fetchBlogPost = async (slug: string): Promise<BlogPostDetail> => {
  const response = await fetch(`/api/v1/blog/posts/${slug}`);
  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 404) {
        throw new Error('Postagem não encontrada');
    }
    throw new Error(errorData.error || 'Falha ao buscar a postagem do blog');
  }
  return response.json();
};

const fetchRecentPosts = async (): Promise<any[]> => {
  try {
    const response = await fetch('/api/v1/blog/posts');
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.slice(0, 5) : [];
  } catch (error) {
    console.error('Erro ao buscar posts recentes:', error);
    return [];
  }
};

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: post,
    isLoading,
    isError,
    error,
  } = useQuery<BlogPostDetail, Error>({
    queryKey: ['blogPost', slug],
    queryFn: () => fetchBlogPost(slug!),
    enabled: !!slug, // A query só será executada se o slug existir
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, err) => {
      if (err.message === 'Postagem não encontrada') return false; // Não tentar novamente para 404
      return failureCount < 3; // Tentar até 3 vezes para outros erros
    }
  });

  const {
    data: recentPosts = [],
  } = useQuery<any[], Error>({
    queryKey: ['recentPosts'],
    queryFn: fetchRecentPosts,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Extrair categorias dos posts recentes e do post atual
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(['Todos']);
    
    // Adicionar categorias do post atual
    if (post?.tags) {
      post.tags.forEach(tag => uniqueCategories.add(tag));
    }
    
    // Adicionar categorias dos posts recentes
    recentPosts.forEach((recentPost: any) => {
      if (recentPost.category) {
        uniqueCategories.add(recentPost.category);
      }
      if (recentPost.tags && recentPost.tags.length > 0) {
        recentPost.tags.forEach((tag: string) => uniqueCategories.add(tag));
      }
    });
    
    return Array.from(uniqueCategories);
  }, [post, recentPosts]);

  // URL atual para compartilhamento
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-6 sm:px-8 py-16 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Carregando postagem...</p>
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
            <p className="text-lg text-red-500">Erro ao carregar postagem: {error?.message}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-6 sm:px-8 py-16 text-center">
            <p className="text-slate-500">Postagem não encontrada ou ainda carregando.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navbar />
      
      <main className="pt-20">
        <div className="container mx-auto px-6 sm:px-8 py-16">
          <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
            {/* Sidebar */}
            <div className="lg:w-80 order-2 lg:order-1">
              <BlogSidebar
                categories={categories}
                recentPosts={recentPosts}
                onCategorySelect={(category) => {
                  // Redirecionar para a página de listagem com filtro
                  window.location.href = `/blog?category=${encodeURIComponent(category)}`;
                }}
              />
            </div>

            {/* Conteúdo Principal */}
            <article className="flex-1 order-1 lg:order-2">
              {post.cover_image_url && (
                <img 
                  src={post.cover_image_url} 
                  alt={post.title} 
                  className="w-full h-auto max-h-[500px] object-cover rounded-xl shadow-xl mb-12"
                />
              )}
              
              <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-800 text-center leading-tight">
                  {post.title}
                </h1>
                
                <div className="text-center text-slate-500 mb-8 text-sm">
                  <span>Publicado em {new Date(post.published_at).toLocaleDateString('pt-BR')}</span>
                  {post.estimated_read_time_minutes && (
                    <span className="mx-2">•</span>
                  )}
                  {post.estimated_read_time_minutes && (
                    <span>{post.estimated_read_time_minutes} min de leitura</span>
                  )}
                </div>
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {post.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 px-4 py-2 text-sm font-semibold rounded-full border border-blue-200 hover:from-blue-200 hover:to-sky-200 transition-all duration-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Botões de Compartilhamento */}
                <div className="flex justify-center mb-8">
                  <SocialShareButtons
                    url={currentUrl}
                    title={post.title}
                    description={post.summary || post.excerpt || ''}
                  />
                </div>
                
                <div className="prose prose-lg max-w-none mx-auto text-slate-700">
                  <ReactMarkdown components={markdownComponents}>
                    {post.content_markdown}
                  </ReactMarkdown>
                </div>

                {/* Botões de Compartilhamento no Final */}
                <div className="border-t border-slate-200 pt-8 mt-12">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-600">
                      <p className="font-medium">Gostou do artigo? Compartilhe com seus colegas!</p>
                    </div>
                    <SocialShareButtons
                      url={currentUrl}
                      title={post.title}
                      description={post.summary || post.excerpt || ''}
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPostPage;
