const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://yheraepvupdsimzjfbva.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXJhZXB2dXBkc2ltempmYnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY2MDMzNywiZXhwIjoyMDc0MjM2MzM3fQ.mMsAO87E_t1uvKMG0wIVMAPOqubkKbPHBiBQbInQ1FU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSchema() {
  try {
    console.log('🔄 Lendo arquivo de schema...');
    const schemaPath = path.join(__dirname, 'database', 'complete_schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Executando schema no Supabase...');
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📊 Total de comandos SQL: ${commands.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.length < 10) continue; // Pular comandos muito pequenos
      
      try {
        // Tentar executar o comando diretamente
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: command + ';' 
        });
        
        if (error) {
          console.log(`⚠️  Comando ${i + 1}: ${error.message}`);
          errors.push({ command: i + 1, error: error.message, sql: command.substring(0, 100) + '...' });
          errorCount++;
        } else {
          successCount++;
          if (i % 10 === 0) {
            console.log(`✅ Progresso: ${i + 1}/${commands.length} comandos executados`);
          }
        }
      } catch (err) {
        console.log(`❌ Erro no comando ${i + 1}: ${err.message}`);
        errors.push({ command: i + 1, error: err.message, sql: command.substring(0, 100) + '...' });
        errorCount++;
      }
      
      // Pequena pausa para não sobrecarregar o Supabase
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📈 Resumo da execução:`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total: ${successCount + errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n🔍 Detalhes dos erros:');
      errors.forEach(err => {
        console.log(`  - Comando ${err.command}: ${err.error}`);
        console.log(`    SQL: ${err.sql}`);
      });
    }
    
    if (errorCount === 0) {
      console.log('\n🎉 Schema criado com sucesso! Todas as tabelas foram criadas no Supabase.');
    } else {
      console.log('\n⚠️  Schema criado com alguns avisos. Verifique os logs acima.');
    }
    
    // Verificar se as tabelas principais foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    await verifyTables();
    
  } catch (error) {
    console.error('❌ Erro ao executar schema:', error.message);
    process.exit(1);
  }
}

async function verifyTables() {
  const expectedTables = [
    'posts',
    'admin_users', 
    'diagnostic_leads',
    'a2a_agents',
    'post_seo',
    'seo_global_settings',
    'scheduled_posts',
    'audit_logs'
  ];
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Tabela '${tableName}': ${error.message}`);
      } else {
        console.log(`✅ Tabela '${tableName}': OK`);
      }
    } catch (err) {
      console.log(`❌ Tabela '${tableName}': ${err.message}`);
    }
  }
}

// Executar o script
executeSchema();