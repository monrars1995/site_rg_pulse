const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🔧 Criando usuário admin no Supabase...');
    
    // Dados do usuário admin
    const adminData = {
      email: 'admin@rgpulse.com',
      username: 'admin',
      password: 'RGPulse2024!',
      fullName: 'Administrador RG Pulse',
      role: 'admin'
    };
    
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`👤 Username: ${adminData.username}`);
    console.log(`🔑 Senha: ${adminData.password}`);
    
    console.log('\n🔍 Verificando se o usuário já existe...');
    
    // Verificar se o usuário já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', adminData.email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log('⚠️  Aviso ao verificar usuário:', checkError.message);
      console.log('🔄 Continuando com a criação...');
    }
    
    if (existingUser) {
      console.log('👤 Usuário já existe. Atualizando senha...');
      
      // Atualizar senha do usuário existente
      const passwordHash = await bcrypt.hash(adminData.password, 10);
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('admin_users')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('email', adminData.email)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError.message);
        return;
      }
      
      console.log('✅ Senha do usuário atualizada com sucesso!');
    } else {
      console.log('➕ Criando novo usuário admin...');
      
      // Criar hash da senha
      const passwordHash = await bcrypt.hash(adminData.password, 10);
      
      // Criar novo usuário
      const { data: newUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          id: crypto.randomUUID(),
          username: adminData.username,
          email: adminData.email,
          password_hash: passwordHash,
          full_name: adminData.fullName,
          role: adminData.role,
          is_active: true,
          login_attempts: 0,
          two_factor_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        if (createError.code === '42P01') {
          console.log('❌ Tabela admin_users não existe. Execute o schema completo primeiro:');
          console.log('📖 Consulte: SUPABASE_MANUAL_SETUP.md');
          console.log('🔧 Ou execute: node ../setup-supabase-schema.cjs');
          return;
        }
        console.error('❌ Erro ao criar usuário:', createError.message);
        return;
      }
      
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('📊 Dados do usuário:', {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      });
    }
    
    console.log('\n🎉 Configuração do admin concluída!');
    console.log('🔐 Credenciais de acesso:');
    console.log(`   📧 Email: ${adminData.email}`);
    console.log(`   👤 Username: ${adminData.username}`);
    console.log(`   🔑 Senha: ${adminData.password}`);
    console.log('\n🌐 Acesse o painel admin em: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    
    if (error.message.includes('fetch failed')) {
      console.log('🔗 Problema de conectividade com Supabase');
      console.log('💡 Verifique se as credenciais estão corretas no .env');
      console.log('🌐 Verifique se o Supabase está acessível');
    }
  }
}

// Função para testar a conexão
async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Tabela admin_users não existe');
        return false;
      }
      console.log('⚠️  Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase OK');
    return true;
  } catch (error) {
    console.log('❌ Falha na conexão:', error.message);
    return false;
  }
}

// Executar o script
async function main() {
  const connected = await testConnection();
  
  if (connected) {
    await createAdminUser();
  } else {
    console.log('\n💡 Para resolver problemas de conexão:');
    console.log('1. Verifique as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
    console.log('2. Execute o schema completo: node ../setup-supabase-schema.cjs');
    console.log('3. Consulte: SUPABASE_MANUAL_SETUP.md');
  }
}

main()
  .then(() => {
    console.log('\n🏁 Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });