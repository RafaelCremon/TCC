/**
 * ============================================================================
 * CONFIGURAÇÃO DO BANCO DE DADOS - POSTGRESQL
 * ============================================================================
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'escola_tcc',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento quando uma conexão é criada
pool.on('connect', () => {
  console.log('💾 Nova conexão estabelecida com PostgreSQL');
});

// Evento para erros no pool
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar com PostgreSQL:', err.message);
    return false;
  }
};

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Erro na query:', { text, error: err.message });
    throw err;
  }
};

// Função para transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};