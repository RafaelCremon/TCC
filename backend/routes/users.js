/**
 * ============================================================================
 * ROTAS DE USUÁRIOS - ESCOLA TCC
 * ============================================================================
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireRole, requirePermission, logActivity } = require('../middleware/auth');
const { validateUpdateUser, validateRegister, validateId } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// ============================================================================
// LISTAR USUÁRIOS (apenas admin)
// ============================================================================

router.get('/', requirePermission('manage_users'), async (req, res) => {
  try {
    const { limite = 50, pagina = 1, busca, role, status } = req.query;
    const offset = (pagina - 1) * limite;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Filtros
    if (busca) {
      paramCount++;
      whereClause += ` AND (u.nome ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      params.push(`%${busca}%`);
    }

    if (role) {
      paramCount++;
      whereClause += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND u.status = $${paramCount}`;
      params.push(status);
    }

    // Query principal
    const usersResult = await query(
      `SELECT 
        u.id, u.nome, u.email, u.username, u.role, u.telefone, u.status, 
        u.created_at, u.updated_at, u.ultimo_acesso,
        p.tema, p.ja_viu_boas_vindas,
        g.pontos, g.nivel, g.badges, g.streak_dias
       FROM usuarios u
       LEFT JOIN preferencias_usuario p ON u.id = p.usuario_id
       LEFT JOIN gamificacao_usuario g ON u.id = g.usuario_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limite, offset]
    );

    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM usuarios u ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPaginas = Math.ceil(total / limite);

    res.json({
      usuarios: usersResult.rows,
      paginacao: {
        pagina_atual: parseInt(pagina),
        total_paginas: totalPaginas,
        total_registros: total,
        registros_por_pagina: parseInt(limite)
      }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// BUSCAR USUÁRIO POR ID
// ============================================================================

router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se pode acessar: próprio perfil ou admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }

    const userResult = await query(
      `SELECT 
        u.id, u.nome, u.email, u.username, u.role, u.telefone, u.status,
        u.avatar_url, u.informacoes_adicionais, u.created_at, u.updated_at, u.ultimo_acesso,
        p.tema, p.ja_viu_boas_vindas, p.configuracoes as config_preferencias,
        g.pontos, g.nivel, g.badges, g.acoes, g.ultima_visita, g.streak_dias
       FROM usuarios u
       LEFT JOIN preferencias_usuario p ON u.id = p.usuario_id
       LEFT JOIN gamificacao_usuario g ON u.id = g.usuario_id
       WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      usuario: userResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// CRIAR USUÁRIO (apenas admin)
// ============================================================================

router.post('/', requirePermission('manage_users'), validateRegister, logActivity('create_user'), async (req, res) => {
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
        message: 'Usuário criado com sucesso',
        usuario: newUser
      });
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
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
// ATUALIZAR USUÁRIO
// ============================================================================

router.put('/:id', validateId, validateUpdateUser, logActivity('update_user'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, role, status, informacoes_adicionais } = req.body;
    
    // Verificar se pode editar: próprio perfil ou admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }

    // Usuários não-admin não podem alterar role e status
    const updateData = { nome, email, telefone, informacoes_adicionais };
    if (req.user.role === 'admin') {
      updateData.role = role;
      updateData.status = status;
    }

    // Remover campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar'
      });
    }

    // Verificar se usuário existe
    const existingUser = await query('SELECT id FROM usuarios WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Construir query dinâmica
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updateData).map(val => 
      typeof val === 'object' ? JSON.stringify(val) : val
    )];

    // Executar update
    const result = await query(
      `UPDATE usuarios 
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1
       RETURNING id, nome, email, username, role, telefone, status, updated_at`,
      values
    );

    res.json({
      message: 'Usuário atualizado com sucesso',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error.constraint === 'usuarios_email_key') {
      return res.status(409).json({
        error: 'Email já está em uso'
      });
    }
    
    if (error.constraint === 'usuarios_username_key') {
      return res.status(409).json({
        error: 'Username já está em uso'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// DELETAR USUÁRIO (apenas admin)
// ============================================================================

router.delete('/:id', validateId, requirePermission('manage_users'), logActivity('delete_user'), async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir auto-exclusão
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        error: 'Não é possível excluir seu próprio usuário'
      });
    }

    // Verificar se usuário existe
    const existingUser = await query('SELECT id, nome FROM usuarios WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Deletar usuário (cascade vai remover dados relacionados)
    await query('DELETE FROM usuarios WHERE id = $1', [id]);

    res.json({
      message: 'Usuário excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// PERFIL DO USUÁRIO ATUAL
// ============================================================================

router.get('/me/profile', async (req, res) => {
  try {
    const userResult = await query(
      `SELECT 
        u.id, u.nome, u.email, u.username, u.role, u.telefone, u.avatar_url,
        u.informacoes_adicionais, u.created_at, u.ultimo_acesso,
        p.tema, p.ja_viu_boas_vindas, p.configuracoes as config_preferencias,
        g.pontos, g.nivel, g.badges, g.acoes, g.ultima_visita, g.streak_dias
       FROM usuarios u
       LEFT JOIN preferencias_usuario p ON u.id = p.usuario_id
       LEFT JOIN gamificacao_usuario g ON u.id = g.usuario_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    res.json({
      usuario: userResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ESTATÍSTICAS DOS USUÁRIOS (apenas admin)
// ============================================================================

router.get('/stats/overview', requirePermission('view_reports'), async (req, res) => {
  try {
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(*) FILTER (WHERE status = 'active') as usuarios_ativos,
        COUNT(*) FILTER (WHERE status = 'inactive') as usuarios_inativos,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'professor') as professores,
        COUNT(*) FILTER (WHERE role = 'aluno') as alunos,
        COUNT(*) FILTER (WHERE role = 'responsavel') as responsaveis,
        COUNT(*) FILTER (WHERE ultimo_acesso >= NOW() - INTERVAL '7 days') as ativos_ultima_semana,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as novos_ultimo_mes
      FROM usuarios
    `);

    res.json({
      estatisticas: statsResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;