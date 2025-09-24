// Definições de tipo para o Blog

export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  cover_image_url?: string;
  estimated_read_time_minutes?: number;
  tags?: string[]; // Vem como string JSON do backend, mas o repo já faz o parse
  published_at: string; // Data como string ISO
}

export interface BlogPostDetail extends BlogPostSummary {
  content_markdown: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedBlogPosts {
  posts: BlogPostSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    limit: number;
  };
}
