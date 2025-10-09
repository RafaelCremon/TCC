/**
 * Script para gerar hash da senha e atualizar usuário admin
 */

const bcrypt = require('bcrypt');
const { query } = require('./config/database');

async function createAdminUser() {
  try {
    console.log('🔧 Gerando hash da senha...');
    
    // Gerar hash da senha "123456"
    const saltRounds = 12;
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Hash gerado:', hashedPassword);
    
    // Atualizar ou inserir usuário admin
    const result = await query(`
      INSERT INTO usuarios (nome, email, username, senha_hash, role) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) 
      DO UPDATE SET senha_hash = $4
      RETURNING id, nome, username, role;
    `, [
      'Administrador',
      'admin@escola.com', 
      'admin',
      hashedPassword,
      'admin'
    ]);
    
    console.log('✅ Usuário admin criado/atualizado:', result.rows[0]);
    
    // Verificar se existe preferências e gamificação
    await query(`
      INSERT INTO preferencias_usuario (usuario_id) 
      VALUES ($1) 
      ON CONFLICT (usuario_id) DO NOTHING
    `, [result.rows[0].id]);
    
    await query(`
      INSERT INTO gamificacao_usuario (usuario_id) 
      VALUES ($1) 
      ON CONFLICT (usuario_id) DO NOTHING
    `, [result.rows[0].id]);
    
    console.log('✅ Preferências e gamificação configuradas');
    console.log('🎯 Login disponível: username=admin, password=123456');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createAdminUser();