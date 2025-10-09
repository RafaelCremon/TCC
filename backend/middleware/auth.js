/**
 * ============================================================================
 * MIDDLEWARE DE AUTENTICAÇÃO JWT
 * ============================================================================
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido' 
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se a sessão ainda existe no banco
    const sessionResult = await query(
      'SELECT * FROM sessoes_usuario WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Sessão expirada ou inválida' 
      });
    }

    // Buscar dados completos do usuário
    const userResult = await query(
      `SELECT u.*, p.tema, p.ja_viu_boas_vindas, g.pontos, g.nivel, g.badges
       FROM usuarios u
       LEFT JOIN preferencias_usuario p ON u.id = p.usuario_id
       LEFT JOIN gamificacao_usuario g ON u.id = g.usuario_id
       WHERE u.id = $1 AND u.status = 'active'`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado ou inativo' 
      });
    }

    // Adicionar dados do usuário na requisição
    req.user = userResult.rows[0];
    req.session = sessionResult.rows[0];
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado' 
      });
    }
    
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno na autenticação' 
    });
  }
};

// Middleware para verificar permissões por role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão insuficiente.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware para verificar permissão específica
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      // Verificar se o role tem a permissão
      const permissionResult = await query(
        'SELECT * FROM permissoes_role WHERE role = $1 AND permissao = $2 AND ativo = true',
        [req.user.role, permission]
      );

      if (permissionResult.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Acesso negado. Permissão insuficiente.',
          required: permission,
          role: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Erro na verificação de permissão:', error);
      return res.status(500).json({ 
        error: 'Erro interno na verificação de permissão' 
      });
    }
  };
};

// Middleware para logs de atividade
const logActivity = (action, getDetails) => {
  return async (req, res, next) => {
    // Executar o próximo middleware/rota primeiro
    const originalSend = res.send;
    
    res.send = function(data) {
      // Só registrar se a operação foi bem-sucedida
      if (res.statusCode < 400) {
        setImmediate(async () => {
          try {
            const details = typeof getDetails === 'function' 
              ? getDetails(req, res, data) 
              : getDetails || action;

            await query(
              `INSERT INTO logs_atividade (usuario_id, acao, detalhes, ip_address, user_agent, dados_extras)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                req.user?.id || null,
                action,
                details,
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent'),
                JSON.stringify({
                  method: req.method,
                  url: req.originalUrl,
                  params: req.params,
                  body: req.method !== 'GET' ? req.body : undefined
                })
              ]
            );
          } catch (error) {
            console.error('Erro ao registrar log de atividade:', error);
          }
        });
      }
      
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  logActivity
};