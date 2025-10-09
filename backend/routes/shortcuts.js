/**
 * ============================================================================
 * ROTAS DE ATALHOS - ESCOLA TCC
 * ============================================================================
 */

const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requirePermission, logActivity } = require('../middleware/auth');
const { validateShortcutSelection, validateId } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// ============================================================================
// LISTAR ATALHOS DISPONÍVEIS
// ============================================================================

router.get('/disponiveis', async (req, res) => {
  try {
    const atalhos = await query(
      `SELECT 
        id, 
        nome, 
        icone_url, 
        url_destino, 
        descricao, 
        categoria,
        ordem
       FROM atalhos_disponiveis 
       WHERE ativo = true
       ORDER BY categoria, ordem, nome`
    );

    // Agrupar por categoria
    const atalhosPorCategoria = {};
    atalhos.rows.forEach(atalho => {
      const categoria = atalho.categoria || 'outros';
      if (!atalhosPorCategoria[categoria]) {
        atalhosPorCategoria[categoria] = [];
      }
      atalhosPorCategoria[categoria].push(atalho);
    });

    res.json({
      atalhos: atalhos.rows,
      por_categoria: atalhosPorCategoria
    });

  } catch (error) {
    console.error('Erro ao buscar atalhos disponíveis:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// BUSCAR ATALHOS SELECIONADOS DO USUÁRIO
// ============================================================================

router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const atalhosSelecionados = await query(
      `SELECT 
        au.posicao,
        ad.id,
        ad.nome,
        ad.icone_url,
        ad.url_destino,
        ad.descricao,
        ad.categoria
       FROM atalhos_usuario au
       INNER JOIN atalhos_disponiveis ad ON au.atalho_id = ad.id
       WHERE au.usuario_id = $1 AND ad.ativo = true
       ORDER BY au.posicao`,
      [userId]
    );

    // Criar array com 6 posições (algumas podem estar vazias)
    const atalhos = Array(6).fill(null);
    
    atalhosSelecionados.rows.forEach(atalho => {
      const index = atalho.posicao - 1; // posicao é 1-indexed
      if (index >= 0 && index < 6) {
        atalhos[index] = {
          id: atalho.id,
          nome: atalho.nome,
          icone_url: atalho.icone_url,
          url_destino: atalho.url_destino,
          descricao: atalho.descricao,
          categoria: atalho.categoria,
          posicao: atalho.posicao
        };
      }
    });

    res.json({
      atalhos: atalhos
    });

  } catch (error) {
    console.error('Erro ao buscar atalhos do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// SALVAR ATALHOS SELECIONADOS DO USUÁRIO
// ============================================================================

router.put('/me', validateShortcutSelection, logActivity('update_shortcuts'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { atalhos } = req.body;

    await transaction(async (client) => {
      // Remover atalhos existentes do usuário
      await client.query(
        'DELETE FROM atalhos_usuario WHERE usuario_id = $1',
        [userId]
      );

      // Inserir novos atalhos
      for (const atalho of atalhos) {
        const { atalho_id, posicao } = atalho;

        // Verificar se o atalho existe e está ativo
        const atalhoExiste = await client.query(
          'SELECT id FROM atalhos_disponiveis WHERE id = $1 AND ativo = true',
          [atalho_id]
        );

        if (atalhoExiste.rows.length === 0) {
          throw new Error(`Atalho com ID ${atalho_id} não encontrado ou inativo`);
        }

        // Inserir atalho do usuário
        await client.query(
          'INSERT INTO atalhos_usuario (usuario_id, atalho_id, posicao) VALUES ($1, $2, $3)',
          [userId, atalho_id, posicao]
        );
      }

      // Buscar atalhos atualizados para retornar
      const atalhosSelecionados = await client.query(
        `SELECT 
          au.posicao,
          ad.id,
          ad.nome,
          ad.icone_url,
          ad.url_destino,
          ad.descricao,
          ad.categoria
         FROM atalhos_usuario au
         INNER JOIN atalhos_disponiveis ad ON au.atalho_id = ad.id
         WHERE au.usuario_id = $1 AND ad.ativo = true
         ORDER BY au.posicao`,
        [userId]
      );

      // Criar array com 6 posições
      const atalhosSalvos = Array(6).fill(null);
      
      atalhosSelecionados.rows.forEach(atalho => {
        const index = atalho.posicao - 1;
        if (index >= 0 && index < 6) {
          atalhosSalvos[index] = {
            id: atalho.id,
            nome: atalho.nome,
            icone_url: atalho.icone_url,
            url_destino: atalho.url_destino,
            descricao: atalho.descricao,
            categoria: atalho.categoria,
            posicao: atalho.posicao
          };
        }
      });

      res.json({
        message: 'Atalhos salvos com sucesso',
        atalhos: atalhosSalvos
      });
    });

  } catch (error) {
    console.error('Erro ao salvar atalhos:', error);
    
    if (error.message.includes('não encontrado ou inativo')) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// REMOVER ATALHO ESPECÍFICO
// ============================================================================

router.delete('/me/:posicao', logActivity('remove_shortcut'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { posicao } = req.params;

    if (!posicao || posicao < 1 || posicao > 6) {
      return res.status(400).json({
        error: 'Posição deve ser entre 1 e 6'
      });
    }

    const result = await query(
      'DELETE FROM atalhos_usuario WHERE usuario_id = $1 AND posicao = $2',
      [userId, posicao]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Atalho não encontrado nesta posição'
      });
    }

    res.json({
      message: 'Atalho removido com sucesso',
      posicao: parseInt(posicao)
    });

  } catch (error) {
    console.error('Erro ao remover atalho:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ADMINISTRAÇÃO DE ATALHOS (apenas admin)
// ============================================================================

// Listar todos os atalhos (admin)
router.get('/admin/todos', requirePermission('configure_system'), async (req, res) => {
  try {
    const atalhos = await query(
      `SELECT 
        id, 
        nome, 
        icone_url, 
        url_destino, 
        descricao, 
        categoria,
        ativo,
        ordem,
        created_at
       FROM atalhos_disponiveis 
       ORDER BY categoria, ordem, nome`
    );

    res.json({
      atalhos: atalhos.rows
    });

  } catch (error) {
    console.error('Erro ao buscar todos os atalhos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar novo atalho (admin)
router.post('/admin', requirePermission('configure_system'), logActivity('create_shortcut'), async (req, res) => {
  try {
    const { nome, icone_url, url_destino, descricao, categoria, ordem = 0 } = req.body;

    if (!nome || !url_destino) {
      return res.status(400).json({
        error: 'Nome e URL de destino são obrigatórios'
      });
    }

    const result = await query(
      `INSERT INTO atalhos_disponiveis (nome, icone_url, url_destino, descricao, categoria, ordem)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nome, icone_url, url_destino, descricao, categoria, ordem]
    );

    res.status(201).json({
      message: 'Atalho criado com sucesso',
      atalho: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar atalho:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar atalho (admin)
router.put('/admin/:id', validateId, requirePermission('configure_system'), logActivity('update_shortcut'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, icone_url, url_destino, descricao, categoria, ativo, ordem } = req.body;

    // Construir query dinâmica
    const updateFields = [];
    const values = [id];
    let paramCount = 1;

    if (nome !== undefined) {
      paramCount++;
      updateFields.push(`nome = $${paramCount}`);
      values.push(nome);
    }

    if (icone_url !== undefined) {
      paramCount++;
      updateFields.push(`icone_url = $${paramCount}`);
      values.push(icone_url);
    }

    if (url_destino !== undefined) {
      paramCount++;
      updateFields.push(`url_destino = $${paramCount}`);
      values.push(url_destino);
    }

    if (descricao !== undefined) {
      paramCount++;
      updateFields.push(`descricao = $${paramCount}`);
      values.push(descricao);
    }

    if (categoria !== undefined) {
      paramCount++;
      updateFields.push(`categoria = $${paramCount}`);
      values.push(categoria);
    }

    if (ativo !== undefined) {
      paramCount++;
      updateFields.push(`ativo = $${paramCount}`);
      values.push(ativo);
    }

    if (ordem !== undefined) {
      paramCount++;
      updateFields.push(`ordem = $${paramCount}`);
      values.push(ordem);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar'
      });
    }

    const result = await query(
      `UPDATE atalhos_disponiveis 
       SET ${updateFields.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Atalho não encontrado'
      });
    }

    res.json({
      message: 'Atalho atualizado com sucesso',
      atalho: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar atalho:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar atalho (admin)
router.delete('/admin/:id', validateId, requirePermission('configure_system'), logActivity('delete_shortcut'), async (req, res) => {
  try {
    const { id } = req.params;

    await transaction(async (client) => {
      // Remover atalho das seleções dos usuários
      await client.query(
        'DELETE FROM atalhos_usuario WHERE atalho_id = $1',
        [id]
      );

      // Remover atalho
      const result = await client.query(
        'DELETE FROM atalhos_disponiveis WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error('Atalho não encontrado');
      }
    });

    res.json({
      message: 'Atalho excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar atalho:', error);
    
    if (error.message === 'Atalho não encontrado') {
      return res.status(404).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ESTATÍSTICAS DE ATALHOS (admin)
// ============================================================================

router.get('/admin/stats', requirePermission('view_reports'), async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        ad.id,
        ad.nome,
        ad.categoria,
        COUNT(au.id) as total_usuarios,
        COUNT(au.id) * 100.0 / (SELECT COUNT(*) FROM usuarios WHERE status = 'active') as percentual_uso
      FROM atalhos_disponiveis ad
      LEFT JOIN atalhos_usuario au ON ad.id = au.atalho_id
      WHERE ad.ativo = true
      GROUP BY ad.id, ad.nome, ad.categoria
      ORDER BY total_usuarios DESC
    `);

    res.json({
      estatisticas: stats.rows
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de atalhos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;