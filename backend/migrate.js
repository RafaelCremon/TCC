/**
 * ============================================================================
 * SISTEMA DE MIGRAÇÕES - ESCOLA TCC
 * ============================================================================
 */

const { query } = require('./config/database');
const fs = require('fs').promises;
const path = require('path');

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  // Criar tabela de migrações se não existir
  async createMigrationsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await query(createTableQuery);
    console.log('✅ Tabela de migrações criada/verificada');
  }

  // Buscar migrações já executadas
  async getExecutedMigrations() {
    const result = await query('SELECT filename FROM migrations ORDER BY executed_at');
    return result.rows.map(row => row.filename);
  }

  // Buscar arquivos de migração
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.log('📁 Diretório de migrações não encontrado, criando...');
      await fs.mkdir(this.migrationsPath, { recursive: true });
      return [];
    }
  }

  // Executar uma migração
  async executeMigration(filename) {
    const filepath = path.join(this.migrationsPath, filename);
    const sql = await fs.readFile(filepath, 'utf8');
    
    try {
      // Executar migração em transação
      await query('BEGIN');
      
      // Executar SQL da migração
      await query(sql);
      
      // Marcar como executada
      await query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      );
      
      await query('COMMIT');
      console.log(`✅ Migração executada: ${filename}`);
      
    } catch (error) {
      await query('ROLLBACK');
      throw new Error(`Erro ao executar migração ${filename}: ${error.message}`);
    }
  }

  // Executar todas as migrações pendentes
  async runPendingMigrations() {
    console.log('🔄 Iniciando sistema de migrações...');
    
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Nenhuma migração pendente');
      return;
    }
    
    console.log(`📋 ${pendingMigrations.length} migração(ões) pendente(s):`);
    pendingMigrations.forEach(file => console.log(`   - ${file}`));
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
    
    console.log('🎉 Todas as migrações foram executadas com sucesso!');
  }

  // Criar nova migração
  async createMigration(name) {
    const timestamp = new Date().toISOString()
      .replace(/[:-]/g, '')
      .split('.')[0];
    
    const filename = `${timestamp}_${name}.sql`;
    const filepath = path.join(this.migrationsPath, filename);
    
    const template = `-- Migração: ${name}
-- Criado em: ${new Date().toISOString()}

-- Escreva seu SQL aqui
-- Exemplo:
-- ALTER TABLE usuarios ADD COLUMN nova_coluna VARCHAR(255);

-- Lembre-se:
-- 1. Use transações quando necessário
-- 2. Sempre teste em ambiente de desenvolvimento primeiro
-- 3. Faça backup antes de executar em produção
`;
    
    await fs.mkdir(this.migrationsPath, { recursive: true });
    await fs.writeFile(filepath, template);
    
    console.log(`✅ Nova migração criada: ${filename}`);
    console.log(`📝 Edite o arquivo: ${filepath}`);
  }

  // Status das migrações
  async status() {
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    console.log('\n📊 STATUS DAS MIGRAÇÕES');
    console.log('========================');
    
    if (migrationFiles.length === 0) {
      console.log('📁 Nenhum arquivo de migração encontrado');
      return;
    }
    
    migrationFiles.forEach(file => {
      const isExecuted = executedMigrations.includes(file);
      const status = isExecuted ? '✅ Executada' : '⏳ Pendente';
      console.log(`${status} - ${file}`);
    });
    
    const pendingCount = migrationFiles.length - executedMigrations.length;
    console.log(`\n📋 Total: ${migrationFiles.length} migração(ões)`);
    console.log(`✅ Executadas: ${executedMigrations.length}`);
    console.log(`⏳ Pendentes: ${pendingCount}`);
  }
}

// Interface de linha de comando
async function main() {
  const migrationRunner = new MigrationRunner();
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'run':
        await migrationRunner.runPendingMigrations();
        break;
        
      case 'create':
        if (!arg) {
          console.error('❌ Nome da migração é obrigatório');
          console.log('Uso: node migrate.js create nome_da_migracao');
          process.exit(1);
        }
        await migrationRunner.createMigration(arg);
        break;
        
      case 'status':
        await migrationRunner.status();
        break;
        
      default:
        console.log('🔧 SISTEMA DE MIGRAÇÕES - ESCOLA TCC');
        console.log('');
        console.log('Comandos disponíveis:');
        console.log('  run     - Executar migrações pendentes');
        console.log('  create  - Criar nova migração');
        console.log('  status  - Ver status das migrações');
        console.log('');
        console.log('Exemplos:');
        console.log('  node migrate.js run');
        console.log('  node migrate.js create add_new_column');
        console.log('  node migrate.js status');
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MigrationRunner;