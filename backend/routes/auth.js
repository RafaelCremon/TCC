/**
 * ============================================================================
 * ROTAS DE AUTENTICAÇÃO - ESCOLA TCC
 * ============================================================================
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../config/database');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { authenticateToken, logActivity } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// LOGIN
// ============================================================================

router.post('/login', validateLogin, logActivity('login'), async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Buscar usuário no banco
    const userResult = await query(
      `SELECT u.*, p.tema, p.ja_viu_boas_vindas, g.pontos_totais, g.nivel, g.badges, g.streak_atual
       FROM usuarios u
       LEFT JOIN preferencias_usuario p ON u.id = p.usuario_id
       LEFT JOIN gamificacao_usuario g ON u.id = g.usuario_id
       WHERE (u.username = $1 OR u.email = $1) AND u.status = 'active'`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    const user = userResult.rows[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(password, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Salvar sessão no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await query(
      `INSERT INTO sessoes_usuario (usuario_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, token, expiresAt, ip, userAgent]
    );

    // Atualizar último acesso
    await query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Remover dados sensíveis
    delete user.password_hash;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        username: user.username,
        role: user.role,
        telefone: user.telefone,
        avatar_url: user.avatar_url,
        tema: user.tema || 'light',
        ja_viu_boas_vindas: user.ja_viu_boas_vindas || false,
        pontos: user.pontos || 0,
        nivel: user.nivel || 1,
        badges: user.badges || [],
        streak_dias: user.streak_dias || 0
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// REGISTRO
// ============================================================================

router.post('/register', validateRegister, logActivity('register'), async (req, res) => {
  try {
    const {
      nome,
      email,
      username,
      password,
      role = 'aluno',
      telefone,
      informacoes_adicionais = {}
    } = req.body;

    await transaction(async (client) => {
      // Verificar se email ou username já existem
      const existingUser = await client.query(
        'SELECT id FROM usuarios WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Email ou username já cadastrado');
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

      // Inserir usuário
      const userResult = await client.query(
        `INSERT INTO usuarios (nome, email, username, password_hash, role, telefone, informacoes_adicionais)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, nome, email, username, role, telefone, created_at`,
        [nome, email, username, passwordHash, role, telefone, JSON.stringify(informacoes_adicionais)]
      );

      const newUser = userResult.rows[0];

      // Criar preferências padrão
      await client.query(
        'INSERT INTO preferencias_usuario (usuario_id, tema, ja_viu_boas_vindas) VALUES ($1, $2, $3)',
        [newUser.id, 'light', false]
      );

      // Criar gamificação padrão
      await client.query(
        'INSERT INTO gamificacao_usuario (usuario_id, pontos, nivel, badges, acoes) VALUES ($1, $2, $3, $4, $5)',
        [newUser.id, 0, 1, JSON.stringify([]), JSON.stringify({})]
      );

      res.status(201).json({
        message: 'Usuário cadastrado com sucesso',
        user: newUser
      });
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    
    if (error.message === 'Email ou username já cadastrado') {
      return res.status(409).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// LOGOUT
// ============================================================================

router.post('/logout', authenticateToken, logActivity('logout'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    // Remover sessão do banco
    await query(
      'DELETE FROM sessoes_usuario WHERE token = $1',
      [token]
    );

    res.json({
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// VERIFICAR TOKEN
// ============================================================================

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Se chegou até aqui, o token é válido
    const user = req.user;
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        username: user.username,
        role: user.role,
        telefone: user.telefone,
        avatar_url: user.avatar_url,
        tema: user.tema || 'light',
        ja_viu_boas_vindas: user.ja_viu_boas_vindas || false,
        pontos: user.pontos || 0,
        nivel: user.nivel || 1,
        badges: user.badges || [],
        streak_dias: user.streak_dias || 0
      }
    });

  } catch (error) {
    console.error('Erro na verificação de token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ALTERAR SENHA
// ============================================================================

router.put('/change-password', authenticateToken, logActivity('change_password'), async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Validar entrada
    if (!current_password || !new_password) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        error: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar senha atual
    const userResult = await query(
      'SELECT password_hash FROM usuarios WHERE id = $1',
      [userId]
    );

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!senhaValida) {
      return res.status(401).json({
        error: 'Senha atual incorreta'
      });
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Atualizar senha
    await query(
      'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;