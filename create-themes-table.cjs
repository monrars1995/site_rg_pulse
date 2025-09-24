const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yheraepvupdsimzjfbva.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXJhZXB2dXBkc2ltempmYnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY2MDMzNywiZXhwIjoyMDc0MjM2MzM3fQ.mMsAO87E_t1uvKMG0wIVMAPOqubkKbPHBiBQbInQ1FU'
);

async function createThemesTable() {
  console.log('🔧 Criando tabela themes no Supabase...');
  
  try {
    // Primeiro, verificar se a tabela já existe
    const { data: checkData, error: checkError } = await supabase
      .from('themes')
      .select('id')
      .limit(1);
      
    if (!checkError) {
      console.log('✅ Tabela themes já existe!');
      console.log('📊 Verificando dados existentes...');
      
      const { data: existingData, error: countError } = await supabase
        .from('themes')
        .select('id, name');
        
      if (!countError) {
        console.log(`📈 Encontrados ${existingData.length} temas na tabela`);
        if (existingData.length > 0) {
          console.log('🎯 Temas existentes:', existingData.map(t => t.name).join(', '));
        }
      }
      return;
    }
    
    console.log('📝 Tabela themes não existe, criando...');
    
    // Inserir dados diretamente usando o método insert
    // Como não podemos executar DDL, vamos assumir que a tabela existe e inserir dados
    const themesData = [
      {
        name: 'Inteligência Artificial',
        description: 'Posts sobre IA, machine learning e automação',
        prompt: 'Escreva um post informativo sobre inteligência artificial, focando em aplicações práticas para empresas. Use linguagem acessível mas técnica.',
        keywords: ['inteligência artificial', 'IA', 'machine learning', 'automação', 'tecnologia'],
        tone: 'professional',
        target_audience: 'Empresários e gestores de TI',
        guidelines: 'Mantenha o tom profissional, use exemplos práticos e evite jargões muito técnicos.',
        active: true
      },
      {
        name: 'Transformação Digital',
        description: 'Posts sobre digitalização e modernização de processos',
        prompt: 'Crie um artigo sobre transformação digital, abordando benefícios, desafios e estratégias para implementação em empresas.',
        keywords: ['transformação digital', 'digitalização', 'modernização', 'processos', 'inovação'],
        tone: 'consultative',
        target_audience: 'CEOs e diretores de empresas',
        guidelines: 'Foque em ROI, casos de sucesso e passos práticos para implementação.',
        active: true
      },
      {
        name: 'Chatbots e Atendimento',
        description: 'Posts sobre chatbots, atendimento automatizado e experiência do cliente',
        prompt: 'Desenvolva um post sobre como chatbots podem melhorar o atendimento ao cliente, incluindo benefícios e melhores práticas.',
        keywords: ['chatbot', 'atendimento', 'customer service', 'automação', 'experiência do cliente'],
        tone: 'friendly',
        target_audience: 'Gestores de atendimento e marketing',
        guidelines: 'Use exemplos de interações reais e destaque melhorias na experiência do cliente.',
        active: true
      }
    ];
    
    console.log('⚠️  A tabela themes precisa ser criada manualmente no Supabase SQL Editor');
    console.log('📋 Execute o seguinte SQL no Supabase:');
    console.log(`
CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  prompt TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  tone VARCHAR(100) DEFAULT 'professional',
  target_audience VARCHAR(255),
  content_examples TEXT[],
  guidelines TEXT,
  active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Política RLS para service_role
CREATE POLICY "Allow service role full access on themes" ON themes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
    `);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createThemesTable();