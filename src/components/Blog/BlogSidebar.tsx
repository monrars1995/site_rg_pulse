import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TagIcon, HomeIcon, ClockIcon } from '@heroicons/react/24/outline';

interface BlogSidebarProps {
  categories: string[];
  tags?: string[];
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
  recentPosts?: Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string;
    estimated_read_time_minutes?: number;
  }>;
  className?: string;
}

const BlogSidebar: React.FC<BlogSidebarProps> = ({
  categories,
  tags = [],
  selectedCategory,
  onCategorySelect,
  recentPosts = [],
  className = ''
}) => {
  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.aside
      className={`bg-white rounded-xl shadow-lg p-6 sticky top-24 h-fit ${className}`}
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Navegação Principal */}
      <motion.div className="mb-8" variants={itemVariants}>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <HomeIcon className="w-5 h-5 text-[#2A15EB]" />
          Navegação
        </h3>
        <div className="space-y-2">
          <Link
            to="/blog"
            className="block px-4 py-2 text-slate-600 hover:text-[#2A15EB] hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
          >
            Todos os Artigos
          </Link>
          <Link
            to="/"
            className="block px-4 py-2 text-slate-600 hover:text-[#2A15EB] hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
          >
            Página Inicial
          </Link>
        </div>
      </motion.div>

      {/* Categorias */}
      {categories.length > 0 && (
        <motion.div className="mb-8" variants={itemVariants}>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-[#2A15EB]" />
            Categorias
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategorySelect?.(category)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white shadow-md'
                    : 'text-slate-600 hover:text-[#2A15EB] hover:bg-blue-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <motion.div className="mb-8" variants={itemVariants}>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-emerald-600" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onCategorySelect?.(tag)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 font-medium ${
                  selectedCategory === tag
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Posts Recentes */}
      {recentPosts.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-[#2A15EB]" />
            Posts Recentes
          </h3>
          <div className="space-y-4">
            {recentPosts.slice(0, 5).map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="block group"
              >
                <div className="p-3 rounded-lg border border-slate-200 hover:border-[#2A15EB] hover:shadow-md transition-all duration-200">
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-[#2A15EB] line-clamp-2 mb-2">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>
                      {new Date(post.published_at).toLocaleDateString('pt-BR')}
                    </span>
                    {post.estimated_read_time_minutes && (
                      <>
                        <span>•</span>
                        <span>{post.estimated_read_time_minutes} min</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Newsletter */}
      <motion.div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg border border-blue-100" variants={itemVariants}>
        <h4 className="text-sm font-bold text-slate-800 mb-2">📧 Newsletter</h4>
        <p className="text-xs text-slate-600 mb-3">
          Receba nossos melhores conteúdos sobre vendas e tecnologia.
        </p>
        <Link
          to="/#newsletter"
          className="inline-block w-full text-center px-3 py-2 bg-gradient-to-r from-[#2A15EB] to-[#05D7FB] text-white text-xs font-semibold rounded-lg hover:shadow-md transition-all duration-200"
        >
          Inscrever-se
        </Link>
      </motion.div>
    </motion.aside>
  );
};

export default BlogSidebar;