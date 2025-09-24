require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

async function testSupabaseAuth() {
  console.log('=== Teste de Autenticação Supabase ===');
  
  // Verificar variáveis de ambiente
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Definida' : 'NÃO DEFINIDA');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Definida' : 'NÃO DEFINIDA');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente do Supabase não estão definidas');
    return;
  }
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Verificar se o usuário admin existe
    console.log('\n1. Verificando usuário admin...');
    const { data: users, error: selectError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@rgpulse.com');
    
    if (selectError) {
      console.error('❌ Erro ao buscar usuário:', selectError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Usuário admin não encontrado. Criando...');
      
      // Criar hash da senha
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const { data: newUser, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          email: 'admin@rgpulse.com',
          username: 'admin',
          password_hash: passwordHash,
          full_name: 'Administrador',
          role: 'admin',
          is_active: true
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao criar usuário:', insertError);
        return;
      }
      
      console.log('✅ Usuário admin criado com sucesso:', newUser.email);
    } else {
      const user = users[0];
      console.log('✅ Usuário admin encontrado:', user.email);
      console.log('   - ID:', user.id);
      console.log('   - Username:', user.username);
      console.log('   - Ativo:', user.is_active);
      console.log('   - Role:', user.role);
      
      // Testar senha
      console.log('\n2. Testando senha...');
      const isValidPassword = await bcrypt.compare('admin123', user.password_hash);
      console.log('   - Senha válida:', isValidPassword ? '✅ SIM' : '❌ NÃO');
      
      if (!isValidPassword) {
        console.log('\n3. Atualizando senha...');
        const newPasswordHash = await bcrypt.hash('admin123', 10);
        
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ password_hash: newPasswordHash })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('❌ Erro ao atualizar senha:', updateError);
        } else {
          console.log('✅ Senha atualizada com sucesso');
        }
      }
    }
    
    console.log('\n=== Teste concluído ===');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSupabaseAuth();