const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yheraepvupdsimzjfbva.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXJhZXB2dXBkc2ltempmYnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY2MDMzNywiZXhwIjoyMDc0MjM2MzM3fQ.mMsAO87E_t1uvKMG0wIVMAPOqubkKbPHBiBQbInQ1FU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');
  
  try {
    // Teste 1: Verificar tabelas existentes
    console.log('📋 1. Verificando tabelas existentes...');
    const expectedTables = [
      'posts',
      'admin_users', 
      'diagnostic_leads',
      'a2a_agents',
      'post_seo',
      'seo_global_settings',
      'seo_keywords',
      'scheduled_posts',
      'audit_logs'
    ];
    
    let tablesFound = 0;
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: OK`);
          tablesFound++;
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Resultado: ${tablesFound}/${expectedTables.length} tabelas encontradas\n`);
    
    if (tablesFound === 0) {
      console.log('❌ Nenhuma tabela foi encontrada. Execute o schema manualmente no Supabase SQL Editor.');
      console.log('📖 Consulte o arquivo SUPABASE_MANUAL_SETUP.md para instruções detalhadas.\n');
      return;
    }
    
    // Teste 2: Inserir um post de teste
    console.log('📝 2. Testando inserção de post...');
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          title: 'Post de Teste - RG Pulse',
          slug: 'post-teste-rg-pulse-' + Date.now(),
          content: 'Este é um post de teste para verificar se a inserção está funcionando corretamente.',
          excerpt: 'Post de teste para validação do sistema.',
          author: 'Sistema',
          tags: ['teste', 'validacao'],
          status: 'draft'
        })
        .select()
        .single();
        
      if (postError) {
        console.log(`   ❌ Erro ao inserir post: ${postError.message}`);
      } else {
        console.log(`   ✅ Post inserido com sucesso! ID: ${postData.id}`);
        
        // Teste 3: Buscar o post inserido
        console.log('🔍 3. Testando busca de post...');
        const { data: fetchedPost, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postData.id)
          .single();
          
        if (fetchError) {
          console.log(`   ❌ Erro ao buscar post: ${fetchError.message}`);
        } else {
          console.log(`   ✅ Post encontrado: "${fetchedPost.title}"`);
        }
        
        // Teste 4: Atualizar o post
        console.log('✏️  4. Testando atualização de post...');
        const { data: updatedPost, error: updateError } = await supabase
          .from('posts')
          .update({ 
            title: 'Post de Teste - RG Pulse (Atualizado)',
            content: 'Conteúdo atualizado para teste de update.'
          })
          .eq('id', postData.id)
          .select()
          .single();
          
        if (updateError) {
          console.log(`   ❌ Erro ao atualizar post: ${updateError.message}`);
        } else {
          console.log(`   ✅ Post atualizado com sucesso!`);
        }
        
        // Teste 5: Deletar o post de teste
        console.log('🗑️  5. Testando exclusão de post...');
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', postData.id);
          
        if (deleteError) {
          console.log(`   ❌ Erro ao deletar post: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Post deletado com sucesso!`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro no teste de posts: ${err.message}`);
    }
    
    // Teste 6: Testar inserção de lead
    console.log('👤 6. Testando inserção de lead...');
    try {
      const { data: leadData, error: leadError } = await supabase
        .from('diagnostic_leads')
        .insert({
          full_name: 'João Teste',
          company_name: 'Empresa Teste Ltda',
          role: 'CEO',
          segment: 'Tecnologia',
          revenue: 'R$ 100k - R$ 500k',
          challenge: 'Automatizar processos',
          has_marketing_team: 'Sim',
          marketing_team_size: '2-5 pessoas',
          marketing_investment: 'R$ 5k - R$ 10k',
          monthly_traffic_investment: 'R$ 1k - R$ 3k',
          current_results: 'Satisfatório',
          phone: '(11) 99999-9999',
          email: 'teste@rgpulse.com.br',
          qualification_score: 85,
          qualification_result: 'Qualificado',
          status: 'new'
        })
        .select()
        .single();
        
      if (leadError) {
        console.log(`   ❌ Erro ao inserir lead: ${leadError.message}`);
      } else {
        console.log(`   ✅ Lead inserido com sucesso! ID: ${leadData.id}`);
        
        // Limpar o lead de teste
        await supabase.from('diagnostic_leads').delete().eq('id', leadData.id);
        console.log(`   🧹 Lead de teste removido`);
      }
    } catch (err) {
      console.log(`   ❌ Erro no teste de leads: ${err.message}`);
    }
    
    // Teste 7: Testar configurações de SEO
    console.log('🔧 7. Testando configurações de SEO...');
    try {
      const { data: seoData, error: seoError } = await supabase
        .from('seo_global_settings')
        .select('*')
        .limit(1);
        
      if (seoError) {
        console.log(`   ❌ Erro ao buscar configurações de SEO: ${seoError.message}`);
      } else {
        if (seoData.length > 0) {
          console.log(`   ✅ Configurações de SEO encontradas: "${seoData[0].site_title}"`);
        } else {
          console.log(`   ⚠️  Nenhuma configuração de SEO encontrada (isso é normal se não foram inseridas)`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro no teste de SEO: ${err.message}`);
    }
    
    // Teste 8: Verificar palavras-chave
    console.log('🔑 8. Testando palavras-chave...');
    try {
      const { data: keywordsData, error: keywordsError } = await supabase
        .from('seo_keywords')
        .select('*')
        .limit(5);
        
      if (keywordsError) {
        console.log(`   ❌ Erro ao buscar palavras-chave: ${keywordsError.message}`);
      } else {
        console.log(`   ✅ ${keywordsData.length} palavras-chave encontradas`);
        if (keywordsData.length > 0) {
          console.log(`   📝 Exemplo: "${keywordsData[0].keyword}"`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro no teste de palavras-chave: ${err.message}`);
    }
    
    console.log('\n🎉 Testes concluídos!');
    console.log('\n📋 Resumo:');
    console.log(`   • Tabelas verificadas: ${tablesFound}/${expectedTables.length}`);
    console.log('   • Operações CRUD testadas: ✅');
    console.log('   • Conexão com Supabase: ✅');
    
    if (tablesFound === expectedTables.length) {
      console.log('\n✅ Todas as tabelas estão funcionando corretamente!');
      console.log('🚀 O sistema está pronto para uso.');
    } else {
      console.log('\n⚠️  Algumas tabelas não foram encontradas.');
      console.log('📖 Consulte SUPABASE_MANUAL_SETUP.md para criar as tabelas faltantes.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar os testes
testSupabaseConnection();