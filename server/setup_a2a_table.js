const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

async function setupA2ATable() {
  try {
    // Criar cliente Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Conectando ao Supabase...');

    // Criar a tabela a2a_agents
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS a2a_agents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        agent_id VARCHAR(255) NOT NULL UNIQUE,
        endpoint TEXT NOT NULL,
        api_key VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        description TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('Criando tabela a2a_agents...');
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.error('Erro ao criar tabela:', tableError);
      // Tentar método alternativo
      console.log('Tentando método alternativo...');
      
      // Usar o método de inserção para testar se a tabela existe
      const { error: testError } = await supabase
        .from('a2a_agents')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === '42P01') {
        console.log('Tabela não existe. Criando via SQL direto...');
        
        // Executar SQL diretamente
        const { error: directError } = await supabase
          .rpc('exec_sql', {
            sql: createTableSQL
          });
        
        if (directError) {
          console.error('Erro ao executar SQL direto:', directError);
          throw directError;
        }
      }
    }

    // Criar índices
    console.log('Criando índices...');
    const indexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_a2a_agents_agent_id ON a2a_agents(agent_id);',
      'CREATE INDEX IF NOT EXISTS idx_a2a_agents_status ON a2a_agents(status);',
      'CREATE INDEX IF NOT EXISTS idx_a2a_agents_created_at ON a2a_agents(created_at);'
    ];

    for (const indexSQL of indexesSQL) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (indexError) {
        console.warn('Aviso ao criar índice:', indexError.message);
      }
    }

    // Inserir agente padrão baseado no .env
    console.log('Inserindo agente padrão...');
    const defaultAgent = {
      name: 'Agent Principal',
      agent_id: process.env.A2A_AGENT_ID || '38c389f2-cb03-4bc0-8159-9d3a1e501989',
      endpoint: process.env.A2A_AGENT_BASE_URL || 'https://connectai.mysaas360.com/api/v1/a2a/38c389f2-cb03-4bc0-8159-9d3a1e501989',
      api_key: process.env.A2A_AGENT_API_KEY || '11366a65-1809-4e1f-8650-f2e7280dc81e',
      status: 'active',
      description: 'Agente principal migrado das variáveis de ambiente',
      usage_count: 0
    };

    // Verificar se o agente já existe
    const { data: existingAgent } = await supabase
      .from('a2a_agents')
      .select('id')
      .eq('agent_id', defaultAgent.agent_id)
      .single();

    if (!existingAgent) {
      const { data: newAgent, error: insertError } = await supabase
        .from('a2a_agents')
        .insert(defaultAgent)
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir agente padrão:', insertError);
      } else {
        console.log('Agente padrão criado com sucesso:', newAgent.id);
      }
    } else {
      console.log('Agente padrão já existe.');
    }

    // Verificar se a tabela foi criada corretamente
    const { data: agents, error: selectError } = await supabase
      .from('a2a_agents')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('Erro ao verificar tabela:', selectError);
    } else {
      console.log('Tabela criada com sucesso! Agentes encontrados:', agents.length);
      if (agents.length > 0) {
        console.log('Primeiro agente:', agents[0]);
      }
    }

    console.log('Setup concluído com sucesso!');

  } catch (error) {
    console.error('Erro durante o setup:', error);
    process.exit(1);
  }
}

// Executar o setup
setupA2ATable();