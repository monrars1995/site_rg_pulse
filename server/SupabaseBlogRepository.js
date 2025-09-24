const { getDatabase } = require('./DatabaseConfig');

class SupabaseBlogRepository {
  constructor() {
    this.db = getDatabase();
    this.client = this.db.getClient();
  }

  // Create posts table if it doesn't exist
  async initializeSchema() {
    try {
      // Check if posts table exists
      const { data: tables, error } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'posts')
        .eq('table_schema', 'public');

      if (error && !error.message.includes('relation "information_schema.tables" does not exist')) {
        throw error;
      }

      // If table doesn't exist, create it
      if (!tables || tables.length === 0) {
        console.log('Creating posts table in Supabase...');
        // Note: In production, you should use Supabase migrations instead
        // This is a fallback for development
        const { error: createError } = await this.client.rpc('create_posts_table');
        if (createError) {
          console.log('Posts table might already exist or RPC function not available');
        }
      }
    } catch (error) {
      console.error('Error initializing Supabase schema:', error);
      // Don't throw here, let the app continue with existing schema
    }
  }

  async createPost(postData) {
    try {
      const postToInsert = {
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.summary || postData.excerpt,
        content: postData.content_markdown || postData.content,
        featured_image: postData.cover_image_url || postData.featured_image,
        estimated_read_time: postData.estimated_read_time_minutes || postData.estimated_read_time || 5,
        tags: postData.tags || [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('posts')
        .insert([postToInsert])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.formatPostFromSupabase(data);
    } catch (error) {
      console.error('Error creating post in Supabase:', error);
      throw error;
    }
  }

  async getPostBySlug(slug) {
    try {
      const { data, error } = await this.client
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Post not found
        }
        throw error;
      }

      return this.formatPostFromSupabase(data);
    } catch (error) {
      console.error('Error getting post by slug from Supabase:', error);
      throw error;
    }
  }

  async getAllPosts(limit = 50, offset = 0) {
    try {
      const { data, error } = await this.client
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data.map(post => this.formatPostFromSupabase(post));
    } catch (error) {
      console.error('Error getting all posts from Supabase:', error);
      throw error;
    }
  }

  // Nova função para admin que retorna TODOS os posts (incluindo drafts)
  async getAllPostsForAdmin(limit = 1000, offset = 0) {
    try {
      const { data, error } = await this.client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data.map(post => this.formatPostFromSupabase(post));
    } catch (error) {
      console.error('Error getting all posts for admin from Supabase:', error);
      throw error;
    }
  }

  async getPostById(id) {
    try {
      const { data, error } = await this.client
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Post not found
        }
        throw error;
      }

      return this.formatPostFromSupabase(data);
    } catch (error) {
      console.error('Error getting post by ID from Supabase:', error);
      throw error;
    }
  }

  async updatePost(id, postData) {
    try {
      const postToUpdate = {
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.summary || postData.excerpt,
        content: postData.content_markdown || postData.content,
        featured_image: postData.cover_image_url || postData.featured_image,
        estimated_read_time: postData.estimated_read_time_minutes || postData.estimated_read_time,
        tags: postData.tags,
        status: postData.status || 'published',
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(postToUpdate).forEach(key => {
        if (postToUpdate[key] === undefined) {
          delete postToUpdate[key];
        }
      });

      const { data, error } = await this.client
        .from('posts')
        .update(postToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.formatPostFromSupabase(data);
    } catch (error) {
      console.error('Error updating post in Supabase:', error);
      throw error;
    }
  }

  async deletePost(id) {
    try {
      const { error } = await this.client
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting post from Supabase:', error);
      throw error;
    }
  }

  async searchPosts(query, limit = 20, offset = 0) {
    try {
      const { data, error } = await this.client
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data.map(post => this.formatPostFromSupabase(post));
    } catch (error) {
      console.error('Error searching posts in Supabase:', error);
      throw error;
    }
  }

  async getPostsByTag(tag, limit = 20, offset = 0) {
    try {
      const { data, error } = await this.client
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .contains('tags', [tag])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data.map(post => this.formatPostFromSupabase(post));
    } catch (error) {
      console.error('Error getting posts by tag from Supabase:', error);
      throw error;
    }
  }

  async getPostsPaginated(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Primeiro, obter o total de posts
      const { count, error: countError } = await this.client
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      if (countError) {
        console.error('Error getting posts count from Supabase:', countError);
        // Retornar resposta padrão em caso de erro
        return {
          posts: [],
          pagination: {
            page: 1,
            limit: limit,
            totalPages: 0,
            totalPosts: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      }

      // Obter os posts da página
      const { data, error } = await this.client
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting paginated posts from Supabase:', error);
        // Retornar resposta padrão em caso de erro
        return {
          posts: [],
          pagination: {
            page: 1,
            limit: limit,
            totalPages: 0,
            totalPosts: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      }

      const posts = data.map(post => this.formatPostFromSupabase(post));

      return {
        posts,
        pagination: {
          page,
          limit,
          totalPosts: count,
          totalPages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting paginated posts from Supabase:', error);
      // Retornar resposta padrão em caso de erro de rede
      return {
        posts: [],
        pagination: {
          page: 1,
          limit: limit,
          totalPages: 0,
          totalPosts: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }

  // Helper method to format post data from Supabase to match expected format
  formatPostFromSupabase(supabasePost) {
    return {
      id: supabasePost.id,
      title: supabasePost.title,
      slug: supabasePost.slug,
      summary: supabasePost.excerpt,
      content_markdown: supabasePost.content,
      cover_image_url: supabasePost.featured_image,
      estimated_read_time_minutes: supabasePost.estimated_read_time,
      tags: supabasePost.tags || [],
      status: supabasePost.status,
      created_at: supabasePost.created_at,
      updated_at: supabasePost.updated_at,
      published_at: supabasePost.created_at // Usando created_at como published_at para compatibilidade
    };
  }

  // Helper method to format post data from expected format to Supabase
  formatPostToSupabase(postData) {
    return {
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.summary,
      content: postData.content_markdown,
      featured_image: postData.cover_image_url,
      estimated_read_time: postData.estimated_read_time_minutes,
      tags: postData.tags || [],
      status: postData.status || 'published'
    };
  }
}

module.exports = SupabaseBlogRepository;