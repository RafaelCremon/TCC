/**
 * ============================================================================
 * ROTAS DE EVENTOS ESCOLARES - ESCOLA TCC
 * ============================================================================
 */

const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requirePermission, logActivity } = require('../middleware/auth');
const { validateEvent, validateId } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// ============================================================================
// LISTAR EVENTOS (filtrados por permissão do usuário)
// ============================================================================

router.get('/', async (req, res) => {
  try {
    const { 
      limite = 50, 
      pagina = 1, 
      data_inicio, 
      data_fim, 
      tipo, 
      mes_ano 
    } = req.query;
    
    const offset = (pagina - 1) * limite;
    const userRole = req.user.role;

    let whereClause = 'WHERE ativo = true';
    const params = [];
    let paramCount = 0;

    // Filtrar por público-alvo (usuário deve estar no público alvo ou ser admin)
    if (userRole !== 'admin') {
      paramCount++;
      whereClause += ` AND (publico_alvo ? $${paramCount} OR publico_alvo = '[]')`;
      params.push(userRole);
    }

    // Filtros de data
    if (data_inicio) {
      paramCount++;
      whereClause += ` AND data_evento >= $${paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      paramCount++;
      whereClause += ` AND data_evento <= $${paramCount}`;
      params.push(data_fim);
    }

    if (mes_ano) {
      // Formato: YYYY-MM
      paramCount++;
      whereClause += ` AND TO_CHAR(data_evento, 'YYYY-MM') = $${paramCount}`;
      params.push(mes_ano);
    }

    if (tipo) {
      paramCount++;
      whereClause += ` AND tipo = $${paramCount}`;
      params.push(tipo);
    }

    // Query principal
    const eventos = await query(
      `SELECT 
        e.id,
        e.titulo,
        e.descricao,
        e.data_evento,
        e.hora_inicio,
        e.hora_fim,
        e.tipo,
        e.local,
        e.publico_alvo,
        e.created_at,
        u.nome as criado_por_nome
       FROM eventos_escolares e
       LEFT JOIN usuarios u ON e.criado_por = u.id
       ${whereClause}
       ORDER BY e.data_evento ASC, e.hora_inicio ASC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limite, offset]
    );

    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM eventos_escolares e ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPaginas = Math.ceil(total / limite);

    res.json({
      eventos: eventos.rows,
      paginacao: {
        pagina_atual: parseInt(pagina),
        total_paginas: totalPaginas,
        total_registros: total,
        registros_por_pagina: parseInt(limite)
      }
    });

  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// BUSCAR EVENTO POR ID
// ============================================================================

router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    let whereClause = 'WHERE e.id = $1 AND e.ativo = true';
    const params = [id];

    // Filtrar por público-alvo se não for admin
    if (userRole !== 'admin') {
      whereClause += ` AND (e.publico_alvo ? $2 OR e.publico_alvo = '[]')`;
      params.push(userRole);
    }

    const evento = await query(
      `SELECT 
        e.*,
        u.nome as criado_por_nome,
        u.email as criado_por_email
       FROM eventos_escolares e
       LEFT JOIN usuarios u ON e.criado_por = u.id
       ${whereClause}`,
      params
    );

    if (evento.rows.length === 0) {
      return res.status(404).json({
        error: 'Evento não encontrado ou sem permissão para visualizar'
      });
    }

    res.json({
      evento: evento.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// CRIAR EVENTO
// ============================================================================

router.post('/', requirePermission('create_events'), validateEvent, logActivity('create_event'), async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      data_evento,
      hora_inicio,
      hora_fim,
      tipo = 'evento',
      local,
      publico_alvo = ['admin', 'professor', 'aluno', 'responsavel']
    } = req.body;

    const result = await query(
      `INSERT INTO eventos_escolares 
       (titulo, descricao, data_evento, hora_inicio, hora_fim, tipo, local, publico_alvo, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        titulo,
        descricao,
        data_evento,
        hora_inicio,
        hora_fim,
        tipo,
        local,
        JSON.stringify(publico_alvo),
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'Evento criado com sucesso',
      evento: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ATUALIZAR EVENTO
// ============================================================================

router.put('/:id', validateId, validateEvent, logActivity('update_event'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descricao,
      data_evento,
      hora_inicio,
      hora_fim,
      tipo,
      local,
      publico_alvo,
      ativo
    } = req.body;

    // Verificar se evento existe e se o usuário pode editá-lo
    const eventoExistente = await query(
      'SELECT criado_por FROM eventos_escolares WHERE id = $1',
      [id]
    );

    if (eventoExistente.rows.length === 0) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    // Apenas o criador ou admin pode editar
    const isOwner = eventoExistente.rows[0].criado_por === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Sem permissão para editar este evento'
      });
    }

    // Construir query dinâmica
    const updateFields = [];
    const values = [id];
    let paramCount = 1;

    if (titulo !== undefined) {
      paramCount++;
      updateFields.push(`titulo = $${paramCount}`);
      values.push(titulo);
    }

    if (descricao !== undefined) {
      paramCount++;
      updateFields.push(`descricao = $${paramCount}`);
      values.push(descricao);
    }

    if (data_evento !== undefined) {
      paramCount++;
      updateFields.push(`data_evento = $${paramCount}`);
      values.push(data_evento);
    }

    if (hora_inicio !== undefined) {
      paramCount++;
      updateFields.push(`hora_inicio = $${paramCount}`);
      values.push(hora_inicio);
    }

    if (hora_fim !== undefined) {
      paramCount++;
      updateFields.push(`hora_fim = $${paramCount}`);
      values.push(hora_fim);
    }

    if (tipo !== undefined) {
      paramCount++;
      updateFields.push(`tipo = $${paramCount}`);
      values.push(tipo);
    }

    if (local !== undefined) {
      paramCount++;
      updateFields.push(`local = $${paramCount}`);
      values.push(local);
    }

    if (publico_alvo !== undefined) {
      paramCount++;
      updateFields.push(`publico_alvo = $${paramCount}`);
      values.push(JSON.stringify(publico_alvo));
    }

    // Apenas admin pode alterar status ativo
    if (ativo !== undefined && isAdmin) {
      paramCount++;
      updateFields.push(`ativo = $${paramCount}`);
      values.push(ativo);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar'
      });
    }

    const result = await query(
      `UPDATE eventos_escolares 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      values
    );

    res.json({
      message: 'Evento atualizado com sucesso',
      evento: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// DELETAR EVENTO
// ============================================================================

router.delete('/:id', validateId, logActivity('delete_event'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se evento existe e se o usuário pode deletá-lo
    const eventoExistente = await query(
      'SELECT criado_por, titulo FROM eventos_escolares WHERE id = $1',
      [id]
    );

    if (eventoExistente.rows.length === 0) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    // Apenas o criador ou admin pode deletar
    const isOwner = eventoExistente.rows[0].criado_por === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Sem permissão para deletar este evento'
      });
    }

    // Soft delete (marcar como inativo)
    await query(
      'UPDATE eventos_escolares SET ativo = false, updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({
      message: 'Evento removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// EVENTOS POR MÊS (para calendário)
// ============================================================================

router.get('/calendario/:mes_ano', async (req, res) => {
  try {
    const { mes_ano } = req.params; // Formato: YYYY-MM
    const userRole = req.user.role;

    // Validar formato
    if (!/^\d{4}-\d{2}$/.test(mes_ano)) {
      return res.status(400).json({
        error: 'Formato de mês inválido. Use YYYY-MM'
      });
    }

    let whereClause = `WHERE TO_CHAR(data_evento, 'YYYY-MM') = $1 AND ativo = true`;
    const params = [mes_ano];

    // Filtrar por público-alvo se não for admin
    if (userRole !== 'admin') {
      whereClause += ` AND (publico_alvo ? $2 OR publico_alvo = '[]')`;
      params.push(userRole);
    }

    const eventos = await query(
      `SELECT 
        id,
        titulo,
        data_evento,
        hora_inicio,
        hora_fim,
        tipo,
        local
       FROM eventos_escolares
       ${whereClause}
       ORDER BY data_evento ASC, hora_inicio ASC`,
      params
    );

    // Agrupar eventos por dia
    const eventosPorDia = {};
    eventos.rows.forEach(evento => {
      const dia = evento.data_evento.toISOString().split('T')[0];
      if (!eventosPorDia[dia]) {
        eventosPorDia[dia] = [];
      }
      eventosPorDia[dia].push(evento);
    });

    res.json({
      mes_ano,
      eventos: eventos.rows,
      eventos_por_dia: eventosPorDia
    });

  } catch (error) {
    console.error('Erro ao buscar eventos do mês:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// PRÓXIMOS EVENTOS
// ============================================================================

router.get('/proximos/lista', async (req, res) => {
  try {
    const { limite = 10 } = req.query;
    const userRole = req.user.role;

    let whereClause = 'WHERE data_evento >= CURRENT_DATE AND ativo = true';
    const params = [];

    // Filtrar por público-alvo se não for admin
    if (userRole !== 'admin') {
      whereClause += ` AND (publico_alvo ? $1 OR publico_alvo = '[]')`;
      params.push(userRole);
    }

    const eventos = await query(
      `SELECT 
        id,
        titulo,
        descricao,
        data_evento,
        hora_inicio,
        hora_fim,
        tipo,
        local,
        publico_alvo
       FROM eventos_escolares
       ${whereClause}
       ORDER BY data_evento ASC, hora_inicio ASC
       LIMIT $${params.length + 1}`,
      [...params, limite]
    );

    res.json({
      proximos_eventos: eventos.rows
    });

  } catch (error) {
    console.error('Erro ao buscar próximos eventos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ESTATÍSTICAS DE EVENTOS (admin)
// ============================================================================

router.get('/admin/stats', requirePermission('view_reports'), async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(*) FILTER (WHERE ativo = true) as eventos_ativos,
        COUNT(*) FILTER (WHERE ativo = false) as eventos_inativos,
        COUNT(*) FILTER (WHERE tipo = 'evento') as eventos_gerais,
        COUNT(*) FILTER (WHERE tipo = 'prova') as provas,
        COUNT(*) FILTER (WHERE tipo = 'reuniao') as reunioes,
        COUNT(*) FILTER (WHERE tipo = 'feriado') as feriados,
        COUNT(*) FILTER (WHERE tipo = 'atividade') as atividades,
        COUNT(*) FILTER (WHERE data_evento >= CURRENT_DATE) as eventos_futuros,
        COUNT(*) FILTER (WHERE data_evento < CURRENT_DATE) as eventos_passados
      FROM eventos_escolares
    `);

    res.json({
      estatisticas: stats.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de eventos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;