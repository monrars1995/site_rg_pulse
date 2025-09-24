const DatabaseConfig = require('./DatabaseConfig');
const SupabaseBlogRepository = require('./SupabaseBlogRepository');
const pino = require('pino')();

class BlogRepositoryFactory {
  static getRepository() {
    pino.info('[BlogRepositoryFactory] Usando Supabase como repositório de blog');
    return new SupabaseBlogRepository();
  }
}

// Singleton instance
let repositoryInstance = null;

function getBlogRepository() {
  if (!repositoryInstance) {
    repositoryInstance = BlogRepositoryFactory.getRepository();
  }
  return repositoryInstance;
}

module.exports = {
  getBlogRepository,
  BlogRepositoryFactory
};