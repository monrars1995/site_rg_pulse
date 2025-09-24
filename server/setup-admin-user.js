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

async function setupAdminUser() {
  try {
    console.log('🔍 Verificando configuração do Supabase...');
    console.log('URL:', supabaseUrl);
    console.log('Service Key configurada:', supabaseServiceKey ? 'Sim' : 'Não');
    
    // Verificar se a tabela admin_users existe
    console.log('\n📋 Verificando tabela admin_users...');
    const { data: tables, error: tableError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela admin_users:', tableError.message);
      console.log('\n📝 Você precisa criar a tabela admin_users no Supabase.');
      console.log('Execute este SQL no Supabase SQL Editor:');
      console.log(`
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  login_attempts INTEGER DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
      return;
    }
    
    console.log('✅ Tabela admin_users encontrada');
    
    // Listar usuários existentes
    console.log('\n👥 Usuários existentes:');
    const { data: existingUsers, error: listError } = await supabase
      .from('admin_users')
      .select('id, email, username, full_name, role, is_active, created_at');
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Usuários encontrados:');
      existingUsers.forEach(user => {
        console.log(`- ${user.email} (${user.username}) - ${user.role} - Ativo: ${user.is_active}`);
      });
    } else {
      console.log('Nenhum usuário encontrado.');
    }
    
    // Perguntar se quer criar um novo usuário
    console.log('\n🔧 Opções disponíveis:');
    console.log('1. Criar novo usuário admin');
    console.log('2. Atualizar senha de usuário existente');
    console.log('3. Listar todos os usuários');
    
    // Para demonstração, vamos criar um usuário padrão
    const email = 'admin@rgpulse.com';
    const username = 'admin';
    const password = 'admin123';
    const fullName = 'Administrador RG Pulse';
    
    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      console.log(`\n👤 Usuário ${email} já existe.`);
      console.log('Atualizando senha...');
      
      const passwordHash = await bcrypt.hash(password, 10);
      
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ 
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError.message);
        return;
      }
      
      console.log('✅ Senha atualizada com sucesso!');
    } else {
      console.log(`\n➕ Criando usuário admin: ${email}`);
      
      const passwordHash = await bcrypt.hash(password, 10);
      
      const { data: newUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          id: crypto.randomUUID(),
          username,
          email,
          password_hash: passwordHash,
          full_name: fullName,
          role: 'admin',
          is_active: true,
          login_attempts: 0,
          two_factor_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError.message);
        return;
      }
      
      console.log('✅ Usuário criado com sucesso!');
      console.log('Dados do usuário:', {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      });
    }
    
    console.log('\n🔑 Credenciais para login:');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
    
    console.log('\n🌐 URLs para teste:');
    console.log('- Frontend: http://localhost:3000/admin/login');
    console.log('- Backend: http://localhost:3001');
    
    console.log('\n📝 Próximos passos:');
    console.log('1. Acesse a página de login do admin');
    console.log('2. Use as credenciais acima para fazer login');
    console.log('3. Altere a senha padrão após o primeiro login');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

setupAdminUser();