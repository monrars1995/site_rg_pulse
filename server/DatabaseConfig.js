const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class DatabaseConfig {
  constructor() {
    this.databaseType = 'supabase';
    this.client = null;
    this.init();
  }

  init() {
    this.initSupabase();
  }

  initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
      throw new Error('Supabase configuration missing');
    }

    // Configurações adicionais para melhorar a conectividade
    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'User-Agent': 'RGPulse-Server/1.0'
        }
      },
      // Configurações de rede para melhor conectividade
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    };

    this.client = createClient(supabaseUrl, supabaseKey, options);
    console.log('✅ Supabase client initialized successfully');
    
    // Teste de conectividade inicial
    this.testConnection();
  }

  async testConnection() {
    try {
      // Teste simples de conectividade
      const { data, error } = await this.client
        .from('posts')
        .select('id')
        .limit(1);
        
      if (error && !error.message.includes('relation "posts" does not exist')) {
        console.log('⚠️  Aviso de conectividade Supabase:', error.message);
      } else {
        console.log('🔗 Conectividade com Supabase verificada');
      }
    } catch (error) {
      console.log('ℹ️  Teste de conectividade será repetido nas próximas operações');
    }
  }

  getClient() {
    return this.client;
  }

  getDatabaseType() {
    return this.databaseType;
  }

  // Close database connection
  close() {
    // Supabase doesn't need explicit closing
  }
}

// Singleton instance
let databaseInstance = null;

function getDatabase() {
  if (!databaseInstance) {
    databaseInstance = new DatabaseConfig();
  }
  return databaseInstance;
}

module.exports = {
  DatabaseConfig,
  getDatabase
};