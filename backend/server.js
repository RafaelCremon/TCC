/**
 * ============================================================================
 * SERVIDOR PRINCIPAL - ESCOLA TCC BACKEND
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const preferencesRoutes = require('./routes/preferences');
const gamificationRoutes = require('./routes/gamification');
const shortcutsRoutes = require('./routes/shortcuts');
const eventsRoutes = require('./routes/events');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARES DE SEGURANÇA
// ============================================================================

// Helmet para segurança
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compressão
app.use(compression());

// Logs de requisições
app.use(morgan(process.env.LOG_FORMAT || 'combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de requests por IP
  message: {
    error: 'Muitas requisições deste IP, tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================================================
// MIDDLEWARES GERAIS
// ============================================================================

// CORS
app.use(cors({
  origin: [
    'http://localhost:8080', 
    'http://localhost:8081', 
    'http://127.0.0.1:8080', 
    'http://127.0.0.1:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

// ============================================================================
// ROTAS DA API
// ============================================================================

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/shortcuts', shortcutsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/logs', logsRoutes);

// ============================================================================
// MIDDLEWARE DE ERRO
// ============================================================================

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    method: req.method,
    url: req.originalUrl
  });
});

// Handler global de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err);

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.message
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado'
    });
  }

  // Erro genérico
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

const startServer = async () => {
  try {
    // Testar conexão com banco
    console.log('🔍 Testando conexão com banco de dados...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('🚀 ============================================');
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🚀 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`🚀 API: http://localhost:${PORT}/api`);
      console.log(`🚀 Health: http://localhost:${PORT}/api/health`);
      console.log('🚀 ============================================');
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Capturar sinais de encerramento
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT recebido, encerrando servidor...');
  process.exit(0);
});

// Iniciar aplicação
startServer();

module.exports = app;