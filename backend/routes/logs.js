/**
 * ============================================================================
 * ROTAS DE LOGS DE ATIVIDADE - ESCOLA TCC
 * ============================================================================
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// ============================================================================
// LISTAR LOGS DE ATIVIDADE (admin only)
// ============================================================================

router.get('/', requirePermission('view_logs'), async (req, res) => {
  try {
    const { 
      limite = 50, 
      pagina = 1, 
      usuario_id,
      acao,
      data_inicio,
      data_fim,
      endpoint
    } = req.query;
    
    const offset = (pagina - 1) * limite;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Filtros
    if (usuario_id) {
      paramCount++;
      whereClause += ` AND l.usuario_id = $${paramCount}`;
      params.push(usuario_id);
    }

    if (acao) {
      paramCount++;
      whereClause += ` AND l.acao = $${paramCount}`;
      params.push(acao);
    }

    if (endpoint) {
      paramCount++;
      whereClause += ` AND l.endpoint ILIKE $${paramCount}`;
      params.push(`%${endpoint}%`);
    }

    if (data_inicio) {
      paramCount++;
      whereClause += ` AND l.timestamp >= $${paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      paramCount++;
      whereClause += ` AND l.timestamp <= $${paramCount}`;
      params.push(data_fim);
    }

    // Query principal
    const logs = await query(
      `SELECT 
        l.id,
        l.usuario_id,
        u.nome as usuario_nome,
        u.email as usuario_email,
        l.acao,
        l.endpoint,
        l.metodo_http,
        l.dados_alterados,
        l.ip_address,
        l.user_agent,
        l.timestamp
       FROM logs_atividade l
       LEFT JOIN usuarios u ON l.usuario_id = u.id
       ${whereClause}
       ORDER BY l.timestamp DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limite, offset]
    );

    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM logs_atividade l ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPaginas = Math.ceil(total / limite);

    res.json({
      logs: logs.rows,
      paginacao: {
        pagina_atual: parseInt(pagina),
        total_paginas: totalPaginas,
        total_registros: total,
        registros_por_pagina: parseInt(limite)
      }
    });

  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// LOGS DE UM USUÁRIO ESPECÍFICO
// ============================================================================

router.get('/usuario/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 50, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    // Se não for admin, só pode ver seus próprios logs
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        error: 'Sem permissão para visualizar logs de outros usuários'
      });
    }

    const logs = await query(
      `SELECT 
        l.id,
        l.acao,
        l.endpoint,
        l.metodo_http,
        l.dados_alterados,
        l.ip_address,
        l.timestamp
       FROM logs_atividade l
       WHERE l.usuario_id = $1
       ORDER BY l.timestamp DESC
       LIMIT $2 OFFSET $3`,
      [id, limite, offset]
    );

    // Contar total
    const countResult = await query(
      'SELECT COUNT(*) as total FROM logs_atividade WHERE usuario_id = $1',
      [id]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPaginas = Math.ceil(total / limite);

    res.json({
      logs: logs.rows,
      paginacao: {
        pagina_atual: parseInt(pagina),
        total_paginas: totalPaginas,
        total_registros: total,
        registros_por_pagina: parseInt(limite)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// BUSCAR LOG POR ID
// ============================================================================

router.get('/:id', validateId, requirePermission('view_logs'), async (req, res) => {
  try {
    const { id } = req.params;

    const log = await query(
      `SELECT 
        l.*,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.role as usuario_role
       FROM logs_atividade l
       LEFT JOIN usuarios u ON l.usuario_id = u.id
       WHERE l.id = $1`,
      [id]
    );

    if (log.rows.length === 0) {
      return res.status(404).json({
        error: 'Log não encontrado'
      });
    }

    res.json({
      log: log.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar log:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ESTATÍSTICAS DE LOGS
// ============================================================================

router.get('/admin/stats', requirePermission('view_reports'), async (req, res) => {
  try {
    const { periodo = '7d' } = req.query;

    let whereClause = '';
    if (periodo === '24h') {
      whereClause = "WHERE timestamp >= NOW() - INTERVAL '24 hours'";
    } else if (periodo === '7d') {
      whereClause = "WHERE timestamp >= NOW() - INTERVAL '7 days'";
    } else if (periodo === '30d') {
      whereClause = "WHERE timestamp >= NOW() - INTERVAL '30 days'";
    } else if (periodo === '90d') {
      whereClause = "WHERE timestamp >= NOW() - INTERVAL '90 days'";
    }

    // Estatísticas gerais
    const statsGerais = await query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT usuario_id) as usuarios_ativos,
        COUNT(*) FILTER (WHERE acao = 'login') as total_logins,
        COUNT(*) FILTER (WHERE acao = 'logout') as total_logouts,
        COUNT(*) FILTER (WHERE acao = 'create_user') as usuarios_criados,
        COUNT(*) FILTER (WHERE acao = 'update_profile') as perfis_atualizados,
        COUNT(*) FILTER (WHERE acao = 'change_password') as senhas_alteradas,
        COUNT(*) FILTER (WHERE acao = 'view_shortcuts') as visualizacoes_atalhos,
        COUNT(*) FILTER (WHERE acao = 'create_event') as eventos_criados,
        COUNT(*) FILTER (WHERE acao = 'update_event') as eventos_atualizados
      FROM logs_atividade
      ${whereClause}
    `);

    // Logs por dia (últimos 30 dias)
    const logsPorDia = await query(`
      SELECT 
        DATE(timestamp) as data,
        COUNT(*) as total_logs,
        COUNT(DISTINCT usuario_id) as usuarios_unicos
      FROM logs_atividade
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY data DESC
    `);

    // Top ações mais executadas
    const topAcoes = await query(`
      SELECT 
        acao,
        COUNT(*) as total
      FROM logs_atividade
      ${whereClause}
      GROUP BY acao
      ORDER BY total DESC
      LIMIT 10
    `);

    // Top usuários mais ativos
    const topUsuarios = await query(`
      SELECT 
        u.nome,
        u.email,
        u.role,
        COUNT(l.id) as total_atividades,
        MAX(l.timestamp) as ultima_atividade
      FROM logs_atividade l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${whereClause}
      GROUP BY u.id, u.nome, u.email, u.role
      ORDER BY total_atividades DESC
      LIMIT 10
    `);

    // Top endpoints mais acessados
    const topEndpoints = await query(`
      SELECT 
        endpoint,
        metodo_http,
        COUNT(*) as total_acessos
      FROM logs_atividade
      ${whereClause}
      GROUP BY endpoint, metodo_http
      ORDER BY total_acessos DESC
      LIMIT 10
    `);

    res.json({
      periodo,
      estatisticas_gerais: statsGerais.rows[0],
      logs_por_dia: logsPorDia.rows,
      top_acoes: topAcoes.rows,
      top_usuarios: topUsuarios.rows,
      top_endpoints: topEndpoints.rows
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de logs:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// RELATÓRIO DE AUDITORIA
// ============================================================================

router.get('/admin/auditoria', requirePermission('view_reports'), async (req, res) => {
  try {
    const { 
      data_inicio, 
      data_fim, 
      usuario_id, 
      formato = 'json' 
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (data_inicio) {
      paramCount++;
      whereClause += ` AND l.timestamp >= $${paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      paramCount++;
      whereClause += ` AND l.timestamp <= $${paramCount}`;
      params.push(data_fim);
    }

    if (usuario_id) {
      paramCount++;
      whereClause += ` AND l.usuario_id = $${paramCount}`;
      params.push(usuario_id);
    }

    const auditoria = await query(`
      SELECT 
        l.id,
        l.timestamp,
        u.nome as usuario,
        u.email,
        u.role,
        l.acao,
        l.endpoint,
        l.metodo_http,
        l.dados_alterados,
        l.ip_address,
        l.user_agent
      FROM logs_atividade l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${whereClause}
      ORDER BY l.timestamp DESC
    `, params);

    if (formato === 'csv') {
      // Gerar CSV
      const csv = [
        'ID,Timestamp,Usuario,Email,Role,Acao,Endpoint,Metodo,IP,User Agent',
        ...auditoria.rows.map(row => 
          `${row.id},"${row.timestamp}","${row.usuario}","${row.email}","${row.role}","${row.acao}","${row.endpoint}","${row.metodo_http}","${row.ip_address}","${row.user_agent}"`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="auditoria.csv"');
      return res.send(csv);
    }

    res.json({
      auditoria: auditoria.rows,
      total_registros: auditoria.rows.length
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de auditoria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// LIMPEZA DE LOGS ANTIGOS (admin)
// ============================================================================

router.delete('/admin/cleanup', requirePermission('manage_system'), async (req, res) => {
  try {
    const { dias = 90 } = req.body;

    if (dias < 30) {
      return res.status(400).json({
        error: 'Não é possível deletar logs com menos de 30 dias'
      });
    }

    const result = await query(`
      DELETE FROM logs_atividade 
      WHERE timestamp < NOW() - INTERVAL '${parseInt(dias)} days'
      RETURNING id
    `);

    res.json({
      message: `${result.rows.length} logs antigos foram removidos`,
      logs_removidos: result.rows.length
    });

  } catch (error) {
    console.error('Erro ao limpar logs antigos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// LOGS DE SEGURANÇA (tentativas de login falhadas, etc.)
// ============================================================================

router.get('/seguranca/alertas', requirePermission('view_security'), async (req, res) => {
  try {
    const { periodo = '24h' } = req.query;

    let whereClause = '';
    if (periodo === '24h') {
      whereClause = "WHERE timestamp >= NOW() - INTERVAL '24 hours'";
    } else if (periodo === '7d') {
      whereClause = "WHERE timestamp >= NOW() - INTERVAL '7 days'";
    } else if (periodo === '30d') {
      whereClause = "WHERE timestamp >= NOW() - INTERVAL '30 days'";
    }

    // Tentativas de login falhadas por IP
    const loginsFalhados = await query(`
      SELECT 
        ip_address,
        COUNT(*) as tentativas,
        MAX(timestamp) as ultima_tentativa,
        array_agg(DISTINCT dados_alterados->>'email') as emails_tentados
      FROM logs_atividade
      ${whereClause} AND acao = 'failed_login'
      GROUP BY ip_address
      HAVING COUNT(*) >= 5
      ORDER BY tentativas DESC
    `);

    // Múltiplos logins do mesmo usuário
    const multiplosLogins = await query(`
      SELECT 
        usuario_id,
        u.nome,
        u.email,
        COUNT(DISTINCT ip_address) as ips_diferentes,
        array_agg(DISTINCT ip_address) as ips,
        COUNT(*) as total_logins
      FROM logs_atividade l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${whereClause} AND acao = 'login'
      GROUP BY usuario_id, u.nome, u.email
      HAVING COUNT(DISTINCT ip_address) > 3
      ORDER BY ips_diferentes DESC
    `);

    // Atividades suspeitas fora do horário normal
    const atividadeForaHorario = await query(`
      SELECT 
        u.nome,
        u.email,
        l.acao,
        l.timestamp,
        l.ip_address
      FROM logs_atividade l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${whereClause}
      AND (EXTRACT(HOUR FROM l.timestamp) < 6 OR EXTRACT(HOUR FROM l.timestamp) > 22)
      AND l.acao IN ('login', 'create_user', 'delete_user', 'update_permissions')
      ORDER BY l.timestamp DESC
    `);

    res.json({
      periodo,
      logins_falhados: loginsFalhados.rows,
      multiplos_logins: multiplosLogins.rows,
      atividade_fora_horario: atividadeForaHorario.rows
    });

  } catch (error) {
    console.error('Erro ao buscar alertas de segurança:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;