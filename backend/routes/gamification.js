/**
 * ============================================================================
 * ROTAS DE GAMIFICAÇÃO - ESCOLA TCC
 * ============================================================================
 */

const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, logActivity } = require('../middleware/auth');
const { validateGamificationAction } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// ============================================================================
// BUSCAR DADOS DE GAMIFICAÇÃO DO USUÁRIO
// ============================================================================

router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const gamificationResult = await query(
      `SELECT 
        pontos, 
        nivel, 
        badges, 
        acoes,
        ultima_visita,
        streak_dias,
        created_at,
        updated_at
       FROM gamificacao_usuario 
       WHERE usuario_id = $1`,
      [userId]
    );

    if (gamificationResult.rows.length === 0) {
      // Criar dados de gamificação padrão se não existirem
      const defaultData = await query(
        `INSERT INTO gamificacao_usuario (usuario_id, pontos, nivel, badges, acoes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING pontos, nivel, badges, acoes, ultima_visita, streak_dias, created_at, updated_at`,
        [userId, 0, 1, JSON.stringify([]), JSON.stringify({})]
      );

      return res.json({
        gamificacao: defaultData.rows[0]
      });
    }

    // Buscar blocos visitados
    const blocosVisitados = await query(
      'SELECT bloco_id, visitado_em FROM blocos_visitados WHERE usuario_id = $1 ORDER BY visitado_em DESC',
      [userId]
    );

    const gamificationData = gamificationResult.rows[0];
    
    res.json({
      gamificacao: {
        ...gamificationData,
        blocos_visitados: blocosVisitados.rows
      }
    });

  } catch (error) {
    console.error('Erro ao buscar gamificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ADICIONAR PONTOS
// ============================================================================

router.post('/pontos', validateGamificationAction, logActivity('add_points'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { acao, pontos = 10, detalhes } = req.body;

    await transaction(async (client) => {
      // Buscar dados atuais
      const currentData = await client.query(
        'SELECT pontos, nivel, acoes FROM gamificacao_usuario WHERE usuario_id = $1',
        [userId]
      );

      if (currentData.rows.length === 0) {
        throw new Error('Dados de gamificação não encontrados');
      }

      const { pontos: pontosAtuais, nivel: nivelAtual, acoes: acoesAtuais } = currentData.rows[0];
      
      // Atualizar ações
      const novasAcoes = { ...acoesAtuais };
      novasAcoes[acao] = (novasAcoes[acao] || 0) + 1;

      // Calcular novos pontos e nível
      const novosPontos = pontosAtuais + pontos;
      const novoNivel = Math.floor(novosPontos / 100) + 1; // A cada 100 pontos = 1 nível

      // Atualizar no banco
      await client.query(
        `UPDATE gamificacao_usuario 
         SET pontos = $1, nivel = $2, acoes = $3, updated_at = NOW()
         WHERE usuario_id = $4`,
        [novosPontos, novoNivel, JSON.stringify(novasAcoes), userId]
      );

      // Verificar se ganhou novo badge
      const novoBadge = await verificarNovoBadge(client, userId, novosPontos, novoNivel, novasAcoes);

      res.json({
        message: 'Pontos adicionados com sucesso',
        pontos_adicionados: pontos,
        pontos_totais: novosPontos,
        nivel_anterior: nivelAtual,
        nivel_atual: novoNivel,
        subiu_nivel: novoNivel > nivelAtual,
        novo_badge: novoBadge,
        acao_realizada: acao
      });
    });

  } catch (error) {
    console.error('Erro ao adicionar pontos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// REGISTRAR VISITA A BLOCO
// ============================================================================

router.post('/visitar-bloco', logActivity('visit_block'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { bloco_id } = req.body;

    if (!bloco_id) {
      return res.status(400).json({
        error: 'ID do bloco é obrigatório'
      });
    }

    await transaction(async (client) => {
      // Verificar se já visitou este bloco
      const jaVisitou = await client.query(
        'SELECT id FROM blocos_visitados WHERE usuario_id = $1 AND bloco_id = $2',
        [userId, bloco_id]
      );

      let pontosGanhos = 0;
      let primeiraVisita = false;

      if (jaVisitou.rows.length === 0) {
        // Primeira visita - registrar e dar pontos
        await client.query(
          'INSERT INTO blocos_visitados (usuario_id, bloco_id) VALUES ($1, $2)',
          [userId, bloco_id]
        );

        pontosGanhos = 20; // 20 pontos por primeira visita
        primeiraVisita = true;

        // Adicionar pontos
        await client.query(
          'UPDATE gamificacao_usuario SET pontos = pontos + $1, updated_at = NOW() WHERE usuario_id = $2',
          [pontosGanhos, userId]
        );

        // Verificar badge de explorador
        const totalBlocos = await client.query(
          'SELECT COUNT(*) as total FROM blocos_visitados WHERE usuario_id = $1',
          [userId]
        );

        const totalVisitados = parseInt(totalBlocos.rows[0].total);
        
        // Badge para 5 blocos visitados
        if (totalVisitados >= 5) {
          await adicionarBadge(client, userId, 'explorador', 'Explorador', 'Visitou 5 blocos diferentes', '🧭');
        }
      }

      // Buscar dados atualizados
      const dadosAtualizados = await client.query(
        'SELECT pontos, nivel, badges FROM gamificacao_usuario WHERE usuario_id = $1',
        [userId]
      );

      res.json({
        message: primeiraVisita ? 'Primeira visita ao bloco registrada!' : 'Visita ao bloco registrada',
        bloco_visitado: bloco_id,
        primeira_visita: primeiraVisita,
        pontos_ganhos: pontosGanhos,
        pontos_totais: dadosAtualizados.rows[0].pontos,
        nivel_atual: dadosAtualizados.rows[0].nivel,
        badges: dadosAtualizados.rows[0].badges
      });
    });

  } catch (error) {
    console.error('Erro ao registrar visita ao bloco:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ATUALIZAR STREAK DE DIAS
// ============================================================================

router.post('/streak', logActivity('update_streak'), async (req, res) => {
  try {
    const userId = req.user.id;
    const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const dadosAtuais = await query(
      'SELECT ultima_visita, streak_dias FROM gamificacao_usuario WHERE usuario_id = $1',
      [userId]
    );

    if (dadosAtuais.rows.length === 0) {
      throw new Error('Dados de gamificação não encontrados');
    }

    const { ultima_visita, streak_dias } = dadosAtuais.rows[0];
    const ultimaVisitaStr = ultima_visita ? ultima_visita.toISOString().split('T')[0] : null;

    let novoStreak = 1;
    let pontosGanhos = 0;

    if (ultimaVisitaStr) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = ontem.toISOString().split('T')[0];

      if (ultimaVisitaStr === hoje) {
        // Já visitou hoje, não fazer nada
        return res.json({
          message: 'Streak já contabilizado hoje',
          streak_atual: streak_dias,
          pontos_ganhos: 0
        });
      } else if (ultimaVisitaStr === ontemStr) {
        // Visitou ontem, incrementar streak
        novoStreak = (streak_dias || 0) + 1;
        pontosGanhos = Math.min(novoStreak * 2, 20); // Máximo 20 pontos por dia
      } else {
        // Quebrou o streak, resetar
        novoStreak = 1;
        pontosGanhos = 2;
      }
    } else {
      // Primeira visita
      pontosGanhos = 2;
    }

    // Atualizar no banco
    await query(
      `UPDATE gamificacao_usuario 
       SET ultima_visita = $1, streak_dias = $2, pontos = pontos + $3, updated_at = NOW()
       WHERE usuario_id = $4`,
      [hoje, novoStreak, pontosGanhos, userId]
    );

    // Verificar badges de streak
    if (novoStreak >= 7) {
      await transaction(async (client) => {
        await adicionarBadge(client, userId, 'perseverante', 'Perseverante', 'Manteve streak de 7 dias', '🔥');
      });
    }

    res.json({
      message: 'Streak atualizado com sucesso',
      streak_anterior: streak_dias || 0,
      streak_atual: novoStreak,
      pontos_ganhos: pontosGanhos,
      quebrou_streak: novoStreak === 1 && ultimaVisitaStr && ultimaVisitaStr !== ontemStr
    });

  } catch (error) {
    console.error('Erro ao atualizar streak:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// LISTAR BADGES DISPONÍVEIS
// ============================================================================

router.get('/badges', async (req, res) => {
  try {
    const badgesDisponiveis = [
      {
        id: 'primeiro_login',
        nome: 'Bem-vindo',
        descricao: 'Fez o primeiro login no sistema',
        icone: '👋',
        pontos_necessarios: 0
      },
      {
        id: 'explorador',
        nome: 'Explorador',
        descricao: 'Visitou 5 blocos diferentes',
        icone: '🧭',
        pontos_necessarios: 100
      },
      {
        id: 'perseverante',
        nome: 'Perseverante',
        descricao: 'Manteve streak de 7 dias consecutivos',
        icone: '🔥',
        pontos_necessarios: 50
      },
      {
        id: 'estudioso',
        nome: 'Estudioso',
        descricao: 'Acumulou 500 pontos',
        icone: '📚',
        pontos_necessarios: 500
      },
      {
        id: 'navegador_mestre',
        nome: 'Navegador Mestre',
        descricao: 'Visitou todos os blocos da escola',
        icone: '🗺️',
        pontos_necessarios: 200
      }
    ];

    res.json({
      badges: badgesDisponiveis
    });

  } catch (error) {
    console.error('Erro ao listar badges:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// RANKING DE USUÁRIOS
// ============================================================================

router.get('/ranking', async (req, res) => {
  try {
    const { limite = 10 } = req.query;

    const ranking = await query(
      `SELECT 
        u.nome, 
        u.username, 
        u.avatar_url,
        g.pontos, 
        g.nivel, 
        g.badges,
        g.streak_dias,
        ROW_NUMBER() OVER (ORDER BY g.pontos DESC) as posicao
       FROM usuarios u
       INNER JOIN gamificacao_usuario g ON u.id = g.usuario_id
       WHERE u.status = 'active'
       ORDER BY g.pontos DESC
       LIMIT $1`,
      [limite]
    );

    // Encontrar posição do usuário atual
    const posicaoUsuario = await query(
      `SELECT posicao FROM (
        SELECT 
          u.id,
          ROW_NUMBER() OVER (ORDER BY g.pontos DESC) as posicao
        FROM usuarios u
        INNER JOIN gamificacao_usuario g ON u.id = g.usuario_id
        WHERE u.status = 'active'
      ) ranked
      WHERE id = $1`,
      [req.user.id]
    );

    res.json({
      ranking: ranking.rows,
      minha_posicao: posicaoUsuario.rows[0]?.posicao || null
    });

  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function verificarNovoBadge(client, userId, pontos, nivel, acoes) {
  const badges = await client.query(
    'SELECT badges FROM gamificacao_usuario WHERE usuario_id = $1',
    [userId]
  );

  const badgesAtuais = badges.rows[0].badges || [];
  
  // Badge de 500 pontos
  if (pontos >= 500 && !badgesAtuais.includes('estudioso')) {
    return await adicionarBadge(client, userId, 'estudioso', 'Estudioso', 'Acumulou 500 pontos', '📚');
  }

  return null;
}

async function adicionarBadge(client, userId, badgeId, nome, descricao, icone) {
  const badges = await client.query(
    'SELECT badges FROM gamificacao_usuario WHERE usuario_id = $1',
    [userId]
  );

  const badgesAtuais = badges.rows[0].badges || [];
  
  if (!badgesAtuais.includes(badgeId)) {
    badgesAtuais.push(badgeId);
    
    await client.query(
      'UPDATE gamificacao_usuario SET badges = $1, updated_at = NOW() WHERE usuario_id = $2',
      [JSON.stringify(badgesAtuais), userId]
    );

    return {
      id: badgeId,
      nome,
      descricao,
      icone
    };
  }

  return null;
}

module.exports = router;