/**
 * ============================================================================
 * ROTAS DE PREFERÊNCIAS DO USUÁRIO - ESCOLA TCC
 * ============================================================================
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, logActivity } = require('../middleware/auth');
const { validatePreferences } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// ============================================================================
// BUSCAR PREFERÊNCIAS DO USUÁRIO
// ============================================================================

router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const preferencesResult = await query(
      `SELECT 
        tema, 
        ja_viu_boas_vindas, 
        configuracoes,
        created_at,
        updated_at
       FROM preferencias_usuario 
       WHERE usuario_id = $1`,
      [userId]
    );

    if (preferencesResult.rows.length === 0) {
      // Criar preferências padrão se não existirem
      await query(
        'INSERT INTO preferencias_usuario (usuario_id, tema, ja_viu_boas_vindas) VALUES ($1, $2, $3)',
        [userId, 'light', false]
      );

      return res.json({
        tema: 'light',
        ja_viu_boas_vindas: false,
        configuracoes: {}
      });
    }

    res.json({
      preferencias: preferencesResult.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ATUALIZAR PREFERÊNCIAS DO USUÁRIO
// ============================================================================

router.put('/me', validatePreferences, logActivity('update_preferences'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { tema, ja_viu_boas_vindas, configuracoes } = req.body;

    // Verificar se preferências existem
    const existingPrefs = await query(
      'SELECT id FROM preferencias_usuario WHERE usuario_id = $1',
      [userId]
    );

    if (existingPrefs.rows.length === 0) {
      // Criar se não existir
      const result = await query(
        `INSERT INTO preferencias_usuario (usuario_id, tema, ja_viu_boas_vindas, configuracoes)
         VALUES ($1, $2, $3, $4)
         RETURNING tema, ja_viu_boas_vindas, configuracoes, created_at, updated_at`,
        [
          userId, 
          tema || 'light', 
          ja_viu_boas_vindas || false, 
          JSON.stringify(configuracoes || {})
        ]
      );

      return res.json({
        message: 'Preferências criadas com sucesso',
        preferencias: result.rows[0]
      });
    }

    // Construir query de update dinâmica
    const updateFields = [];
    const values = [userId];
    let paramCount = 1;

    if (tema !== undefined) {
      paramCount++;
      updateFields.push(`tema = $${paramCount}`);
      values.push(tema);
    }

    if (ja_viu_boas_vindas !== undefined) {
      paramCount++;
      updateFields.push(`ja_viu_boas_vindas = $${paramCount}`);
      values.push(ja_viu_boas_vindas);
    }

    if (configuracoes !== undefined) {
      paramCount++;
      updateFields.push(`configuracoes = $${paramCount}`);
      values.push(JSON.stringify(configuracoes));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar'
      });
    }

    // Executar update
    const result = await query(
      `UPDATE preferencias_usuario 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE usuario_id = $1
       RETURNING tema, ja_viu_boas_vindas, configuracoes, updated_at`,
      values
    );

    res.json({
      message: 'Preferências atualizadas com sucesso',
      preferencias: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ATUALIZAR APENAS O TEMA
// ============================================================================

router.patch('/me/tema', logActivity('change_theme'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { tema } = req.body;

    if (!tema || !['light', 'dark'].includes(tema)) {
      return res.status(400).json({
        error: 'Tema deve ser "light" ou "dark"'
      });
    }

    // Verificar se preferências existem
    const existingPrefs = await query(
      'SELECT id FROM preferencias_usuario WHERE usuario_id = $1',
      [userId]
    );

    if (existingPrefs.rows.length === 0) {
      // Criar se não existir
      await query(
        'INSERT INTO preferencias_usuario (usuario_id, tema, ja_viu_boas_vindas) VALUES ($1, $2, $3)',
        [userId, tema, false]
      );
    } else {
      // Atualizar tema
      await query(
        'UPDATE preferencias_usuario SET tema = $1, updated_at = NOW() WHERE usuario_id = $2',
        [tema, userId]
      );
    }

    res.json({
      message: 'Tema atualizado com sucesso',
      tema
    });

  } catch (error) {
    console.error('Erro ao atualizar tema:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// MARCAR BOAS-VINDAS COMO VISTA
// ============================================================================

router.patch('/me/boas-vindas', logActivity('mark_welcome_seen'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar se preferências existem
    const existingPrefs = await query(
      'SELECT id FROM preferencias_usuario WHERE usuario_id = $1',
      [userId]
    );

    if (existingPrefs.rows.length === 0) {
      // Criar se não existir
      await query(
        'INSERT INTO preferencias_usuario (usuario_id, tema, ja_viu_boas_vindas) VALUES ($1, $2, $3)',
        [userId, 'light', true]
      );
    } else {
      // Atualizar flag
      await query(
        'UPDATE preferencias_usuario SET ja_viu_boas_vindas = true, updated_at = NOW() WHERE usuario_id = $1',
        [userId]
      );
    }

    res.json({
      message: 'Boas-vindas marcadas como vistas',
      ja_viu_boas_vindas: true
    });

  } catch (error) {
    console.error('Erro ao marcar boas-vindas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// RESETAR BOAS-VINDAS (para debug)
// ============================================================================

router.patch('/me/reset-boas-vindas', logActivity('reset_welcome'), async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      'UPDATE preferencias_usuario SET ja_viu_boas_vindas = false, updated_at = NOW() WHERE usuario_id = $1',
      [userId]
    );

    res.json({
      message: 'Boas-vindas resetadas com sucesso',
      ja_viu_boas_vindas: false
    });

  } catch (error) {
    console.error('Erro ao resetar boas-vindas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// ATUALIZAR CONFIGURAÇÕES ESPECÍFICAS
// ============================================================================

router.patch('/me/configuracoes', logActivity('update_settings'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { configuracoes } = req.body;

    if (!configuracoes || typeof configuracoes !== 'object') {
      return res.status(400).json({
        error: 'Configurações devem ser um objeto válido'
      });
    }

    // Buscar configurações atuais
    const currentPrefs = await query(
      'SELECT configuracoes FROM preferencias_usuario WHERE usuario_id = $1',
      [userId]
    );

    let novasConfiguracoes = {};
    if (currentPrefs.rows.length > 0 && currentPrefs.rows[0].configuracoes) {
      novasConfiguracoes = { ...currentPrefs.rows[0].configuracoes };
    }

    // Mesclar com novas configurações
    novasConfiguracoes = { ...novasConfiguracoes, ...configuracoes };

    // Verificar se preferências existem
    if (currentPrefs.rows.length === 0) {
      // Criar se não existir
      await query(
        'INSERT INTO preferencias_usuario (usuario_id, tema, ja_viu_boas_vindas, configuracoes) VALUES ($1, $2, $3, $4)',
        [userId, 'light', false, JSON.stringify(novasConfiguracoes)]
      );
    } else {
      // Atualizar configurações
      await query(
        'UPDATE preferencias_usuario SET configuracoes = $1, updated_at = NOW() WHERE usuario_id = $2',
        [JSON.stringify(novasConfiguracoes), userId]
      );
    }

    res.json({
      message: 'Configurações atualizadas com sucesso',
      configuracoes: novasConfiguracoes
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;