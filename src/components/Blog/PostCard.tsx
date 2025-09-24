import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPostSummary } from '../../types/blog'; // Importando a interface

interface PostCardProps {
  post: BlogPostSummary;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl transform group-hover:-translate-y-1">
        {post.cover_image_url && (
          <img 
            src={post.cover_image_url} 
            alt={post.title} 
            className="w-full h-48 object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        )}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {post.title}
          </h2>
          {post.summary && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
              {post.summary}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags && post.tags.map((tag, index) => (
              <span 
                key={index} 
                className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 text-xs font-semibold rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span>{new Date(post.published_at).toLocaleDateString()}</span>
            {post.estimated_read_time_minutes && (
              <span className="mx-2">•</span>
            )}
            {post.estimated_read_time_minutes && (
              <span>{post.estimated_read_time_minutes} min de leitura</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
